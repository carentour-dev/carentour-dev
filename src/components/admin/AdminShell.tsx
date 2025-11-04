"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
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
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  createEntitlementContext,
  hasOperationsEntry,
} from "@/lib/operations/entitlements";
import { hasAnyOperationsSection } from "@/lib/operations/sections";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "next-themes";
import {
  ActivitySquare,
  Building2,
  CalendarCheck,
  CalendarDays,
  Hotel,
  Inbox,
  LayoutDashboard,
  Loader2,
  LogOut,
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

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();

  const isCheckingAccess = authLoading || profileLoading;
  const hasAdminAccess = profile?.hasPermission("admin.access");
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

  // Reuse existing auth provider to fully sign out admins.
  const handleSignOut = async () => {
    await signOut();
    router.replace("/auth");
  };

  if (isCheckingAccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Checking admin access…</p>
      </div>
    );
  }

  if (!hasAdminAccess) {
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
        <Button onClick={() => router.replace("/dashboard")}>
          Return to dashboard
        </Button>
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
          <AdminBranding />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/admin" && pathname.startsWith(item.href));

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
                {profile?.displayName ?? "Admin"}
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
        <AdminTopbar hasOperationsAccess={hasOperationsAccess} />
        <main className="flex-1 overflow-y-auto px-6 pb-10 pt-6 lg:px-10">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function AdminTopbar({
  hasOperationsAccess,
}: {
  hasOperationsAccess: boolean;
}) {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="flex h-14 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur lg:h-16 lg:px-8">
      <div className="flex flex-1 items-center gap-4">
        {/* Mobile trigger keeps sidebar accessible on smaller screens. */}
        <SidebarTrigger className="lg:hidden" onClick={toggleSidebar} />
        <SidebarSeparator className="lg:hidden" />
        <div className="flex flex-col">
          <span className="text-sm font-medium text-muted-foreground">
            Care N Tour Admin
          </span>
          <span className="text-lg font-semibold tracking-tight">
            Operations Console
          </span>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        {hasOperationsAccess && (
          <Button asChild size="sm">
            <Link href="/operations" prefetch={false}>
              Operations Dashboard
            </Link>
          </Button>
        )}
        <Button asChild variant="outline" size="sm">
          <Link
            href="/"
            prefetch={false}
            target="_blank"
            rel="noopener noreferrer"
          >
            Visit Site
          </Link>
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}

function AdminBranding() {
  const { state } = useSidebar();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const logoSrc =
    mounted && resolvedTheme === "dark"
      ? "/carentour-logo-light-alt.png"
      : "/carentour-logo-dark-alt.png";
  const isCollapsed = state === "collapsed";

  if (isCollapsed) {
    return (
      <div className="flex items-center justify-center">
        <Image
          src={logoSrc}
          alt="Care N Tour logo"
          width={64}
          height={64}
          className="h-14 w-14 rounded-md border border-sidebar-border bg-sidebar-accent/30 p-1.5 object-contain"
          priority
        />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-2 text-center">
      <Image
        src={logoSrc}
        alt="Care N Tour logo"
        width={240}
        height={240}
        className="h-16 w-auto max-w-[240px] object-contain"
        priority
      />
      <span className="text-xs text-muted-foreground">Admin Console</span>
    </div>
  );
}
