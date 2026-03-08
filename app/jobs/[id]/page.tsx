import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeMatch } from "@/lib/ai/match-engine";
import type { ParsedResumeData } from "@/lib/ai/resume-parser";
import type { ParsedJobData } from "@/lib/ai/job-parser";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScoreBreakdown } from "@/components/shared/ScoreBreakdown";
import { GapAnalysisCard } from "@/components/shared/GapAnalysisCard";
import { ContactInfoCard } from "@/components/shared/ContactInfoCard";
import { ApplyButton } from "./ApplyButton";
import { Briefcase } from "lucide-react";

function safeParseJson<T>(str: string | null | undefined, fallback: T): T {
  if (!str || str === "") return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const job = await prisma.job.findUnique({
    where: { id },
    include: { parsedJob: true },
  });

  if (!job) notFound();

  let matchResult: Awaited<ReturnType<typeof computeMatch>> | null = null;
  let existingApplication: { id: string } | null = null;

  if (session?.user?.role === "student") {
    existingApplication = await prisma.application.findUnique({
      where: {
        studentId_jobId: { studentId: session.user.id, jobId: id },
      },
      select: { id: true },
    });

    if (!existingApplication) {
      const latestResume = await prisma.parsedResume.findFirst({
        where: { studentId: session.user.id },
        orderBy: { createdAt: "desc" },
      });

      if (latestResume && job.parsedJob) {
        const resumeData: ParsedResumeData = {
          skills: safeParseJson(latestResume.skillsJson, []),
          experience: safeParseJson(latestResume.experienceJson, []),
          education: safeParseJson(latestResume.educationJson, []),
          availability: latestResume.availability || null,
          eligibility: latestResume.eligibility || null,
          atsReadabilityScore: latestResume.atsReadabilityScore,
        };
        const parsedJobData: ParsedJobData = {
          requiredSkills: safeParseJson(job.parsedJob.requiredSkillsJson, []),
          preferredSkills: safeParseJson(job.parsedJob.preferredSkillsJson, []),
          requiredExperience: safeParseJson(
            job.parsedJob.requiredExperienceJson,
            []
          ),
          eligibilityRequirements: safeParseJson(
            job.parsedJob.eligibilityRequirementsJson,
            []
          ),
          availabilityRequirements: safeParseJson(
            job.parsedJob.availabilityRequirementsJson,
            []
          ),
        };
        matchResult = await computeMatch(resumeData, parsedJobData, {
          workStudyEligible: job.workStudyEligible,
          hoursPerWeek: job.hoursPerWeek,
        });
      }
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-6 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Briefcase className="h-6 w-6 text-cu-gold" />
                {job.title}
              </CardTitle>
              <p className="mt-1 text-cu-dark-gray">{job.department}</p>
              <p className="mt-1 text-sm text-cu-dark-gray">
                {job.hoursPerWeek} hrs/week
                {job.payRange && ` · ${job.payRange}`}
              </p>
            </div>
            {session?.user?.role === "student" && (
              <div>
                {existingApplication ? (
                  <Button asChild variant="outline">
                    <Link href={`/applications/${existingApplication.id}`}>
                      View application
                    </Link>
                  </Button>
                ) : (
                  <ApplyButton jobId={job.id} />
                )}
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap text-sm text-cu-dark-gray">
            {job.description}
          </div>
        </CardContent>
      </Card>

      {matchResult && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Your match</CardTitle>
            </CardHeader>
            <CardContent>
              <ScoreBreakdown
                scores={{
                  overallScore: matchResult.overallScore,
                  eligibilityScore: matchResult.eligibilityScore,
                  requiredSkillsScore: matchResult.requiredSkillsScore,
                  experienceScore: matchResult.experienceScore,
                  availabilityScore: matchResult.availabilityScore,
                  preferredSkillsScore: matchResult.preferredSkillsScore,
                  atsReadabilityScore: matchResult.atsReadabilityScore,
                }}
              />
            </CardContent>
          </Card>

          <GapAnalysisCard
            strengths={matchResult.strengths}
            gaps={matchResult.gaps}
            fitReasons={matchResult.fitReasons}
          />
        </>
      )}

      <ContactInfoCard
        contactName={job.contactName}
        contactEmail={job.contactEmail}
        contactPhone={job.contactPhone}
        additionalContactInfo={job.additionalContactInfo}
        title="Contact"
      />
    </div>
  );
}
