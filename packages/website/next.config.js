/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});
const isDev = process.env.NODE_ENV == "development";
const rewites =
  process.env.NODE_ENV == "development"
    ? {
        async rewrites() {
          return [
            {
              source: "/api/comment",
              destination: "http://127.0.0.1:8360/api/comment",
            },
            {
              source: "/api/comment/:path*",
              destination: "http://127.0.0.1:8360/api/comment/:path*",
            },
            {
              source: "/comment",
              destination: "http://127.0.0.1:8360/comment",
            },
            {
              source: "/comment/:path*",
              destination: "http://127.0.0.1:8360/comment/:path*",
            },
            {
              source: "/api/:path*",
              destination: "http://127.0.0.1:3000/api/:path*", // Proxy to Backend
            },
          ];
        },
      }
    : {};

const getAllowDomains = () => {
  const domainsInEnv = process.env.VAN_BLOG_ALLOW_DOMAINS || "";
  if (domainsInEnv && domainsInEnv != "") {
    const arr = domainsInEnv.split(",");
    return arr;
  } else {
    if (isDev) {
      return ["pic.mereith.com",'localhost','127.0.0.1'];
    }
    return [];
  }
};
const getCdnUrl = () => {
  if (isDev) {
    return {};
  }
  const UrlInEnv = process.env.VAN_BLOG_CDN_URL || "";
  if (UrlInEnv && UrlInEnv != "") {
    return { assetPrefix: UrlInEnv };
  } else {
    return {};
  }
};
module.exports = withBundleAnalyzer({
  reactStrictMode: true,
  output: "standalone",
  // Lint is run as a separate, explicit gate (`pnpm lint` -> `next lint`),
  // not coupled to the production build. Before this repo had an .eslintrc,
  // `next build` skipped linting entirely; keeping it decoupled preserves that
  // CI behavior so newly-activated rules can't surprise-break the Docker build.
  // Flip `ignoreDuringBuilds` to false once `next lint` is clean if we ever
  // want lint to hard-gate the build.
  eslint: {
    ignoreDuringBuilds: true,
    dirs: ["pages", "components", "themes", "utils", "api", "types"],
  },
  experimental: {
    largePageDataBytes: 1024 * 1024 * 10,
  },
  images: {
    domains: getAllowDomains(),
  },
  ...getCdnUrl(),
  ...(isDev ? rewites : {}),
});
