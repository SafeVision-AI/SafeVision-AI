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

