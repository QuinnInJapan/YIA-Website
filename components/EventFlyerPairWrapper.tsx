import { resolveImage } from "@/lib/images";
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
        src: resolveImage(f.imageJa),
        alt: f.altJa || "",
        caption: "日本語版",
      });
      items.push({
        src: resolveImage(f.imageEn),
        alt: f.altEn || "",
        caption: "English",
      });
    } else {
      const img = f.image || f.imageJa || "";
      items.push({
        src: resolveImage(img),
        alt: f.alt || f.altJa || "",
        caption: f.alt || "",
      });
    }
  }

  // Render paired layout for pairs, using event-flyer-pair wrapper
  const elements: React.ReactNode[] = [];
  let i = 0;
  for (const f of flyers) {
    if (f.imageJa && f.imageEn) {
      // This pair gets wrapped in event-flyer-pair div
      elements.push(
        <div className="event-flyer-pair" key={i}>
          {/* Individual flyer buttons rendered by client EventFlyerPair */}
        </div>
      );
      i += 2;
    } else {
      i += 1;
    }
  }

  // Actually, let the client component handle all rendering
  return <EventFlyerPair flyers={items} />;
}
