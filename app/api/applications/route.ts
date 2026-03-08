import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeMatch } from "@/lib/ai/match-engine";
import { generateRejectionSummary } from "@/lib/ai/explain-engine";
import { sendRejectionEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const jobId = req.nextUrl.searchParams.get("jobId");

  if (session.user.role === "recruiter" && jobId) {
    const job = await prisma.job.findFirst({
      where: { id: jobId, recruiterId: session.user.id },
    });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    const applications = await prisma.application.findMany({
      where: { jobId },
      include: { student: true, matchResult: true },
      orderBy: { submittedAt: "desc" },
    });
    const qualified = applications.filter(
      (a) => a.matchResult && a.matchResult.overallScore >= 65
    );
    const sorted = [...qualified].sort(
      (a, b) => (b.matchResult?.overallScore ?? 0) - (a.matchResult?.overallScore ?? 0)
    );
    return NextResponse.json(sorted);
  }

  const applications = await prisma.application.findMany({
    where: { studentId: session.user.id },
    include: { job: true, matchResult: true, rejectionFeedback: true },
    orderBy: { submittedAt: "desc" },
  });
  return NextResponse.json(applications);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const jobId = body.jobId as string | undefined;
  if (!jobId) {
    return NextResponse.json({ error: "jobId is required" }, { status: 400 });
  }

  const existing = await prisma.application.findFirst({
    where: { studentId: session.user.id, jobId },
  });
  if (existing) {
    return NextResponse.json({ error: "Already applied", id: existing.id }, { status: 400 });
  }

  const resume = await prisma.parsedResume.findFirst({
    where: { studentId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  if (!resume) {
    return NextResponse.json({ error: "Upload a resume first" }, { status: 400 });
  }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { parsedJob: true },
  });
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const resumeData = {
    skills: JSON.parse(resume.skillsJson || "[]") as string[],
    experience: JSON.parse(resume.experienceJson || "[]") as Array<{title:string;company:string;duration?:string;bullets:string[]}>,
    education: JSON.parse(resume.educationJson || "[]") as Array<{degree:string;institution:string;year?:string}>,
    availability: resume.availability || null,
    eligibility: resume.eligibility || null,
    atsReadabilityScore: resume.atsReadabilityScore,
    resumeEmail: resume.resumeEmail?.trim() || null,
    graduationDate: resume.graduationDate?.trim() || null,
  };

  const pj = job.parsedJob;
  const parsedJobData = {
    requiredSkills: pj ? JSON.parse(pj.requiredSkillsJson || "[]") : [],
    preferredSkills: pj ? JSON.parse(pj.preferredSkillsJson || "[]") : [],
    requiredExperience: pj ? JSON.parse(pj.requiredExperienceJson || "[]") : [],
    eligibilityRequirements: pj ? JSON.parse(pj.eligibilityRequirementsJson || "[]") : [],
    availabilityRequirements: pj ? JSON.parse(pj.availabilityRequirementsJson || "[]") : [],
  };

  const match = await computeMatch(resumeData, parsedJobData, {
    workStudyEligible: job.workStudyEligible,
    hoursPerWeek: job.hoursPerWeek,
  });

  const status = !match.metHardFilters || match.overallScore < 65 ? "screened_out" : "screened_in";
  const trackerStatus = status === "screened_out" ? "screened_out" : "applied";

  const application = await prisma.application.create({
    data: {
      studentId: session.user.id,
      jobId,
      status,
      trackerStatus,
    },
  });

  await prisma.matchResult.create({
    data: {
      applicationId: application.id,
      overallScore: match.overallScore,
      eligibilityScore: match.eligibilityScore,
      requiredSkillsScore: match.requiredSkillsScore,
      experienceScore: match.experienceScore,
      availabilityScore: match.availabilityScore,
      preferredSkillsScore: match.preferredSkillsScore,
      atsReadabilityScore: match.atsReadabilityScore,
      strengthsJson: JSON.stringify(match.strengths),
      gapsJson: JSON.stringify(match.gaps),
      fitReasonsJson: JSON.stringify(match.fitReasons),
      metHardFilters: match.metHardFilters,
    },
  });

  if (status === "screened_out") {
    const improvementSuggestions = match.gaps.length > 0
      ? match.gaps.slice(0, 3).map((g: string) => `Consider: ${g}`)
      : ["Add more relevant experience to your resume.", "Highlight skills that match the job description."];

    let summary: string;
    try {
      summary = await generateRejectionSummary({
        overallScore: match.overallScore,
        metHardFilters: match.metHardFilters,
        unmetRequirements: match.hardFilterResult.unmetRequirements,
        strengths: match.strengths,
        gaps: match.gaps,
        improvementSuggestions,
      });
    } catch {
      summary = "We encourage you to review the feedback and apply to other roles.";
    }

    const alternateJobs = await prisma.job.findMany({
      where: { id: { not: jobId }, status: "open" },
      take: 3,
      orderBy: { createdAt: "desc" },
    });

    await prisma.rejectionFeedback.create({
      data: {
        applicationId: application.id,
        unmetRequirementsJson: JSON.stringify(match.hardFilterResult.unmetRequirements),
        resumeGapsJson: JSON.stringify(match.gaps),
        improvementSuggestionsJson: JSON.stringify(improvementSuggestions),
        alternateJobIdsJson: JSON.stringify(alternateJobs.map((j) => j.id)),
        plainEnglishSummary: summary,
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3001";
    sendRejectionEmail("ardon.kotey371@gmail.com", job.title, summary, `${baseUrl}/applications/${application.id}`).catch(() => {});
  }

  const full = await prisma.application.findUnique({
    where: { id: application.id },
    include: { matchResult: true, rejectionFeedback: true, job: true },
  });

  return NextResponse.json(full);
}
