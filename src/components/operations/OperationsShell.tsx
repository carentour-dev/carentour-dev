"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  createEntitlementContext,
  hasOperationsEntry,
} from "@/lib/operations/entitlements";
import {
  getAccessibleOperationsSections,
  hasAnyOperationsSection,
} from "@/lib/operations/sections";
import {
  hasAdminWorkspaceAccess,
  hasCmsWorkspaceAccess,
  hasFinanceWorkspaceAccess,
} from "@/lib/workspaces/access-policies";
import { buildModuleTabs } from "@/lib/workspaces/module-nav";
import {
  InternalWorkspaceShell,
  type InternalWorkspaceShellNavSection,
} from "@/components/workspaces/InternalWorkspaceShell";
import { Loader2, Users } from "lucide-react";

type OperationsShellProps = {
  children: ReactNode;
};

export function OperationsShell({ children }: OperationsShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const [initialAccessResolved, setInitialAccessResolved] = useState(false);

  const entitlements = useMemo(
    () =>
      profile
        ? createEntitlementContext({
            permissions: profile.permissions,
            roles: profile.roles,
          })
        : createEntitlementContext(),
    [profile],
  );

  const navSections = useMemo(
    () => getAccessibleOperationsSections(entitlements),
    [entitlements],
  );

  const assignedSections = hasAnyOperationsSection(entitlements);
  const baseAccess = hasOperationsEntry(entitlements);
  const isAuthorized = baseAccess || assignedSections;
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
          operations: isAuthorized,
          finance: hasFinanceAccess,
          cms: hasCmsAccess,
        },
      }),
    [hasAdminAccess, hasCmsAccess, hasFinanceAccess, isAuthorized, pathname],
  );
  const shellNavSections = useMemo<InternalWorkspaceShellNavSection[]>(
    () => [
      {
        label: "Operations",
        items: navSections.map((section) => ({
          label: section.label,
          href: section.href,
          icon: section.icon,
          active:
            pathname === section.href ||
            (section.href !== "/operations" &&
              Boolean(pathname?.startsWith(section.href))),
        })),
      },
    ],
    [navSections, pathname],
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
  }, [authLoading, initialAccessResolved, router, user]);

  const handleSignOut = async () => {
    await signOut();
    router.replace("/auth");
  };

  if (!initialAccessResolved) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Loading operations workspace…
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

  if (!isAuthorized && !isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Operations access required
          </h2>
          <p className="text-sm text-muted-foreground">
            You&apos;re signed in, but your account doesn&apos;t have access to
            the Operations tools.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => router.replace("/dashboard")}>
            Go to patient dashboard
          </Button>
          <Button
            variant="outline"
            onClick={() => router.replace("/auth/support")}
          >
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
        subtitle: "Operations Workspace",
        lightLogoSrc: "/carentour-logo-dark-alt.png",
        darkLogoSrc: "/carentour-logo-light-alt.png",
        logoAlt: "Care N Tour logo",
      }}
      navSections={shellNavSections}
      moduleTabs={moduleTabs}
      headerTitle="Operations Workspace"
      headerSubtitle="Role-aware queues and casework for Care N Tour staff."
      headerActions={<ThemeToggle variant="workspace" />}
      profile={{
        displayName: profile?.displayName ?? "Team member",
        roles: profile?.roles ?? [],
        icon: Users,
      }}
      onSignOut={handleSignOut}
      loading={isLoading}
      loadingMessage="Refreshing operations access..."
      contentWidth="dashboard"
      contentClassName="max-w-[1520px] print:max-w-none"
      mainClassName="print:px-0 print:pb-0 print:pt-0"
    >
      {children}
    </InternalWorkspaceShell>
  );
}
