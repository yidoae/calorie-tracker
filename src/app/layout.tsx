import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import AppProviders from "@/providers/AppProviders";
import "./globals.css";

// tofuhq pairs a neutral sans for body/UI text with Space Grotesk Bold for display headings.
const body = Inter({
  variable: "--font-body",
  subsets: ["latin", "latin-ext"],
});

const display = localFont({
  variable: "--font-display-face",
  src: "./fonts/SpaceGroteskBold-700.ttf",
  weight: "700",
});

export const metadata: Metadata = {
  title: "Kalori Takip",
  description: "Yemek fotoğraflarından kalori ve makro takibi",
};

export const viewport: Viewport = {
  themeColor: "#170b21",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className={`${body.variable} ${display.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col overflow-x-hidden">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
