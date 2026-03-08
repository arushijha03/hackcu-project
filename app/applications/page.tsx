import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApplicantTrackerBadge } from "@/components/shared/ApplicantTrackerBadge";
import { ClipboardList } from "lucide-react";

export default async function ApplicationsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.role === "recruiter") {
    redirect("/recruiter/dashboard");
  }

  const applications = await prisma.application.findMany({
    where: { studentId: session.user.id },
    include: { job: true },
    orderBy: { submittedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-6 py-8">
      <h1 className="text-3xl font-bold text-cu-black">My applications</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-cu-gold" />
            Applications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <p className="text-sm text-cu-dark-gray">
              No applications yet. Browse jobs to apply.
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
                    <p className="text-xs text-cu-dark-gray">
                      Applied {new Date(app.submittedAt).toLocaleDateString()}
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
