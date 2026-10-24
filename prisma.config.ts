import "dotenv/config";
import { defineConfig as ormConfig } from "@prisma/orm-postgres/config";
import { definePrismaConfig } from "prisma/config";

// The CLI (migrations) uses the direct, unpooled Neon URL; the app runtime uses DATABASE_URL (D-037).
export default definePrismaConfig({
  orm: ormConfig({
    contract: "./prisma/contract.prisma",
    db: {
      connection: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
    },
  }),
});
