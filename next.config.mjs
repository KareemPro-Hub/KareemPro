/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Default is 1mb — too small for real contract/invoice/design-file
    // uploads. Big files (video, etc.) still go through an external link,
    // never a direct upload, so this only needs to cover normal documents.
    serverActions: { bodySizeLimit: "15mb" },
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
