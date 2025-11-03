"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useTheme } from "next-themes";

const NAV_ITEMS = [
  { href: "/cms", label: "Overview", icon: LayoutDashboard },
  { href: "/cms/new", label: "New Page", icon: FilePlus },
  { href: "/cms/blog", label: "Blog", icon: FileText, badge: "Blog" },
  { href: "/cms/media", label: "Media Library", icon: PanelsTopLeft },
  { href: "/cms/navigation", label: "Navigation Links", icon: Link2 },
];

const CMS_PERMISSION_SLUGS = new Set([
  "cms.read",
  "cms.write",
  "cms.media",
  "nav.manage",
]);

export default function CmsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

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
        setAuthorized(false);
        return;
      }
      const normalizedPermissions = Array.isArray(permissions)
        ? permissions
        : [];
      setAuthorized(
        normalizedPermissions.some((permission) =>
          CMS_PERMISSION_SLUGS.has(permission),
        ),
      );
    };
    check();
  }, [router]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const logoSrc =
    mounted && resolvedTheme === "dark"
      ? "/carentour-logo-light.png"
      : "/carentour-logo-dark.png";

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
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/cms" className="flex items-center gap-3">
            <Image
              src={logoSrc}
              alt="Care N Tour logo"
              width={240}
              height={90}
              className="h-12 w-auto max-w-[260px] object-contain"
              priority
            />
            <span className="hidden text-sm font-semibold tracking-wide text-muted-foreground md:inline">
              CMS
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm">
              <Link href="/">View Site</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/cms/new">New Page</Link>
            </Button>
          </div>
        </div>
      </header>
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
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
