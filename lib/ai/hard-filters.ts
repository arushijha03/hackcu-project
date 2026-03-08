import type { ParsedResumeData } from "./resume-parser";
import type { ParsedJobData } from "./job-parser";

export type HardFilterResult = {
  passed: boolean;
  unmetRequirements: string[];
};

function parseHoursFromAvailability(availability: string | null): number | null {
  if (!availability) return null;
  const match = availability.match(/(\d+)\s*(?:hours?|hrs?)/i);
  return match ? parseInt(match[1], 10) : null;
}

export function runHardFilters(
  resume: ParsedResumeData,
  parsedJob: ParsedJobData,
  job: { workStudyEligible: boolean; hoursPerWeek?: number | null }
): HardFilterResult {
  const unmetRequirements: string[] = [];

  if (job.workStudyEligible) {
    const eligibility = (resume.eligibility ?? "").toLowerCase();
    if (!eligibility.includes("work") && !eligibility.includes("work_study")) {
      unmetRequirements.push("Work-study eligibility required");
    }
  }

  if (job.hoursPerWeek != null && job.hoursPerWeek > 0) {
    const resumeHours = parseHoursFromAvailability(resume.availability);
    if (resumeHours != null && resumeHours < job.hoursPerWeek) {
      unmetRequirements.push(
        `Insufficient availability: job requires ${job.hoursPerWeek} hours/week, resume indicates ${resumeHours} hours/week`
      );
    }
  }

  return {
    passed: unmetRequirements.length === 0,
    unmetRequirements,
  };
}
