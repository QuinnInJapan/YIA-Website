import { Nl2br } from "@/lib/helpers";

interface CalloutProps {
  ja: string;
  en?: string;
  variant?: string;
}

export default function Callout({ ja, en, variant }: CalloutProps) {
  const cls = variant === "warning" ? " callout--warning" : "";
  return (
    <div className={`callout${cls}`}>
      <div className="callout__text-ja">
        <Nl2br text={ja} />
      </div>
      {en && (
        <div className="callout__text-en" lang="en">
          <Nl2br text={en} />
        </div>
      )}
    </div>
  );
}
