import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

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
      job: true,
      student: true,
      matchResult: true,
      rejectionFeedback: true,
    },
  });

  return NextResponse.json(updated);
}
