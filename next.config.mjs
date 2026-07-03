/** @type {import('next').NextConfig} */
const nextConfig = {
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
