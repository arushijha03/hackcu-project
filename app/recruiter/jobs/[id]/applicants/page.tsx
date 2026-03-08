import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContactInfoCard } from "@/components/shared/ContactInfoCard";
import { ApplicantsTable } from "./ApplicantsTable";
import { ArrowLeft } from "lucide-react";

export default async function JobApplicantsPage({
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

  const job = await prisma.job.findUnique({
    where: { id },
  });

  if (!job || job.recruiterId !== session.user.id) {
    notFound();
  }

  const applications = await prisma.application.findMany({
    where: { jobId: id },
    include: {
      student: true,
      matchResult: true,
    },
  });

  applications.sort((a, b) => {
    const scoreA = a.matchResult?.overallScore ?? -1;
    const scoreB = b.matchResult?.overallScore ?? -1;
    return scoreB - scoreA;
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/recruiter/jobs">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-cu-black">{job.title}</h1>
          {job.department && (
            <p className="text-cu-dark-gray">{job.department}</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                Applicants ({applications.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ApplicantsTable applications={applications} jobId={job.id} />
            </CardContent>
          </Card>
        </div>
        <div>
          <ContactInfoCard
            contactName={job.contactName || undefined}
            contactEmail={job.contactEmail || undefined}
            contactPhone={job.contactPhone || undefined}
            additionalContactInfo={job.additionalContactInfo || undefined}
            title="Job contact"
          />
        </div>
      </div>
    </div>
  );
}
