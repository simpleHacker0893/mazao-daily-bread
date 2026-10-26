import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { defineConfig } from "vitest/config";

// `pnpm test:db`: route and server tests against the Neon dev branch (DATABASE_URL in .env).
// Kept apart so `pnpm test` stays green with no database (Phase 1 plan, Global Constraints).
loadEnv({ path: ".env", quiet: true });

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
      // `server-only` throws outside a React server bundle; tests run server code in plain Node.
      "server-only": fileURLToPath(
        new URL("./test/server-only.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    include: ["**/*.db.test.ts"],
    exclude: ["node_modules/**", ".next/**", ".claude/**", ".agents/**"],
    // One database: run files one at a time.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
