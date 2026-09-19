import type { NextConfig } from "next";
const config: NextConfig = {
  agentRules: false,
  // Reuse short-lived, authenticated route payloads in browser memory.
  experimental: { staleTimes: { dynamic: 30, static: 30 } },
  logging: { serverFunctions: false },
  serverExternalPackages: ["@react-pdf/renderer"],
  outputFileTracingIncludes: {
    "/api/cotizaciones/*/pdf": ["./node_modules/pdfkit/js/standard-fonts/**/*"],
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};
export default config;
