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
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { WorkspaceModuleTopBar } from "@/components/workspaces/WorkspaceModuleTopBar";
import { supabase } from "@/integrations/supabase/client";
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
];

export default function CmsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [resolvedPermissions, setResolvedPermissions] = useState<string[]>([]);

  useEffect(() => {
    const check = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth");
        return;
      }
      const { data: permissions, error } = await supabase.rpc(
        "current_user_permissions",
      );
      if (error) {
        console.error("Failed to resolve CMS permissions", error);
        setResolvedPermissions([]);
        setAuthorized(false);
        return;
      }
      const normalizedPermissions = Array.isArray(permissions)
        ? permissions
        : [];
      setResolvedPermissions(normalizedPermissions);
      setAuthorized(hasCmsWorkspaceAccess(normalizedPermissions));
    };
    check();
  }, [router]);

  const operationsEntitlements = useMemo(
    () => createEntitlementContext({ permissions: resolvedPermissions }),
    [resolvedPermissions],
  );
  const hasOperationsAccess =
    hasOperationsEntry(operationsEntitlements) ||
    hasAnyOperationsSection(operationsEntitlements);
  const moduleTabs = useMemo(
    () =>
      buildModuleTabs({
        pathname,
        access: {
          admin: hasAdminWorkspaceAccess({ permissions: resolvedPermissions }),
          operations: hasOperationsAccess,
          finance: hasFinanceWorkspaceAccess(resolvedPermissions),
          cms: hasCmsWorkspaceAccess(resolvedPermissions),
        },
      }),
    [hasOperationsAccess, pathname, resolvedPermissions],
  );

  if (authorized === null) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Loading CMS…</CardTitle>
          </CardHeader>
          <CardContent>Checking your permissions.</CardContent>
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
          <CardContent>
            You need CMS permissions to access this workspace.
            <div className="mt-4">
              <Button asChild>
                <Link href="/">Go home</Link>
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
            {NAV_ITEMS.map((item) => {
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
