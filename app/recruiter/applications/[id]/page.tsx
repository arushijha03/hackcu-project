import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApplicantTrackerBadge } from "@/components/shared/ApplicantTrackerBadge";
import { ScoreBreakdown } from "@/components/shared/ScoreBreakdown";
import { GapAnalysisCard } from "@/components/shared/GapAnalysisCard";
import { UpdateStatusForm } from "./UpdateStatusForm";
import { ArrowLeft } from "lucide-react";

export default async function RecruiterApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.role !== "recruiter") {
    redirect("/dashboard");
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

  if (!application || application.job.recruiterId !== session.user.id) {
    notFound();
  }

  const strengths = application.matchResult
    ? (JSON.parse(application.matchResult.strengthsJson || "[]") as string[])
    : [];
  const gaps = application.matchResult
    ? (JSON.parse(application.matchResult.gapsJson || "[]") as string[])
    : [];
  const fitReasons = application.matchResult
    ? (JSON.parse(application.matchResult.fitReasonsJson || "[]") as string[])
    : [];

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-6 py-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/recruiter/jobs/${application.jobId}/applicants`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-cu-black">
            Application: {application.job.title}
          </h1>
          <p className="text-cu-dark-gray">
            {application.student.name || "—"} · {application.student.email}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <ApplicantTrackerBadge status={application.trackerStatus} />
        <UpdateStatusForm
          applicationId={application.id}
          currentStatus={application.trackerStatus}
        />
      </div>

      {application.matchResult && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Score breakdown</CardTitle>
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

          <GapAnalysisCard
            strengths={strengths}
            gaps={gaps}
            fitReasons={fitReasons}
          />
        </div>
      )}

      {!application.matchResult && (
        <Card>
          <CardContent className="py-8 text-center text-cu-dark-gray">
            No match score available for this application.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
