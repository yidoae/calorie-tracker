"use client";

import { useAuth } from "@/hooks/useAuth";
import SiteHeader from "../layout/SiteHeader";
import FinalCall from "./FinalCall";
import HowItWorks from "./HowItWorks";
import IntroHero from "./IntroHero";
import LegendStories from "./LegendStories";
import { LEGENDS } from "./legends";

/**
 * The landing page at /giris: four full-screen scenes on the ink background, no app panel.
 * Headline + macro rings, athlete stories, "Çek. Yaz. Okut. İzle." and the call to sign up.
 * Members never see it: the /giris page redirects them to /panel on the server.
 */
export default function Landing() {
  const { openAuth } = useAuth();
  const register = () => openAuth("register");
  const login = () => openAuth("login");

  return (
    <div className="flex-1 bg-ink text-on-ink">
      <SiteHeader />
      <main>
        <IntroHero onRegister={register} onLogin={login} />
        <LegendStories legends={LEGENDS} />
        <HowItWorks />
        <FinalCall onRegister={register} onLogin={login} />
      </main>
    </div>
  );
}
