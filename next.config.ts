import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // D-043: React Compiler on; code never hand-memoises.
  reactCompiler: true,
};

export default nextConfig;
