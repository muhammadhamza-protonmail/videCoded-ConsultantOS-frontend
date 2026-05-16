import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:8000/api/:path*",
        // destination: "https://citatory-catherine-punctiliously.ngrok-free.dev/api/:path*",
      },
      {
        source: "/static/uploads/:path*",
        destination: "http://127.0.0.1:8000/static/uploads/:path*",
      },
    ];
  },
};

export default nextConfig;
