import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a phone on the same Wi-Fi open the dev server by LAN IP (e.g. http://192.168.1.21:3000).
  // Without this, Next blocks the dev JS bundles for that origin, the page never hydrates and
  // no button (including "Snap a meal") responds. Dev-only; ignored by `next start`.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*", "*.local"],
};

export default nextConfig;
