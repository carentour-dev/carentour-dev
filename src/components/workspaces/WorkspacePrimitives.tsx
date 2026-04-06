import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type WorkspaceStatusTone =
  | "default"
  | "muted"
  | "info"
  | "success"
  | "warning"
  | "danger";

export type WorkspacePageHeaderProps = {
  breadcrumb?: ReactNode;
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export type WorkspaceMetricCardProps = {
  label: ReactNode;
  value: ReactNode;
  valueDensity?: "default" | "compact";
  trend?: ReactNode;
  helperText?: ReactNode;
  icon?: LucideIcon;
  emphasisTone?: WorkspaceStatusTone;
  className?: string;
};

export type WorkspacePanelProps = {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  densityVariant?: "compact" | "comfortable" | "relaxed";
  className?: string;
  contentClassName?: string;
};

export type WorkspaceDataTableShellProps = {
  title: ReactNode;
  description?: ReactNode;
  controls?: ReactNode;
  children?: ReactNode;
  footerActions?: ReactNode;
  emptyState?: ReactNode;
  isEmpty?: boolean;
  className?: string;
  contentClassName?: string;
};

export type WorkspaceEmptyStateProps = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
};

const METRIC_TONE_STYLES: Record<
  WorkspaceStatusTone,
  {
    container: string;
    icon: string;
    trend: string;
  }
> = {
  default: {
    container: "border-border bg-card shadow-[var(--workspace-card-shadow)]",
    icon: "bg-muted text-foreground ring-1 ring-border",
    trend: "text-foreground",
  },
  muted: {
    container: "border-border bg-card shadow-[var(--workspace-card-shadow)]",
    icon: "bg-muted text-muted-foreground ring-1 ring-border",
    trend: "text-muted-foreground",
  },
  info: {
    container: "border-border bg-card shadow-[var(--workspace-card-shadow)]",
    icon: "bg-muted text-foreground ring-1 ring-border",
    trend: "text-primary",
  },
  success: {
    container: "border-border bg-card shadow-[var(--workspace-card-shadow)]",
    icon: "bg-muted text-foreground ring-1 ring-border",
    trend: "text-emerald-600 dark:text-emerald-300",
  },
  warning: {
    container: "border-border bg-card shadow-[var(--workspace-card-shadow)]",
    icon: "bg-muted text-foreground ring-1 ring-border",
    trend: "text-amber-700 dark:text-amber-300",
  },
  danger: {
    container: "border-border bg-card shadow-[var(--workspace-card-shadow)]",
    icon: "bg-muted text-foreground ring-1 ring-border",
    trend: "text-destructive",
  },
};

const STATUS_BADGE_STYLES: Record<WorkspaceStatusTone, string> = {
  default: "border-border bg-primary text-primary-foreground",
  muted: "border-border bg-muted text-muted-foreground",
  info: "border-border bg-muted text-foreground",
  success:
    "border-emerald-500/25 bg-emerald-500/12 text-emerald-700 dark:text-emerald-200",
  warning:
    "border-amber-500/25 bg-amber-500/12 text-amber-700 dark:text-amber-200",
  danger:
    "border-destructive/25 bg-destructive/12 text-destructive dark:text-destructive-foreground",
};

const PANEL_DENSITY_STYLES = {
  compact: {
    header: "px-5 py-4",
    content: "px-5 py-4",
  },
  comfortable: {
    header: "px-6 py-5",
    content: "px-6 py-5",
  },
  relaxed: {
    header: "px-7 py-6",
    content: "px-7 py-6",
  },
} as const;

