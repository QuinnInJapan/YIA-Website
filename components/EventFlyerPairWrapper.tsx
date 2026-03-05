import { imageUrl } from "@/lib/sanity/image";
import EventFlyerPair from "./EventFlyerPair";
import type { EventFlyer } from "@/lib/types";

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
    if (f.imageJa && f.imageEn) {
      items.push({
        src: imageUrl(f.imageJa),
        alt: f.altJa || "",
        caption: "日本語版",
      });
      items.push({
        src: imageUrl(f.imageEn),
        alt: f.altEn || "",
        caption: "English",
      });
    } else {
      const img = f.image || f.imageJa;
      items.push({
        src: imageUrl(img),
        alt: f.alt || f.altJa || "",
        caption: f.alt || "",
      });
    }
  }

  // Actually, let the client component handle all rendering
  return <EventFlyerPair flyers={items} />;
}
