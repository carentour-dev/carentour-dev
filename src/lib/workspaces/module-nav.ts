export type WorkspaceModuleId =
  | "admin"
  | "operations"
  | "finance"
  | "cms"
  | "site";

export type WorkspaceAccessFlags = {
  admin: boolean;
  operations: boolean;
  finance: boolean;
  cms: boolean;
};

export type ModuleTab = {
  id: WorkspaceModuleId;
  label: string;
  href: string;
  active: boolean;
  visible: boolean;
  external?: boolean;
};

const STAFF_ROOTS = ["/admin", "/operations", "/finance", "/cms"] as const;

const MODULE_ROOTS: Record<Exclude<WorkspaceModuleId, "site">, string> = {
  admin: "/admin",
  operations: "/operations",
  finance: "/finance",
  cms: "/cms",
};

const isModulePathActive = (pathname: string | null, root: string) => {
  if (!pathname) {
    return false;
  }

  return pathname === root || pathname.startsWith(`${root}/`);
};

const isSiteActive = (pathname: string | null) => {
  if (!pathname) {
    return false;
  }

  return !STAFF_ROOTS.some((root) => isModulePathActive(pathname, root));
};

const isAdminFinancePath = (pathname: string | null) => {
  if (!pathname) {
    return false;
  }

  return (
    pathname === "/admin/finance" || pathname.startsWith("/admin/finance/")
  );
};

export function mapAdminFinancePathToFinance(pathname: string | null): string {
  if (!pathname) {
    return "/finance";
  }

  if (pathname === "/admin/finance") {
    return "/finance";
  }

  if (pathname.startsWith("/admin/finance/")) {
    return `/finance${pathname.slice("/admin/finance".length)}`;
  }

  return "/finance";
}

export function buildModuleTabs(args: {
  pathname: string | null;
  access: WorkspaceAccessFlags;
}): ModuleTab[] {
  const { pathname, access } = args;
  const financeHref = pathname?.startsWith("/admin/finance")
    ? mapAdminFinancePathToFinance(pathname)
    : "/finance";

  const tabs: ModuleTab[] = [
    {
      id: "admin",
      label: "Admin",
      href: MODULE_ROOTS.admin,
      active:
        isModulePathActive(pathname, MODULE_ROOTS.admin) &&
        !isAdminFinancePath(pathname),
      visible: access.admin,
    },
    {
      id: "operations",
      label: "Operations",
      href: MODULE_ROOTS.operations,
      active: isModulePathActive(pathname, MODULE_ROOTS.operations),
      visible: access.operations,
    },
    {
      id: "finance",
      label: "Finance",
      href: financeHref,
      active:
        isModulePathActive(pathname, MODULE_ROOTS.finance) ||
        isAdminFinancePath(pathname),
      visible: access.finance,
    },
    {
      id: "cms",
      label: "CMS",
      href: MODULE_ROOTS.cms,
      active: isModulePathActive(pathname, MODULE_ROOTS.cms),
      visible: access.cms,
    },
    {
      id: "site",
      label: "Site",
      href: "/",
      active: isSiteActive(pathname),
      visible: true,
      external: true,
    },
  ];

  return tabs;
}
