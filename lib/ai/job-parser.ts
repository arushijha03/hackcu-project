import { openai } from "./openai";

export type ParsedJobData = {
  requiredSkills: string[];
  preferredSkills: string[];
  requiredExperience: string[];
  eligibilityRequirements: string[];
  availabilityRequirements: string[];
};

const COMMON_JOB_KEYWORDS = [
  "communication",
  "teamwork",
  "leadership",
  "excel",
  "microsoft office",
  "work study",
  "federal work study",
  "hours per week",
  "customer service",
  "research",
  "data entry",
  "organization",
];

function extractKeywordsFromText(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const kw of COMMON_JOB_KEYWORDS) {
    if (lower.includes(kw)) found.push(kw);
  }
  const words = lower.split(/\s+/).filter((w) => w.length > 3);
  found.push(...words.slice(0, 5));
  return [...new Set(found)];
}

export async function parseJobDescription(
  description: string
): Promise<ParsedJobData> {
  if (openai) {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Parse the job description into JSON with this exact structure:
{
  "requiredSkills": ["skill1", "skill2"],
  "preferredSkills": ["skill1"],
  "requiredExperience": ["exp1"],
  "eligibilityRequirements": ["req1"],
  "availabilityRequirements": ["req1"]
}
Return only valid JSON, no markdown.`,
        },
        { role: "user", content: description },
      ],
      temperature: 0.2,
    });
    const content = response.choices[0]?.message?.content?.trim();
    if (content) {
      try {
        const parsed = JSON.parse(content.replace(/^```json\s*|\s*```$/g, ""));
        return {
          requiredSkills: parsed.requiredSkills ?? [],
          preferredSkills: parsed.preferredSkills ?? [],
          requiredExperience: parsed.requiredExperience ?? [],
          eligibilityRequirements: parsed.eligibilityRequirements ?? [],
          availabilityRequirements: parsed.availabilityRequirements ?? [],
        };
      } catch {
        // fall through to fallback
      }
    }
  }

  const keywords = extractKeywordsFromText(description);
  return {
    requiredSkills: keywords.slice(0, 5),
    preferredSkills: keywords.slice(5, 8),
    requiredExperience: [],
    eligibilityRequirements: keywords.filter(
      (k) => k.includes("work") || k.includes("study")
    ),
    availabilityRequirements: keywords.filter((k) =>
      k.includes("hour") || k.includes("week")
    ),
  };
}
