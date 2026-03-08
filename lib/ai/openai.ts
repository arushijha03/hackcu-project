import OpenAI from "openai";

const key = process.env.OPENAI_API_KEY ?? "";
const isValidKey = key.length > 10 && !key.includes("...");

export const openai = isValidKey ? new OpenAI({ apiKey: key }) : null;

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export async function embed(text: string): Promise<number[]> {
  if (openai) {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    return response.data[0].embedding;
  }
  // Placeholder: fake 10-dimensional vector based on text hash
  const vec: number[] = [];
  const h = simpleHash(text);
  for (let i = 0; i < 10; i++) {
    vec.push(((h * (i + 1) * 7919) % 1000) / 1000 - 0.5);
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}
