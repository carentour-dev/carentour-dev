import type { RoleSlug } from "@/lib/auth/roles";

export const ADMIN_PERMISSION = "admin.access";
export const OPERATIONS_ACCESS_PERMISSION = "operations.access";
export const OPERATIONS_SHARED_PERMISSION = "operations.shared";

export type AccessRule = {
  allPermissions?: string[];
  anyPermissions?: string[];
  allRoles?: RoleSlug[];
  anyRoles?: RoleSlug[];
};

export type AccessRequirement = AccessRule | AccessRule[];

export type EntitlementContext = {
  permissions: Set<string>;
  roles: Set<RoleSlug>;
};

type EntitlementInit =
  | null
  | undefined
  | {
      permissions?: Iterable<string> | null | undefined;
      roles?: Iterable<RoleSlug | string> | null | undefined;
    };

export const createEntitlementContext = (
  init?: EntitlementInit,
): EntitlementContext => {
  const permissions = new Set<string>();
  const roles = new Set<RoleSlug>();

  if (init) {
    if (init.permissions) {
      for (const permission of init.permissions) {
        if (typeof permission === "string" && permission.trim()) {
          permissions.add(permission.trim());
        }
      }
    }

    if (init.roles) {
      for (const role of init.roles) {
        if (typeof role === "string" && role.trim()) {
          roles.add(role.trim() as RoleSlug);
        }
      }
    }
  }

  return { permissions, roles };
};

const matchesRoles = (
  ownedRoles: Set<RoleSlug>,
  rule: Pick<AccessRule, "allRoles" | "anyRoles">,
) => {
  if (rule.allRoles?.length) {
    const ownsAll = rule.allRoles.every((role) => ownedRoles.has(role));
    if (!ownsAll) {
      return false;
    }
  }

  if (rule.anyRoles?.length) {
    const ownsAny = rule.anyRoles.some((role) => ownedRoles.has(role));
    if (!ownsAny) {
      return false;
    }
  }

  return true;
};

const matchesPermissions = (
  ownedPermissions: Set<string>,
  rule: Pick<AccessRule, "allPermissions" | "anyPermissions">,
) => {
  if (rule.allPermissions?.length) {
    const hasAll = rule.allPermissions.every((permission) =>
      ownedPermissions.has(permission),
    );
    if (!hasAll) {
      return false;
    }
  }

  if (rule.anyPermissions?.length) {
    const hasAny = rule.anyPermissions.some((permission) =>
      ownedPermissions.has(permission),
    );
    if (!hasAny) {
      return false;
    }
  }

  return true;
};

export const satisfiesRequirement = (
  context: EntitlementContext,
  requirement: AccessRequirement,
): boolean => {
  const rules = Array.isArray(requirement) ? requirement : [requirement];

  if (context.permissions.has(ADMIN_PERMISSION)) {
    return true;
  }

  return rules.some((rule) => {
    const permissionsMatch = matchesPermissions(context.permissions, rule);
    if (!permissionsMatch) {
      return false;
    }

    const rolesMatch = matchesRoles(context.roles, rule);
    return rolesMatch;
  });
};

export const hasPermission = (
  context: EntitlementContext,
  permission: string,
) => {
  return (
    context.permissions.has(ADMIN_PERMISSION) ||
    context.permissions.has(permission)
  );
};

export const hasOperationsEntry = (context: EntitlementContext) => {
  return (
    context.permissions.has(ADMIN_PERMISSION) ||
    context.permissions.has(OPERATIONS_ACCESS_PERMISSION)
  );
};

export const mergeEntitlements = (
  ...sources: EntitlementInit[]
): EntitlementContext => {
  const permissions = new Set<string>();
  const roles = new Set<RoleSlug>();

  for (const source of sources) {
    if (!source) continue;

    if (source.permissions) {
      for (const permission of source.permissions) {
        if (typeof permission === "string" && permission.trim()) {
          permissions.add(permission.trim());
        }
      }
    }

    if (source.roles) {
      for (const role of source.roles) {
        if (typeof role === "string" && role.trim()) {
          roles.add(role.trim() as RoleSlug);
        }
      }
    }
  }

  return { permissions, roles };
};
