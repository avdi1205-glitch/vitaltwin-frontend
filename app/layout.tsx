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
  title: {
    default: "VitalTwin | Digitaler Wellness-Zwilling",
    template: "%s | VitalTwin",
  },
  description:
    "VitalTwin ordnet deine freiwillig eingetragenen Biomarker ein und gibt allgemeine Wellness-Impulse zur Orientierung für mehr Wohlbefinden im Alltag.",
  manifest: "/manifest.webmanifest",
  applicationName: "VitalTwin",
  metadataBase: new URL("https://www.vitaltwin.de"),
  openGraph: {
    type: "website",
    locale: "de_DE",
    siteName: "VitalTwin",
    title: "VitalTwin | Digitaler Wellness-Zwilling",
    description:
      "Wellness-Orientierung auf Basis deiner freiwillig eingetragenen Biomarker und Gewohnheiten. Kein medizinisches Produkt.",
    url: "https://www.vitaltwin.de",
  },
  twitter: {
    card: "summary",
    title: "VitalTwin | Digitaler Wellness-Zwilling",
    description:
      "Wellness-Orientierung auf Basis deiner freiwillig eingetragenen Biomarker und Gewohnheiten. Kein medizinisches Produkt.",
  },
};

export const viewport: Viewport = {
  themeColor: "#F5EFE1",
  width: "device-width",
  initialScale: 1,
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
