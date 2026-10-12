// Turns `expo export --platform web` output into an artifact page: the page body only (the artifact
// host adds the document skeleton), relative URLs because the page is not served from "/", and
// no top-level "_expo" directory because the artifact service reserves names starting with "_", and
// short asset paths ("a/<file>") because node_modules-style asset paths break Windows' 260-char limit.
import { mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const dist = fileURLToPath(new URL("../dist/", import.meta.url));

const html = readFileSync(join(dist, "index.html"), "utf8");
const scripts = [...html.matchAll(/<script[^>]*src="([^"]+)"[^>]*><\/script>/g)].map((m) => m[1].replace(/^\/_expo\//, "./bundle/"));
if (scripts.length === 0) throw new Error("No bundle <script> found in dist/index.html");

// Asset URLs inside the JS bundles are absolute ("/assets/..."); point them at the short copies.
const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
renameSync(join(dist, "_expo"), join(dist, "bundle"));
const short = join(dist, "a");
mkdirSync(short, { recursive: true });
const moves = walk(join(dist, "assets")).map((file) => {
  const from = `/${relative(dist, file).replaceAll("\\", "/")}`;
  renameSync(file, join(short, basename(file)));
  return [from, `./a/${basename(file)}`];
});
rmSync(join(dist, "assets"), { recursive: true, force: true });
for (const file of walk(join(dist, "bundle")).filter((f) => f.endsWith(".js"))) {
  let code = readFileSync(file, "utf8");
  for (const [from, to] of moves) code = code.replaceAll(`"${from}"`, `"${to}"`);
  writeFileSync(file, code);
}

const page = `<title>Kalori Takip Önizleme</title>
<style>
  :root { color-scheme: dark; }
  html, body, #root { height: 100%; }
  body { margin: 0; background: #170b21; }
  #root { display: flex; }
</style>
<div id="root"></div>
${scripts.map((src) => `<script src="${src}" defer></script>`).join("\n")}
`;
writeFileSync(join(dist, "artifact.html"), page);
console.log(`artifact.html written with ${scripts.length} script(s)`);
