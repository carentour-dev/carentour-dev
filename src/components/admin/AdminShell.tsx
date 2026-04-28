"use client";

import { ReactNode, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { buildModuleTabs } from "@/lib/workspaces/module-nav";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  InternalWorkspaceShell,
  type InternalWorkspaceShellNavSection,
} from "@/components/workspaces/InternalWorkspaceShell";
import {
  ActivitySquare,
  Building2,
  CalendarCheck,
  CalendarDays,
  CircleDollarSign,
  Hotel,
  Inbox,
  LayoutDashboard,
  Loader2,
  Plane,
  Sparkles,
  Stethoscope,
  Users,
  UserPlus,
  UserRoundSearch,
  ShieldCheck,
} from "lucide-react";

// Admin navigation configuration keeps sidebar items in one place.
const NAV_ITEMS = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Leads", href: "/admin/leads", icon: UserRoundSearch },
  { label: "Requests", href: "/admin/requests", icon: Inbox },
  { label: "Start Journey", href: "/admin/start-journey", icon: Plane },
  { label: "Consultations", href: "/admin/consultations", icon: CalendarCheck },
  { label: "Appointments", href: "/admin/appointments", icon: CalendarDays },
  { label: "Doctors", href: "/admin/doctors", icon: Stethoscope },
  { label: "Patients", href: "/admin/patients", icon: Users },
  { label: "Treatments", href: "/admin/treatments", icon: ActivitySquare },
  { label: "Finance", href: "/admin/finance", icon: CircleDollarSign },
  { label: "Testimonials", href: "/admin/testimonials", icon: Sparkles },
  {
    label: "Service Providers",
    href: "/admin/service-providers",
    icon: Building2,
  },
  { label: "Hotels", href: "/admin/hotels", icon: Hotel },
  { label: "Team Accounts", href: "/admin/accounts", icon: UserPlus },
  { label: "Access", href: "/admin/access", icon: ShieldCheck },
];

const NAV_SECTIONS: Array<{
  label: string;
  items: typeof NAV_ITEMS;
}> = [
  {
    label: "Core",
    items: NAV_ITEMS.slice(0, 7),
  },
  {
    label: "Catalog",
    items: NAV_ITEMS.slice(7, 13),
  },
  {
    label: "Access",
    items: NAV_ITEMS.slice(13),
  },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut, loading: authLoading, workspaceAccess } = useAuth();
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
  const isCheckingAccess =
    authLoading ||
    (Boolean(user) &&
      (workspaceAccess.userId !== user.id ||
        workspaceAccess.loading ||
        !workspaceAccess.resolved));
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
  const hasAdminAccess = hasAdminWorkspaceAccess({ permissions, roles });
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
  const navSections = useMemo<InternalWorkspaceShellNavSection[]>(
    () =>
      NAV_SECTIONS.map((section) => ({
        label: section.label,
        items: section.items.map((item) => ({
          ...item,
          active:
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href)),
        })),
      })),
    [pathname],
  );
  const activeNavItem = useMemo(
    () =>
      NAV_ITEMS.find(
        (item) =>
          pathname === item.href ||
          (item.href !== "/admin" && pathname.startsWith(item.href)),
      ),
    [pathname],
  );

  // Reuse existing auth provider to fully sign out admins.
  const handleSignOut = async () => {
    await signOut();
    router.replace("/auth");
  };

  if (isCheckingAccess) {
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

  if (hasAdminAccess === false) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Admin access required
          </h2>
          <p className="text-sm text-muted-foreground">
            You&apos;re signed in, but your account doesn&apos;t have admin
            privileges.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {hasFinanceAccess ? (
            <Button onClick={() => router.replace("/finance")}>
              Open finance workspace
            </Button>
          ) : null}
          <Button
            variant={hasFinanceAccess ? "outline" : "default"}
            onClick={() => router.replace("/dashboard")}
          >
            Return to dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <InternalWorkspaceShell
      branding={{
        title: "Care N Tour",
        subtitle: "Admin Console",
        lightLogoSrc: "/carentour-logo-dark-alt.png",
        darkLogoSrc: "/carentour-logo-light-alt.png",
        logoAlt: "Care N Tour logo",
      }}
      navSections={navSections}
      moduleTabs={moduleTabs}
      headerTitle={activeNavItem?.label ?? "Admin"}
      headerSubtitle="Admin Console"
      headerActions={<ThemeToggle variant="workspace" />}
      profile={{
        displayName: profile?.displayName ?? user.email ?? "Admin",
        roles,
        icon: Users,
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
