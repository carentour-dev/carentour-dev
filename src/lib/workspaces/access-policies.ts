export const CMS_WORKSPACE_PERMISSION_SLUGS: ReadonlySet<string> = new Set([
  "cms.read",
  "cms.write",
  "cms.media",
  "nav.manage",
]);
const ADMIN_PERMISSION = "admin.access";
const OPERATIONS_ACCESS_PERMISSION = "operations.access";
const OPERATIONS_SHARED_PERMISSION = "operations.shared";
const CMS_FALLBACK_ROLE_SLUGS = new Set([
  "editor",
  "cms",
  "content",
  "content_manager",
  "content-editor",
]);
const FINANCE_FALLBACK_ROLE_SLUGS = new Set([
  "finance",
  "accounting",
  "accountant",
  "finance_manager",
  "finance-admin",
  "controller",
  "bookkeeper",
  "ap",
  "ar",
]);
const OPERATIONS_FALLBACK_ROLE_SLUGS = new Set([
  "operations",
  "coordinator",
  "doctor",
  "employee",
  "management",
  "staff",
]);
const OPERATIONS_SECTION_PERMISSIONS = [
  "operations.quotation_calculator",
  "operations.requests",
  "operations.start_journey",
  "operations.consultations",
  "operations.appointments",
  "operations.patients",
  "operations.testimonials",
] as const;

export type WorkspaceLandingPath =
  | "/admin"
  | "/operations"
  | "/finance"
  | "/cms"
  | "/dashboard";

const normalizePermissionSlugs = (permissions: string[]): string[] =>
  permissions
    .map((permission) =>
      typeof permission === "string" ? permission.trim().toLowerCase() : "",
    )
    .filter((permission) => permission.length > 0);

const normalizeRoleSlugs = (roles: string[]): string[] =>
  roles
    .map((role) => (typeof role === "string" ? role.trim().toLowerCase() : ""))
    .filter((role) => role.length > 0);

export function hasAdminWorkspaceAccess({
  permissions,
  roles = [],
}: {
  permissions: string[];
  roles?: string[];
}): boolean {
  const normalizedPermissions = normalizePermissionSlugs(permissions);
  if (normalizedPermissions.includes(ADMIN_PERMISSION)) {
    return true;
  }

  const normalizedRoles = normalizeRoleSlugs(roles);
  return normalizedRoles.includes("admin");
}

export function hasCmsWorkspaceAccess(permissions: string[]): boolean {
  const normalizedPermissions = normalizePermissionSlugs(permissions);
  if (!normalizedPermissions.length) {
    return false;
  }

  return normalizedPermissions.some((permission) =>
    CMS_WORKSPACE_PERMISSION_SLUGS.has(permission),
  );
}

export function hasFinanceWorkspaceAccess(permissions: string[]): boolean {
  const normalizedPermissions = normalizePermissionSlugs(permissions);
  if (!normalizedPermissions.length) {
    return false;
  }

  if (normalizedPermissions.includes(ADMIN_PERMISSION)) {
    return true;
  }

  if (normalizedPermissions.includes("finance.access")) {
    return true;
  }

  return normalizedPermissions.some((permission) =>
    permission.startsWith("finance."),
  );
}

export function hasOperationsWorkspaceAccess(permissions: string[]): boolean {
  const normalizedPermissions = normalizePermissionSlugs(permissions);
  if (!normalizedPermissions.length) {
    return false;
  }

  const normalizedPermissionSet = new Set(normalizedPermissions);

  if (
    normalizedPermissionSet.has(ADMIN_PERMISSION) ||
    normalizedPermissionSet.has(OPERATIONS_ACCESS_PERMISSION)
  ) {
    return true;
  }

  if (!normalizedPermissionSet.has(OPERATIONS_SHARED_PERMISSION)) {
    return false;
  }

  return OPERATIONS_SECTION_PERMISSIONS.some((permission) =>
    normalizedPermissionSet.has(permission),
  );
}

export function resolveAccessibleWorkspaceRoute({
  permissions,
  roles = [],
}: {
  permissions: string[];
  roles?: string[];
}): WorkspaceLandingPath {
  const normalizedPermissions = normalizePermissionSlugs(permissions);
  const normalizedRoles = normalizeRoleSlugs(roles);
  if (
    hasAdminWorkspaceAccess({
      permissions: normalizedPermissions,
      roles: normalizedRoles,
    })
  ) {
    return "/admin";
  }

  if (hasOperationsWorkspaceAccess(normalizedPermissions)) {
    return "/operations";
  }

  if (hasFinanceWorkspaceAccess(normalizedPermissions)) {
    return "/finance";
  }

  if (hasCmsWorkspaceAccess(normalizedPermissions)) {
    return "/cms";
  }

  // Fallback for sign-in redirect paths when permission RPC returns empty
  // while role data is already available.
  if (normalizedPermissions.length === 0) {
    if (normalizedRoles.some((role) => CMS_FALLBACK_ROLE_SLUGS.has(role))) {
      return "/cms";
    }

    if (normalizedRoles.some((role) => FINANCE_FALLBACK_ROLE_SLUGS.has(role))) {
      return "/finance";
    }

    if (
      normalizedRoles.some((role) => OPERATIONS_FALLBACK_ROLE_SLUGS.has(role))
    ) {
      return "/operations";
    }
  }

  return "/dashboard";
}
