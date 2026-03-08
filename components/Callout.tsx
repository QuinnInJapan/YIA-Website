import { PortableText } from "@portabletext/react";
import { Nl2br } from "@/lib/helpers";
import type { I18nString, I18nBlocks } from "@/lib/i18n";
import { ja, en, jaBlocks, enBlocks } from "@/lib/i18n";
import { ptComponents } from "@/lib/portable-text";

function isBlocks(field: I18nString | I18nBlocks | undefined): field is I18nBlocks {
  if (!field || field.length === 0) return false;
  return Array.isArray(field[0]?.value);
}

interface CalloutProps {
  field?: I18nString | I18nBlocks;
  ja?: string;
  en?: string;
  variant?: string;
  notePrefix?: string;
}

export default function Callout({ field, ja: jaText, en: enText, variant, notePrefix }: CalloutProps) {
  const cls = variant === "warning" ? " callout--warning" : "";

  if (field && isBlocks(field)) {
    const jaB = jaBlocks(field);
    const enB = enBlocks(field);
    return (
      <div className={`callout${cls}`}>
        <div className="callout__text-ja">
          {notePrefix && <span>{notePrefix}</span>}
          <PortableText value={jaB} components={ptComponents} />
        </div>
        {enB.length > 0 && (
          <div className="callout__text-en" lang="en">
            <PortableText value={enB} components={ptComponents} />
          </div>
        )}
      </div>
    );
  }

  // Plain string mode (backward compat or explicit ja/en props)
  const jaStr = jaText ?? (field ? ja(field) : "");
  const enStr = enText ?? (field ? en(field) : "");
  const displayJa = notePrefix ? `${notePrefix}${jaStr}` : jaStr;

  return (
    <div className={`callout${cls}`}>
      <div className="callout__text-ja">
        <Nl2br text={displayJa} />
      </div>
      {enStr && (
        <div className="callout__text-en" lang="en">
          <Nl2br text={enStr} />
        </div>
      )}
    </div>
  );
}
