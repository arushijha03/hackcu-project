import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseResumeText } from "@/lib/ai/resume-parser";
import { extractTextFromPDF } from "@/lib/pdf";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json(
      { error: "No file provided" },
      { status: 400 }
    );
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json(
      { error: "File must be a PDF" },
      { status: 400 }
    );
  }

  let text: string;
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    text = await extractTextFromPDF(buffer);

    if (text.length < 20) {
      return NextResponse.json(
        { error: "Could not extract text from PDF. Make sure it's not a scanned image." },
        { status: 400 }
      );
    }
  } catch (err) {
    console.error("PDF parse error:", err);
    return NextResponse.json(
      { error: "Failed to read PDF file. Please try a different file." },
      { status: 400 }
    );
  }

  const availabilityDate = formData.get("availabilityDate") as string | null;

  const parsed = await parseResumeText(text);

  const availability = availabilityDate
    ? `Available from ${availabilityDate}`
    : parsed.availability ?? "";

  const parsedResume = await prisma.parsedResume.create({
    data: {
      studentId: session.user.id,
      rawText: text,
      skillsJson: JSON.stringify(parsed.skills),
      experienceJson: JSON.stringify(parsed.experience),
      educationJson: JSON.stringify(parsed.education),
      availability,
      eligibility: parsed.eligibility ?? "",
      atsReadabilityScore: parsed.atsReadabilityScore,
      resumeEmail: parsed.resumeEmail ?? "",
      graduationDate: parsed.graduationDate ?? "",
    },
  });

  return NextResponse.json(parsedResume);
}
