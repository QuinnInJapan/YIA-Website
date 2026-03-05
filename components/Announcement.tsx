import { Nl2br } from "@/lib/helpers";
import { imageUrl, resolveDocs } from "@/lib/sanity/image";
import DocList from "./DocList";
import LazyImage from "./LazyImage";
import type { Document, SanityImage } from "@/lib/types";

interface AnnouncementProps {
  titleJa?: string;
  titleEn?: string;
  contentJa: string;
  contentEn: string;
  documents?: Document[];
  image?: SanityImage;
}

export default function Announcement({
  titleJa,
  titleEn,
  contentJa,
  contentEn,
  documents,
  image,
}: AnnouncementProps) {
  const imgSrc = imageUrl(image);
  return (
    <article className="announcement">
      {titleJa && (
        <h3 className="announcement__title">
          {titleJa}
          {titleEn && (
            <span className="announcement__title-en" lang="en"> {titleEn}</span>
          )}
        </h3>
      )}
      <div className="announcement__content" lang="ja">
        <Nl2br text={contentJa} />
      </div>
      <div className="announcement__content" lang="en">
        <Nl2br text={contentEn} />
      </div>
      {imgSrc && (
        <div className="announcement__content" style={{ maxWidth: "400px" }}>
          <LazyImage
            src={imgSrc}
            alt=""
          />
        </div>
      )}
      {documents && documents.length > 0 && (
        <div className="announcement__content">
          <DocList docs={resolveDocs(documents)} />
        </div>
      )}
    </article>
  );
}
