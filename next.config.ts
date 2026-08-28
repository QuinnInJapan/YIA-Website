import type { NextConfig } from "next";
import { siteRedirects } from "./lib/legacy-redirects";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "cdn.sanity.io", pathname: "/**" }],
    dangerouslyAllowLocalIP: true,
  },
  async redirects() {
    return siteRedirects;
  },
};

export default nextConfig;