export function WorkspacePageHeader({
  breadcrumb,
  title,
  subtitle,
  actions,
  className,
}: WorkspacePageHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-5", className)}>
      {breadcrumb ? (
        <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          {breadcrumb}
        </div>
      ) : null}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 space-y-3">
          <h1 className="text-[2rem] font-semibold tracking-[-0.04em] text-foreground sm:text-[2.55rem]">
            {title}
          </h1>
          {subtitle ? (
            <div className="max-w-3xl text-[15px] leading-7 text-muted-foreground sm:text-base">
              {subtitle}
            </div>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}

export function WorkspaceMetricCard({
  label,
  value,
  valueDensity = "default",
  trend,
  helperText,
  icon: Icon,
  emphasisTone = "default",
  className,
}: WorkspaceMetricCardProps) {
  const tone = METRIC_TONE_STYLES[emphasisTone];
  const valueClassName =
    valueDensity === "compact"
      ? "text-[clamp(1.95rem,2.8vw,2.5rem)] leading-[0.98] tracking-[-0.05em]"
      : "text-[clamp(2.2rem,3.2vw,2.9rem)] leading-[0.96] tracking-[-0.055em]";

  return (
    <Card
      data-workspace-surface="interactive"
      className={cn(
        "group/workspace-metric overflow-hidden rounded-[1.5rem] border backdrop-blur-sm",
        tone.container,
        className,
      )}
    >
      <CardContent className="flex min-h-[152px] flex-col justify-between gap-6 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              {label}
            </p>
            <div
              className={cn(
                "min-w-0 break-normal text-pretty font-semibold text-foreground",
                valueClassName,
              )}
            >
              {value}
            </div>
          </div>
          {Icon ? (
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 ease-smooth group-hover/workspace-metric:-translate-y-0.5 group-hover/workspace-metric:scale-[1.02]",
                tone.icon,
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
          ) : null}
        </div>
        <div className="space-y-1">
          {trend ? (
            <div className={cn("text-base font-medium", tone.trend)}>
              {trend}
            </div>
          ) : null}
          {helperText ? (
            <div className="text-sm leading-6 text-muted-foreground">
              {helperText}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function WorkspacePanel({
  title,
  description,
  actions,
  children,
  densityVariant = "comfortable",
  className,
  contentClassName,
}: WorkspacePanelProps) {
  const density = PANEL_DENSITY_STYLES[densityVariant];
  const hasHeader = Boolean(title || description || actions);

  return (
    <Card
      data-workspace-surface="subtle"
      className={cn(
        "overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-[var(--workspace-panel-shadow)] backdrop-blur-sm",
        className,
      )}
    >
      {hasHeader ? (
        <CardHeader
          className={cn(
            "gap-4 border-b border-border bg-transparent",
            density.header,
          )}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-1.5">
              {title ? (
                <CardTitle className="text-xl font-semibold tracking-tight text-foreground">
                  {title}
                </CardTitle>
              ) : null}
              {description ? (
                <div className="text-sm leading-6 text-muted-foreground">
                  {description}
                </div>
              ) : null}
            </div>
            {actions ? (
              <div className="flex shrink-0 flex-wrap items-center gap-3">
                {actions}
              </div>
            ) : null}
          </div>
        </CardHeader>
      ) : null}
      <CardContent className={cn(density.content, contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}

export function WorkspaceFilterBar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-workspace-surface="subtle"
      className={cn(
        "relative overflow-hidden flex flex-col gap-3 rounded-[1rem] border border-border bg-muted/50 p-3 backdrop-blur-sm lg:flex-row lg:items-center lg:justify-between",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function WorkspaceDataTableShell({
  title,
  description,
  controls,
  children,
  footerActions,
  emptyState,
  isEmpty = false,
  className,
  contentClassName,
}: WorkspaceDataTableShellProps) {
  return (
    <WorkspacePanel
      title={title}
      description={description}
      className={className}
      contentClassName={cn("space-y-5", contentClassName)}
    >
      {controls ? <WorkspaceFilterBar>{controls}</WorkspaceFilterBar> : null}
      {isEmpty ? emptyState : children}
      {footerActions ? (
        <div className="flex flex-wrap items-center gap-3 border-t border-border/70 pt-4">
          {footerActions}
        </div>
      ) : null}
    </WorkspacePanel>
  );
}

export function WorkspaceEmptyState({
  title,
  description,
  action,
  icon,
  className,
}: WorkspaceEmptyStateProps) {
  return (
    <div
      data-workspace-surface="subtle"
      className={cn(
        "relative overflow-hidden flex flex-col items-center justify-center rounded-[1.25rem] border border-border bg-muted/30 px-6 py-12 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/80 text-muted-foreground ring-1 ring-border/60">
          {icon}
        </div>
      ) : null}
      <h3 className="text-lg font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      {description ? (
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? (
        <div className="mt-6 flex flex-wrap gap-3">{action}</div>
      ) : null}
    </div>
  );
}

export function WorkspaceStatusBadge({
  tone = "muted",
  className,
  children,
}: {
  tone?: WorkspaceStatusTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]",
        STATUS_BADGE_STYLES[tone],
        className,
      )}
    >
      {children}
    </Badge>
  );
}
