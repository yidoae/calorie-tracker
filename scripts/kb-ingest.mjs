// Builds knowledge/index.json for FitBot's retrieval: splits every .md/.txt file in knowledge/ into
// heading-sized chunks, embeds them with Ollama and stores unit-length vectors.
//   npm run kb:ingest
// Env: LOCAL_LLM_URL (default http://localhost:11434), LOCAL_EMBED_MODEL (default bge-m3),
// LOCAL_EMBED_GPU=1 to embed on the GPU instead of the CPU.
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..", "knowledge");
const INDEX_FILE = path.join(ROOT, "index.json");
const LLM_URL = (process.env.LOCAL_LLM_URL || "http://localhost:11434").replace(/\/+$/, "");
const EMBED_MODEL = process.env.LOCAL_EMBED_MODEL || "bge-m3";
const MAX_CHUNK_CHARS = 1200;
// Same as src/lib/knowledge.ts: CPU by default so the chat model isn't evicted from a small GPU.
const EMBED_OPTIONS = process.env.LOCAL_EMBED_GPU === "1" ? {} : { options: { num_gpu: 0 } };
const BATCH = 16;

function listFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return listFiles(full);
    return /\.(md|txt)$/i.test(name) && name.toLowerCase() !== "readme.md" ? [full] : [];
  });
}

/** Splits text into pieces of at most `max` chars, preferring paragraph then sentence boundaries. */
function splitLong(text, max) {
  if (text.length <= max) return [text];
  const pieces = [];
  let current = "";
  const units = text.split(/\n\s*\n/).flatMap((p) => (p.length > max ? p.match(/[^.!?]+[.!?]+\s*|[^.!?]+$/g) ?? [p] : [p]));
  for (const unit of units) {
    if (current && current.length + unit.length + 2 > max) {
      pieces.push(current.trim());
      current = "";
    }
    current += (current ? "\n\n" : "") + unit;
  }
  if (current.trim()) pieces.push(current.trim());
  return pieces;
}

/**
 * One document -> chunks. `# Title` and `Source:` at the top describe the document; each `##`/`###`
 * section becomes its own chunk(s). A `Based on:` line inside a section overrides the source for it.
 */
function chunkDocument(file) {
  const raw = readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  const title = raw.match(/^#\s+(.+)$/m)?.[1].trim() ?? path.basename(file).replace(/\.\w+$/, "");
  const docSource = raw.match(/^Source:\s*(.+)$/m)?.[1].trim() ?? rel;

  const sections = [];
  let heading = null;
  let lines = [];
  const flush = () => {
    const text = lines.join("\n").trim();
    if (text) sections.push({ heading, text });
    lines = [];
  };
  for (const line of raw.split("\n")) {
    const h = line.match(/^(#{2,3})\s+(.+)$/);
    if (h) {
      flush();
      heading = h[2].trim();
    } else if (!/^#\s+/.test(line) && !/^Source:/.test(line)) {
      lines.push(line);
    }
  }
  flush();

  return sections.flatMap(({ heading: sectionHeading, text }) => {
    const source = text.match(/^Based on:\s*(.+)$/m)?.[1].trim() ?? docSource;
    return splitLong(text, MAX_CHUNK_CHARS).map((piece) => ({
      file: rel,
      title,
      heading: sectionHeading,
      source,
      text: piece,
    }));
  });
}

async function embed(texts) {
  let res;
  try {
    res = await fetch(`${LLM_URL}/api/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: EMBED_MODEL, input: texts, ...EMBED_OPTIONS }),
    });
  } catch {
    throw new Error(`Couldn't reach Ollama at ${LLM_URL}. Is it running?`);
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = json.error ?? `HTTP ${res.status}`;
    throw new Error(/not found/i.test(detail) ? `Embedding model "${EMBED_MODEL}" isn't installed. Run: ollama pull ${EMBED_MODEL}` : detail);
  }
  return json.embeddings.map((v) => {
    const norm = Math.hypot(...v) || 1;
    return v.map((x) => Math.round((x / norm) * 1e6) / 1e6);
  });
}

const files = listFiles(ROOT);
if (files.length === 0) {
  console.error("No .md/.txt files in knowledge/ (besides README.md). Add some sources first.");
  process.exit(1);
}

const chunks = files.flatMap(chunkDocument);
console.log(`${files.length} file(s), ${chunks.length} chunk(s). Embedding with ${EMBED_MODEL}…`);

try {
  for (let i = 0; i < chunks.length; i += BATCH) {
    const batch = chunks.slice(i, i + BATCH);
    // Title and heading are embedded with the text so short sections still carry their topic.
    const vectors = await embed(batch.map((c) => `${c.title}${c.heading ? ` — ${c.heading}` : ""}\n${c.text}`));
    batch.forEach((c, j) => (c.embedding = vectors[j]));
    process.stdout.write(`\r  ${Math.min(i + BATCH, chunks.length)}/${chunks.length}`);
  }
} catch (err) {
  console.error(`\n${err.message}`);
  process.exit(1);
}

writeFileSync(
  INDEX_FILE,
  JSON.stringify({ model: EMBED_MODEL, createdAt: new Date().toISOString(), chunks: chunks.map((c, id) => ({ id, ...c })) }),
);
console.log(`\nWrote ${path.relative(process.cwd(), INDEX_FILE)}`);
