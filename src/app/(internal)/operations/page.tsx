"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  WorkspaceEmptyState,
  WorkspacePageHeader,
  WorkspacePanel,
  WorkspaceStatusBadge,
} from "@/components/workspaces/WorkspacePrimitives";
import { useUserProfile } from "@/hooks/useUserProfile";
import { createEntitlementContext } from "@/lib/operations/entitlements";
import { getAccessibleOperationsSections } from "@/lib/operations/sections";
import { adminFetch } from "@/components/admin/hooks/useAdminFetch";
import type { Tables } from "@/integrations/supabase/types";

type ContactRequestRow = Tables<"contact_requests">;
type StartJourneySubmissionRow = Tables<"start_journey_submissions">;
type ConsultationRow = Tables<"patient_consultations">;
type QueueBadgeTone = "info" | "success" | "warning";

type QueueSurface = {
  id: string;
  title: string;
  description: string;
  href: string;
  count: number;
  isLoading: boolean;
  badgeTone: QueueBadgeTone;
};

export default function OperationsOverviewPage() {
  const { profile, loading } = useUserProfile();

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

  const sections = useMemo(
    () =>
      getAccessibleOperationsSections(entitlements, {
        includeOverview: false,
      }),
    [entitlements],
  );

  const hasRequestsAccess = sections.some(
    (section) => section.id === "requests",
  );
  const hasStartJourneyAccess = sections.some(
    (section) => section.id === "start-journey",
  );
  const hasConsultationsAccess = sections.some(
    (section) => section.id === "consultations",
  );

  const requestsAssignedQuery = useQuery({
    queryKey: ["operations", "assigned", "requests"],
    queryFn: () =>
      adminFetch<ContactRequestRow[]>("/api/admin/requests?assignedTo=me"),
    enabled: hasRequestsAccess && !loading,
    staleTime: 60_000,
  });

  const startJourneyAssignedQuery = useQuery({
    queryKey: ["operations", "assigned", "start-journey"],
    queryFn: () =>
      adminFetch<StartJourneySubmissionRow[]>(
        "/api/admin/start-journey?assignedTo=me",
      ),
    enabled: hasStartJourneyAccess && !loading,
    staleTime: 60_000,
  });

  const consultationsAssignedQuery = useQuery({
    queryKey: ["operations", "assigned", "consultations"],
    queryFn: () =>
      adminFetch<ConsultationRow[]>(
        "/api/admin/consultations?assignedTo=me&upcomingOnly=true",
      ),
    enabled: hasConsultationsAccess && !loading,
    staleTime: 60_000,
  });

  const openRequestsCount = useMemo(() => {
    if (!hasRequestsAccess) return 0;
    const data = requestsAssignedQuery.data ?? [];
    return data.filter((request) => request.status !== "resolved").length;
  }, [hasRequestsAccess, requestsAssignedQuery.data]);

  const activeStartJourneyCount = useMemo(() => {
    if (!hasStartJourneyAccess) return 0;
    const data = startJourneyAssignedQuery.data ?? [];
    return data.filter(
      (submission) =>
        submission.status !== "completed" && submission.status !== "archived",
    ).length;
  }, [hasStartJourneyAccess, startJourneyAssignedQuery.data]);

  const upcomingConsultationsCount = useMemo(() => {
    if (!hasConsultationsAccess) return 0;
    const data = consultationsAssignedQuery.data ?? [];
    return data.filter((consultation) =>
      ["scheduled", "rescheduled"].includes(consultation.status),
    ).length;
  }, [hasConsultationsAccess, consultationsAssignedQuery.data]);

  const requestsLoading =
    hasRequestsAccess &&
    (requestsAssignedQuery.isLoading || requestsAssignedQuery.isFetching);
  const startJourneyLoading =
    hasStartJourneyAccess &&
    (startJourneyAssignedQuery.isLoading ||
      startJourneyAssignedQuery.isFetching);
  const consultationsLoading =
    hasConsultationsAccess &&
    (consultationsAssignedQuery.isLoading ||
      consultationsAssignedQuery.isFetching);

  const queueSurfaces = useMemo<QueueSurface[]>(
    () => [
      ...(hasRequestsAccess
        ? [
            {
              id: "requests",
              title: "Requests queue",
              description:
                "Contact and consultation intake items currently assigned to you.",
              href: "/operations/requests?assigned=me",
              count: openRequestsCount,
              isLoading: requestsLoading,
              badgeTone: "info" as const,
            },
          ]
        : []),
      ...(hasStartJourneyAccess
        ? [
            {
              id: "start-journey",
              title: "Start Journey follow-up",
              description:
                "Active journey submissions waiting for coordination or next-step follow-up.",
              href: "/operations/start-journey?assigned=me",
              count: activeStartJourneyCount,
              isLoading: startJourneyLoading,
              badgeTone: "success" as const,
            },
          ]
        : []),
      ...(hasConsultationsAccess
        ? [
            {
              id: "consultations",
              title: "Consultation schedule",
              description:
                "Upcoming consultations you are coordinating right now.",
              href: "/operations/consultations?assigned=me",
              count: upcomingConsultationsCount,
              isLoading: consultationsLoading,
              badgeTone: "warning" as const,
            },
          ]
        : []),
    ],
    [
      activeStartJourneyCount,
      consultationsLoading,
      hasConsultationsAccess,
      hasRequestsAccess,
      hasStartJourneyAccess,
      openRequestsCount,
      requestsLoading,
      startJourneyLoading,
      upcomingConsultationsCount,
    ],
  );

  return (
    <div className="space-y-8">
      <WorkspacePageHeader
        breadcrumb="Operations"
        title="Operations Overview"
        subtitle="Queues and workspaces adapt to the permissions granted to your staff account, with quick visibility into what is assigned to you today."
      />

      {loading ? (
        <WorkspacePanel
          title="Loading permissions"
          densityVariant="comfortable"
        >
          <p className="text-sm text-muted-foreground">
            Preparing your Operations workspace.
          </p>
        </WorkspacePanel>
      ) : sections.length ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.9fr)]">
          <WorkspacePanel
            title="Assigned queues"
            description="Open the sections already assigned to you instead of scanning abstract summary cards."
            contentClassName="space-y-3"
          >
            {queueSurfaces.length ? (
              queueSurfaces.map((surface) => (
                <div
                  key={surface.id}
                  className="flex flex-col gap-4 rounded-[1.15rem] border border-border/70 bg-background/55 p-4 lg:flex-row lg:items-start lg:justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {surface.title}
                      </p>
                      <WorkspaceStatusBadge tone={surface.badgeTone}>
                        {surface.isLoading
                          ? "Loading"
                          : `${surface.count} assigned`}
                      </WorkspaceStatusBadge>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {surface.description}
                    </p>
                  </div>
                  <Button asChild size="sm" className="shrink-0 rounded-lg">
                    <Link href={surface.href}>
                      Open queue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))
            ) : (
              <WorkspaceEmptyState
                title="No personal queues"
                description="This role can access Operations, but none of the current sections expose assigned-to-me queues."
              />
            )}
          </WorkspacePanel>

          <WorkspacePanel
            title="Available sections"
            description="These are the operational modules already enabled for your staff account."
            contentClassName="space-y-3"
          >
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <div
                  key={section.id}
                  className="flex items-start justify-between gap-4 rounded-[1.15rem] border border-border/70 bg-background/55 p-4"
                >
                  <div className="flex min-w-0 gap-3">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-muted/40 text-foreground">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          {section.label}
                        </p>
                        <WorkspaceStatusBadge tone="muted">
                          Available
                        </WorkspaceStatusBadge>
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {section.description}
                      </p>
                    </div>
                  </div>
                  <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                  >
                    <Link href={section.href}>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              );
            })}
          </WorkspacePanel>
        </div>
      ) : (
        <WorkspaceEmptyState
          title="No operations modules assigned"
          description="Your account can open the Operations workspace, but no sections have been enabled yet. Reach out to an administrator if this is unexpected."
          action={
            <Button asChild variant="outline">
              <Link href="/auth/support">Contact support</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
