import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-noto",
});

export const metadata: Metadata = {
  title: {
    default: "横須賀国際交流協会",
    template: "%s — 横須賀国際交流協会",
  },
  description:
    "横須賀の多文化共生を支える国際交流の拠点。生活相談、日本語教室、文化交流、防災支援など幅広い活動を行っています。",
  openGraph: {
    type: "website",
    locale: "ja_JP",
  },
  icons: {
    icon: [
      { url: "/favicon-128x128.png", sizes: "128x128", type: "image/png" },
      { url: "/favicon-256x256.png", sizes: "256x256", type: "image/png" },
      { url: "/favicon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={notoSansJP.variable}>{children}</body>
    </html>
  );
}
