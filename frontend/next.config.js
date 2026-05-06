/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'source.unsplash.com' },
      { protocol: 'https', hostname: 'unpkg.com' },
      { protocol: 'https', hostname: 'nominatim.openstreetmap.org' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'huggingface.co' },
    ],
  },
  // No orphan redirects needed — /emergency and /settings routes now exist
  async redirects() {
    return [];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=self, microphone=self, geolocation=self, browsing-topics=()',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'wasm-unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https: wss:; worker-src 'self' blob:; child-src 'self' blob:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none';",
          },
        ],
      },
    ];
  },
  webpack: (config) => {
    // Base fallbacks
    config.resolve.fallback = { fs: false, path: false };

    // ── @xenova/transformers — WASM + Web Worker support ──────────────────
    // Transformers.js runs models via WebAssembly and offloads to Web Workers.
    // Without this, Next.js blocks both and the offline AI won't load.
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,   // enables .wasm module imports
      layers: true,             // required for asyncWebAssembly in Next.js 13+
    };

    // Handle worker files from @xenova/transformers
    config.module.rules.push({
      test: /\.worker\.js$/,
      use: { loader: 'worker-loader', options: { inline: 'no-fallback' } },
    });

    return config;
  },
};

module.exports = nextConfig;

