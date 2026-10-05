"use client";

import { useState, type RefObject } from "react";

export type Panel = "calendar" | "today" | "profile";

/**
 * Navigation state of the dashboard. Below `lg` the three columns are tabs (`activePanel`);
 * from `lg` up every column is visible and `openProfile` scrolls the plan column into view.
 */
export function useDashboardLayout(profileRef: RefObject<HTMLElement | null>) {
  const [activePanel, setActivePanel] = useState<Panel>("today");

  return {
    activePanel,
    setActivePanel,
    /** Visible when its tab is active on small screens (rising in as it appears); always visible from `lg`. */
    panelClass: (id: Panel) => (id === activePanel ? "block max-lg:animate-panel" : "hidden lg:block"),
    openProfile: () => {
      setActivePanel("profile");
      requestAnimationFrame(() => profileRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    },
  };
}
