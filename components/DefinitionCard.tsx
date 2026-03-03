import BilingualBlock from "./BilingualBlock";

interface DefinitionCardProps {
  termJa: string;
  termEn?: string;
  definitionJa: string;
  definitionEn?: string;
}

export default function DefinitionCard({
  termJa,
  termEn,
  definitionJa,
  definitionEn,
}: DefinitionCardProps) {
  return (
    <div className="definition-card">
      <div className="definition-card__term">
        {termJa}{" "}
        <span className="definition-card__term-en">{termEn}</span>
      </div>
      <div className="definition-card__body">
        <BilingualBlock ja={definitionJa} en={definitionEn || ""} />
      </div>
    </div>
  );
}
