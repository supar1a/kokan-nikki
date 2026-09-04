import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 紙の上に開発用の印を出さない
  devIndicators: false,
  experimental: {
    // 写真はブラウザ側で縮めてから送るが、その余裕を見ておく
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
