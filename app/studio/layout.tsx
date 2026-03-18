import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Studio — YIA",
  icons: {
    icon: { url: "/favicon-studio.svg", type: "image/svg+xml" },
  },
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
