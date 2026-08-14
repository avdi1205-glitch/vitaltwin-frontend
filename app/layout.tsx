import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import SplashScreen from "./components/brand/SplashScreen";
import CookieConsentBanner from "./components/CookieConsentBanner";
import AdSenseScript from "./components/AdSenseScript";
import I18nProvider from "./i18n-provider";
import { defaultLocale, isLocale, localeCookie } from "@/lib/i18n/config";

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

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('siteMeta');
  return {
    title: {
      default: t('homeTitle'),
      template: "%s | VitalTwin",
    },
    description: t('homeDescription'),
    manifest: "/manifest.webmanifest",
    applicationName: "VitalTwin",
    metadataBase: new URL("https://www.vitaltwin.de"),
    openGraph: {
      type: "website",
      locale: "de_DE",
      siteName: "VitalTwin",
      title: t('homeTitle'),
      description: t('ogDescription'),
      url: "https://www.vitaltwin.de",
    },
    twitter: {
      card: "summary",
      title: t('homeTitle'),
      description: t('ogDescription'),
    },
    // Google AdSense site-ownership verification via meta tag — deliberately
    // NOT the AdSense <script> snippet, which would load the ad library
    // (and set cookies) before the user has given cookie consent. The meta
    // tag alone loads nothing and sets no cookies, so it needs no consent.
    other: {
      "google-adsense-account": "ca-pub-9292565421244191",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#0B1118",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const localeValue = (await cookies()).get(localeCookie)?.value;
  const locale = isLocale(localeValue) ? localeValue : defaultLocale;

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${ibmPlexMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <I18nProvider locale={locale}>
          <SplashScreen>{children}</SplashScreen>
          <AdSenseScript />
          <CookieConsentBanner />
        </I18nProvider>
      </body>
    </html>
  );
}
