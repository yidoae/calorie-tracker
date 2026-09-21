import { MIME_BY_EXT, readImage } from "@/lib/storage";

/** GET /api/uploads/:filename — serves a stored meal photo. */
export async function GET(_request: Request, ctx: RouteContext<"/api/uploads/[filename]">) {
  const { filename } = await ctx.params;

  const data = await readImage(filename);
  if (!data) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": MIME_BY_EXT[filename.split(".").pop()!],
      // Filenames are random UUIDs and never reused, so they're safe to cache forever.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
