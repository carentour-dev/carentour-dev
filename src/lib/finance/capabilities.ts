const normalizePermissionSlugs = (
  permissions: string[] | null | undefined,
): string[] =>
  Array.isArray(permissions)
    ? permissions
        .map((permission) =>
          typeof permission === "string" ? permission.trim().toLowerCase() : "",
        )
        .filter((permission) => permission.length > 0)
    : [];

const normalizeRoleSlugs = (roles: string[] | null | undefined): string[] =>
  Array.isArray(roles)
    ? roles
        .map((role) =>
          typeof role === "string" ? role.trim().toLowerCase() : "",
        )
        .filter((role) => role.length > 0)
    : [];

const hasFinanceWorkspacePermission = (permissions: string[]) =>
  permissions.includes("finance.access") ||
  permissions.some((permission) => permission.startsWith("finance."));

export type FinanceCapabilities = {
  isAdmin: boolean;
  hasFinanceWorkspaceAccess: boolean;
  hasSharedFinanceData: boolean;
  canManageOrders: boolean;
  canManageInvoices: boolean;
  canRecordPayments: boolean;
  canManagePayables: boolean;
  canManageCounterparties: boolean;
  canViewCounterparties: boolean;
  canViewReports: boolean;
  canViewApprovalsQueue: boolean;
  canDecideApprovals: boolean;
  canManageSettings: boolean;
  canRunCounterpartySync: boolean;
  canRunLedgerBackfill: boolean;
  canViewJournalEntries: boolean;
  canAccessQuotationData: boolean;
  canConvertQuotes: boolean;
  canViewApprovalsConsole: boolean;
  canViewSettingsConsole: boolean;
};

export function resolveFinanceCapabilities(
  permissions: string[] | null | undefined,
  roles: string[] | null | undefined = [],
): FinanceCapabilities {
  const normalized = normalizePermissionSlugs(permissions);
  const normalizedRoles = normalizeRoleSlugs(roles);
  const permissionSet = new Set(normalized);

  const isAdmin =
    permissionSet.has("admin.access") || normalizedRoles.includes("admin");
  const hasPermission = (permission: string) =>
    isAdmin || permissionSet.has(permission);

  const hasFinanceWorkspaceAccess =
    isAdmin || hasFinanceWorkspacePermission(normalized);
  const hasSharedFinanceData = isAdmin || hasPermission("finance.shared");
  const hasFinanceBaseAccess =
    isAdmin ||
    (hasPermission("finance.access") && hasPermission("finance.shared"));

  const canManageOrders =
    hasFinanceBaseAccess && hasPermission("finance.orders");
  const canManageInvoices =
    hasFinanceBaseAccess && hasPermission("finance.invoices");
  const canRecordPayments =
    hasFinanceBaseAccess && hasPermission("finance.payments");
  const canManagePayables =
    hasFinanceBaseAccess && hasPermission("finance.payables");
  const canManageCounterparties =
    hasFinanceBaseAccess && hasPermission("finance.counterparties");
  const canViewCounterparties =
    hasFinanceBaseAccess && (canManagePayables || canManageCounterparties);
  const canViewReports =
    hasFinanceBaseAccess && hasPermission("finance.reports");
  const canDecideApprovals =
    hasFinanceBaseAccess && hasPermission("finance.approvals");
  const canViewApprovalsQueue =
    hasFinanceBaseAccess && (canManagePayables || canDecideApprovals);
  const canManageSettings =
    hasFinanceBaseAccess && hasPermission("finance.settings");
  const canRunCounterpartySync =
    hasFinanceBaseAccess && (canManageCounterparties || canManageSettings);
  const canRunLedgerBackfill =
    hasFinanceBaseAccess && (canManageSettings || canDecideApprovals);
  const canViewJournalEntries = canViewReports;
  const canAccessQuotationData =
    hasFinanceBaseAccess && (canManageOrders || canManageInvoices);
  const canConvertQuotes =
    hasFinanceBaseAccess && canManageOrders && canManageInvoices;

  return {
    isAdmin,
    hasFinanceWorkspaceAccess,
    hasSharedFinanceData,
    canManageOrders,
    canManageInvoices,
    canRecordPayments,
    canManagePayables,
    canManageCounterparties,
    canViewCounterparties,
    canViewReports,
    canViewApprovalsQueue,
    canDecideApprovals,
    canManageSettings,
    canRunCounterpartySync,
    canRunLedgerBackfill,
    canViewJournalEntries,
    canAccessQuotationData,
    canConvertQuotes,
    canViewApprovalsConsole: canViewApprovalsQueue,
    canViewSettingsConsole:
      canManageSettings || canRunCounterpartySync || canRunLedgerBackfill,
  };
}
