import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { KEEP_ALIVE } from "@/server/llm/config";

/**
 * Retrieval over knowledge/index.json (built by `npm run kb:ingest`): embeds the question with the
 * same Ollama embedding model and returns the closest chunks. Everything here fails soft — with no
 * index or no embedding model, FitBot simply answers without reference material.
 */

const INDEX_FILE = path.join(process.cwd(), "knowledge", "index.json");
const LLM_URL = (process.env.LOCAL_LLM_URL || "http://localhost:11434").replace(/\/+$/, "");
/**
 * Embed on the CPU by default: on small GPUs (e.g. 4 GB) the embedding model and the chat model don't
 * fit together, so each question would evict the chat model and reload it (~10 s). A one-sentence
 * query embeds in ~0.3 s on the CPU. Set LOCAL_EMBED_GPU=1 when there is VRAM for both.
 */
const EMBED_OPTIONS = process.env.LOCAL_EMBED_GPU === "1" ? {} : { options: { num_gpu: 0 } };
const TOP_K = Number(process.env.KB_TOP_K) || 4;
/**
 * Cosine similarity (bge-m3) below which a chunk is considered unrelated. Measured on the starter
 * knowledge base: the right section scores 0.60–0.79, unrelated questions (greetings, off-topic) ≤ 0.43.
 */
const MIN_SCORE = Number(process.env.KB_MIN_SCORE) || 0.55;
/** Also drop chunks scoring this far below the best one: they are usually a neighbouring topic. */
const SCORE_MARGIN = Number(process.env.KB_SCORE_MARGIN) || 0.1;

interface IndexedChunk {
  id: number;
  file: string;
  title: string;
  heading: string | null;
  source: string;
  text: string;
  embedding: number[];
}

interface KnowledgeIndex {
  model: string;
  createdAt: string;
  chunks: IndexedChunk[];
}

export interface RetrievedChunk {
  title: string;
  heading: string | null;
  source: string;
  text: string;
  score: number;
}

let cache: { mtimeMs: number; index: KnowledgeIndex } | null = null;
const warned = new Set<string>();

function warnOnce(key: string, message: string) {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(`FitBot knowledge: ${message}`);
}

/** Loads the index, re-reading it only when the file changes (e.g. after re-running kb:ingest). */
async function loadIndex(): Promise<KnowledgeIndex | null> {
  let mtimeMs: number;
  try {
    mtimeMs = (await stat(INDEX_FILE)).mtimeMs;
  } catch {
    warnOnce("no-index", "knowledge/index.json not found — run `npm run kb:ingest` to enable reference material.");
    return null;
  }
  if (cache?.mtimeMs === mtimeMs) return cache.index;
  try {
    const index = JSON.parse(await readFile(INDEX_FILE, "utf8")) as KnowledgeIndex;
    cache = { mtimeMs, index };
    return index;
  } catch (err) {
    warnOnce(`bad-index-${mtimeMs}`, `couldn't read knowledge/index.json (${String(err)}). Re-run \`npm run kb:ingest\`.`);
    return null;
  }
}

async function embedQuery(model: string, text: string, signal: AbortSignal): Promise<number[] | null> {
  try {
    const res = await fetch(`${LLM_URL}/api/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, input: text, keep_alive: KEEP_ALIVE, ...EMBED_OPTIONS }),
      signal,
    });
    const json = (await res.json().catch(() => null)) as { embeddings?: number[][]; error?: string } | null;
    if (!res.ok || !json?.embeddings?.[0]) {
      warnOnce(`embed-${model}`, `embedding with "${model}" failed (${json?.error ?? `HTTP ${res.status}`}). Run: ollama pull ${model}`);
      return null;
    }
    const v = json.embeddings[0];
    const norm = Math.hypot(...v) || 1;
    return v.map((x) => x / norm);
  } catch {
    return null; // Ollama down: the chat request itself will report that
  }
}

/** The chunks most similar to `query`, best first, or [] when retrieval isn't available. */
export async function searchKnowledge(query: string, signal: AbortSignal): Promise<RetrievedChunk[]> {
  const index = await loadIndex();
  if (!index || index.chunks.length === 0) return [];
  // The query must be embedded with the same model the index was built with.
  const q = await embedQuery(index.model, query, signal);
  if (!q) return [];
  if (q.length !== index.chunks[0].embedding.length) {
    warnOnce("dims", "index was built with a different embedding size. Re-run `npm run kb:ingest`.");
    return [];
  }
  const ranked = index.chunks
    .map((c) => ({ chunk: c, score: c.embedding.reduce((sum, x, i) => sum + x * q[i], 0) }))
    .sort((a, b) => b.score - a.score);
  const best = ranked[0]?.score ?? 0;
  return ranked
    .filter(({ score }) => score >= MIN_SCORE && score >= best - SCORE_MARGIN)
    .slice(0, TOP_K)
    .map(({ chunk, score }) => ({ title: chunk.title, heading: chunk.heading, source: chunk.source, text: chunk.text, score }));
}

/**
 * Numbered excerpts, sent as a system message right before the user's latest message: small models
 * follow reference text next to the question far better than text buried in a long system prompt.
 * The numbers match the `sources` returned to the client.
 */
export function formatKnowledge(chunks: RetrievedChunk[]): string {
  const excerpts = chunks
    .map((c, i) => `[${i + 1}] ${c.title}${c.heading ? ` — ${c.heading}` : ""}\nSource: ${c.source}\n${c.text}`)
    .join("\n\n");
  return `Reference material for the user's next message, from the app's knowledge base:

${excerpts}

If this material answers the question, answer from it: repeat its numbers and ranges exactly as written (for example "3–5 g", not "3 g") and put the excerpt number after the fact, like [1]. If it doesn't cover the question, ignore it and answer normally without citing.`;
}

const numbersIn = (text: string) => new Set(text.match(/\d+(?:[.,]\d+)?/g)?.map((n) => n.replace(",", ".")) ?? []);

/**
 * The excerpts the reply relied on: those it cites as [n], plus those sharing a number with it
 * (small models often use an excerpt's figures without writing the citation).
 */
export function usedSources(reply: string, chunks: RetrievedChunk[]) {
  const cited = new Set([...reply.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1])));
  const replyNumbers = numbersIn(reply.replace(/\[\d+\]/g, ""));
  return chunks
    .map((c, i) => ({ n: i + 1, title: c.title, heading: c.heading, source: c.source, text: c.text }))
    .filter((c) => cited.has(c.n) || [...numbersIn(c.text)].some((n) => replyNumbers.has(n)))
    .map(({ n, title, heading, source }) => ({ n, title, heading, source }));
}
