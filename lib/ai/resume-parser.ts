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
  resumeEmail?: string | null;
  graduationDate?: string | null;
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
  "atsReadabilityScore": 0-100,
  "resumeEmail": "email from resume or null",
  "graduationDate": "e.g. May 2026 or 2025 or null"
}
Return only valid JSON, no markdown. Extract resumeEmail from contact info (email, e-mail, etc). Extract graduationDate from education (expected graduation, graduation year, etc).`,
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
          resumeEmail: parsed.resumeEmail ?? null,
          graduationDate: parsed.graduationDate ?? null,
        };
      }
    } catch {
      // OpenAI call failed — fall through to keyword fallback
    }
  }

  const skills = extractSkillsFromText(text);
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  const graduationMatch = text.match(/(?:graduation|grad|expected|class of)\s*[:]?\s*(\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i)
    ?? text.match(/(\d{4})\s*(?:graduation|grad|expected|degree)/i);
  return {
    skills,
    experience: [],
    education: [],
    availability: null,
    eligibility: null,
    atsReadabilityScore: 70,
    resumeEmail: emailMatch ? emailMatch[0] : null,
    graduationDate: graduationMatch ? graduationMatch[1] : null,
  };
}
