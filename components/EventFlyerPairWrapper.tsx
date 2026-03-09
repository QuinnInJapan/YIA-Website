import dynamic from "next/dynamic";
import { imageUrl } from "@/lib/sanity/image";
import { ja, en } from "@/lib/i18n";
import type { EventFlyer } from "@/lib/types";

const EventFlyerPair = dynamic(() => import("./EventFlyerPair"));

interface EventFlyerPairWrapperProps {
  flyers: EventFlyer[];
}

// Server component that resolves image paths and prepares data for the client component
export default function EventFlyerPairWrapper({
  flyers,
}: EventFlyerPairWrapperProps) {
  // Flatten flyers into individual items with resolved src/alt/caption
  const items: { src: string; alt: string; caption: string }[] = [];

  for (const f of flyers) {
    // alt may be i18n array or legacy plain string
    const altJa = typeof f.alt === "string" ? f.alt : ja(f.alt);
    const altEn = typeof f.alt === "string" ? f.alt : en(f.alt);

    if (f.imageJa && f.imageEn) {
      items.push({
        src: imageUrl(f.imageJa),
        alt: altJa || "",
        caption: "日本語版",
      });
      items.push({
        src: imageUrl(f.imageEn),
        alt: altEn || "",
        caption: "English",
      });
    } else {
      const img = f.image || f.imageJa;
      items.push({
        src: imageUrl(img),
        alt: altJa || "",
        caption: altJa || "",
      });
    }
  }

  return <EventFlyerPair flyers={items} />;
}
