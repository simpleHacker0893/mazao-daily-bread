// Shared contract: where to go after a successful PIN unlock.
// Stub until B4 (Phase 3), which routes by onboarding and notebook state.
export async function nextRouteAfterPin(): Promise<string> {
  return "/";
}
