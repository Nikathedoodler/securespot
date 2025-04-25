/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["tsx", "ts", "jsx", "js"],
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "TestComponent.tsx": false,
    };
    return config;
  },
  images: {
    domains: ["lh3.googleusercontent.com"],
  },
};

module.exports = nextConfig;
