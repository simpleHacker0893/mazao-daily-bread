// POST /api/bootstrap: the first call after Clerk sign-in. Creates the profile, business and owner
// membership if they are missing, and says whether the business has records to restore.
// The email comes from Clerk on the server, never from the request. /api/* is never cached.
import { currentUser } from "@clerk/nextjs/server";
import { bootstrapBusiness } from "@/server/bootstrap";
import { errorResponse, HttpError, requireSession } from "@/server/tenant";

export const dynamic = "force-dynamic";

const exceptionClassLabels = new Set([
  "Error",
  "TypeError",
  "RangeError",
  "ReferenceError",
  "SyntaxError",
  "HttpError",
]);

const databaseErrorCodes = new Set([
  "08000",
  "08003",
  "08006",
  "23502",
  "23503",
  "23505",
  "40001",
  "40P01",
  "42P01",
  "42703",
  "42883",
]);

function safeDiagnosticLabels(error: unknown): {
  exceptionClass: string;
  databaseCode: string;
} {
  let current: unknown = error;
  let exceptionClass = "other";
  let databaseCode = "other";

  for (
    let depth = 0;
    depth < 4 && current && typeof current === "object";
    depth += 1
  ) {
    const candidate = current as {
      cause?: unknown;
      code?: unknown;
      name?: unknown;
      sqlState?: unknown;
    };
    if (depth === 0 && typeof candidate.name === "string") {
      exceptionClass = exceptionClassLabels.has(candidate.name)
        ? candidate.name
        : "other";
    }

    for (const value of [candidate.code, candidate.sqlState]) {
      if (typeof value === "string" && databaseErrorCodes.has(value)) {
        databaseCode = value;
        break;
      }
    }
    if (databaseCode !== "other") break;
    current = candidate.cause;
  }

  return { exceptionClass, databaseCode };
}

export async function POST(): Promise<Response> {
  try {
    const { clerkUserId } = await requireSession();
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!user || !email) throw new HttpError(401);
    return Response.json(await bootstrapBusiness(clerkUserId, email));
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "POST /api/bootstrap diagnostic",
        safeDiagnosticLabels(error),
      );
    }
    return errorResponse(error);
  }
}
