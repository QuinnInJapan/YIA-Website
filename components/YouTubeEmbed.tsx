"use client";

import { useState } from "react";

function extractVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") return parsed.pathname.slice(1);
    if (
      parsed.hostname === "www.youtube.com" ||
      parsed.hostname === "youtube.com"
    ) {
      return parsed.searchParams.get("v");
    }
  } catch {
    // ignore invalid URLs
  }
  return null;
}

interface YouTubeEmbedProps {
  url: string;
  caption?: string;
}

export default function YouTubeEmbed({ url, caption }: YouTubeEmbedProps) {
  const videoId = extractVideoId(url);
  const [playing, setPlaying] = useState(false);

  if (!videoId) return null;

  return (
    <figure className="pt-youtube">
      <div className="pt-youtube__wrapper">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
            title={caption || "YouTube video"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            className="pt-youtube__facade"
            onClick={() => setPlaying(true)}
            aria-label={`Play ${caption || "video"}`}
          >
            <img
              src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
              alt=""
              className="pt-youtube__thumb"
              loading="lazy"
            />
            <span className="pt-youtube__play" aria-hidden="true" />
          </button>
        )}
      </div>
      {caption && <figcaption className="pt-youtube__caption">{caption}</figcaption>}
    </figure>
  );
}
