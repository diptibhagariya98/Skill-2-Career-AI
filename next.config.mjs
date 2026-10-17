/** @type {import('next').NextConfig} */
const isMobile = process.env.BUILD_TARGET === "mobile";

const nextConfig = {
  reactStrictMode: true,
  ...(isMobile
    ? {
        output: "export",
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;

