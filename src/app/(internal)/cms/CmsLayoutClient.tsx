"use client";

import Link from "next/link";
import { ReactNode, useEffect, useMemo, useState } from "react";
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
import { metadataIndicatesStaffAccount, useAuth } from "@/contexts/AuthContext";
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

const CMS_FALLBACK_ROLE_SLUGS = new Set([
  "admin",
  "editor",
  "cms",
  "content",
  "content_manager",
  "content-editor",
]);

const isCmsNavItemActive = (itemHref: string, pathname: string | null) => {
  if (!pathname) {
    return false;
  }

  if (itemHref === "/cms") {
    return pathname === "/cms";
  }

  return pathname === itemHref || pathname.startsWith(`${itemHref}/`);
};

const collectRoleCandidates = (value: unknown, bucket: Set<string>) => {
  if (value === null || value === undefined) {
    return;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }

    if (trimmed.includes(",")) {
      trimmed
        .split(",")
        .map((segment) => segment.trim().toLowerCase())
        .filter((segment) => segment.length > 0)
        .forEach((segment) => bucket.add(segment));
      return;
    }

    bucket.add(trimmed.toLowerCase());
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry) => collectRoleCandidates(entry, bucket));
    return;
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;

    for (const key of ["value", "role", "slug", "name", "label", "primary"]) {
      if (record[key] !== undefined) {
        collectRoleCandidates(record[key], bucket);
      }
    }

    if (Array.isArray(record.values)) {
      collectRoleCandidates(record.values, bucket);
    }
  }
};

const hasCmsMetadataAccess = (
  user: {
    user_metadata?: Record<string, unknown> | null;
    app_metadata?: Record<string, unknown> | null;
  } | null,
): boolean => {
  if (!user) {
    return false;
  }

  const metadataRecords = [user.user_metadata, user.app_metadata].filter(
    (value): value is Record<string, unknown> =>
      Boolean(value) && typeof value === "object",
  );

  for (const metadata of metadataRecords) {
    const candidates = new Set<string>();

    for (const key of [
      "staff_roles",
      "roles",
      "role",
      "primary_role",
      "primaryRole",
      "primary_role_slug",
    ]) {
      if (metadata[key] !== undefined) {
        collectRoleCandidates(metadata[key], candidates);
      }
    }

    if (
      Array.from(candidates).some((role) => CMS_FALLBACK_ROLE_SLUGS.has(role))
    ) {
      return true;
    }
  }

  return false;
};

export default function CmsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const [resolvingGuardExpired, setResolvingGuardExpired] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth");
    }
  }, [authLoading, router, user]);

  const resolvedPermissions = useMemo(
    () => profile?.permissions ?? [],
    [profile?.permissions],
  );
  const resolvedRoles = useMemo(() => profile?.roles ?? [], [profile?.roles]);
  const hasMetadataCmsAccess = useMemo(
    () => hasCmsMetadataAccess(user),
    [user],
  );
  const hasMetadataStaffAccess = useMemo(
    () =>
      metadataIndicatesStaffAccount(
        ((user?.user_metadata ?? {}) as Record<string, unknown>) ?? {},
      ) ||
      metadataIndicatesStaffAccount(
        ((user?.app_metadata ?? {}) as Record<string, unknown>) ?? {},
      ),
    [user],
  );
  const authorized =
    hasCmsWorkspaceAccess(resolvedPermissions, resolvedRoles) ||
    hasMetadataCmsAccess ||
    hasMetadataStaffAccess;
  const isAwaitingInitialProfileHydration =
    Boolean(user) &&
    !authorized &&
    !profile &&
    resolvedPermissions.length === 0 &&
    resolvedRoles.length === 0;
  const shouldResolveProfileGate =
    !resolvingGuardExpired &&
    !authorized &&
    (profileLoading || isAwaitingInitialProfileHydration);
  const isResolvingAccess = authLoading || shouldResolveProfileGate;

  useEffect(() => {
    if (authLoading || !profileLoading || authorized) {
      setResolvingGuardExpired(false);
      return;
    }

    const guardTimer = window.setTimeout(() => {
      setResolvingGuardExpired(true);
    }, 2000);

    return () => window.clearTimeout(guardTimer);
  }, [authLoading, authorized, pathname, profileLoading, user]);

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
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading CMS workspace…</p>
      </div>
    );
  }

  if (!authLoading && !user) {
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
      loading={profileLoading}
      loadingMessage="Refreshing CMS access..."
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
