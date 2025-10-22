export const KNOWN_ROLES = [
  "admin",
  "editor",
  "user",
  "management",
  "doctor",
  "employee",
  "coordinator",
] as const;

export type KnownRole = (typeof KNOWN_ROLES)[number];
export type RoleSlug = KnownRole | string;

export const PRIMARY_ROLE_ORDER: RoleSlug[] = [
  "admin",
  "editor",
  "management",
  "coordinator",
  "doctor",
  "employee",
  "user",
];

export function normalizeRoles(input: string[] | null | undefined): RoleSlug[] {
  if (!Array.isArray(input)) {
    return [];
  }

  const seen = new Set<string>();
  const normalized: RoleSlug[] = [];

  for (const role of input) {
    if (!role || seen.has(role)) {
      continue;
    }
    seen.add(role);
    normalized.push(role);
  }

  return normalized;
}

export function pickPrimaryRole(roles: RoleSlug[]): RoleSlug | null {
  if (!roles.length) {
    return null;
  }

  const preferred = PRIMARY_ROLE_ORDER.find((role) => roles.includes(role));
  return preferred ?? roles[0] ?? null;
}

export function hasRole(roles: RoleSlug[], role: RoleSlug): boolean {
  return roles.includes(role);
}

export function hasAnyRole(roles: RoleSlug[], allowed: RoleSlug[]): boolean {
  if (!roles.length || !allowed.length) {
    return false;
  }
  return allowed.some((role) => roles.includes(role));
}

export function hasAllRoles(roles: RoleSlug[], required: RoleSlug[]): boolean {
  if (!roles.length || !required.length) {
    return false;
  }
  return required.every((role) => roles.includes(role));
}
