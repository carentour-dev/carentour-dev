// Temporarily allow all requests; admin verification disabled per request.
export async function requireAdmin() {
  return { user: null, role: "bypassed" };
}
