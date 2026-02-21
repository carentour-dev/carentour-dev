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
        "border-b border-border bg-background/80 backdrop-blur print:hidden",
        isLoading ? "opacity-80" : null,
      )}
    >
      <div className="flex min-h-14 items-center gap-3 px-4 lg:px-8">
        {leftSlot ? (
          <div className="flex items-center gap-2">{leftSlot}</div>
        ) : null}

        <nav
          aria-label="Workspace modules"
          className="min-w-0 flex-1 overflow-x-auto"
        >
          <div className="flex min-w-max items-center gap-2 py-2">
            {visibleTabs.map((tab) => {
              const className = cn(
                "inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium tracking-tight transition-all",
                tab.active
                  ? "border-primary/30 bg-primary/15 text-primary"
                  : "border-border bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground",
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
                  aria-current={tab.active ? "page" : undefined}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {rightSlot ? (
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {rightSlot}
          </div>
        ) : null}
      </div>

      <div className="border-t border-border/70 px-4 py-2 lg:px-8">
        <h1 className="text-base font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
    </header>
  );
}
