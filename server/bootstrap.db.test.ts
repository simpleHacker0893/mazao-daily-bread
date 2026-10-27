// pnpm test:db — against the Neon dev branch. Clerk is mocked at the auth()/currentUser() boundary.
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const clerk = vi.hoisted(() => ({
  userId: null as string | null,
  email: "merchant+clerk_test@example.com",
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: async () => ({ userId: clerk.userId }),
  currentUser: async () =>
    clerk.userId
      ? {
          id: clerk.userId,
          primaryEmailAddress: { emailAddress: clerk.email },
        }
      : null,
}));

const { db } = await import("./db");
const { bootstrapBusiness } = await import("./bootstrap");
const { errorResponse, requireMember } = await import("./tenant");
const { POST } = await import("@/app/api/bootstrap/route");

const run = `test_${crypto.randomUUID().slice(0, 8)}`;
let n = 0;
const newClerkId = () => `${run}_${++n}`;

async function one<Row>(rows: AsyncIterable<Row>): Promise<Row> {
  for await (const row of rows) return row;
  throw new Error("no row");
}

async function count(sql: ReturnType<typeof db.raw.sql>) {
  const row = await one(db.query(sql.returnsRow({ n: "pg/int4@1" }).build()));
  return row.n;
}

/** A guarded handler that exists only in this test (no test route ships in the build). */
async function guarded(): Promise<Response> {
  try {
    await requireMember();
    return new Response("ok");
  } catch (error) {
    return errorResponse(error);
  }
}

beforeEach(() => {
  clerk.userId = null;
});

afterAll(async () => {
  const like = `${run}%`;
  await db.execute(
    db.raw.sql`
      DELETE FROM businesses WHERE id IN (
        SELECT m.business_id FROM business_members m
        JOIN profiles p ON p.id = m.profile_id
        WHERE p.clerk_user_id LIKE ${like})`
      .affectedCount()
      .build(),
  );
  await db.execute(
    db.raw.sql`DELETE FROM profiles WHERE clerk_user_id LIKE ${like}`
      .affectedCount()
      .build(),
  );
  await db.close();
});

describe("bootstrapBusiness (race-safe, M2)", () => {
  it("two concurrent calls give one profile, one business, one membership and no orphan (AC-12)", async () => {
    const id = newClerkId();
    const [a, b] = await Promise.all([
      bootstrapBusiness(id, "a+clerk_test@example.com"),
      bootstrapBusiness(id, "a+clerk_test@example.com"),
    ]);
    expect(b.profileId).toBe(a.profileId);
    expect(b.businessId).toBe(a.businessId);
    expect(
      await count(
        db.raw
          .sql`SELECT count(*)::int AS n FROM profiles WHERE clerk_user_id = ${id}`,
      ),
    ).toBe(1);
    expect(
      await count(
        db.raw
          .sql`SELECT count(*)::int AS n FROM business_members WHERE profile_id = ${a.profileId}::uuid`,
      ),
    ).toBe(1);
    expect(
      await count(
        db.raw.sql`SELECT count(*)::int AS n FROM businesses b
          WHERE NOT EXISTS (SELECT 1 FROM business_members m WHERE m.business_id = b.id)`,
      ),
    ).toBe(0);
  });

  it("ten concurrent calls for one new user all get the same business", async () => {
    const id = newClerkId();
    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        bootstrapBusiness(id, "ten+clerk_test@example.com"),
      ),
    );
    expect(new Set(results.map((r) => r.businessId)).size).toBe(1);
  });

  it("a second call returns the same ids; hasData follows the business's rows", async () => {
    const id = newClerkId();
    const first = await bootstrapBusiness(id, "again+clerk_test@example.com");
    expect(first.hasData).toBe(false);

    await db.execute(
      db.raw.sql`
        INSERT INTO customers (id, business_id, name, created_by, created_at, updated_at)
        VALUES (gen_random_uuid(), ${first.businessId}::uuid, 'Otieno',
                ${first.profileId}::uuid, now(), now())`
        .affectedCount()
        .build(),
    );
    const second = await bootstrapBusiness(id, "again+clerk_test@example.com");
    expect(second.profileId).toBe(first.profileId);
    expect(second.businessId).toBe(first.businessId);
    expect(second.hasData).toBe(true);
  });
});

describe("POST /api/bootstrap and the tenancy guard", () => {
  it("stores and returns the Clerk user's primary email", async () => {
    clerk.userId = newClerkId();
    const response = await POST();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toMatchObject({
      clerkUserId: clerk.userId,
      email: clerk.email,
      hasData: false,
    });
    const stored = await one(
      db.query(
        db.raw
          .sql`SELECT email FROM profiles WHERE clerk_user_id = ${clerk.userId}`
          .returnsRow({ email: "pg/text@1" })
          .build(),
      ),
    );
    expect(stored.email).toBe(clerk.email);
  });

  it("answers 401 with no session, for bootstrap and a guarded handler", async () => {
    expect((await POST()).status).toBe(401);
    expect((await guarded()).status).toBe(401);
  });

  it("answers 403 to a signed-in user with a profile but no membership", async () => {
    clerk.userId = newClerkId();
    await db.execute(
      db.raw.sql`INSERT INTO profiles (clerk_user_id, email)
        VALUES (${clerk.userId}, 'nomember+clerk_test@example.com')`
        .affectedCount()
        .build(),
    );
    expect((await guarded()).status).toBe(403);
  });

  it("lets a member through and names their business", async () => {
    clerk.userId = newClerkId();
    const boot = await bootstrapBusiness(
      clerk.userId,
      "member+clerk_test@example.com",
    );
    await expect(requireMember()).resolves.toEqual({
      profileId: boot.profileId,
      businessId: boot.businessId,
    });
    expect((await guarded()).status).toBe(200);
  });
});
