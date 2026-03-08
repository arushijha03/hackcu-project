import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseResumeText } from "@/lib/ai/resume-parser";

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
    const decoder = new TextDecoder("utf-8", { fatal: false });
    text = decoder.decode(arrayBuffer);
    // If text is mostly garbage/binary, use placeholder
    const printableRatio =
      text.split("").filter((c) => c.charCodeAt(0) >= 32 && c.charCodeAt(0) < 127).length /
      Math.max(text.length, 1);
    if (text.length < 50 || printableRatio < 0.7) {
      text = "Resume uploaded - parsing simulated for demo";
    }
  } catch {
    text = "Resume uploaded - parsing simulated for demo";
  }

  const parsed = await parseResumeText(text);

  const parsedResume = await prisma.parsedResume.create({
    data: {
      studentId: session.user.id,
      rawText: text,
      skillsJson: JSON.stringify(parsed.skills),
      experienceJson: JSON.stringify(parsed.experience),
      educationJson: JSON.stringify(parsed.education),
      availability: parsed.availability ?? "",
      eligibility: parsed.eligibility ?? "",
      atsReadabilityScore: parsed.atsReadabilityScore,
    },
  });

  return NextResponse.json(parsedResume);
}
