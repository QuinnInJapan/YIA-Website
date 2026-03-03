import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  basePath: process.env.GITHUB_ACTIONS ? "/YIA-Website" : "",
  assetPrefix: process.env.GITHUB_ACTIONS ? "/YIA-Website/" : "",
};

export default nextConfig;
