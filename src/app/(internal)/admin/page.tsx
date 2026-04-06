"use client";

import Link from "next/link";
import {
  Building2,
  CalendarCheck,
  CalendarDays,
  CircleDollarSign,
  Hotel,
  Inbox,
  Plane,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserPlus,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkspacePanel } from "@/components/workspaces/WorkspacePrimitives";

type AdminSurfaceGroup = "care" | "catalog" | "platform";
type AdminTabValue = "all" | AdminSurfaceGroup;

type AdminSurface = {
  title: string;
  href: string;
  description: string;
  icon: typeof Inbox;
  group: AdminSurfaceGroup;
};

const SURFACES: AdminSurface[] = [
  {
    title: "Contact Requests",
    href: "/admin/requests",
    description: "Log new inquiries and assign follow-up actions.",
    icon: Inbox,
    group: "care",
  },
  {
    title: "Start Journey",
    href: "/admin/start-journey",
    description: "Advance pre-travel intake and keep case handoffs moving.",
    icon: Plane,
    group: "care",
  },
  {
    title: "Consultations",
    href: "/admin/consultations",
    description: "Review specialist consults and coordinate medical follow-up.",
    icon: CalendarCheck,
    group: "care",
  },
  {
    title: "Appointments",
    href: "/admin/appointments",
    description: "Confirm treatment schedules, arrivals, and clinic calendars.",
    icon: CalendarDays,
    group: "care",
  },
  {
    title: "Manage Doctors",
    href: "/admin/doctors",
    description: "Keep specialist profiles accurate and up to date.",
    icon: Stethoscope,
    group: "care",
  },
  {
    title: "Review Patients",
    href: "/admin/patients",
    description: "Assist coordinators with patient intake and planning.",
    icon: Users,
    group: "catalog",
  },
  {
    title: "Curate Treatments",
    href: "/admin/treatments",
    description: "Maintain pricing, durations, and medical guidance.",
    icon: Building2,
    group: "catalog",
  },
  {
    title: "Finance Workspace",
    href: "/admin/finance",
    description: "Manage invoices, installments, payments, and approvals.",
    icon: CircleDollarSign,
    group: "catalog",
  },
  {
    title: "Patient Testimonials",
    href: "/admin/testimonials",
    description: "Approve reviews and stories that highlight patient success.",
    icon: Sparkles,
    group: "catalog",
  },
  {
    title: "Partner Hotels",
    href: "/admin/hotels",
    description: "Update recovery-friendly accommodations and perks.",
    icon: Hotel,
    group: "catalog",
  },
  {
    title: "Service Providers",
    href: "/admin/service-providers",
    description: "Keep transport, translation, and support vendors current.",
    icon: Building2,
    group: "catalog",
  },
  {
    title: "Team Accounts",
    href: "/admin/accounts",
    description: "Invite staff and assign roles without touching patient data.",
    icon: UserPlus,
    group: "platform",
  },
  {
    title: "Workspace Access",
    href: "/admin/access",
    description: "Review permissions, workspace reach, and staff entry rules.",
    icon: ShieldCheck,
    group: "platform",
  },
];

const GROUP_META: Record<
  AdminSurfaceGroup,
  { label: string; helper: string; actionHref: string; actionLabel: string }
> = {
  care: {
    label: "Care coordination",
    helper:
      "Requests, journeys, consultations, appointments, and doctor operations.",
    actionHref: "/admin/requests",
    actionLabel: "Open intake queue",
  },
  catalog: {
    label: "Catalog and finance",
    helper:
      "Patients, treatments, finance, providers, hotels, and testimonial operations.",
    actionHref: "/admin/finance",
    actionLabel: "Open finance",
  },
  platform: {
    label: "Platform controls",
    helper: "Team identity, role assignment, and workspace access governance.",
    actionHref: "/admin/access",
    actionLabel: "Review access",
  },
};

const GROUP_ORDER: AdminSurfaceGroup[] = ["care", "catalog", "platform"];
const TAB_ORDER: AdminTabValue[] = ["all", "care", "catalog", "platform"];

const TAB_LABELS: Record<AdminTabValue, string> = {
  all: "All routes",
  care: "Care coordination",
  catalog: "Catalog and finance",
  platform: "Platform controls",
};

function getRowsForTab(tab: AdminTabValue) {
  if (tab === "all") {
    return SURFACES;
  }

  return SURFACES.filter((surface) => surface.group === tab);
}

