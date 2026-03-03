import { Nl2br } from "@/lib/helpers";
import { resolveImage } from "@/lib/images";
import DocList from "./DocList";
import LazyImage from "./LazyImage";
import type { Document } from "@/lib/types";

interface AnnouncementProps {
  titleJa?: string;
  titleEn?: string;
  contentJa: string;
  contentEn: string;
  documents?: Document[];
  image?: string;
}

export default function Announcement({
  titleJa,
  titleEn,
  contentJa,
  contentEn,
  documents,
  image,
}: AnnouncementProps) {
  return (
    <article className="announcement">
      {titleJa && (
        <h3 className="announcement__title">
          {titleJa}
          {titleEn && (
            <span className="announcement__title-en"> {titleEn}</span>
          )}
        </h3>
      )}
      <div className="announcement__content" lang="ja">
        <Nl2br text={contentJa} />
      </div>
      <div className="announcement__content" lang="en">
        <Nl2br text={contentEn} />
      </div>
      {image && (
        <div className="announcement__content">
          <LazyImage
            src={resolveImage(image)}
            alt=""
            style={{ maxWidth: "400px" }}
          />
        </div>
      )}
      {documents && documents.length > 0 && (
        <div className="announcement__content">
          <DocList docs={documents} />
        </div>
      )}
    </article>
  );
}
