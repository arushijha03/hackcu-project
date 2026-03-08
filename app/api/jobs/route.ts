import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseJobDescription } from "@/lib/ai/job-parser";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role === "recruiter") {
    const jobs = await prisma.job.findMany({
      where: { recruiterId: session.user.id },
      include: { parsedJob: true },
    });
    return NextResponse.json(jobs);
  }

  // student: return all open jobs
  const jobs = await prisma.job.findMany({
    where: { status: "open" },
    include: { parsedJob: true },
  });
  return NextResponse.json(jobs);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "recruiter") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    title,
    department,
    description,
    workStudyEligible,
    hoursPerWeek,
    payRange,
    contactName,
    contactEmail,
    contactPhone,
    additionalContactInfo,
  } = body;

  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json(
      { error: "Title is required" },
      { status: 400 }
    );
  }
  if (!description || typeof description !== "string" || !description.trim()) {
    return NextResponse.json(
      { error: "Description is required" },
      { status: 400 }
    );
  }

  const job = await prisma.job.create({
    data: {
      recruiterId: session.user.id,
      title: title.trim(),
      department: typeof department === "string" ? department.trim() : "",
      description: description.trim(),
      workStudyEligible: Boolean(workStudyEligible),
      hoursPerWeek:
        typeof hoursPerWeek === "number" && hoursPerWeek >= 0
          ? hoursPerWeek
          : 0,
      payRange: typeof payRange === "string" ? payRange.trim() : "",
      contactName: typeof contactName === "string" ? contactName.trim() : "",
      contactEmail: typeof contactEmail === "string" ? contactEmail.trim() : "",
      contactPhone: typeof contactPhone === "string" ? contactPhone.trim() : "",
      additionalContactInfo:
        typeof additionalContactInfo === "string"
          ? additionalContactInfo.trim()
          : "",
    },
  });

  const parsed = await parseJobDescription(job.description);

  await prisma.parsedJob.create({
    data: {
      jobId: job.id,
      requiredSkillsJson: JSON.stringify(parsed.requiredSkills),
      preferredSkillsJson: JSON.stringify(parsed.preferredSkills),
      requiredExperienceJson: JSON.stringify(parsed.requiredExperience),
      eligibilityRequirementsJson: JSON.stringify(parsed.eligibilityRequirements),
      availabilityRequirementsJson: JSON.stringify(parsed.availabilityRequirements),
    },
  });

  const jobWithParsed = await prisma.job.findUnique({
    where: { id: job.id },
    include: { parsedJob: true },
  });

  return NextResponse.json(jobWithParsed);
}
