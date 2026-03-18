import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: {
    default: "ペンペンリーグ",
    template: "%s | ペンペンリーグ",
  },
  applicationName: "ペンペンリーグ",
  manifest: "/penpen_league/site.webmanifest",
  icons: {
    icon: [
      { url: "/penpen_league/favicon.ico" },
      {
        url: "/penpen_league/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/penpen_league/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/penpen_league/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    other: [
      {
        rel: "icon",
        url: "/penpen_league/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        rel: "icon",
        url: "/penpen_league/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  },
  appleWebApp: {
    title: "ペンペンリーグ",
  },
};

export const viewport: Viewport = {
  themeColor: "#1d4ed8",
};

export default function PenpenLeagueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
