import type { ParsedResumeData } from "./resume-parser";
import type { ParsedJobData } from "./job-parser";
import type { HardFilterResult } from "./hard-filters";
import { runHardFilters } from "./hard-filters";
import { openai } from "./openai";

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

export async function computeMatch(
  resume: ParsedResumeData,
  parsedJob: ParsedJobData,
  job: { workStudyEligible: boolean; hoursPerWeek?: number | null }
): Promise<MatchScores> {
  const hardFilterResult = runHardFilters(resume, parsedJob, job);

  if (openai) {
    return computeMatchWithAI(resume, parsedJob, job, hardFilterResult);
  }

  return computeMatchFallback(resume, parsedJob, job, hardFilterResult);
}

async function computeMatchWithAI(
  resume: ParsedResumeData,
  parsedJob: ParsedJobData,
  job: { workStudyEligible: boolean; hoursPerWeek?: number | null },
  hardFilterResult: HardFilterResult
): Promise<MatchScores> {
  const prompt = `You are an expert ATS (Applicant Tracking System) analyzer. Compare this candidate's resume against the job requirements and provide an accurate, honest assessment.

## CANDIDATE RESUME
Skills: ${JSON.stringify(resume.skills)}
Experience: ${JSON.stringify(resume.experience)}
Education: ${JSON.stringify(resume.education)}
Availability: ${resume.availability || "Not specified"}
Eligibility: ${resume.eligibility || "Not specified"}

## JOB REQUIREMENTS
Required Skills: ${JSON.stringify(parsedJob.requiredSkills)}
Preferred Skills: ${JSON.stringify(parsedJob.preferredSkills)}
Required Experience: ${JSON.stringify(parsedJob.requiredExperience)}
Eligibility Requirements: ${JSON.stringify(parsedJob.eligibilityRequirements)}
Availability Requirements: ${JSON.stringify(parsedJob.availabilityRequirements)}
Work-Study Required: ${job.workStudyEligible}
Hours/Week: ${job.hoursPerWeek ?? "Not specified"}

## SCORING RULES
- Score each category 0-100 based on ACTUAL match quality.
- Be strict: only count a skill as matching if the candidate genuinely has it (not just a vaguely similar word).
- If the job requires "telescope operation" and the candidate has "python programming", that is NOT a match. Score it 0.
- If the candidate has none of the required skills, requiredSkillsScore should be 0-10.
- If the candidate has some but not all, score proportionally.
- For experience, compare the candidate's actual work history against what the job needs.
- Strengths should ONLY list things the candidate actually has that match the job.
- Gaps should list specific job requirements the candidate is missing.
- Be honest and accurate. Do not inflate scores.

Return ONLY valid JSON (no markdown) with this exact structure:
{
  "requiredSkillsScore": 0-100,
  "preferredSkillsScore": 0-100,
  "experienceScore": 0-100,
  "eligibilityScore": 0-100,
  "availabilityScore": 0-100,
  "strengths": ["specific strength 1", "specific strength 2"],
  "gaps": ["specific gap 1", "specific gap 2"],
  "fitReasons": ["reason 1", "reason 2"]
}`;

  try {
    const response = await openai!.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a precise ATS scoring system. Return only valid JSON." },
        { role: "user", content: prompt },
      ],
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (content) {
      const result = JSON.parse(content.replace(/^```json\s*|\s*```$/g, ""));

      const scores = {
        requiredSkillsScore: clamp(result.requiredSkillsScore ?? 0),
        preferredSkillsScore: clamp(result.preferredSkillsScore ?? 0),
        experienceScore: clamp(result.experienceScore ?? 0),
        eligibilityScore: clamp(result.eligibilityScore ?? 0),
        availabilityScore: clamp(result.availabilityScore ?? 0),
        atsReadabilityScore: resume.atsReadabilityScore,
      };

      const overallScore =
        scores.eligibilityScore * 0.2 +
        scores.requiredSkillsScore * 0.25 +
        scores.experienceScore * 0.25 +
        scores.availabilityScore * 0.15 +
        scores.preferredSkillsScore * 0.1 +
        scores.atsReadabilityScore * 0.05;

      return {
        ...scores,
        overallScore: Math.round(overallScore * 10) / 10,
        strengths: result.strengths ?? [],
        gaps: result.gaps ?? [],
        fitReasons: result.fitReasons ?? [],
        metHardFilters: hardFilterResult.passed,
        hardFilterResult,
      };
    }
  } catch {
    // Fall through to keyword fallback
  }

  return computeMatchFallback(resume, parsedJob, job, hardFilterResult);
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function keywordOverlap(
  resumeItems: string[],
  jobItems: string[]
): { score: number; matches: string[]; missing: string[] } {
  if (jobItems.length === 0) return { score: 100, matches: [], missing: [] };

  const resumeLower = resumeItems.map((s) => s.toLowerCase().trim());
  const matches: string[] = [];
  const missing: string[] = [];

  for (const item of jobItems) {
    const lower = item.toLowerCase().trim();
    const found = resumeLower.some(
      (r) => r === lower || r.includes(lower) || lower.includes(r)
    );
    if (found) {
      matches.push(item);
    } else {
      missing.push(item);
    }
  }

  const score = Math.min(100, (matches.length / jobItems.length) * 100);
  return { score, matches, missing };
}

function computeMatchFallback(
  resume: ParsedResumeData,
  parsedJob: ParsedJobData,
  job: { workStudyEligible: boolean; hoursPerWeek?: number | null },
  hardFilterResult: HardFilterResult
): MatchScores {
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

  const expStrings: string[] = [];
  for (const exp of resume.experience) {
    expStrings.push(exp.title, exp.company, ...exp.bullets);
  }

  const { score: requiredSkillsScore, matches: requiredMatches, missing: requiredMissing } =
    keywordOverlap(resume.skills, parsedJob.requiredSkills);

  const { score: experienceScore, matches: expMatches } =
    keywordOverlap(expStrings, parsedJob.requiredExperience);

  const { score: preferredSkillsScore, matches: preferredMatches } =
    keywordOverlap(resume.skills, parsedJob.preferredSkills);

  const atsReadabilityScore = resume.atsReadabilityScore;

  const overallScore =
    eligibilityScore * 0.2 +
    requiredSkillsScore * 0.25 +
    experienceScore * 0.25 +
    availabilityScore * 0.15 +
    preferredSkillsScore * 0.1 +
    atsReadabilityScore * 0.05;

  const strengths: string[] = [];
  const gaps: string[] = [];
  const fitReasons: string[] = [];

  if (requiredMatches.length > 0) {
    strengths.push(`Matching required skills: ${requiredMatches.join(", ")}`);
    fitReasons.push("Skills align with job requirements");
  }
  if (requiredMissing.length > 0) {
    gaps.push(`Missing required skills: ${requiredMissing.join(", ")}`);
  }

  if (expMatches.length > 0) {
    strengths.push(`Relevant experience: ${expMatches.join(", ")}`);
    fitReasons.push("Experience matches job requirements");
  }
  if (experienceScore < 50 && parsedJob.requiredExperience.length > 0) {
    gaps.push("Limited experience in required areas");
  }

  if (preferredMatches.length > 0) {
    fitReasons.push(`Has preferred skills: ${preferredMatches.join(", ")}`);
  }

  if (eligibilityScore === 30) {
    gaps.push("Work-study eligibility required but not indicated");
  }
  if (availabilityScore === 50 && job.hoursPerWeek) {
    gaps.push("Availability not clearly stated");
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
