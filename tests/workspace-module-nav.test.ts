import assert from "node:assert/strict";

import {
  buildModuleTabs,
  mapAdminFinancePathToFinance,
} from "../src/lib/workspaces/module-nav.ts";
import {
  hasAdminWorkspaceAccess,
  hasCmsWorkspaceAccess,
  hasFinanceWorkspaceAccess,
  hasOperationsWorkspaceAccess,
  resolveAccessibleWorkspaceRoute,
} from "../src/lib/workspaces/access-policies.ts";

const tabById = (
  tabs: ReturnType<typeof buildModuleTabs>,
  id: "admin" | "operations" | "finance" | "cms" | "site",
) => tabs.find((tab) => tab.id === id);

assert.equal(mapAdminFinancePathToFinance(null), "/finance");
assert.equal(mapAdminFinancePathToFinance("/admin/finance"), "/finance");
assert.equal(
  mapAdminFinancePathToFinance("/admin/finance/payables/abc123"),
  "/finance/payables/abc123",
);
assert.equal(
  mapAdminFinancePathToFinance("/admin/finance/invoices/INV-1"),
  "/finance/invoices/INV-1",
);
assert.equal(mapAdminFinancePathToFinance("/admin"), "/finance");

const adminTabs = buildModuleTabs({
  pathname: "/admin/requests",
  access: { admin: true, operations: true, finance: true, cms: true },
});
assert.equal(tabById(adminTabs, "admin")?.active, true);
assert.equal(tabById(adminTabs, "site")?.active, false);
assert.equal(tabById(adminTabs, "finance")?.href, "/finance");
assert.equal(tabById(adminTabs, "site")?.external, true);

const operationsOnlyTabs = buildModuleTabs({
  pathname: "/operations/tasks",
  access: { admin: false, operations: true, finance: false, cms: false },
});
assert.deepEqual(
  operationsOnlyTabs.filter((tab) => tab.visible).map((tab) => tab.id),
  ["operations", "site"],
);
assert.equal(tabById(operationsOnlyTabs, "operations")?.active, true);
assert.equal(tabById(operationsOnlyTabs, "site")?.active, false);

const cmsOnlyTabs = buildModuleTabs({
  pathname: "/cms/blog",
  access: { admin: false, operations: false, finance: false, cms: true },
});
assert.deepEqual(
  cmsOnlyTabs.filter((tab) => tab.visible).map((tab) => tab.id),
  ["cms", "site"],
);
assert.equal(tabById(cmsOnlyTabs, "cms")?.active, true);

const publicSiteTabs = buildModuleTabs({
  pathname: "/travel-info",
  access: { admin: false, operations: false, finance: false, cms: false },
});
assert.equal(tabById(publicSiteTabs, "site")?.active, true);
assert.equal(tabById(publicSiteTabs, "site")?.visible, true);

const adminFinanceTabs = buildModuleTabs({
  pathname: "/admin/finance/payables/pay-1",
  access: { admin: true, operations: true, finance: true, cms: false },
});
assert.equal(
  tabById(adminFinanceTabs, "finance")?.href,
  "/finance/payables/pay-1",
);
assert.equal(tabById(adminFinanceTabs, "finance")?.active, true);
assert.equal(tabById(adminFinanceTabs, "admin")?.active, false);

assert.equal(hasCmsWorkspaceAccess(["cms.read"]), true);
assert.equal(hasCmsWorkspaceAccess(["nav.manage"]), true);
assert.equal(hasCmsWorkspaceAccess([" CMS.READ "]), true);
assert.equal(
  hasCmsWorkspaceAccess(["cms.read", null] as unknown as string[]),
  true,
);
assert.equal(hasCmsWorkspaceAccess(["admin.access"]), false);
assert.equal(hasCmsWorkspaceAccess([]), false);

assert.equal(hasFinanceWorkspaceAccess(["finance.access"]), true);
assert.equal(hasFinanceWorkspaceAccess(["finance.reports"]), true);
assert.equal(hasFinanceWorkspaceAccess([" FINANCE.REPORTS "]), true);
assert.equal(
  hasFinanceWorkspaceAccess(["finance.reports", null] as unknown as string[]),
  true,
);
assert.equal(hasFinanceWorkspaceAccess(["admin.access"]), true);
assert.equal(hasFinanceWorkspaceAccess(["cms.read"]), false);
assert.equal(hasFinanceWorkspaceAccess([]), false);
assert.equal(hasOperationsWorkspaceAccess(["operations.access"]), true);
assert.equal(hasOperationsWorkspaceAccess([" OPERATIONS.ACCESS "]), true);
assert.equal(
  hasOperationsWorkspaceAccess([
    "operations.access",
    null,
  ] as unknown as string[]),
  true,
);
assert.equal(
  hasOperationsWorkspaceAccess(["operations.shared", "operations.requests"]),
  true,
);
assert.equal(hasOperationsWorkspaceAccess(["operations.requests"]), false);
assert.equal(hasOperationsWorkspaceAccess([]), false);
assert.equal(
  hasAdminWorkspaceAccess({
    permissions: [" ADMIN.ACCESS ", null] as unknown as string[],
    roles: [],
  }),
  true,
);
assert.equal(
  hasAdminWorkspaceAccess({
    permissions: [],
    roles: ["admin"],
  }),
  true,
);
assert.equal(
  hasAdminWorkspaceAccess({
    permissions: [],
    roles: ["employee"],
  }),
  false,
);

assert.equal(
  resolveAccessibleWorkspaceRoute({
    permissions: ["admin.access"],
    roles: [],
  }),
  "/admin",
);
assert.equal(
  resolveAccessibleWorkspaceRoute({
    permissions: ["operations.access", null] as unknown as string[],
    roles: [],
  }),
  "/operations",
);
assert.equal(
  resolveAccessibleWorkspaceRoute({
    permissions: ["finance.reports"],
    roles: [],
  }),
  "/finance",
);
assert.equal(
  resolveAccessibleWorkspaceRoute({
    permissions: ["cms.read"],
    roles: [],
  }),
  "/cms",
);
assert.equal(
  resolveAccessibleWorkspaceRoute({
    permissions: [],
    roles: [],
  }),
  "/dashboard",
);
assert.equal(
  resolveAccessibleWorkspaceRoute({
    permissions: [],
    roles: ["employee"],
  }),
  "/operations",
);
assert.equal(
  resolveAccessibleWorkspaceRoute({
    permissions: [],
    roles: ["EDITOR"],
  }),
  "/cms",
);
assert.equal(
  resolveAccessibleWorkspaceRoute({
    permissions: [],
    roles: ["finance"],
  }),
  "/finance",
);

console.log("workspace module navigation tests passed");
