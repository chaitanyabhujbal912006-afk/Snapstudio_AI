import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SnapStudio AI — AI Photo Editor",
  description:
    "Turn any photo into studio-quality art. Auto-enhance, swap backgrounds, apply art styles, or remove objects — all powered by free GPU.",
  keywords: ["AI photo editor", "background swap", "style filter", "object removal", "auto enhance"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
