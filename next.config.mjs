/** @type {import('next').NextConfig} */
const isMobile = process.env.BUILD_TARGET === "mobile";

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["puppeteer-core", "@sparticuz/chromium-min"],
  },
  ...(isMobile
    ? {
        output: "export",
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {
        // Enable CORS for mobile Capacitor APKs & remote clients when deployed on Vercel
        async headers() {
          return [
            {
              source: "/api/:path*",
              headers: [
                { key: "Access-Control-Allow-Origin", value: "*" },
                { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
                {
                  key: "Access-Control-Allow-Headers",
                  value:
                    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
                },
              ],
            },
          ];
        },
      }),
};

export default nextConfig;
