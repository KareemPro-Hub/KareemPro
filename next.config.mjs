/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Default is 1mb — too small for real contract/invoice/design-file
    // uploads. Big files (video, etc.) still go through an external link,
    // never a direct upload, so this only needs to cover normal documents.
    serverActions: { bodySizeLimit: "15mb" },
  },
  // @sparticuz/chromium ships a compressed headless-Chromium binary that
  // must NOT be processed/bundled by webpack — used to generate the
  // payment-receipt PDF (see src/lib/pdfReceipt.js) on Vercel's serverless
  // Node runtime.
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  async rewrites() {
    return {
      beforeFiles: [
        // Serve the existing static marketing site untouched at the homepage.
        { source: "/", destination: "/index.html" },
      ],
    };
  },
};

export default nextConfig;
