import { getCurrentUser } from "@/server/auth";
import { ownsImage } from "@/server/meals/repository";
import { MIME_BY_EXT, readImage } from "@/server/storage";

/** GET /api/uploads/:filename: serves a stored meal photo to the user who logged it. */
export async function GET(_request: Request, ctx: RouteContext<"/api/uploads/[filename]">) {
  const { filename } = await ctx.params;
  const user = await getCurrentUser();
  if (!user || !(await ownsImage(user.id, `/api/uploads/${filename}`))) return new Response("Not found", { status: 404 });

  const data = await readImage(filename);
  if (!data) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": MIME_BY_EXT[filename.split(".").pop()!],
      // Filenames are random UUIDs and never reused, so they're safe to cache forever, but only
      // in this browser (`private`), since photos belong to one account.
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
