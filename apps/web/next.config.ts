import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    const nonce = Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString("base64");

    return [
      {
        source: "/(.*)",
        headers: [
          // Content Security Policy with nonce
          {
            key: "Content-Security-Policy",
            value: `
              default-src 'self';
              script-src 'self' 'nonce-${nonce}' https://cdn.jsdelivr.net;
              style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com;
              font-src 'self' https://fonts.gstatic.com;
              img-src 'self' data: https: blob:;
              connect-src 'self' https://supabase.com https://*.supabase.co;
              frame-ancestors 'none';
              base-uri 'self';
              form-action 'self';
            `.replace(/\n/g, ""),
          },
          // HTTP Strict Transport Security
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          // Prevent MIME type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Prevent clickjacking
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // Prevent XSS (older browsers)
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // Referrer policy
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Permissions policy
          {
            key: "Permissions-Policy",
            value: "geolocation=(), microphone=(), camera=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
