"use client";

import { ReactNode, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  createEntitlementContext,
  hasOperationsEntry,
} from "@/lib/operations/entitlements";
import { hasAnyOperationsSection } from "@/lib/operations/sections";
import {
  hasAdminWorkspaceAccess,
  hasCmsWorkspaceAccess,
  hasFinanceWorkspaceAccess,
} from "@/lib/workspaces/access-policies";
import {
  resolveFinanceCapabilities,
  type FinanceCapabilities,
} from "@/lib/finance/capabilities";
import { buildModuleTabs } from "@/lib/workspaces/module-nav";
import {
  InternalWorkspaceShell,
  type InternalWorkspaceShellNavSection,
} from "@/components/workspaces/InternalWorkspaceShell";
import {
  BarChart3,
  BookOpen,
  Calculator,
  CheckCheck,
  CircleDollarSign,
  LayoutDashboard,
  Loader2,
  SlidersHorizontal,
  Users,
  Wallet,
} from "lucide-react";

type FinanceShellProps = {
  children: ReactNode;
};

type FinanceNavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  isVisible?: (capabilities: FinanceCapabilities) => boolean;
};

const FINANCE_NAV_ITEMS: FinanceNavItem[] = [
  { label: "Workspace", href: "/finance", icon: LayoutDashboard },
  {
    label: "Quotation Calculator",
    href: "/finance/quotation-calculator",
    icon: Calculator,
    isVisible: (capabilities) => capabilities.canAccessQuotationData,
  },
  {
    label: "Counterparties",
    href: "/finance/counterparties",
    icon: Users,
    isVisible: (capabilities) => capabilities.canViewCounterparties,
  },
  {
    label: "Payables",
    href: "/finance/payables",
    icon: Wallet,
    isVisible: (capabilities) => capabilities.canManagePayables,
  },
  {
    label: "Approvals",
    href: "/finance/approvals",
    icon: CheckCheck,
    isVisible: (capabilities) => capabilities.canViewApprovalsConsole,
  },
  {
    label: "Settings",
    href: "/finance/settings",
    icon: SlidersHorizontal,
    isVisible: (capabilities) => capabilities.canViewSettingsConsole,
  },
  {
    label: "Journals",
    href: "/finance/ledger/journals",
    icon: BookOpen,
    isVisible: (capabilities) => capabilities.canViewJournalEntries,
  },
  {
    label: "AP Aging",
    href: "/finance/reports/ap-aging",
    icon: CircleDollarSign,
    isVisible: (capabilities) => capabilities.canViewReports,
  },
  {
    label: "AR Aging",
    href: "/finance/reports/ar-aging",
    icon: CircleDollarSign,
    isVisible: (capabilities) => capabilities.canViewReports,
  },
  {
    label: "Trial Balance",
    href: "/finance/reports/trial-balance",
    icon: BarChart3,
    isVisible: (capabilities) => capabilities.canViewReports,
  },
  {
    label: "Profit & Loss",
    href: "/finance/reports/profit-loss",
    icon: BarChart3,
    isVisible: (capabilities) => capabilities.canViewReports,
  },
  {
    label: "Balance Sheet",
    href: "/finance/reports/balance-sheet",
    icon: BarChart3,
    isVisible: (capabilities) => capabilities.canViewReports,
  },
];

const FINANCE_NAV_SECTIONS: Array<{
  label: string;
  items: FinanceNavItem[];
}> = [
  {
    label: "Workspace",
    items: FINANCE_NAV_ITEMS.slice(0, 6),
  },
  {
    label: "Ledger & Reports",
    items: FINANCE_NAV_ITEMS.slice(6),
  },
];

