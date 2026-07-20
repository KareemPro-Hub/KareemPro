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
  // serverExternalPackages alone stops webpack/turbopack from bundling the
  // package's JS, but it does NOT make Vercel's file-tracer include the
  // binary .br files under bin/ — chromium.executablePath() reads that
  // folder with a runtime fs.readdirSync, which static tracing can't see,
  // so the folder was silently missing in production ("input directory
  // .../bin does not exist" — confirmed via runtime error logs). Forcing
  // it into the traced output for the admin project route fixes it.
  outputFileTracingIncludes: {
    "/admin/**": ["./node_modules/@sparticuz/chromium/bin/**"],
  },
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
