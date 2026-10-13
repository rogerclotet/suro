/**
 * The invitation a signed-out user was trying to accept when they were sent to
 * sign in. The invitation screen lives outside the (app) group so it can prompt
 * for login itself, but that prompt replaces it with /login — and login hands
 * off to the groups list, so without this the invite is lost and the user has
 * to find and tap the link again.
 *
 * Deliberately in memory only: it has to outlive the login screen, not the
 * process. A stale invite surviving a cold start would hijack a later, unrelated
 * sign-in.
 */
let pendingRoute: string | null = null;

/** In-app route of the invitation screen for a group's invite token. */
export function invitationRoute(
  projectId: string,
  inviteToken: string,
): string {
  return `/invitation/${projectId}/${inviteToken}`;
}

export function rememberPendingInvitation(route: string): void {
  pendingRoute = route;
}

/** The route to resume after sign-in, or null when there is none. */
export function pendingInvitation(): string | null {
  return pendingRoute;
}

export function clearPendingInvitation(): void {
  pendingRoute = null;
}
