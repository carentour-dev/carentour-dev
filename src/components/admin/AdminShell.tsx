"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
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
  ShieldCheck,
} from "lucide-react";

// Admin navigation configuration keeps sidebar items in one place.
const NAV_ITEMS = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
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
    items: NAV_ITEMS.slice(0, 6),
  },
  {
    label: "Catalog",
    items: NAV_ITEMS.slice(6, 12),
  },
  {
    label: "Access",
    items: NAV_ITEMS.slice(12),
  },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();

  const isCheckingAccess = authLoading || profileLoading;
  const [initialAccessResolved, setInitialAccessResolved] = useState(false);
  useEffect(() => {
    if (!isCheckingAccess) {
      setInitialAccessResolved(true);
    }
  }, [isCheckingAccess]);
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
  const permissions = profile?.permissions ?? [];
  const roles = profile?.roles ?? [];
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

  if (!initialAccessResolved) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Checking admin access…</p>
      </div>
    );
  }

  if (initialAccessResolved && !authLoading && !user) {
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

  if (initialAccessResolved && !profileLoading && hasAdminAccess === false) {
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
        displayName: profile?.displayName ?? "Admin",
        roles: profile?.roles ?? [],
        icon: Users,
      }}
      onSignOut={handleSignOut}
      loading={isCheckingAccess}
      loadingMessage="Refreshing admin access..."
      contentWidth="dashboard"
      contentClassName="max-w-[1520px]"
    >
      {children}
    </InternalWorkspaceShell>
  );
}
