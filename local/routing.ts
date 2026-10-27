// Shared contract: where to go after a successful PIN unlock.
// Stub until B4 (Phase 3), which routes by onboarding and notebook state. The app home is /dashboard (D-055).
export async function nextRouteAfterPin(): Promise<string> {
  return "/dashboard";
}
