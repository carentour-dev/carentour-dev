"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Loader2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUserProfile } from "@/hooks/useUserProfile";
import { createEntitlementContext } from "@/lib/operations/entitlements";
import { getAccessibleOperationsSections } from "@/lib/operations/sections";
import { adminFetch } from "@/components/admin/hooks/useAdminFetch";
import type { Tables } from "@/integrations/supabase/types";

type ContactRequestRow = Tables<"contact_requests">;
type StartJourneySubmissionRow = Tables<"start_journey_submissions">;
type ConsultationRow = Tables<"patient_consultations">;

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

  const showSummary =
    hasRequestsAccess || hasStartJourneyAccess || hasConsultationsAccess;

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

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Operations Overview
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Access the tools that match your role. Sections below adapt to the
          permissions granted to your staff account.
        </p>
      </header>

      {loading ? (
        <Card>
          <CardHeader>
            <CardTitle>Loading permissions…</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Preparing your Operations workspace.
            </p>
          </CardContent>
        </Card>
      ) : sections.length ? (
        <>
          {showSummary && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {hasRequestsAccess && (
                <AssignedSummaryCard
                  title="My Requests"
                  description="Open contact and consultation intake items."
                  href="/operations/requests?assigned=me"
                  count={openRequestsCount}
                  loading={requestsLoading}
                />
              )}
              {hasStartJourneyAccess && (
                <AssignedSummaryCard
                  title="My Start Journey"
                  description="Active journey submissions needing follow-up."
                  href="/operations/start-journey?assigned=me"
                  count={activeStartJourneyCount}
                  loading={startJourneyLoading}
                />
              )}
              {hasConsultationsAccess && (
                <AssignedSummaryCard
                  title="My Consultations"
                  description="Upcoming consultations you coordinate."
                  href="/operations/consultations?assigned=me"
                  count={upcomingConsultationsCount}
                  loading={consultationsLoading}
                />
              )}
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <Card key={section.id} className="transition hover:shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                      <Icon className="h-5 w-5 text-primary" />
                      {section.label}
                    </CardTitle>
                    <Button asChild variant="ghost" size="icon">
                      <Link href={section.href}>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{section.description}</CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No operations modules assigned</CardTitle>
            <CardDescription>
              Your account has access to the Operations workspace, but no
              sections have been enabled yet. Reach out to an administrator if
              this is unexpected.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/auth/support">Contact support</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

type AssignedSummaryCardProps = {
  title: string;
  description: string;
  href: string;
  count: number;
  loading: boolean;
};

function AssignedSummaryCard({
  title,
  description,
  href,
  count,
  loading,
}: AssignedSummaryCardProps) {
  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <span className="text-2xl font-semibold text-primary">{count}</span>
          )}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="w-full justify-between"
        >
          <Link href={href}>
            Review
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
