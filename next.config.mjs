import createNextIntlPlugin from "next-intl/plugin";
import path from "path";
import { fileURLToPath } from "url";

const withNextIntl = createNextIntlPlugin("./lib/i18n/server.ts");
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {
    root: __dirname,
  },
  images: {
    unoptimized: true,
  },
  // Ẩn console.log và console.error trong production
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
          exclude: ["error", "warn"],
        }
        : false,
  },
  async redirects() {
    return [
      {
        source: "/:locale(vi|en)/assignments/do-excerise/:id",
        destination: "/:locale/assignments/do-exercise/:id",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    const rewrites = [];
    const h5pBaseUrl = process.env.NEXT_PUBLIC_H5P_URL;
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    if (h5pBaseUrl) {
      rewrites.push({
        source: "/h5p/:path*",
        destination: `${h5pBaseUrl}/h5p/:path*`,
      });
    }

    if (apiBaseUrl) {
      rewrites.push({
        source: "/api/:path*",
        destination: `${apiBaseUrl}/:path*`,
      });
    }

    return rewrites;
  },
  async headers() {
    return [
      {
        source: "/h5p/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
          {
            key: "Expires",
            value: "0",
          },
        ],
      },
      {
        source: "/firebase-messaging-sw.js",
        headers: [
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
