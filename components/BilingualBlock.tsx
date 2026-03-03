import { Nl2br } from "@/lib/helpers";

interface BilingualBlockProps {
  ja: string;
  en: string;
}

export default function BilingualBlock({ ja, en }: BilingualBlockProps) {
  return (
    <div className="bilingual-block">
      <div className="bilingual-block__ja" lang="ja">
        <p>
          <Nl2br text={ja} />
        </p>
      </div>
      <div className="bilingual-block__en" lang="en">
        <p>
          <Nl2br text={en} />
        </p>
      </div>
    </div>
  );
}
