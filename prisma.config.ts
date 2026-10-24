import "dotenv/config";
import { defineConfig as ormConfig } from "@prisma/orm-postgres/config";
import { definePrismaConfig } from "prisma/config";

// D-048: the CLI (migrations) uses Neon's direct URL (DATABASE_URL_UNPOOLED); the app runtime uses DATABASE_URL.
// Falls back to "" so the offline `contract emit` on postinstall works before any .env exists.
export default definePrismaConfig({
  orm: ormConfig({
    contract: "./prisma/contract.prisma",
    db: {
      connection:
        process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "",
    },
  }),
});
