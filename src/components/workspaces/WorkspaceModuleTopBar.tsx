"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import type { ModuleTab } from "@/lib/workspaces/module-nav";

type WorkspaceModuleTopBarProps = {
  title: string;
  subtitle?: string;
  tabs: ModuleTab[];
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
  isLoading?: boolean;
};

export function WorkspaceModuleTopBar({
  title,
  subtitle,
  tabs,
  leftSlot,
  rightSlot,
  isLoading = false,
}: WorkspaceModuleTopBarProps) {
  const visibleTabs = tabs.filter((tab) => tab.visible);

  return (
    <header
      className={cn(
        "border-b border-border bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/88 print:hidden",
        isLoading ? "opacity-80" : null,
      )}
    >
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[4rem] flex-wrap items-center gap-3 py-3">
          {leftSlot ? (
            <div className="flex items-center gap-2">{leftSlot}</div>
          ) : null}

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/80">
                Internal workspace
              </p>
              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold tracking-tight text-foreground sm:text-lg">
                  {title}
                </h1>
                {subtitle ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {subtitle}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {rightSlot ? (
            <div className="ml-auto flex shrink-0 flex-wrap items-center gap-2">
              {rightSlot}
            </div>
          ) : null}
        </div>

        <nav
          aria-label="Workspace modules"
          className="-mx-1 min-w-0 overflow-x-auto px-1 pb-4 pt-1"
        >
          <div className="flex min-w-max items-center gap-2">
            {visibleTabs.map((tab) => {
              const className = cn(
                "group/module-tab inline-flex h-8 items-center rounded-full border px-3.5 text-xs font-medium tracking-tight transition-[background-color,border-color,color,transform,box-shadow] duration-200 ease-smooth",
                tab.active
                  ? "border-primary/15 bg-primary text-primary-foreground"
                  : "border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground",
              );

              if (tab.external) {
                return (
                  <Link
                    key={tab.id}
                    href={tab.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    prefetch={false}
                    className={className}
                    data-workspace-chip="true"
                    data-active={tab.active ? "true" : "false"}
                    aria-current={tab.active ? "page" : undefined}
                  >
                    {tab.label}
                  </Link>
                );
              }

              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={className}
                  data-workspace-chip="true"
                  data-active={tab.active ? "true" : "false"}
                  aria-current={tab.active ? "page" : undefined}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </header>
  );
}
