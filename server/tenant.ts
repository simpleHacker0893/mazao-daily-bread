// Tenancy guard (D-016): every API route calls requireMember() first and works only inside the
// caller's business. Only POST /api/bootstrap uses requireSession(), because it creates the
// membership. Never logs the Clerk id, email or request body.
import "server-only";
import { auth } from "@clerk/nextjs/server";
import { db } from "./db";

export class HttpError extends Error {
  readonly status: 401 | 403;
  constructor(status: 401 | 403) {
    super(status === 401 ? "Unauthorized" : "Forbidden");
    this.name = "HttpError";
    this.status = status;
  }
}

/** The signed-in Clerk user, or 401. */
export async function requireSession(): Promise<{ clerkUserId: string }> {
  const { userId } = await auth();
  if (!userId) throw new HttpError(401);
  return { clerkUserId: userId };
}

/** The caller's profile and business: 401 with no session, 403 with no membership. */
export async function requireMember(): Promise<{
  profileId: string;
  businessId: string;
}> {
  const { clerkUserId } = await requireSession();
  const plan = db.raw.sql`
    SELECT p.id::text AS profile_id, m.business_id::text AS business_id
    FROM profiles p
    JOIN business_members m ON m.profile_id = p.id
    WHERE p.clerk_user_id = ${clerkUserId}`
    .returnsRow({ profile_id: "pg/text@1", business_id: "pg/text@1" })
    .build();
  for await (const row of db.query(plan)) {
    return { profileId: row.profile_id, businessId: row.business_id };
  }
  throw new HttpError(403);
}

/** Maps a thrown error to a response; anything unexpected is a plain 500 with no details. */
export function errorResponse(error: unknown): Response {
  if (error instanceof HttpError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  return Response.json({ error: "Server error" }, { status: 500 });
}
