import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-serif-display",
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
});

export const metadata: Metadata = {
  title: "VitalTwin | Digitaler Gesundheits-Zwilling",
  description:
    "VitalTwin analysiert Biomarker, berechnet dein biologisches Alter und gibt personalisierte Empfehlungen für ein längeres, besseres Leben.",
  manifest: "/manifest.webmanifest",
  applicationName: "VitalTwin",
};

export const viewport: Viewport = {
  themeColor: "#F5EFE1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
