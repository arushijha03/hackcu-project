import { openai } from "./openai";

export type ParsedResumeData = {
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    duration?: string;
    bullets: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year?: string;
  }>;
  availability: string | null;
  eligibility: string | null;
  atsReadabilityScore: number;
};

const COMMON_SKILLS = [
  "javascript",
  "typescript",
  "python",
  "java",
  "react",
  "node",
  "sql",
  "communication",
  "leadership",
  "teamwork",
  "problem solving",
  "microsoft office",
  "excel",
  "data analysis",
  "research",
  "writing",
  "customer service",
  "organization",
  "time management",
];

function extractSkillsFromText(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const skill of COMMON_SKILLS) {
    if (lower.includes(skill)) found.push(skill);
  }
  return [...new Set(found)];
}

export async function parseResumeText(text: string): Promise<ParsedResumeData> {
  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Parse the resume text into JSON with this exact structure:
{
  "skills": ["skill1", "skill2"],
  "experience": [{"title": "...", "company": "...", "duration": "...", "bullets": ["..."]}],
  "education": [{"degree": "...", "institution": "...", "year": "..."}],
  "availability": "hours per week or null",
  "eligibility": "work_study or federal_work_study or null",
  "atsReadabilityScore": 0-100
}
Return only valid JSON, no markdown.`,
          },
          { role: "user", content: text },
        ],
        temperature: 0.2,
      });
      const content = response.choices[0]?.message?.content?.trim();
      if (content) {
        const parsed = JSON.parse(content.replace(/^```json\s*|\s*```$/g, ""));
        return {
          skills: parsed.skills ?? [],
          experience: parsed.experience ?? [],
          education: parsed.education ?? [],
          availability: parsed.availability ?? null,
          eligibility: parsed.eligibility ?? null,
          atsReadabilityScore: parsed.atsReadabilityScore ?? 70,
        };
      }
    } catch {
      // OpenAI call failed — fall through to keyword fallback
    }
  }

  const skills = extractSkillsFromText(text);
  return {
    skills,
    experience: [],
    education: [],
    availability: null,
    eligibility: null,
    atsReadabilityScore: 70,
  };
}
