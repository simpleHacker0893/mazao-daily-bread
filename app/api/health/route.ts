// Liveness of the server-side services. /api/* is never cached by the service worker.
// Reports only ok/error per service; never echoes connection details or record contents.
import { db } from "@/server/db";
import { getFiles } from "@/server/storage";

export const dynamic = "force-dynamic";

async function checkDatabase(): Promise<boolean> {
  const plan = db.raw.sql`SELECT 1::text AS ok`
    .returnsRow({ ok: "pg/text@1" })
    .build();
  for await (const row of db.query(plan)) return row.ok === "1";
  return false;
}

async function checkStorage(): Promise<boolean> {
  const files = getFiles();
  // Production: read-only probe, so this public endpoint can't be used to write to the bucket.
  if (process.env.NODE_ENV === "production") {
    await files.list({ prefix: "health/" });
    return true;
  }
  const key = `health/${crypto.randomUUID()}.txt`;
  const body = "mazao health probe";
  await files.upload(key, body, { contentType: "text/plain" });
  try {
    const read = await (await files.download(key)).text();
    return read === body;
  } finally {
    await files.delete(key);
  }
}

async function settle(check: () => Promise<boolean>): Promise<"ok" | "error"> {
  try {
    return (await check()) ? "ok" : "error";
  } catch {
    return "error";
  }
}

export async function GET() {
  const [database, storage] = await Promise.all([
    settle(checkDatabase),
    settle(checkStorage),
  ]);
  const ok = database === "ok" && storage === "ok";
  return Response.json({ database, storage }, { status: ok ? 200 : 503 });
}
