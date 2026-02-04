import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "*.asse.devtunnels.ms"], // 必要に応じて、使用しているプロキシやトンネルのドメイン（例: "my-app.ngrok-free.app"）を追加してください
    },
  },
};

export default nextConfig;
