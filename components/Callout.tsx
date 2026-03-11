import { Nl2br } from "@/lib/helpers";
import type { I18nString } from "@/lib/i18n";
import { ja, en } from "@/lib/i18n";

interface CalloutProps {
  field?: I18nString;
  ja?: string;
  en?: string;
  variant?: string;
  notePrefix?: string;
}

export default function Callout({ field, ja: jaText, en: enText, variant, notePrefix }: CalloutProps) {
  const cls = variant === "warning" ? " callout--warning" : "";

  const jaStr = jaText ?? (field ? ja(field) : "");
  const enStr = enText ?? (field ? en(field) : "");
  const displayJa = notePrefix ? `${notePrefix}${jaStr}` : jaStr;

  return (
    <div className={`callout${cls}`}>
      <div className="callout__text-ja">
        <Nl2br text={displayJa} />
      </div>
      {enStr && (
        <div className="callout__text-en" lang="en" translate="no">
          <Nl2br text={enStr} />
        </div>
      )}
    </div>
  );
}