function formatRoute(href: string) {
  return href.replace("/admin", "") || "/";
}

function AdminRouteCount({ count }: { count: number }) {
  return (
    <div className="inline-flex items-baseline gap-1.5 whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
      <span className="text-sm font-medium normal-case tracking-normal text-foreground">
        {count}
      </span>
      <span>routes</span>
    </div>
  );
}

function AdminSurfaceRow({ surface }: { surface: AdminSurface }) {
  const Icon = surface.icon;

  return (
    <Link
      href={surface.href}
      className="group flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-3 transition-colors hover:bg-muted/50"
    >
      <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-foreground">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-medium text-foreground">{surface.title}</p>
        <p className="text-sm leading-6 text-muted-foreground">
          {surface.description}
        </p>
      </div>
    </Link>
  );
}

function SurfaceTable({ tab }: { tab: AdminTabValue }) {
  const rows = getRowsForTab(tab);

  return (
    <Table className="[&_tr:last-child]:border-b-0">
      <TableHeader>
        <TableRow className="border-border hover:bg-transparent">
          <TableHead className="h-12 px-5 text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Surface
          </TableHead>
          <TableHead className="h-12 px-5 text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Area
          </TableHead>
          <TableHead className="h-12 px-5 text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Route
          </TableHead>
          <TableHead className="h-12 px-5 text-right text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Action
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((surface) => {
          const Icon = surface.icon;
          const groupMeta = GROUP_META[surface.group];

          return (
            <TableRow
              key={surface.href}
              className="border-border hover:bg-muted/30"
            >
              <TableCell className="px-5 py-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-9 items-center justify-center rounded-xl border border-border bg-muted/60 text-foreground">
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {surface.title}
                    </p>
                    <p className="max-w-[32rem] text-sm leading-6 text-muted-foreground">
                      {surface.description}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="px-5 py-4 align-top">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {groupMeta.label}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {groupMeta.helper}
                  </p>
                </div>
              </TableCell>
              <TableCell className="px-5 py-4 align-top text-sm text-muted-foreground">
                {formatRoute(surface.href)}
              </TableCell>
              <TableCell className="px-5 py-4 text-right align-top">
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="rounded-lg"
                >
                  <Link href={surface.href}>Open</Link>
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export default function AdminOverviewPage() {
  return (
    <div className="space-y-6">
      <WorkspacePanel
        title="Priority workstreams"
        description="The highest-frequency admin routes, grouped by how staff already operate inside the workspace."
        contentClassName="grid gap-4 xl:grid-cols-3"
      >
        {GROUP_ORDER.map((group) => {
          const meta = GROUP_META[group];
          const rows = SURFACES.filter((surface) => surface.group === group);

          return (
            <div
              key={group}
              className="overflow-hidden rounded-[1.2rem] border border-border bg-muted/20"
            >
              <div className="border-b border-border px-5 py-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">
                      {meta.label}
                    </p>
                    <AdminRouteCount count={rows.length} />
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {meta.helper}
                  </p>
                </div>
              </div>
              <div className="space-y-2 p-3">
                {rows.map((surface) => (
                  <AdminSurfaceRow key={surface.href} surface={surface} />
                ))}
              </div>
              <div className="border-t border-border px-3 py-3">
                <Button
                  asChild
                  variant="ghost"
                  className="h-9 w-full justify-start rounded-lg"
                >
                  <Link href={meta.actionHref}>{meta.actionLabel}</Link>
                </Button>
              </div>
            </div>
          );
        })}
      </WorkspacePanel>

      <Tabs defaultValue="all" className="space-y-4">
        <div className="-mx-1 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList className="inline-flex h-auto min-w-max justify-start rounded-xl border border-border bg-muted/40 p-1">
            {TAB_ORDER.map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="shrink-0 rounded-lg px-4 py-2 text-sm data-[state=active]:bg-card data-[state=active]:text-foreground"
              >
                {TAB_LABELS[tab]}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {TAB_ORDER.map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-0">
            <WorkspacePanel
              title={tab === "all" ? "Admin routes" : TAB_LABELS[tab]}
              description={
                tab === "all"
                  ? "Every implemented admin route, kept visible and directly launchable from one operating table."
                  : GROUP_META[tab].helper
              }
              actions={<AdminRouteCount count={getRowsForTab(tab).length} />}
              contentClassName="px-0 pb-0 pt-0"
            >
              <SurfaceTable tab={tab} />
            </WorkspacePanel>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
