"use client";

import Link from "next/link";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
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
import { WorkspaceModuleTopBar } from "@/components/workspaces/WorkspaceModuleTopBar";
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
  { href: "/cms/blog", label: "Blog", icon: FileText, badge: "Blog" },
  { href: "/cms/media", label: "Media Library", icon: PanelsTopLeft },
  { href: "/cms/navigation", label: "Navigation Links", icon: Link2 },
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
  const { user, loading: authLoading } = useAuth();
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
    <div className="min-h-screen bg-background">
      <WorkspaceModuleTopBar
        tabs={moduleTabs}
        title="CMS Workspace"
        subtitle="Manage pages, media, blog content, and navigation."
        rightSlot={
          <>
            <ThemeToggle />
            <Button asChild size="sm">
              <Link href="/cms/new">New Page</Link>
            </Button>
          </>
        }
      />
      <div className="border-b border-border/70 bg-card/40">
        <div className="container mx-auto px-4">
          <nav className="flex flex-wrap items-center gap-2 overflow-x-auto py-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-full border border-transparent px-4 py-2 text-sm font-medium transition",
                    isActive
                      ? "bg-primary/15 text-primary border-primary/30"
                      : "text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="flex flex-col gap-3 pb-4 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between md:text-sm">
            <div>
              <p className="font-medium text-foreground">Need help?</p>
              <p className="max-w-2xl">
                Preview changes, manage navigation, and publish pages directly
                from the CMS.
              </p>
            </div>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="self-start md:self-auto"
            >
              <Link href="/cms/navigation">Manage navigation</Link>
            </Button>
          </div>
        </div>
      </div>
      <main
        className={cn(
          "py-8",
          pathname?.startsWith("/cms/preview")
            ? "px-0"
            : "container mx-auto px-4",
        )}
      >
        {children}
      </main>
    </div>
  );
}
