import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // No image domains are configured yet because the MVP ships with no
  // external or user-uploaded images: avatars are built from a closed set
  // of local SVG parts (src/data/avatar-options.ts), never a URL a child
  // or third party could point elsewhere.
};

export default withNextIntl(nextConfig);
