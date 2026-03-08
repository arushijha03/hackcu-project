import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApplicantTrackerBadge } from "@/components/shared/ApplicantTrackerBadge";
import { ScoreBreakdown } from "@/components/shared/ScoreBreakdown";
import { ExplainableCard } from "@/components/shared/ExplainableCard";
import { AlternateJobsSection } from "@/components/shared/AlternateJobsSection";
import { ContactInfoCard } from "@/components/shared/ContactInfoCard";
import { CheckCircle, XCircle } from "lucide-react";

function safeParseJson<T>(str: string | null | undefined, fallback: T): T {
  if (!str || str === "") return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.role === "recruiter") {
    redirect("/recruiter/dashboard");
  }

  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      job: true,
      matchResult: true,
      rejectionFeedback: true,
    },
  });

  if (!application) notFound();
  if (application.studentId !== session.user.id) notFound();

  const isScreenedIn =
    application.status === "screened_in" ||
    application.trackerStatus === "screened_in" ||
    ["shortlisted", "contacted", "hired"].includes(application.trackerStatus);
  const isScreenedOut =
    application.status === "screened_out" ||
    application.trackerStatus === "screened_out" ||
    application.trackerStatus === "rejected";

  let alternateJobs: { id: string; title: string; department?: string | null }[] = [];
  if (application.rejectionFeedback?.alternateJobIdsJson) {
    const ids = safeParseJson<string[]>(
      application.rejectionFeedback.alternateJobIdsJson,
      []
    );
    if (ids.length > 0) {
      const jobs = await prisma.job.findMany({
        where: { id: { in: ids } },
        select: { id: true, title: true, department: true },
      });
      alternateJobs = jobs;
    }
  }

  const unmetRequirements = application.rejectionFeedback
    ? safeParseJson<string[]>(
        application.rejectionFeedback.unmetRequirementsJson,
        []
      )
    : [];
  const resumeGaps = application.rejectionFeedback
    ? safeParseJson<string[]>(
        application.rejectionFeedback.resumeGapsJson,
        []
      )
    : [];
  const improvementSuggestions = application.rejectionFeedback
    ? safeParseJson<string[]>(
        application.rejectionFeedback.improvementSuggestionsJson,
        []
      )
    : [];
  const plainEnglishSummary =
    application.rejectionFeedback?.plainEnglishSummary ?? undefined;

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-cu-black">
          {application.job.title}
        </h1>
        <ApplicantTrackerBadge status={application.trackerStatus} />
      </div>

      <p className="text-cu-dark-gray">{application.job.department}</p>

      {/* Status card */}
      <Card
        className={
          isScreenedIn
            ? "border-green-200 bg-green-50"
            : isScreenedOut
              ? "border-amber-200 bg-amber-50"
              : ""
        }
      >
        <CardContent className="flex items-center gap-3 pt-6">
          {isScreenedIn ? (
            <>
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Screened in</p>
                <p className="text-sm text-green-700">
                  Your application passed the initial screening.
                </p>
              </div>
            </>
          ) : isScreenedOut ? (
            <>
              <XCircle className="h-8 w-8 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">Screened out</p>
                <p className="text-sm text-amber-700">
                  See feedback below for how to improve.
                </p>
              </div>
            </>
          ) : (
            <p className="text-cu-dark-gray">Application under review.</p>
          )}
        </CardContent>
      </Card>

      {application.matchResult && (
        <Card>
          <CardHeader>
            <CardTitle>Match score</CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreBreakdown
              scores={{
                overallScore: application.matchResult.overallScore,
                eligibilityScore: application.matchResult.eligibilityScore,
                requiredSkillsScore:
                  application.matchResult.requiredSkillsScore,
                experienceScore: application.matchResult.experienceScore,
                availabilityScore: application.matchResult.availabilityScore,
                preferredSkillsScore:
                  application.matchResult.preferredSkillsScore,
                atsReadabilityScore:
                  application.matchResult.atsReadabilityScore,
              }}
            />
          </CardContent>
        </Card>
      )}

      {isScreenedOut && application.rejectionFeedback && (
        <ExplainableCard
          title="Feedback"
          unmetRequirements={unmetRequirements}
          resumeGaps={resumeGaps}
          improvementSuggestions={improvementSuggestions}
          plainEnglishSummary={plainEnglishSummary}
        />
      )}

      {alternateJobs.length > 0 && (
        <AlternateJobsSection jobs={alternateJobs} />
      )}

      <ContactInfoCard
        contactName={application.job.contactName}
        contactEmail={application.job.contactEmail}
        contactPhone={application.job.contactPhone}
        additionalContactInfo={application.job.additionalContactInfo}
        title="Contact"
      />

      <Button asChild variant="outline">
        <Link href="/jobs">Browse more jobs</Link>
      </Button>
    </div>
  );
}
