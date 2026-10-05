import { exportUserData } from "@/server/accounts";
import { getCurrentUser } from "@/server/auth";
import { unauthorized, validate } from "@/server/http";
import { exportFormatSchema } from "@/types/account";

/** GET /api/me/export?format=json|csv: the signed-in user's data as a file download. */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  const format = validate(exportFormatSchema, new URL(request.url).searchParams.get("format") ?? "json");
  if (!format.ok) return format.response;

  const file = await exportUserData(user, format.data);
  return new Response(file.body, {
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": `attachment; filename="${file.filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
