// Hand-off contract between the server bootstrap (Task 2) and the sign-in flow (Task 3).

export type BootstrapResponse = {
  profileId: string;
  businessId: string;
  clerkUserId: string;
  email: string;
  /** The business already has backed-up records, so a new phone restores before setting a PIN. */
  hasData: boolean;
};

/** 401 no session, 403 no membership, 500 server error, 0 network (offline or unreachable). */
export class BootstrapError extends Error {
  readonly status: 401 | 403 | 500 | 0;
  constructor(status: 401 | 403 | 500 | 0) {
    super(`Bootstrap failed (${status})`);
    this.name = "BootstrapError";
    this.status = status;
  }
}

/** Same-origin POST with the Clerk session cookie. Creates the business on first sign-in. */
export async function bootstrap(): Promise<BootstrapResponse> {
  let response: Response;
  try {
    response = await fetch("/api/bootstrap", {
      method: "POST",
      credentials: "same-origin",
    });
  } catch {
    throw new BootstrapError(0);
  }
  if (response.status === 401 || response.status === 403) {
    throw new BootstrapError(response.status);
  }
  if (!response.ok) throw new BootstrapError(500);
  return (await response.json()) as BootstrapResponse;
}
