import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // D-043: React Compiler on; code never hand-memoises.
  reactCompiler: true,
  // D-055: the landing page moved from /welcome to /. Old shared links keep working.
  async redirects() {
    return [{ source: "/welcome", destination: "/", permanent: true }];
  },
};

export default nextConfig;
