import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function RecruiterJobsPage() {
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

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-cu-black">My jobs</h1>
        <Button asChild>
          <Link href="/recruiter/jobs/new">
            <Plus className="mr-2 h-4 w-4" />
            Post new job
          </Link>
        </Button>
      </div>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-cu-dark-gray">
              No jobs yet. Post your first job to get started.
            </p>
            <Button asChild className="mt-4">
              <Link href="/recruiter/jobs/new">Post new job</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {jobs.map((job) => (
            <Card key={job.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{job.title}</CardTitle>
                <p className="text-sm text-cu-dark-gray">{job.department}</p>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-cu-dark-gray">
                  {job._count.applications} application
                  {job._count.applications !== 1 ? "s" : ""}
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/recruiter/jobs/${job.id}/applicants`}>
                    View applicants
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
