"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { LogOut, type LucideIcon, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { WorkspaceModuleTopBar } from "@/components/workspaces/WorkspaceModuleTopBar";
import type { ModuleTab } from "@/lib/workspaces/module-nav";
import { cn } from "@/lib/utils";

export type InternalWorkspaceShellNavItem = {
  label: string;
  href: string;
  icon?: LucideIcon;
  active?: boolean;
  badge?: string;
  external?: boolean;
};

export type InternalWorkspaceShellNavSection = {
  label: string;
  items: InternalWorkspaceShellNavItem[];
};

export type InternalWorkspaceShellSecondaryNavigation = {
  label?: string;
  items: InternalWorkspaceShellNavItem[];
  actions?: ReactNode;
};

export type InternalWorkspaceShellProps = {
  branding: {
    title: string;
    subtitle?: string;
    icon?: LucideIcon;
    lightLogoSrc?: string;
    darkLogoSrc?: string;
    logoAlt?: string;
  };
  navSections: InternalWorkspaceShellNavSection[];
  moduleTabs: ModuleTab[];
  headerTitle: string;
  headerSubtitle?: string;
  headerActions?: ReactNode;
  secondaryNavigation?: InternalWorkspaceShellSecondaryNavigation;
  profile: {
    displayName: string;
    roles: string[];
    icon?: LucideIcon;
  };
  onSignOut?: () => void;
  signOutLabel?: string;
  loading?: boolean;
  loadingMessage?: string;
  sidebarDefaultOpen?: boolean;
  contentWidth?: "dashboard" | "editor" | "full";
  mainClassName?: string;
  contentClassName?: string;
  children: ReactNode;
};

const CONTENT_WIDTH_STYLES: Record<
  NonNullable<InternalWorkspaceShellProps["contentWidth"]>,
  string
> = {
  dashboard: "max-w-[1520px]",
  editor: "max-w-7xl",
  full: "max-w-none",
};

