"use client";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface ScoreBreakdownProps {
  scores: {
    overallScore: number;
    eligibilityScore: number;
    requiredSkillsScore: number;
    experienceScore: number;
    availabilityScore: number;
    preferredSkillsScore: number;
    atsReadabilityScore: number;
  };
}

const DIMENSIONS = [
  { key: "eligibilityScore", label: "Eligibility", weight: "Base" },
  { key: "requiredSkillsScore", label: "Required Skills", weight: "Core" },
  { key: "experienceScore", label: "Experience", weight: "Core" },
  { key: "availabilityScore", label: "Availability", weight: "Core" },
  { key: "preferredSkillsScore", label: "Preferred Skills", weight: "Bonus" },
  { key: "atsReadabilityScore", label: "ATS Readability", weight: "Bonus" },
] as const;

export function ScoreBreakdown({ scores }: ScoreBreakdownProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-cu-dark-gray">Overall Match</p>
        <p className={cn("text-4xl font-bold text-cu-gold")}>
          {Math.round(scores.overallScore)}%
        </p>
      </div>

      <ul className="space-y-4">
        {DIMENSIONS.map(({ key, label, weight }) => {
          const score = scores[key] ?? 0;
          return (
            <li key={key} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{label}</span>
                <span className="text-cu-dark-gray">
                  {Math.round(score)}% · {weight}
                </span>
              </div>
              <Progress value={score} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
