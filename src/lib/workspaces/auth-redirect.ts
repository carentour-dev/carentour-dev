export function canAutoRedirectToWorkspaceFromPath(
  pathname: string | null | undefined,
): boolean {
  if (!pathname || typeof pathname !== "string") {
    return false;
  }

  if (pathname === "/auth") {
    return true;
  }

  if (pathname === "/auth/") {
    return true;
  }

  return false;
}
