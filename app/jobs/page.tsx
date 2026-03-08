import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase } from "lucide-react";

export default async function JobsPage() {
  const jobs = await prisma.job.findMany({
    where: { status: "open" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-8">
      <h1 className="text-3xl font-bold text-cu-black">Open jobs</h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => (
          <Card key={job.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Briefcase className="h-5 w-5 text-cu-gold" />
                {job.title}
              </CardTitle>
              <p className="text-sm text-cu-dark-gray">{job.department}</p>
              <p className="text-sm text-cu-dark-gray">
                {job.hoursPerWeek} hrs/week
                {job.payRange && ` · ${job.payRange}`}
              </p>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href={`/jobs/${job.id}`}>View match & apply</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {jobs.length === 0 && (
        <p className="text-center text-cu-dark-gray">
          No open jobs at the moment. Check back later.
        </p>
      )}
    </div>
  );
}
