import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase } from "lucide-react";
import { JobsFilters } from "./JobsFilters";

function getDateCutoff(dateFilter: string): Date | null {
  const now = new Date();
  if (dateFilter === "24h") {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    return d;
  }
  if (dateFilter === "7d") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (dateFilter === "30d") {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    return d;
  }
  return null;
}

function formatPostedDate(postedAt: Date | null, createdAt: Date): string {
  const d = postedAt || createdAt;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return d.toLocaleDateString();
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const dateFilter = params.date || "all";
  const sort = params.sort || "newest";

  const where: Record<string, unknown> = { status: "open" };

  const dateCutoff = getDateCutoff(dateFilter);
  if (dateCutoff) {
    where.OR = [
      { postedAt: { gte: dateCutoff } },
      { postedAt: null, createdAt: { gte: dateCutoff } },
    ];
  }

  const orderBy =
    sort === "oldest"
      ? { createdAt: "asc" as const }
      : { createdAt: "desc" as const };

  const jobs = await prisma.job.findMany({
    where,
    orderBy,
    include: { parsedJob: true },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-6 py-8">
      <h1 className="text-3xl font-bold text-cu-black">Open jobs</h1>

      <Suspense fallback={<div className="h-10" />}>
        <JobsFilters />
      </Suspense>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => (
          <Card key={job.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Briefcase className="h-5 w-5 shrink-0 text-cu-gold" />
                  {job.title}
                </CardTitle>
                <span className="shrink-0 rounded bg-cu-light-gold px-2 py-0.5 text-xs font-medium text-cu-black">
                  Campus
                </span>
              </div>
              <p className="text-sm font-medium text-cu-dark-gray">
                {job.employerName || job.department || "—"}
              </p>
              <p className="text-sm text-cu-dark-gray">
                {job.hoursPerWeek > 0 && `${job.hoursPerWeek} hrs/week`}
                {job.hoursPerWeek > 0 && job.payRange && " · "}
                {job.payRange || "—"}
              </p>
              <p className="text-xs text-cu-dark-gray">
                Posted {formatPostedDate(job.postedAt, job.createdAt)}
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
          No open jobs match your filters. Try adjusting filters.
        </p>
      )}
    </div>
  );
}