export function InternalWorkspaceShell({
  branding,
  navSections,
  moduleTabs,
  headerTitle,
  headerSubtitle,
  headerActions,
  secondaryNavigation,
  profile,
  onSignOut,
  signOutLabel = "Sign out",
  loading = false,
  loadingMessage = "Refreshing workspace access...",
  sidebarDefaultOpen = true,
  contentWidth = "dashboard",
  mainClassName,
  contentClassName,
  children,
}: InternalWorkspaceShellProps) {
  const pathname = usePathname();

  return (
    <>
      <SidebarProvider
        defaultOpen={sidebarDefaultOpen}
        style={
          {
            "--sidebar-width": "16rem",
            "--sidebar-width-icon": "4rem",
          } as CSSProperties
        }
      >
        <Sidebar
          variant="inset"
          collapsible="icon"
          className="border-none bg-transparent print:hidden"
        >
          <SidebarHeader className="px-5 pb-5 pt-6">
            <InternalWorkspaceBranding {...branding} />
          </SidebarHeader>
          <SidebarContent className="px-4 pb-4 pt-2">
            {navSections.map((section) => (
              <SidebarGroup key={section.label}>
                <SidebarGroupLabel className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-sidebar-foreground/42">
                  {section.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="gap-1.5">
                    {section.items.map((item) => (
                      <InternalWorkspaceNavItem key={item.href} item={item} />
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>
          <SidebarFooter className="mt-auto px-4 pb-4 pt-5">
            <InternalWorkspaceProfileCard profile={profile} />
            {onSignOut ? (
              <Button
                variant="ghost"
                size="sm"
                className="group/sign-out h-10 w-full justify-start gap-2 rounded-xl border border-transparent px-3 text-sidebar-foreground/70 hover:border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                onClick={onSignOut}
              >
                <LogOut className="h-4 w-4" />
                <span>{signOutLabel}</span>
              </Button>
            ) : null}
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>

        <SidebarInset
          data-workspace-shell="frame"
          className="overflow-hidden border border-border bg-background shadow-[var(--workspace-frame-shadow)] ring-0 md:m-4 md:ml-0 md:rounded-[1.5rem]"
        >
          <div className="sticky top-0 z-30">
            <WorkspaceModuleTopBar
              tabs={moduleTabs}
              title={headerTitle}
              subtitle={headerSubtitle}
              leftSlot={<SidebarTrigger className="-ml-1 lg:hidden" />}
              rightSlot={headerActions}
            />
            {secondaryNavigation ? (
              <InternalSecondaryNavigation {...secondaryNavigation} />
            ) : null}
          </div>

          <main
            className={cn(
              "flex-1 px-4 pb-8 pt-6 sm:px-6 lg:px-8 lg:pb-10 lg:pt-6",
              mainClassName,
            )}
          >
            <div
              className={cn(
                "mx-auto w-full",
                CONTENT_WIDTH_STYLES[contentWidth],
                contentClassName,
              )}
            >
              <div
                key={pathname}
                data-workspace-shell="content"
                className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-300"
              >
                {children}
              </div>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>

      {loading ? (
        <div className="pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background/70 backdrop-blur-md">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <p className="text-sm text-muted-foreground">{loadingMessage}</p>
        </div>
      ) : null}
    </>
  );
}

function InternalWorkspaceNavItem({
  item,
}: {
  item: InternalWorkspaceShellNavItem;
}) {
  const Icon = item.icon;
  const className =
    "group/nav-item h-10 rounded-xl border border-transparent px-3.5 text-[13px] font-medium text-sidebar-foreground/72 transition-[background-color,border-color,color,transform,box-shadow] duration-200 ease-smooth hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:border-sidebar-primary/15 data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground data-[active=true]:shadow-none group-data-[collapsible=icon]:rounded-xl";

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={Boolean(item.active)}
        tooltip={item.label}
        data-workspace-nav="true"
        className={className}
      >
        {item.external ? (
          <Link
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            prefetch={false}
            aria-current={item.active ? "page" : undefined}
          >
            {Icon ? <Icon className="h-4 w-4" /> : null}
            <span>{item.label}</span>
          </Link>
        ) : (
          <Link
            href={item.href}
            aria-current={item.active ? "page" : undefined}
          >
            {Icon ? <Icon className="h-4 w-4" /> : null}
            <span>{item.label}</span>
          </Link>
        )}
      </SidebarMenuButton>
      {item.badge ? (
        <SidebarMenuBadge className="rounded-md bg-sidebar-accent px-1.5 text-[11px] font-semibold text-sidebar-foreground/70 transition-transform duration-200 ease-smooth group-hover/menu-item:scale-[1.04]">
          {item.badge}
        </SidebarMenuBadge>
      ) : null}
    </SidebarMenuItem>
  );
}

function InternalWorkspaceBranding({
  title,
  subtitle,
  icon: Icon,
  lightLogoSrc,
  darkLogoSrc,
  logoAlt = title,
}: InternalWorkspaceShellProps["branding"]) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const prefersDark = mounted && resolvedTheme === "dark";
  const logoSrc =
    prefersDark && darkLogoSrc ? darkLogoSrc : (lightLogoSrc ?? darkLogoSrc);

  return (
    <div className="group/brand flex items-center gap-4 group-data-[collapsible=icon]:justify-center">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] border border-sidebar-border bg-sidebar-accent transition-transform duration-300 ease-smooth group-hover/brand:scale-[1.03]">
        {logoSrc ? (
          <Image
            src={logoSrc}
            alt={logoAlt}
            width={88}
            height={88}
            className="h-8 w-8 object-contain transition-transform duration-300 ease-smooth group-hover/brand:scale-[1.03]"
            priority
          />
        ) : Icon ? (
          <Icon className="h-6 w-6 text-sidebar-primary transition-transform duration-300 ease-smooth group-hover/brand:scale-[1.03]" />
        ) : null}
      </div>
      <div className="min-w-0 space-y-1 group-data-[collapsible=icon]:hidden">
        {subtitle ? (
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-sidebar-foreground/45">
            {subtitle}
          </p>
        ) : null}
        <p className="truncate text-[17px] font-semibold tracking-[-0.03em] text-sidebar-foreground">
          {title}
        </p>
      </div>
    </div>
  );
}

function InternalWorkspaceProfileCard({
  profile,
}: {
  profile: InternalWorkspaceShellProps["profile"];
}) {
  const ProfileIcon = profile.icon ?? UserRound;
  const roles = profile.roles.length > 0 ? profile.roles : ["user"];
  const visibleRoles = roles.slice(0, 2);
  const hiddenRolesCount = Math.max(roles.length - visibleRoles.length, 0);

  return (
    <div
      data-workspace-surface="subtle"
      className="rounded-[1.15rem] border border-sidebar-border bg-sidebar-accent/45 p-3"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sidebar-background text-sidebar-foreground ring-1 ring-sidebar-border">
          <ProfileIcon className="h-4 w-4" />
        </div>
        <div className="min-w-0 space-y-2">
          <p className="truncate text-sm font-medium text-sidebar-foreground">
            {profile.displayName}
          </p>
          <p className="text-[11px] text-sidebar-foreground/48">
            {roles.length} access role{roles.length === 1 ? "" : "s"}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {visibleRoles.map((role) => (
              <Badge
                key={role}
                variant="outline"
                className="border-sidebar-border bg-sidebar-background text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/66"
              >
                {role.replace(/[-_]/g, " ")}
              </Badge>
            ))}
            {hiddenRolesCount > 0 ? (
              <Badge
                variant="outline"
                className="border-sidebar-border bg-sidebar-background text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/54"
              >
                +{hiddenRolesCount} more
              </Badge>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function InternalSecondaryNavigation({
  label,
  items,
  actions,
}: InternalWorkspaceShellSecondaryNavigation) {
  return (
    <div className="border-b border-border bg-background px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1520px] flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 space-y-2">
          {label ? (
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              {label}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {items.map((item) => {
              const Icon = item.icon;
              const itemClassName = cn(
                "group/secondary-item inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-medium transition-[background-color,border-color,color,transform,box-shadow] duration-200 ease-smooth",
                item.active
                  ? "border-primary/15 bg-primary text-primary-foreground"
                  : "border-border bg-muted/40 text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground",
              );

              if (item.external) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    prefetch={false}
                    className={itemClassName}
                    data-workspace-chip="true"
                    data-active={item.active ? "true" : "false"}
                    aria-current={item.active ? "page" : undefined}
                  >
                    {Icon ? <Icon className="h-4 w-4" /> : null}
                    <span>{item.label}</span>
                    {item.badge ? (
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary transition-colors duration-200 ease-smooth group-hover/secondary-item:bg-primary/20">
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={itemClassName}
                  data-workspace-chip="true"
                  data-active={item.active ? "true" : "false"}
                  aria-current={item.active ? "page" : undefined}
                >
                  {Icon ? <Icon className="h-4 w-4" /> : null}
                  <span>{item.label}</span>
                  {item.badge ? (
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary transition-colors duration-200 ease-smooth group-hover/secondary-item:bg-primary/20">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}
