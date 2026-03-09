import { ja, en } from "@/lib/i18n";
import type { I18nString } from "@/lib/i18n";
import BilingualBlock from "./BilingualBlock";

interface DefinitionCardProps {
  term: I18nString;
  definition: I18nString;
}

export default function DefinitionCard({
  term,
  definition,
}: DefinitionCardProps) {
  return (
    <div className="definition-card">
      <div className="definition-card__term">
        {ja(term)}{" "}
        <span className="definition-card__term-en" lang="en" translate="no">{en(term)}</span>
      </div>
      <div className="definition-card__body">
        <BilingualBlock ja={ja(definition)} en={en(definition) || ""} />
      </div>
    </div>
  );
}
