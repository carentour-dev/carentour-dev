"use client";

import { ReactNode } from "react";
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
  ActivitySquare,
  Building2,
  Hotel,
  LayoutDashboard,
  LogOut,
  Stethoscope,
  Users,
} from "lucide-react";

// Admin navigation configuration keeps sidebar items in one place.
const NAV_ITEMS = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Doctors", href: "/admin/doctors", icon: Stethoscope },
  { label: "Patients", href: "/admin/patients", icon: Users },
  { label: "Treatments", href: "/admin/treatments", icon: ActivitySquare },
  { label: "Facilities", href: "/admin/facilities", icon: Building2 },
  { label: "Hotels", href: "/admin/hotels", icon: Hotel },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const { profile } = useUserProfile();

  // Reuse existing auth provider to fully sign out admins.
  const handleSignOut = async () => {
    await signOut();
    router.replace("/auth");
  };

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="bg-sidebar text-sidebar-foreground">
        <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold tracking-tight">Care N Tour</span>
              <span className="text-xs text-muted-foreground">Admin Console</span>
            </div>
          </div>
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
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
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
              <span className="text-sm font-medium">{profile?.displayName ?? "Admin"}</span>
              <Badge variant="outline" className="w-fit text-xs">
                {profile?.role ?? "admin"}
              </Badge>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="flex min-h-screen flex-1 flex-col bg-background">
        <AdminTopbar />
        <main className="flex-1 overflow-y-auto px-6 pb-10 pt-6 lg:px-10">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function AdminTopbar() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="flex h-14 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur lg:h-16 lg:px-8">
      {/* Mobile trigger keeps sidebar accessible on smaller screens. */}
      <SidebarTrigger className="lg:hidden" onClick={toggleSidebar} />
      <SidebarSeparator className="lg:hidden" />
      <div className="flex flex-col">
        <span className="text-sm font-medium text-muted-foreground">Care N Tour Admin</span>
        <span className="text-lg font-semibold tracking-tight">Operations Console</span>
      </div>
    </header>
  );
}
