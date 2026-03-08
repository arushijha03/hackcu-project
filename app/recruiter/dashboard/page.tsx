import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, FileText, Plus } from "lucide-react";

export default async function RecruiterDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.role !== "recruiter") {
    redirect("/dashboard");
  }

  const jobs = await prisma.job.findMany({
    where: { recruiterId: session.user.id },
    include: {
      _count: { select: { applications: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalApplications = jobs.reduce(
    (sum, j) => sum + j._count.applications,
    0
  );

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-6 py-8">
      <h1 className="text-3xl font-bold text-cu-black">
        Recruiter dashboard
      </h1>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-cu-dark-gray">
              My jobs
            </CardTitle>
            <Briefcase className="h-4 w-4 text-cu-gold" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-cu-black">{jobs.length}</p>
            <Button variant="link" size="sm" className="h-auto p-0" asChild>
              <Link href="/recruiter/jobs">View all jobs</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-cu-dark-gray">
              Total applications
            </CardTitle>
            <FileText className="h-4 w-4 text-cu-gold" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-cu-black">
              {totalApplications}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent jobs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent jobs</CardTitle>
          <Button asChild>
            <Link href="/recruiter/jobs/new">
              <Plus className="mr-2 h-4 w-4" />
              Post a new job
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <p className="text-sm text-cu-dark-gray">
              No jobs yet. Post your first job to get started.
            </p>
          ) : (
            <ul className="space-y-3">
              {jobs.slice(0, 10).map((job) => (
                <li
                  key={job.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-cu-light-gray p-3"
                >
                  <div>
                    <p className="font-medium">{job.title}</p>
                    <p className="text-sm text-cu-dark-gray">
                      {job._count.applications} application
                      {job._count.applications !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/recruiter/jobs/${job.id}/applicants`}>
                      View applicants
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
