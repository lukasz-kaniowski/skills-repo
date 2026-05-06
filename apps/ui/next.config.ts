import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: ["@repo/types"],
};

export default config;
