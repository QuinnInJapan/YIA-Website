import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Studio — YIA",
  icons: {
    icon: [
      { url: "/favicon-studio-128x128.png", sizes: "128x128", type: "image/png" },
      { url: "/favicon-studio-256x256.png", sizes: "256x256", type: "image/png" },
      { url: "/favicon-studio-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
