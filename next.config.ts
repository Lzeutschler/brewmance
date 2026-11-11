import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
// Vercel preview deployments inject the Vercel Toolbar (comments, feedback) from vercel.live.
const isVercelPreview = process.env.VERCEL_ENV === "preview";
const vercelLive = isVercelPreview ? " https://vercel.live" : "";

/**
 * Without nonces, so pages stay prerendered with Cache Components. Next.js inlines its bootstrap scripts and
 * Motion animates through inline styles, hence 'unsafe-inline'. React needs 'unsafe-eval' only in development.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}${vercelLive}`,
  `style-src 'self' 'unsafe-inline'${vercelLive}`,
  // Card images and mana symbols are loaded straight from Scryfall.
  `img-src 'self' data: blob: https://cards.scryfall.io https://svgs.scryfall.io${isVercelPreview ? " https://vercel.live https://vercel.com" : ""}`,
  `font-src 'self'${isVercelPreview ? " https://vercel.live https://assets.vercel.com" : ""}`,
  `connect-src 'self'${isDev ? " ws: wss:" : ""}${isVercelPreview ? " https://vercel.live wss://ws-us3.pusher.com" : ""}`,
  `frame-src ${isVercelPreview ? "https://vercel.live" : "'none'"}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000" }]),
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  // Route handlers and shared deck and quiz pages read the generated card database from disk at runtime;
  // their preview images also read the Open Graph fonts. Only the routes that suggest cards carry the
  // EDHREC bulk data snapshot (data/recs-snapshot/, about 3,300 files).
  outputFileTracingIncludes: {
    "/api/**": ["./data/*.json"],
    "/api/candidates": ["./data/recs-snapshot/*.json"],
    "/api/commander-insights": ["./data/recs-snapshot/*.json"],
    "/d/**": ["./data/*.json", "./app/fonts/og/*"],
    "/q/**": ["./data/*.json", "./app/fonts/og/*"],
    // Precon pages render from the card database and the generated precon lists (lib/server/precons.ts);
    // a slug that was not prerendered renders at request time and reads them from disk.
    "/precons/**": ["./data/*.json", "./public/data/precons.json", "./public/data/precons/*.json", "./public/data/commanders.json"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return [
      { source: "/imprint", destination: "/impressum", permanent: true },
      { source: "/legal", destination: "/impressum", permanent: true },
      { source: "/privacy", destination: "/datenschutz", permanent: true },
    ];
  },
};

export default nextConfig;
