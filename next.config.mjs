import { withSentryConfig } from "@sentry/nextjs/config";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: process.env.BUILD_STANDALONE === "true" ? "standalone" : undefined,
};

export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG || "personal-t1i",
  project: process.env.SENTRY_PROJECT || "clube-da-cota",
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: true,
});
