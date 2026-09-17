import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // No image domains are configured yet because the MVP ships with no
  // external or user-uploaded images: avatars are built from a closed set
  // of local SVG parts (src/data/avatar-options.ts), never a URL a child
  // or third party could point elsewhere.

  // Added specifically for Namecheap's 1GB-RAM Stellar plan. Audited
  // first, not guessed: this app's own content is small (2.0MB across
  // all 9 languages combined, ~1,100 lines of structural TS content,
  // no heavy module-level computation) and static generation is
  // already scoped to just 63 pages total (9 locale roots + 54
  // article pages) — none of the deep lesson/game routes are
  // pre-rendered at build time at all. So the app's own code isn't
  // what's bloating the build.
  //
  // The real driver, per the exact "WebAssembly.instantiate(): Out of
  // memory" error: Next.js's build falls back to the WASM build of
  // SWC when no matching native binary is available for the host
  // platform, and by default spins up one compiler worker per CPU
  // core — each running its own WASM instance simultaneously. `cpus:
  // 1` forces single-threaded compilation, so only one WASM SWC
  // instance is ever allocated at once. `workerThreads: false` stops
  // Next from parallelizing across worker_threads as well. This
  // trades build TIME (a slower, sequential build) for peak memory
  // (the actual constraint on this host) — an explicit, honest
  // tradeoff, not a disabled feature: every build step still runs,
  // just one at a time instead of in parallel.
  experimental: {
    cpus: 1,
    workerThreads: false,
  },
};

export default withNextIntl(nextConfig);
