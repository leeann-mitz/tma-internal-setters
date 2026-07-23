import type { Metadata } from "next";
import { Inter, Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Free stand-ins for Performance Golf's actual brand typefaces — same
// substitution used in closer-performance-trends and qa-heatmap-dashboard.
const primarySans = Inter({
  variable: "--font-primary",
  subsets: ["latin"],
});

const secondarySerif = Fraunces({
  variable: "--font-secondary",
  subsets: ["latin"],
});

const tertiaryMono = JetBrains_Mono({
  variable: "--font-tertiary",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TMA Internal Setters | Performance Golf",
  description: "TMA Internal Setter performance trends, leaderboard, and per-rep monitoring — Team Philip",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${primarySans.variable} ${secondarySerif.variable} ${tertiaryMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-page font-sans">{children}</body>
    </html>
  );
}
