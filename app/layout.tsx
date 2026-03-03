import type { Metadata } from "next";
import Script from "next/script";
import SiteHeader from "@/components/SiteHeader";
import SiteNav from "@/components/SiteNav";
import "./globals.css";

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
    icon: { url: "/favicon.svg", type: "image/svg+xml" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap"
        />
      </head>
      <body>
        <a href="#main" className="skip-link">
          本文へスキップ / Skip to content
        </a>
        <SiteHeader />
        <SiteNav />
        {children}
        <Script
          id="img-loaded"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `document.querySelectorAll('img').forEach(function(i){if(i.complete)i.classList.add('loaded')})`,
          }}
        />
      </body>
    </html>
  );
}
