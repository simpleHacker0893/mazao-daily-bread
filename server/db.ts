// D-048: Prisma 8 runtime client on Neon's pooled DATABASE_URL (Vercel Node runtime).
// A module-level singleton: the pool lives for the process and is never closed per request.
import "server-only";
import postgres from "@prisma/orm-postgres/runtime";
import { contractFromJson } from "@prisma/orm-postgres/static";
import type { Contract } from "@/prisma/contract.d";
import contractJson from "@/prisma/contract.json";

export const contract = contractFromJson<Contract>(contractJson);

if (process.env.NODE_ENV === "development") {
  console.info("Database URL configured:", Boolean(process.env.DATABASE_URL));
}

function createDb() {
  return postgres({ contract, url: process.env.DATABASE_URL });
}

// Reuse one pool across dev hot reloads instead of opening a new one per edit.
const globalForDb = globalThis as unknown as {
  mazaoDb?: ReturnType<typeof createDb>;
};

export const db = globalForDb.mazaoDb ?? createDb();

if (process.env.NODE_ENV !== "production") globalForDb.mazaoDb = db;
