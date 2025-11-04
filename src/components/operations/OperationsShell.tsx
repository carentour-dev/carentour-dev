"use client";

import { ReactNode, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
import type { OperationsSectionConfig } from "@/lib/operations/sections";
import { Loader2, LogOut, Users } from "lucide-react";

type OperationsShellProps = {
  children: ReactNode;
};

export function OperationsShell({ children }: OperationsShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth");
    }
  }, [authLoading, router, user]);

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

  const isLoading = authLoading || profileLoading;

  const handleSignOut = async () => {
    await signOut();
    router.replace("/auth");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Loading operations workspace…
        </p>
      </div>
    );
  }

  if (!isAuthorized) {
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
    <SidebarProvider>
      <Sidebar
        collapsible="icon"
        className="bg-sidebar text-sidebar-foreground"
      >
        <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
          <OperationsBranding />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Operations</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navSections.map((section) => (
                  <OperationsNavItem
                    key={section.id}
                    section={section}
                    pathname={pathname}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border">
          <OperationsProfileSummary
            displayName={profile?.displayName ?? "Team member"}
            roles={profile?.roles ?? []}
          />
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
        <OperationsTopbar />
        <main className="flex-1 overflow-y-auto px-6 pb-10 pt-6 lg:px-10">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function OperationsNavItem({
  section,
  pathname,
}: {
  section: OperationsSectionConfig;
  pathname: string | null;
}) {
  const Icon = section.icon;
  const isActive =
    pathname === section.href ||
    (section.href !== "/operations" && pathname?.startsWith(section.href));

  return (
    <SidebarMenuItem key={section.href}>
      <SidebarMenuButton asChild isActive={isActive} tooltip={section.label}>
        <Link href={section.href}>
          <Icon className="h-4 w-4" />
          <span>{section.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function OperationsProfileSummary({
  displayName,
  roles,
}: {
  displayName: string;
  roles: string[];
}) {
  return (
    <div className="flex items-center gap-3 rounded-md bg-sidebar-accent/30 px-3 py-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Users className="h-4 w-4" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium">{displayName}</span>
        <div className="flex flex-wrap gap-1">
          {roles.length ? (
            roles.map((role) => (
              <Badge
                key={role}
                variant="outline"
                className="w-fit text-xs capitalize"
              >
                {role.replace(/[-_]/g, " ")}
              </Badge>
            ))
          ) : (
            <Badge variant="outline" className="w-fit text-xs capitalize">
              user
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

function OperationsTopbar() {
  return (
    <header className="flex h-14 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur lg:h-16 lg:px-8">
      <div className="flex flex-1 items-center gap-4">
        <SidebarTrigger className="-ml-1 lg:hidden" />
        <div className="flex flex-1 flex-col">
          <h1 className="text-base font-semibold tracking-tight text-foreground">
            Operations Dashboard
          </h1>
          <p className="text-xs text-muted-foreground">
            Role-aware workspace for Care N Tour staff.
          </p>
        </div>
      </div>
      <ThemeToggle />
    </header>
  );
}

function OperationsBranding() {
  return (
    <div className="flex items-center gap-3 px-1">
      <Image
        src="/carentour-logo-dark.png"
        alt="Care N Tour"
        width={200}
        height={60}
        className="h-10 w-auto object-contain dark:hidden"
        priority
      />
      <Image
        src="/carentour-logo-light.png"
        alt="Care N Tour"
        width={200}
        height={60}
        className="hidden h-10 w-auto object-contain dark:block"
        priority
      />
      <div className="flex flex-col">
        <span className="text-xs font-medium uppercase tracking-tight text-muted-foreground">
          Staff workspace
        </span>
        <span className="text-sm font-semibold text-foreground">
          Operations
        </span>
      </div>
    </div>
  );
}
