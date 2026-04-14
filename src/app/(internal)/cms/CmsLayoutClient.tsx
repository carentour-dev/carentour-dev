"use client";

import Link from "next/link";
import { ReactNode, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  CircleHelp,
  LayoutDashboard,
  FilePlus,
  Link2,
  PanelsTopLeft,
  FileText,
  Loader2,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  InternalWorkspaceShell,
  type InternalWorkspaceShellNavSection,
} from "@/components/workspaces/InternalWorkspaceShell";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  createEntitlementContext,
  hasOperationsEntry,
} from "@/lib/operations/entitlements";
import { hasAnyOperationsSection } from "@/lib/operations/sections";
import { cn } from "@/lib/utils";
import {
  hasAdminWorkspaceAccess,
  hasCmsWorkspaceAccess,
  hasFinanceWorkspaceAccess,
} from "@/lib/workspaces/access-policies";
import { buildModuleTabs } from "@/lib/workspaces/module-nav";

const NAV_ITEMS = [
  { href: "/cms", label: "Overview", icon: LayoutDashboard },
  { href: "/cms/new", label: "New Page", icon: FilePlus },
  { href: "/cms/blog", label: "Blog", icon: FileText },
  { href: "/cms/media", label: "Media Library", icon: PanelsTopLeft },
  { href: "/cms/navigation", label: "Navigation Links", icon: Link2 },
  { href: "/cms/faqs", label: "FAQs", icon: CircleHelp },
  { href: "/cms/seo", label: "SEO", icon: Search },
];

const isCmsNavItemActive = (itemHref: string, pathname: string | null) => {
  if (!pathname) {
    return false;
  }

  if (itemHref === "/cms") {
    return pathname === "/cms";
  }

  return pathname === itemHref || pathname.startsWith(`${itemHref}/`);
};

export default function CmsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading, signOut, workspaceAccess } = useAuth();
  const { profile } = useUserProfile();

  const resolvedPermissions = useMemo(
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
  const resolvedRoles = useMemo(
    () =>
      workspaceAccess.userId === user?.id
        ? workspaceAccess.roles
        : (profile?.roles ?? []),
    [profile?.roles, user?.id, workspaceAccess.roles, workspaceAccess.userId],
  );
  const authorized = hasCmsWorkspaceAccess(resolvedPermissions, resolvedRoles);
  const isResolvingAccess =
    authLoading ||
    (Boolean(user) &&
      (workspaceAccess.userId !== user.id ||
        workspaceAccess.loading ||
        !workspaceAccess.resolved));

  const operationsEntitlements = useMemo(
    () =>
      createEntitlementContext({
        permissions: resolvedPermissions,
        roles: resolvedRoles,
      }),
    [resolvedPermissions, resolvedRoles],
  );
  const hasOperationsAccess =
    hasOperationsEntry(operationsEntitlements) ||
    hasAnyOperationsSection(operationsEntitlements);
  const hasAdminAccess = hasAdminWorkspaceAccess({
    permissions: resolvedPermissions,
    roles: resolvedRoles,
  });
  const hasFinanceAccess = hasFinanceWorkspaceAccess(
    resolvedPermissions,
    resolvedRoles,
  );
  const canViewSeoWorkspace = useMemo(() => {
    const normalizedPermissions = new Set(
      resolvedPermissions.map((permission) => permission.trim().toLowerCase()),
    );

    return (
      hasAdminAccess ||
      normalizedPermissions.has("cms.read") ||
      normalizedPermissions.has("cms.write")
    );
  }, [hasAdminAccess, resolvedPermissions]);
  const navItems = useMemo(
    () =>
      NAV_ITEMS.filter((item) =>
        item.href === "/cms/seo" ? canViewSeoWorkspace : true,
      ),
    [canViewSeoWorkspace],
  );
  const shellNavSections = useMemo<InternalWorkspaceShellNavSection[]>(
    () =>
      [
        {
          label: "Publishing",
          items: navItems.slice(0, 3),
        },
        {
          label: "Structure",
          items: navItems.slice(3),
        },
      ]
        .map((section) => ({
          label: section.label,
          items: section.items.map((item) => ({
            ...item,
            active: isCmsNavItemActive(item.href, pathname),
          })),
        }))
        .filter((section) => section.items.length > 0),
    [navItems, pathname],
  );
  const moduleTabs = useMemo(
    () =>
      buildModuleTabs({
        pathname,
        access: {
          admin: hasAdminAccess,
          operations: hasOperationsAccess,
          finance: hasFinanceAccess,
          cms: hasCmsWorkspaceAccess(resolvedPermissions, resolvedRoles),
        },
      }),
    [
      hasAdminAccess,
      hasFinanceAccess,
      hasOperationsAccess,
      pathname,
      resolvedPermissions,
      resolvedRoles,
    ],
  );
  const isPreviewRoute = pathname?.startsWith("/cms/preview") ?? false;
  const isEditorRoute =
    pathname?.startsWith("/cms/new") ||
    pathname?.endsWith("/edit") ||
    pathname?.startsWith("/cms/blog/posts/");
  const handleSignOut = async () => {
    await signOut();
    router.replace("/auth");
  };

  if (isResolvingAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Session required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Your session has ended. Please sign in again to continue.</p>
            <Button asChild>
              <Link href="/auth">Go to sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Access denied</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>You need CMS permissions to access this workspace.</p>
            <div className="flex flex-wrap gap-3">
              {hasFinanceAccess ? (
                <Button asChild variant="outline">
                  <Link href="/finance">Open finance workspace</Link>
                </Button>
              ) : null}
              <Button asChild>
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <InternalWorkspaceShell
      branding={{
        title: "Care N Tour",
        subtitle: "CMS Workspace",
        lightLogoSrc: "/carentour-logo-dark-alt.png",
        darkLogoSrc: "/carentour-logo-light-alt.png",
        logoAlt: "Care N Tour logo",
      }}
      navSections={shellNavSections}
      moduleTabs={moduleTabs}
      headerTitle="CMS Workspace"
      headerSubtitle="Pages, blog, SEO, media, and navigation in one place."
      headerActions={
        <>
          <ThemeToggle variant="workspace" />
        </>
      }
      profile={{
        displayName: profile?.displayName ?? user?.email ?? "CMS editor",
        roles: resolvedRoles,
        icon: FileText,
      }}
      onSignOut={handleSignOut}
      loading={false}
      loadingMessage={null}
      contentWidth={isPreviewRoute ? "full" : isEditorRoute ? "editor" : "full"}
      contentClassName={cn(
        isPreviewRoute && "max-w-none",
        isEditorRoute && "max-w-[1120px]",
        !isPreviewRoute && !isEditorRoute && "max-w-[1680px]",
      )}
      mainClassName={cn(
        isPreviewRoute
          ? "px-0 pb-0 pt-0 sm:px-0 lg:px-0"
          : "pb-8 pt-7 lg:pb-10 lg:pt-8",
      )}
    >
      {children}
    </InternalWorkspaceShell>
  );
}
