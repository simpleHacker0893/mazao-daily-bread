// POST /api/bootstrap: the first call after Clerk sign-in. Creates the profile, business and owner
// membership if they are missing, and says whether the business has records to restore.
// The email comes from Clerk on the server, never from the request. /api/* is never cached.
import { currentUser } from "@clerk/nextjs/server";
import { bootstrapBusiness } from "@/server/bootstrap";
import { errorResponse, HttpError, requireSession } from "@/server/tenant";

export const dynamic = "force-dynamic";

export async function POST(): Promise<Response> {
  try {
    const { clerkUserId } = await requireSession();
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!user || !email) throw new HttpError(401);
    return Response.json(await bootstrapBusiness(clerkUserId, email));
  } catch (error) {
    return errorResponse(error);
  }
}
