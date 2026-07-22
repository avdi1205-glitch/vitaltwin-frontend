import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import SplashScreen from "./components/brand/SplashScreen";

const inter = Inter({
  variable: "--font-sans-body",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono-technical",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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
  themeColor: "#0B1118",
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
      className={`${inter.variable} ${ibmPlexMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SplashScreen>{children}</SplashScreen>
      </body>
    </html>
  );
}
