/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ✅ allow imports from ../../packages/*
  experimental: {
    externalDir: true,
  },
};

module.exports = nextConfig;