export function FinanceShell({ children }: FinanceShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading, signOut, workspaceAccess } = useAuth();
  const { profile } = useUserProfile();
  const permissions = useMemo(
    () =>
      workspaceAccess.userId === user?.id
        ? workspaceAccess.permissions
        : (profile?.permissions ?? []),
    [
      profile?.permissions,
      user?.id,
      workspaceAccess.permissions,
      workspaceAccess.userId,
    ],
  );
  const roles = useMemo(
    () =>
      workspaceAccess.userId === user?.id
        ? workspaceAccess.roles
        : (profile?.roles ?? []),
    [profile?.roles, user?.id, workspaceAccess.roles, workspaceAccess.userId],
  );
  const financeCapabilities = useMemo(
    () => resolveFinanceCapabilities(permissions, roles),
    [permissions, roles],
  );

  const isLoading =
    authLoading ||
    (Boolean(user) &&
      (workspaceAccess.userId !== user.id ||
        workspaceAccess.loading ||
        !workspaceAccess.resolved));

  const hasAdminAccess = hasAdminWorkspaceAccess({ permissions, roles });
  const operationsEntitlements = useMemo(
    () =>
      createEntitlementContext({
        permissions,
        roles,
      }),
    [permissions, roles],
  );
  const hasOperationsAccess =
    hasOperationsEntry(operationsEntitlements) ||
    hasAnyOperationsSection(operationsEntitlements);
  const hasFinanceAccess = hasFinanceWorkspaceAccess(permissions, roles);
  const hasCmsAccess = hasCmsWorkspaceAccess(permissions, roles);
  const moduleTabs = useMemo(
    () =>
      buildModuleTabs({
        pathname,
        access: {
          admin: hasAdminAccess,
          operations: hasOperationsAccess,
          finance: hasFinanceAccess,
          cms: hasCmsAccess,
        },
      }),
    [
      hasAdminAccess,
      hasCmsAccess,
      hasFinanceAccess,
      hasOperationsAccess,
      pathname,
    ],
  );
  const shellNavSections = useMemo<InternalWorkspaceShellNavSection[]>(
    () =>
      FINANCE_NAV_SECTIONS.map((section) => ({
        label: section.label,
        items: section.items
          .filter((item) =>
            item.isVisible ? item.isVisible(financeCapabilities) : true,
          )
          .map((item) => ({
            label: item.label,
            href: item.href,
            icon: item.icon,
            active:
              pathname === item.href ||
              (item.href !== "/finance" &&
                Boolean(pathname?.startsWith(`${item.href}/`))),
          })),
      })).filter((section) => section.items.length > 0),
    [financeCapabilities, pathname],
  );

  const handleSignOut = async () => {
    await signOut();
    router.replace("/auth");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Session required
          </h2>
          <p className="text-sm text-muted-foreground">
            Your session has ended. Please sign in again to continue.
          </p>
        </div>
        <Button onClick={() => router.replace("/auth")}>Go to sign in</Button>
      </div>
    );
  }

  if (!hasFinanceAccess && !isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Finance access required
          </h2>
          <p className="text-sm text-muted-foreground">
            Your account does not currently include finance workspace
            permissions.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => router.replace("/dashboard")}>
            Go to dashboard
          </Button>
          <Button variant="outline" onClick={() => router.replace("/contact")}>
            Contact support
          </Button>
        </div>
      </div>
    );
  }

  return (
    <InternalWorkspaceShell
      branding={{
        title: "Care N Tour",
        subtitle: "Finance Workspace",
        lightLogoSrc: "/carentour-logo-dark-alt.png",
        darkLogoSrc: "/carentour-logo-light-alt.png",
        logoAlt: "Care N Tour logo",
      }}
      navSections={shellNavSections}
      moduleTabs={moduleTabs}
      headerTitle="Finance Workspace"
      headerSubtitle="Invoice lifecycle, payables, journals, and reporting."
      headerActions={
        <>
          {hasAdminAccess ? (
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/finance">Admin Finance View</Link>
            </Button>
          ) : null}
          <ThemeToggle variant="workspace" />
        </>
      }
      profile={{
        displayName: profile?.displayName ?? user.email ?? "Team member",
        roles,
        icon: CircleDollarSign,
      }}
      onSignOut={handleSignOut}
      loading={false}
      loadingMessage={null}
      contentWidth="dashboard"
      contentClassName="max-w-[1520px]"
    >
      {children}
    </InternalWorkspaceShell>
  );
}
