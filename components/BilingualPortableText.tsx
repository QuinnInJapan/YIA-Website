import { PortableText } from "@portabletext/react";
import type { PortableTextBlock } from "@portabletext/types";
import { Nl2br } from "@/lib/helpers";
import type { I18nString, I18nBlocks } from "@/lib/i18n";
import { ja, en, jaBlocks, enBlocks } from "@/lib/i18n";
import { ptComponents } from "@/lib/portable-text";

/**
 * Detect whether an i18n field contains Portable Text blocks or plain strings.
 * PT block entries have `value` as an array; plain string entries have `value` as a string.
 */
function isBlocks(field: I18nString | I18nBlocks | undefined): field is I18nBlocks {
  if (!field || field.length === 0) return false;
  return Array.isArray(field[0]?.value);
}

function hasContent(blocks: PortableTextBlock[]): boolean {
  if (blocks.length === 0) return false;
  return blocks.some(
    (b) =>
      b._type !== "block" ||
      (b.children as { text?: string }[])?.some((c) => c.text?.trim()),
  );
}

interface BilingualPortableTextProps {
  field: I18nString | I18nBlocks | undefined;
  className?: string;
}

export default function BilingualPortableText({
  field,
  className = "bilingual-block",
}: BilingualPortableTextProps) {
  if (!field || field.length === 0) return null;

  if (isBlocks(field)) {
    const jaB = jaBlocks(field);
    const enB = enBlocks(field);
    if (!hasContent(jaB) && !hasContent(enB)) return null;
    return (
      <div className={className}>
        {hasContent(jaB) && (
          <div className="bilingual-block__ja" lang="ja">
            <PortableText value={jaB} components={ptComponents} />
          </div>
        )}
        {hasContent(enB) && (
          <div className="bilingual-block__en" lang="en">
            <PortableText value={enB} components={ptComponents} />
          </div>
        )}
      </div>
    );
  }

  // Fallback: plain string (backward compat)
  const jaText = ja(field);
  const enText = en(field);
  if (!jaText && !enText) return null;
  return (
    <div className={className}>
      <div className="bilingual-block__ja" lang="ja">
        <p>
          <Nl2br text={jaText} />
        </p>
      </div>
      <div className="bilingual-block__en" lang="en">
        <p>
          <Nl2br text={enText} />
        </p>
      </div>
    </div>
  );
}
