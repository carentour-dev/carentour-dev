"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { WorkspaceModuleTopBar } from "@/components/workspaces/WorkspaceModuleTopBar";
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
import { buildModuleTabs, type ModuleTab } from "@/lib/workspaces/module-nav";
import {
  BarChart3,
  BookOpen,
  Calculator,
  CheckCheck,
  CircleDollarSign,
  LayoutDashboard,
  Loader2,
  LogOut,
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

export function FinanceShell({ children }: FinanceShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const [initialAccessResolved, setInitialAccessResolved] = useState(false);
  const permissions = useMemo(
    () => profile?.permissions ?? [],
    [profile?.permissions],
  );
  const financeCapabilities = useMemo(
    () => resolveFinanceCapabilities(permissions, profile?.roles),
    [permissions, profile?.roles],
  );

  const isLoading = authLoading || profileLoading;

  useEffect(() => {
    if (!isLoading) {
      setInitialAccessResolved(true);
    }
  }, [isLoading]);

  useEffect(() => {
    if (initialAccessResolved && !authLoading && !user) {
      router.replace("/auth");
    }
  }, [initialAccessResolved, authLoading, router, user]);

  const roles = profile?.roles ?? [];
  const hasAdminAccess = hasAdminWorkspaceAccess({ permissions, roles });
  const operationsEntitlements = useMemo(
    () =>
      profile
        ? createEntitlementContext({
            permissions: profile.permissions,
            roles: profile.roles,
          })
        : createEntitlementContext(),
    [profile],
  );
  const hasOperationsAccess =
    hasOperationsEntry(operationsEntitlements) ||
    hasAnyOperationsSection(operationsEntitlements);
  const hasFinanceAccess = hasFinanceWorkspaceAccess(permissions, roles);
  const hasCmsAccess = hasCmsWorkspaceAccess(permissions);
  const visibleFinanceNavItems = useMemo(
    () =>
      FINANCE_NAV_ITEMS.filter((item) =>
        item.isVisible ? item.isVisible(financeCapabilities) : true,
      ),
    [financeCapabilities],
  );
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

  const handleSignOut = async () => {
    await signOut();
    router.replace("/auth");
  };

  if (!initialAccessResolved) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Loading finance workspace…
        </p>
      </div>
    );
  }

  if (!authLoading && !user) {
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
    <>
      <SidebarProvider>
        <Sidebar
          collapsible="icon"
          className="bg-sidebar text-sidebar-foreground print:hidden"
        >
          <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
            <FinanceBranding />
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Finance</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleFinanceNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/finance" &&
                        pathname?.startsWith(`${item.href}/`));

                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.label}
                        >
                          <Link href={item.href}>
                            <Icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t border-sidebar-border">
            <div className="flex items-center gap-3 rounded-md bg-sidebar-accent/30 px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Users className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {profile?.displayName ?? "Team member"}
                </span>
                <div className="flex flex-wrap gap-1">
                  {(profile?.roles ?? ["user"]).map((role) => (
                    <Badge
                      key={role}
                      variant="outline"
                      className="w-fit text-xs capitalize"
                    >
                      {role.replace(/[-_]/g, " ")}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex min-h-screen flex-1 flex-col bg-background">
          <FinanceTopbar tabs={moduleTabs} hasAdminAccess={hasAdminAccess} />
          <main className="flex-1 overflow-y-auto px-6 pb-10 pt-6 lg:px-10">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </SidebarInset>
      </SidebarProvider>

      {isLoading ? (
        <div className="pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background/60 backdrop-blur-sm">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Refreshing finance access…
          </p>
        </div>
      ) : null}
    </>
  );
}

function FinanceTopbar({
  tabs,
  hasAdminAccess,
}: {
  tabs: ModuleTab[];
  hasAdminAccess: boolean;
}) {
  return (
    <WorkspaceModuleTopBar
      tabs={tabs}
      title="Finance Workspace"
      subtitle="Invoice lifecycle, payments, and receivables."
      leftSlot={<SidebarTrigger className="-ml-1 lg:hidden" />}
      rightSlot={
        <>
          {hasAdminAccess ? (
            <Button asChild size="sm" variant="outline">
              <Link href="/admin/finance">Admin Finance View</Link>
            </Button>
          ) : null}
          <ThemeToggle />
        </>
      }
    />
  );
}

function FinanceBranding() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const logoSrc =
    mounted && resolvedTheme === "dark"
      ? "/carentour-logo-light-alt.png"
      : "/carentour-logo-dark-alt.png";

  return (
    <div className="flex items-center gap-3 px-1">
      <Image
        src={logoSrc}
        alt="Care N Tour"
        width={600}
        height={400}
        className="h-10 w-auto object-contain"
        priority
      />
      <div className="flex flex-col">
        <span className="text-xs font-medium uppercase tracking-tight text-muted-foreground">
          Staff workspace
        </span>
        <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
          <CircleDollarSign className="h-4 w-4 text-primary" />
          Finance
        </span>
      </div>
    </div>
  );
}
