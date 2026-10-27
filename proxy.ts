import { clerkMiddleware } from "@clerk/nextjs/server";

// Clerk on API routes only (Phase 1 plan, Task 2). It never protects or redirects pages: app
// pages open offline and are gated on the phone by the device account and PIN (LockGuard), and
// every API route checks the session itself (requireMember / requireSession: 401, 403).
export default clerkMiddleware();

export const config = {
  matcher: ["/(api|trpc)(.*)"],
};
