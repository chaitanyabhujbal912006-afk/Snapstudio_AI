import type { Metadata } from "next";
import { Inter, Space_Grotesk, Space_Mono } from "next/font/google";
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
  weight: ["300", "400", "500", "600", "700"],
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-mono-var",
  display: "swap",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "SnapStudio AI — Professional AI Photo Studio",
  description:
    "Transform any photo with 13 professional AI engines. Auto-enhance, swap backgrounds, apply art styles, upscale 4×, or remove objects — all powered by free Kaggle GPU.",
  keywords: ["AI photo editor", "background swap", "style filter", "object removal", "auto enhance", "AI studio", "photo transformation"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${spaceMono.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
