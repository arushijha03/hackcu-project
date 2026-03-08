"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ApplicantTrackerBadge } from "@/components/shared/ApplicantTrackerBadge";
import { Label } from "@/components/ui/label";

const STATUS_OPTIONS = [
  { value: "applied", label: "Applied" },
  { value: "under_review", label: "Under review" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "contacted", label: "Contacted" },
  { value: "rejected", label: "Rejected" },
  { value: "hired", label: "Hired" },
];

interface ApplicantWithRelations {
  id: string;
  trackerStatus: string;
  student: { name: string; email: string };
  matchResult: { overallScore: number } | null;
}

interface ApplicantsTableProps {
  applications: ApplicantWithRelations[];
  jobId: string;
}

export function ApplicantsTable({ applications, jobId }: ApplicantsTableProps) {
  const router = useRouter();
  const [blindReview, setBlindReview] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function handleStatusChange(applicationId: string, newStatus: string) {
    setUpdatingId(applicationId);
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackerStatus: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update");
      router.refresh();
    } catch {
      setUpdatingId(null);
    }
  }

  if (applications.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-cu-dark-gray">
        No applicants yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="blindReview"
          checked={blindReview}
          onChange={(e) => setBlindReview(e.target.checked)}
          className="h-4 w-4 rounded border-cu-light-gray"
        />
        <Label htmlFor="blindReview" className="font-normal">
          Blind review (hide applicant names)
        </Label>
      </div>

      <div className="overflow-x-auto rounded-md border border-cu-light-gray">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cu-light-gray bg-cu-light-gold/50">
              <th className="px-4 py-3 text-left font-medium">Applicant</th>
              <th className="px-4 py-3 text-left font-medium">Score</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr
                key={app.id}
                className="border-b border-cu-light-gray last:border-0"
              >
                <td className="px-4 py-3">
                  {blindReview ? (
                    <span className="text-cu-dark-gray">
                      Applicant #{applications.indexOf(app) + 1}
                    </span>
                  ) : (
                    <div>
                      <p className="font-medium">{app.student.name || "—"}</p>
                      <p className="text-cu-dark-gray">{app.student.email}</p>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {app.matchResult ? (
                    <span className="font-medium">
                      {Math.round(app.matchResult.overallScore)}%
                    </span>
                  ) : (
                    <span className="text-cu-dark-gray">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <ApplicantTrackerBadge status={app.trackerStatus} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Select
                      value={app.trackerStatus}
                      onValueChange={(v) => handleStatusChange(app.id, v)}
                      disabled={updatingId === app.id}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="link" size="sm" asChild>
                      <Link href={`/recruiter/applications/${app.id}`}>
                        View
                      </Link>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
