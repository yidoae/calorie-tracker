import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { getCurrentUser } from "@/server/auth";

/** "/" has no screen of its own: members go to the panel, guests to the landing page. */
export default async function Home() {
  redirect((await getCurrentUser()) ? ROUTES.panel : ROUTES.landing);
}
