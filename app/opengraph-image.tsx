import { ImageResponse } from "next/og";
import { getSiteData } from "@/lib/data";
import { en, ja } from "@/lib/i18n";
import { urlFor } from "@/lib/sanity/image";
import { SITE_URL, SOCIAL_IMAGE_ALT } from "@/lib/site-metadata";

export const alt = SOCIAL_IMAGE_ALT;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 60;

async function imageDataUrl(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) return "";

    const contentType = response.headers.get("content-type") || "image/png";
    const data = Buffer.from(await response.arrayBuffer()).toString("base64");
    return `data:${contentType};base64,${data}`;
  } catch {
    return "";
  }
}

export default async function OpenGraphImage() {
  const data = await getSiteData();
  const heroImage = data.homepage.hero.image;
  const heroImageUrl = heroImage
    ? urlFor(heroImage)
        .width(size.width)
        .height(size.height)
        .fit("crop")
        .format("jpg")
        .quality(90)
        .url()
    : "";
  const titleJa = ja(data.site.org.name) || "横須賀国際交流協会";
  const titleEn = en(data.site.org.name) || "Yokosuka International Association";
  const abbreviation = data.site.org.abbreviation || "YIA";
  const markDataUrl = await imageDataUrl(
    new URL("/favicon-512x512.png", SITE_URL).toString(),
  );
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: "#123a63",
        color: "#ffffff",
        fontFamily: "sans-serif",
      }}
    >
      {heroImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- ImageResponse requires a plain image.
        <img
          src={heroImageUrl}
          alt=""
          width={size.width}
          height={size.height}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      )}
      <div
        style={{
          display: "flex",
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(9, 31, 55, 0.03) 52%, rgba(9, 42, 68, 0.3) 100%)",
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
          alignSelf: "flex-end",
          width: "100%",
          minHeight: "190px",
          marginTop: "auto",
          padding: "29px 64px 29px 72px",
          borderTop: "6px solid #79a7c5",
          background:
            "linear-gradient(105deg, rgba(18, 58, 99, 0.98) 0%, rgba(23, 94, 148, 0.96) 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            maxWidth: "850px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "49px",
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: "0.01em",
            }}
          >
            {titleJa}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: "10px",
              color: "rgba(255, 250, 242, 0.94)",
              fontSize: "25px",
              fontWeight: 700,
              letterSpacing: "0.012em",
            }}
          >
            {titleEn}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
            marginLeft: "32px",
            paddingLeft: "36px",
            borderLeft: "1px solid rgba(255, 255, 255, 0.28)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "82px",
              height: "82px",
              padding: "8px",
              borderRadius: "18px",
              background: "#f6f1e8",
            }}
          >
            {markDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- ImageResponse requires a plain image.
              <img
                src={markDataUrl}
                alt=""
                width="66"
                height="66"
                style={{ width: "66px", height: "66px", objectFit: "contain" }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  color: "#0022ee",
                  fontSize: "29px",
                  fontWeight: 800,
                  letterSpacing: "0.02em",
                }}
              >
                {abbreviation}
              </div>
            )}
          </div>
          <div
            style={{
              display: "flex",
              marginLeft: "18px",
              color: "rgba(255, 250, 242, 0.92)",
              fontSize: "23px",
              fontWeight: 600,
              letterSpacing: "0.04em",
            }}
          >
            yia.jp
          </div>
        </div>
      </div>
    </div>,
    size,
  );
}
