import type { NextConfig } from "next";
import path from "node:path";

const config: NextConfig = {
  turbopack: {
    root: path.resolve(process.cwd(), "..", ".."),
  },
  transpilePackages: ["@repo/types"],
};

export default config;
