import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApplicantTrackerBadge } from "@/components/shared/ApplicantTrackerBadge";
import { FileText, Briefcase, ClipboardList } from "lucide-react";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.role === "recruiter") {
    redirect("/recruiter/dashboard");
  }

  const studentId = session.user.id;

  const [latestResume, applications] = await Promise.all([
    prisma.parsedResume.findFirst({
      where: { studentId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.application.findMany({
      where: { studentId },
      include: { job: true },
      orderBy: { submittedAt: "desc" },
      take: 5,
    }),
  ]);

  const skillsCount = latestResume
    ? (JSON.parse(latestResume.skillsJson || "[]") as string[]).length
    : 0;

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-6 py-8">
      <h1 className="text-3xl font-bold text-cu-black">Dashboard</h1>

      {/* Resume status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-cu-gold" />
            Resume status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {latestResume ? (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-cu-dark-gray">
                  Last uploaded:{" "}
                  {new Date(latestResume.createdAt).toLocaleDateString()}
                </p>
                <p className="text-sm text-cu-dark-gray">
                  Skills extracted: {skillsCount}
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/resume">Update resume</Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-cu-dark-gray">No resume uploaded</p>
              <Button asChild>
                <Link href="/resume">Upload resume</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Browse jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-cu-gold" />
            Browse jobs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-cu-dark-gray">
            Find on-campus jobs and see your match score before applying.
          </p>
          <Button asChild>
            <Link href="/jobs">Browse jobs</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Recent applications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-cu-gold" />
            Recent applications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <p className="text-sm text-cu-dark-gray">
              No applications yet. Browse jobs to get started.
            </p>
          ) : (
            <ul className="space-y-3">
              {applications.map((app) => (
                <li
                  key={app.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-cu-light-gray p-3"
                >
                  <div>
                    <p className="font-medium">{app.job.title}</p>
                    <p className="text-sm text-cu-dark-gray">
                      {app.job.department}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ApplicantTrackerBadge status={app.trackerStatus} />
                    <Button variant="link" size="sm" asChild>
                      <Link href={`/applications/${app.id}`}>View</Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
