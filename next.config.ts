import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sanity.io", pathname: "/**" },
    ],
    dangerouslyAllowLocalIP: true,
  },
  async redirects() {
    return [
      // Old flat page URLs → new /<category>/<slug> URLs
      { source: "/seikatsusodan", destination: "/support/seikatsusodan", permanent: true },
      { source: "/honyaku", destination: "/support/honyaku", permanent: true },
      { source: "/bosai", destination: "/support/bosai", permanent: true },
      { source: "/kaiwasalon", destination: "/learning/kaiwasalon", permanent: true },
      { source: "/gaikokugo", destination: "/learning/gaikokugo", permanent: true },
      { source: "/kokusairikai", destination: "/learning/kokusairikai", permanent: true },
      { source: "/nihongo-handbook", destination: "/learning/nihongo-handbook", permanent: true },
      { source: "/nihonbunka", destination: "/events/nihonbunka", permanent: true },
      { source: "/kids", destination: "/events/kids", permanent: true },
      { source: "/cooking", destination: "/events/cooking", permanent: true },
      { source: "/youthfo", destination: "/exchange/youthfo", permanent: true },
      { source: "/homestay", destination: "/exchange/homestay", permanent: true },
      { source: "/englishguide", destination: "/exchange/englishguide", permanent: true },
      { source: "/fairtrade", destination: "/exchange/fairtrade", permanent: true },
      { source: "/sistercity", destination: "/exchange/sistercity", permanent: true },
      { source: "/aboutyia", destination: "/about/aboutyia", permanent: true },
      { source: "/kaiinn", destination: "/about/kaiinn", permanent: true },
      { source: "/sanjyokaiin", destination: "/about/sanjyokaiin", permanent: true },
      { source: "/contact", destination: "/about/contact", permanent: true },
    ];
  },
};

export default nextConfig;
