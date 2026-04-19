import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  outputFileTracingIncludes: {
    "/api/v1/private/ai-ats": [
      "./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs",
      "./node_modules/pdf-parse/node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs",
    ],
    "/api/v1/private/resume-ai": [
      "./node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs",
      "./node_modules/pdf-parse/node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs",
    ],
  },
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
