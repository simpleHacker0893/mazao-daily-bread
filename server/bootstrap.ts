// First sign-in: find or create the merchant's profile, business and owner membership.
// Race-safe without relying on an error inside a transaction (Phase 1 plan, Task 2, M2): a
// transaction that hit a unique violation is aborted, so nothing here ever provokes one.
import "server-only";
import type { BootstrapResponse } from "@/auth/bootstrap";
import { db } from "./db";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function first<Row>(rows: AsyncIterable<Row>): Promise<Row | undefined> {
  for await (const row of rows) return row;
  return undefined;
}

export async function bootstrapBusiness(
  clerkUserId: string,
  email: string,
): Promise<BootstrapResponse> {
  return db.transaction(async (tx) => {
    // 1. Profile: one statement. A concurrent caller waits on the row lock instead of failing.
    const profile = await first(
      tx.query(
        tx.raw.sql`
          INSERT INTO profiles (clerk_user_id, email)
          VALUES (${clerkUserId}, ${email})
          ON CONFLICT (clerk_user_id)
          DO UPDATE SET email = EXCLUDED.email, updated_at = now()
          RETURNING id::text AS id`
          .returnsRow({ id: "pg/text@1" })
          .build(),
      ),
    );
    if (!profile) throw new Error("Profile upsert returned no row");
    const profileId = profile.id;

    // 2. Membership, if this merchant already has a business.
    let businessId = await membership(tx, profileId);

    // 3. Otherwise create one. If a concurrent call won, drop ours and use theirs.
    if (!businessId) {
      const business = await first(
        tx.query(
          tx.raw
            .sql`INSERT INTO businesses DEFAULT VALUES RETURNING id::text AS id`
            .returnsRow({ id: "pg/text@1" })
            .build(),
        ),
      );
      if (!business) throw new Error("Business insert returned no row");

      const joined = await first(
        tx.query(
          tx.raw.sql`
            INSERT INTO business_members (business_id, profile_id, role)
            VALUES (${business.id}::uuid, ${profileId}::uuid, 'owner')
            ON CONFLICT (profile_id) DO NOTHING
            RETURNING business_id::text AS business_id`
            .returnsRow({ business_id: "pg/text@1" })
            .build(),
        ),
      );
      if (joined) {
        businessId = joined.business_id;
      } else {
        await tx.execute(
          tx.raw.sql`DELETE FROM businesses WHERE id = ${business.id}::uuid`
            .affectedCount()
            .build(),
        );
        businessId = await membership(tx, profileId);
      }
    }
    if (!businessId) throw new Error("No membership after bootstrap");

    return {
      profileId,
      businessId,
      clerkUserId,
      email,
      hasData: await hasData(tx, businessId),
    };
  });
}

async function membership(
  tx: Tx,
  profileId: string,
): Promise<string | undefined> {
  const row = await first(
    tx.query(
      tx.raw.sql`
        SELECT business_id::text AS business_id
        FROM business_members
        WHERE profile_id = ${profileId}::uuid`
        .returnsRow({ business_id: "pg/text@1" })
        .build(),
    ),
  );
  return row?.business_id;
}

/** True when the business has any backed-up record, so a new phone restores first. */
async function hasData(tx: Tx, businessId: string): Promise<boolean> {
  const row = await first(
    tx.query(
      tx.raw.sql`
        SELECT (
          EXISTS (SELECT 1 FROM customers WHERE business_id = ${businessId}::uuid)
          OR EXISTS (SELECT 1 FROM suppliers WHERE business_id = ${businessId}::uuid)
          OR EXISTS (SELECT 1 FROM items WHERE business_id = ${businessId}::uuid)
          OR EXISTS (SELECT 1 FROM merchant_settings WHERE business_id = ${businessId}::uuid)
          OR EXISTS (SELECT 1 FROM transactions WHERE business_id = ${businessId}::uuid)
        ) AS has_data`
        .returnsRow({ has_data: "pg/bool@1" })
        .build(),
    ),
  );
  return row?.has_data === true;
}
