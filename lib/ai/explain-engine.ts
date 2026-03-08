import { openai } from "./openai";

export async function generateRejectionSummary(params: {
  overallScore: number;
  metHardFilters: boolean;
  unmetRequirements: string[];
  strengths: string[];
  gaps: string[];
  improvementSuggestions: string[];
}): Promise<string> {
  if (openai) {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Generate a brief, empathetic plain-English summary (2-4 sentences) for a student who was not selected for a job. Use the provided match data. Be constructive and encouraging.`,
        },
        {
          role: "user",
          content: JSON.stringify(params),
        },
      ],
      temperature: 0.5,
    });
    const content = response.choices[0]?.message?.content?.trim();
    if (content) return content;
  }

  // Fallback plain-English summary
  const parts: string[] = [];
  if (!params.metHardFilters && params.unmetRequirements.length > 0) {
    parts.push(
      `Unfortunately, this application did not meet some requirements: ${params.unmetRequirements.join("; ")}.`
    );
  }
  if (params.strengths.length > 0) {
    parts.push(
      `Your strengths included: ${params.strengths.slice(0, 2).join("; ")}.`
    );
  }
  if (params.gaps.length > 0) {
    parts.push(
      `Areas to improve: ${params.gaps.slice(0, 2).join("; ")}.`
    );
  }
  if (params.improvementSuggestions.length > 0) {
    parts.push(
      `Suggestions: ${params.improvementSuggestions.slice(0, 2).join("; ")}.`
    );
  }
  if (parts.length === 0) {
    parts.push(
      `Your overall match score was ${params.overallScore.toFixed(1)}%. We encourage you to apply to other positions that may be a better fit.`
    );
  }
  return parts.join(" ");
}
