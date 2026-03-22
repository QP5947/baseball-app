import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "*.devtunnels.ms"], // 必要に応じて、使用しているプロキシやトンネルのドメイン（例: "my-app.ngrok-free.app"）を追加してください
      bodySizeLimit: "5mb", // ファイルアップロード用に容量を増やす
    },
  },
};

export default nextConfig;
