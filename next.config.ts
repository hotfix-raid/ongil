import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable React.StrictMode's double-invocation of effects in development.
  // The app's fetch effects already use AbortController cleanup correctly,
  // but Next.js 16 enables reactStrictMode by default, which causes every
  // initial-mount fetch (e.g. /api/regions, /api/sigungu, /api/tour-attractions)
  // to fire twice during dev. This setting makes dev behavior match production
  // (single fetch per effect run).
  reactStrictMode: false,
};

export default nextConfig;
