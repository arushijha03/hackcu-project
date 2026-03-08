import type { ParsedResumeData } from "./resume-parser";
import type { ParsedJobData } from "./job-parser";
import type { HardFilterResult } from "./hard-filters";
import { runHardFilters } from "./hard-filters";

const WEIGHTS = {
  eligibility: 0.2,
  requiredSkills: 0.25,
  experience: 0.25,
  availability: 0.15,
  preferredSkills: 0.1,
  atsReadability: 0.05,
};

export type MatchScores = {
  overallScore: number;
  eligibilityScore: number;
  requiredSkillsScore: number;
  experienceScore: number;
  availabilityScore: number;
  preferredSkillsScore: number;
  atsReadabilityScore: number;
  strengths: string[];
  gaps: string[];
  fitReasons: string[];
  metHardFilters: boolean;
  hardFilterResult: HardFilterResult;
};

function keywordOverlap(
  resumeItems: string[],
  jobItems: string[]
): { score: number; matches: string[] } {
  const resumeSet = new Set(resumeItems.map((s) => s.toLowerCase().trim()));
  const jobSet = new Set(jobItems.map((s) => s.toLowerCase().trim()));
  const matches: string[] = [];
  for (const j of jobSet) {
    if (resumeSet.has(j)) matches.push(j);
    else {
      for (const r of resumeSet) {
        if (r.includes(j) || j.includes(r)) {
          matches.push(j);
          break;
        }
      }
    }
  }
  const score =
    jobSet.size === 0 ? 100 : Math.min(100, (matches.length / jobSet.size) * 100);
  return { score, matches };
}

function getExperienceStrings(resume: ParsedResumeData): string[] {
  const strs: string[] = [];
  for (const exp of resume.experience) {
    strs.push(exp.title, exp.company, ...exp.bullets);
  }
  return strs;
}

export async function computeMatch(
  resume: ParsedResumeData,
  parsedJob: ParsedJobData,
  job: { workStudyEligible: boolean; hoursPerWeek?: number | null }
): Promise<MatchScores> {
  const hardFilterResult = runHardFilters(resume, parsedJob, job);

  const eligibilityScore = (() => {
    if (!job.workStudyEligible) return 80;
    const el = (resume.eligibility ?? "").toLowerCase();
    if (el.includes("work") || el.includes("work_study")) return 100;
    return 30;
  })();

  const availabilityScore = (() => {
    if (!job.hoursPerWeek || job.hoursPerWeek <= 0) return 70;
    if (resume.availability && resume.availability.trim()) return 85;
    return 50;
  })();

  const { score: requiredSkillsScore, matches: requiredMatches } = keywordOverlap(
    resume.skills,
    parsedJob.requiredSkills
  );

  const expStrings = getExperienceStrings(resume);
  const { score: experienceScore, matches: expMatches } = keywordOverlap(
    expStrings,
    parsedJob.requiredExperience
  );

  const { score: preferredSkillsScore, matches: preferredMatches } =
    keywordOverlap(resume.skills, parsedJob.preferredSkills);

  const atsReadabilityScore = resume.atsReadabilityScore;

  const overallScore =
    eligibilityScore * WEIGHTS.eligibility +
    requiredSkillsScore * WEIGHTS.requiredSkills +
    experienceScore * WEIGHTS.experience +
    availabilityScore * WEIGHTS.availability +
    preferredSkillsScore * WEIGHTS.preferredSkills +
    atsReadabilityScore * WEIGHTS.atsReadability;

  const strengths: string[] = [];
  const gaps: string[] = [];
  const fitReasons: string[] = [];

  if (requiredMatches.length > 0) {
    strengths.push(`Strong match on required skills: ${requiredMatches.join(", ")}`);
    fitReasons.push("Skills align with job requirements");
  }
  if (requiredSkillsScore < 50 && parsedJob.requiredSkills.length > 0) {
    gaps.push(
      `Missing required skills: ${parsedJob.requiredSkills.filter((s) => !requiredMatches.includes(s.toLowerCase())).join(", ")}`
    );
  }

  if (expMatches.length > 0) {
    strengths.push(`Relevant experience: ${expMatches.join(", ")}`);
    fitReasons.push("Experience matches job requirements");
  }
  if (experienceScore < 50 && parsedJob.requiredExperience.length > 0) {
    gaps.push("Limited experience in required areas");
  }

  if (preferredMatches.length > 0) {
    fitReasons.push("Has preferred skills");
  }

  if (eligibilityScore === 100) {
    fitReasons.push("Work-study eligible");
  }
  if (eligibilityScore === 30) {
    gaps.push("Work-study eligibility required but not indicated");
  }

  if (availabilityScore >= 85) {
    fitReasons.push("Availability meets requirements");
  }
  if (availabilityScore === 50 && job.hoursPerWeek) {
    gaps.push("Availability not clearly stated");
  }

  if (atsReadabilityScore >= 80) {
    fitReasons.push("Resume is well-formatted for ATS");
  }

  return {
    overallScore: Math.round(overallScore * 10) / 10,
    eligibilityScore,
    requiredSkillsScore,
    experienceScore,
    availabilityScore,
    preferredSkillsScore,
    atsReadabilityScore,
    strengths,
    gaps,
    fitReasons,
    metHardFilters: hardFilterResult.passed,
    hardFilterResult,
  };
}
