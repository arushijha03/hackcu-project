import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateRejectionSummary } from "@/lib/ai/explain-engine";
import { runHardFilters } from "@/lib/ai/hard-filters";
import { sendRejectionEmail } from "@/lib/email";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      job: true,
      student: true,
      matchResult: true,
      rejectionFeedback: true,
    },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  // Students can only view their own; recruiters can view apps for their jobs
  if (session.user.role === "student" && application.studentId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (session.user.role === "recruiter") {
    const job = await prisma.job.findUnique({
      where: { id: application.jobId },
    });
    if (!job || job.recruiterId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.json(application);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "recruiter") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const application = await prisma.application.findUnique({
    where: { id },
    include: { job: true },
  });

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  if (application.job.recruiterId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { trackerStatus, recruiterNotes } = body;

  const updateData: { trackerStatus?: string; recruiterNotes?: string } = {};
  if (trackerStatus !== undefined && typeof trackerStatus === "string") {
    updateData.trackerStatus = trackerStatus;
  }
  if (recruiterNotes !== undefined && typeof recruiterNotes === "string") {
    updateData.recruiterNotes = recruiterNotes;
  }

  const updated = await prisma.application.update({
    where: { id },
    data: updateData,
    include: {
      job: { include: { parsedJob: true } },
      student: true,
      matchResult: true,
      rejectionFeedback: true,
    },
  });

  if (trackerStatus === "rejected") {
    const app = updated;
    let feedback = app.rejectionFeedback;

    if (!feedback && app.matchResult) {
      const resume = await prisma.parsedResume.findFirst({
        where: { studentId: app.studentId },
        orderBy: { createdAt: "desc" },
      });

      const resumeData = resume
        ? {
            skills: JSON.parse(resume.skillsJson || "[]") as string[],
            experience: JSON.parse(resume.experienceJson || "[]") as Array<{
              title: string;
              company: string;
              duration?: string;
              bullets: string[];
            }>,
            education: JSON.parse(resume.educationJson || "[]") as Array<{
              degree: string;
              institution: string;
              year?: string;
            }>,
            availability: resume.availability || null,
            eligibility: resume.eligibility || null,
            atsReadabilityScore: resume.atsReadabilityScore,
          }
        : null;

      const pj = app.job.parsedJob;
      const parsedJobData = pj
        ? {
            requiredSkills: JSON.parse(pj.requiredSkillsJson || "[]") as string[],
            preferredSkills: JSON.parse(pj.preferredSkillsJson || "[]") as string[],
            requiredExperience: JSON.parse(pj.requiredExperienceJson || "[]") as string[],
            eligibilityRequirements: JSON.parse(pj.eligibilityRequirementsJson || "[]") as string[],
            availabilityRequirements: JSON.parse(pj.availabilityRequirementsJson || "[]") as string[],
          }
        : { requiredSkills: [] as string[], preferredSkills: [] as string[], requiredExperience: [] as string[], eligibilityRequirements: [] as string[], availabilityRequirements: [] as string[] };

      const hardFilterResult = resumeData
        ? runHardFilters(resumeData, parsedJobData, {
            workStudyEligible: app.job.workStudyEligible,
            hoursPerWeek: app.job.hoursPerWeek,
          })
        : { passed: true, unmetRequirements: [] as string[] };

      const gaps = JSON.parse(app.matchResult.gapsJson || "[]") as string[];
      const improvementSuggestions =
        gaps.length > 0
          ? gaps.slice(0, 3).map((g: string) => `Consider: ${g}`)
          : ["Add more relevant experience to your resume.", "Highlight skills that match the job description."];

      let summary: string;
      try {
        summary = await generateRejectionSummary({
          overallScore: app.matchResult.overallScore,
          metHardFilters: app.matchResult.metHardFilters,
          unmetRequirements: hardFilterResult.unmetRequirements,
          strengths: JSON.parse(app.matchResult.strengthsJson || "[]"),
          gaps,
          improvementSuggestions,
        });
      } catch {
        summary = "We encourage you to review the feedback and apply to other roles.";
      }

      const alternateJobs = await prisma.job.findMany({
        where: { id: { not: app.jobId }, status: "open" },
        take: 3,
        orderBy: { createdAt: "desc" },
      });

      feedback = await prisma.rejectionFeedback.create({
        data: {
          applicationId: app.id,
          unmetRequirementsJson: JSON.stringify(hardFilterResult.unmetRequirements),
          resumeGapsJson: JSON.stringify(gaps),
          improvementSuggestionsJson: JSON.stringify(improvementSuggestions),
          alternateJobIdsJson: JSON.stringify(alternateJobs.map((j) => j.id)),
          plainEnglishSummary: summary,
        },
      });

      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3001";
      const applicationUrl = `${baseUrl}/applications/${app.id}`;

      sendRejectionEmail("ardon.kotey371@gmail.com", app.job.title, summary, applicationUrl).catch(
        () => {}
      );
    } else if (feedback && feedback.plainEnglishSummary) {
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3001";
      sendRejectionEmail(
        "ardon.kotey371@gmail.com",
        app.job.title,
        feedback.plainEnglishSummary,
        `${baseUrl}/applications/${app.id}`
      ).catch(() => {});
    }
  }

  const final =
    updated.rejectionFeedback ||
    (await prisma.application.findUnique({
      where: { id },
      include: {
        job: { include: { parsedJob: true } },
        student: true,
        matchResult: true,
        rejectionFeedback: true,
      },
    }));

  return NextResponse.json(final ?? updated);
}
