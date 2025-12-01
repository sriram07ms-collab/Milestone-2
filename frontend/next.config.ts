import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',  // Enable static export for GitHub Pages
  images: {
    unoptimized: true,  // Required for static export
  },
  trailingSlash: true,  // Better compatibility with GitHub Pages
  // Skip dynamic routes during static export
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
