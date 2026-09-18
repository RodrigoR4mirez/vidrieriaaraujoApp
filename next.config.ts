import type { NextConfig } from "next";
const config: NextConfig = {
  agentRules: false,
  logging: { serverFunctions: false },
  serverExternalPackages: ["@react-pdf/renderer"],
  outputFileTracingIncludes: {
    "/api/proformas/*/pdf": ["./node_modules/pdfkit/js/standard-fonts/**/*"],
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
