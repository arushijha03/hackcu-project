"use client";

import { cn } from "@/lib/utils";

const STATUS_MAP: Record<
  string,
  { label: string; className: string }
> = {
  applied: { label: "Applied", className: "bg-cu-light-gray text-cu-dark-gray" },
  screened_in: {
    label: "Screened in",
    className: "bg-green-100 text-green-700",
  },
  screened_out: {
    label: "Screened out",
    className: "bg-amber-100 text-amber-700",
  },
  under_review: {
    label: "Under review",
    className: "bg-cu-sky-blue/20 text-cu-dark-blue",
  },
  shortlisted: {
    label: "Shortlisted",
    className: "bg-cu-gold/30 text-cu-gold-dark",
  },
  contacted: {
    label: "Contacted",
    className: "bg-cu-sky-blue/20 text-cu-dark-blue",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-100 text-red-700",
  },
  hired: {
    label: "Hired",
    className: "bg-green-100 text-green-700",
  },
};

export interface ApplicantTrackerBadgeProps {
  status: string;
}

export function ApplicantTrackerBadge({ status }: ApplicantTrackerBadgeProps) {
  const config =
    STATUS_MAP[status] ?? STATUS_MAP.applied;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
