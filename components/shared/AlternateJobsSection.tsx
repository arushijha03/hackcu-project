"use client";

import Link from "next/link";
import { Briefcase } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AlternateJob {
  id: string;
  title: string;
  department?: string | null;
}

export interface AlternateJobsSectionProps {
  jobs: AlternateJob[];
}

export function AlternateJobsSection({ jobs }: AlternateJobsSectionProps) {
  if (jobs.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Briefcase className="h-5 w-5 text-cu-gold" />
          Jobs that may fit you better
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {jobs.map((job) => (
            <li
              key={job.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-cu-light-gray p-3"
            >
              <div>
                <p className="font-medium">{job.title}</p>
                {job.department && (
                  <p className="text-sm text-cu-dark-gray">{job.department}</p>
                )}
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/jobs/${job.id}`}>View</Link>
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
