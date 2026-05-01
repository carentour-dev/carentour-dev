"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  Loader2,
  Plus,
  RefreshCcw,
  Route,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AssignmentControl } from "@/components/admin/AssignmentControl";
import {
  adminFetch,
  useAdminInvalidate,
} from "@/components/admin/hooks/useAdminFetch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/useUserProfile";
import type {
  PatientJourney,
  PatientJourneyIntakeSource,
  PatientJourneyStatus,
  PatientJourneyStep,
  PatientJourneyStepStatus,
} from "@/server/modules/patientJourneys/module";
import {
  WorkspaceEmptyState,
  WorkspaceFilterBar,
  WorkspacePageHeader,
  WorkspacePanel,
} from "@/components/workspaces/WorkspacePrimitives";

const QUERY_KEY = ["admin", "patient-journeys"] as const;
const JOURNEY_STATUSES: PatientJourneyStatus[] = [
  "active",
  "completed",
  "cancelled",
];
const STEP_STATUSES: PatientJourneyStepStatus[] = [
  "not_started",
  "in_progress",
  "blocked",
  "completed",
  "cancelled",
];

type StatusFilter = "all" | PatientJourneyStatus;
type AssignmentFilter = "all" | "me" | "unassigned";

type StepDraft = {
  title: string;
  description: string;
  status: PatientJourneyStepStatus;
  coordinator_notes: string;
};

type NewStepDraft = {
  title: string;
  description: string;
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "Not provided";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Not provided";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const formatLabel = (value: string) =>
  value
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

const formatProfileName = (
  profile: PatientJourney["assigned_coordinator_profile"],
) => profile?.username?.trim() || profile?.email?.trim() || null;

const formatSourceType = (
  sourceType: PatientJourneyIntakeSource["source_type"],
) => {
  switch (sourceType) {
    case "consultation_request":
      return "Consultation Request";
    case "start_journey_submission":
      return "Start Your Journey";
    case "contact_request":
    default:
      return "Contact Request";
  }
};

const getSourceQueueHref = (
  sourceType: PatientJourneyIntakeSource["source_type"],
  baseNamespace: string,
  sourceId: string,
) => {
  if (sourceType === "start_journey_submission") {
    return `${baseNamespace}/requests?tab=start-journey&submissionId=${sourceId}`;
  }

  const tab = sourceType === "contact_request" ? "contact" : "consultation";
  return `${baseNamespace}/requests?tab=${tab}&requestId=${sourceId}`;
};

const compact = (values: Array<string | null | undefined>) =>
  values.filter((value): value is string => Boolean(value?.trim()));

const makeStepDrafts = (journey: PatientJourney | null) => {
  const drafts: Record<string, StepDraft> = {};
  for (const step of journey?.steps ?? []) {
    drafts[step.id] = {
      title: step.title,
      description: step.description ?? "",
      status: step.status,
      coordinator_notes: step.coordinator_notes ?? "",
    };
  }
  return drafts;
};

export default function AdminPatientJourneysPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const baseNamespace = pathname.startsWith("/operations")
    ? "/operations"
    : "/admin";
  const initialJourneyId = searchParams.get("journeyId");
  const initialAssignment =
    searchParams.get("assigned") === "me" ||
    searchParams.get("assigned") === "unassigned"
      ? (searchParams.get("assigned") as AssignmentFilter)
      : "all";
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [assignmentFilter, setAssignmentFilter] =
    useState<AssignmentFilter>(initialAssignment);
  const [selectedJourneyId, setSelectedJourneyId] = useState<string | null>(
    initialJourneyId,
  );
  const [stepDrafts, setStepDrafts] = useState<Record<string, StepDraft>>({});
  const [newStepDraft, setNewStepDraft] = useState<NewStepDraft>({
    title: "",
    description: "",
  });
  const [savingStepId, setSavingStepId] = useState<string | null>(null);
  const [savingJourneyId, setSavingJourneyId] = useState<string | null>(null);
  const [reorderingStepId, setReorderingStepId] = useState<string | null>(null);
  const { profile } = useUserProfile();
  const { toast } = useToast();
  const invalidate = useAdminInvalidate();

  const canManage =
    profile?.hasPermission("operations.patient_journeys.manage") ?? false;
  const canUpdateAssignedSteps =
    profile?.hasPermission(
      "operations.patient_journey_steps.update_assigned",
    ) ?? false;
  const canEditSteps = canManage || canUpdateAssignedSteps;
  const canOpenSourceQueue = (
    sourceType: PatientJourneyIntakeSource["source_type"],
  ) =>
    sourceType === "start_journey_submission"
      ? (profile?.hasPermission("operations.start_journey") ?? false)
      : (profile?.hasPermission("operations.requests") ?? false);

  const journeysQuery = useQuery({
    queryKey: [...QUERY_KEY, statusFilter, assignmentFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      if (assignmentFilter === "me") {
        params.set("assignedTo", "me");
      } else if (assignmentFilter === "unassigned") {
        params.set("assignedTo", "unassigned");
      }
      const query = params.toString();
      return adminFetch<PatientJourney[]>(
        `/api/admin/patient-journeys${query ? `?${query}` : ""}`,
      );
    },
  });

  const journeys = useMemo(
    () => journeysQuery.data ?? [],
    [journeysQuery.data],
  );
  const selectedJourneyFromList = useMemo(
    () => journeys.find((journey) => journey.id === selectedJourneyId) ?? null,
    [journeys, selectedJourneyId],
  );
  const selectedJourneyQuery = useQuery({
    queryKey: [...QUERY_KEY, "detail", selectedJourneyId],
    queryFn: () =>
      adminFetch<PatientJourney>(
        `/api/admin/patient-journeys/${selectedJourneyId}`,
      ),
    enabled: Boolean(selectedJourneyId && !selectedJourneyFromList),
  });
  const selectedJourney = useMemo(() => {
    if (selectedJourneyId) {
      return selectedJourneyFromList ?? selectedJourneyQuery.data ?? null;
    }
    return journeys[0] ?? null;
  }, [
    journeys,
    selectedJourneyFromList,
    selectedJourneyId,
    selectedJourneyQuery.data,
  ]);
  const selectedJourneyIsActive = selectedJourney?.status === "active";

  useEffect(() => {
    setNewStepDraft({ title: "", description: "" });
  }, [selectedJourney?.id]);

  useEffect(() => {
    setStepDrafts(makeStepDrafts(selectedJourney));
  }, [selectedJourney]);

  const updateJourney = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<
        Pick<PatientJourney, "status" | "assigned_coordinator_profile_id">
      >;
    }) =>
      adminFetch<PatientJourney>(`/api/admin/patient-journeys/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (journey) => {
      invalidate(QUERY_KEY);
      setSelectedJourneyId(journey.id);
      toast({ title: "Journey updated" });
    },
    onError: (error: Error) => {
      toast({
        title: "Journey update failed",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => setSavingJourneyId(null),
  });

  const updateStep = useMutation({
    mutationFn: ({
      journeyId,
      stepId,
      data,
    }: {
      journeyId: string;
      stepId: string;
      data: Partial<StepDraft>;
    }) =>
      adminFetch<PatientJourney>(
        `/api/admin/patient-journeys/${journeyId}/steps/${stepId}`,
        {
          method: "PATCH",
          body: JSON.stringify(data),
        },
      ),
    onSuccess: (journey) => {
      invalidate(QUERY_KEY);
      setSelectedJourneyId(journey.id);
      setStepDrafts(makeStepDrafts(journey));
      toast({ title: "Step updated" });
    },
    onError: (error: Error) => {
      toast({
        title: "Step update failed",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => setSavingStepId(null),
  });

  const createStep = useMutation({
    mutationFn: ({
      journeyId,
      data,
    }: {
      journeyId: string;
      data: NewStepDraft;
    }) =>
      adminFetch<PatientJourney>(
        `/api/admin/patient-journeys/${journeyId}/steps`,
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      ),
    onSuccess: (journey) => {
      invalidate(QUERY_KEY);
      setSelectedJourneyId(journey.id);
      setStepDrafts(makeStepDrafts(journey));
      setNewStepDraft({ title: "", description: "" });
      toast({ title: "Step added" });
    },
    onError: (error: Error) => {
      toast({
        title: "Unable to add step",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const reorderSteps = useMutation({
    mutationFn: ({
      journeyId,
      orderedStepIds,
    }: {
      journeyId: string;
      orderedStepIds: string[];
    }) =>
      adminFetch<PatientJourney>(
        `/api/admin/patient-journeys/${journeyId}/steps`,
        {
          method: "PATCH",
          body: JSON.stringify({ orderedStepIds }),
        },
      ),
    onSuccess: (journey) => {
      invalidate(QUERY_KEY);
      setSelectedJourneyId(journey.id);
      setStepDrafts(makeStepDrafts(journey));
      toast({ title: "Steps reordered" });
    },
    onError: (error: Error) => {
      toast({
        title: "Unable to reorder steps",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => setReorderingStepId(null),
  });

  const handleAssignmentFilterChange = (value: AssignmentFilter) => {
    setAssignmentFilter(value);
    const params = new URLSearchParams(searchParams);
    if (value === "all") {
      params.delete("assigned");
    } else {
      params.set("assigned", value);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  const updateDraft = (step: PatientJourneyStep, patch: Partial<StepDraft>) => {
    setStepDrafts((current) => ({
      ...current,
      [step.id]: {
        title: step.title,
        description: step.description ?? "",
        status: step.status,
        coordinator_notes: step.coordinator_notes ?? "",
        ...(current[step.id] ?? {}),
        ...patch,
      },
    }));
  };

  const saveStep = (step: PatientJourneyStep) => {
    if (!selectedJourney) return;
    const draft = stepDrafts[step.id];
    if (!draft) return;

    setSavingStepId(step.id);
    updateStep.mutate({
      journeyId: selectedJourney.id,
      stepId: step.id,
      data: canManage
        ? draft
        : {
            status: draft.status,
            coordinator_notes: draft.coordinator_notes,
          },
    });
  };

  const addStep = () => {
    if (!selectedJourney) return;
    const title = newStepDraft.title.trim();
    if (title.length === 0) {
      toast({
        title: "Step title required",
        description: "Add a title before creating a journey step.",
        variant: "destructive",
      });
      return;
    }

    createStep.mutate({
      journeyId: selectedJourney.id,
      data: {
        title,
        description: newStepDraft.description,
      },
    });
  };

  const moveStep = (stepId: string, direction: "up" | "down") => {
    if (!selectedJourney) return;
    const steps = [...(selectedJourney.steps ?? [])].sort(
      (a, b) => a.position - b.position,
    );
    const currentIndex = steps.findIndex((step) => step.id === stepId);
    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (
      currentIndex < 0 ||
      targetIndex < 0 ||
      targetIndex >= steps.length ||
      reorderSteps.isPending
    ) {
      return;
    }

    const reorderedSteps = [...steps];
    [reorderedSteps[currentIndex], reorderedSteps[targetIndex]] = [
      reorderedSteps[targetIndex],
      reorderedSteps[currentIndex],
    ];

    setReorderingStepId(stepId);
    reorderSteps.mutate({
      journeyId: selectedJourney.id,
      orderedStepIds: reorderedSteps.map((step) => step.id),
    });
  };

  return (
    <div className="space-y-8">
      <WorkspacePageHeader
        breadcrumb="Operations"
        title="Patient Journeys"
        subtitle="Staff-only journey plans for account manager ownership and assigned coordinator execution."
      />

      <WorkspacePanel
        title="Journey workspace"
        description={
          journeys.length === 0
            ? "No journeys match the current filters."
            : `${journeys.length} journey${journeys.length === 1 ? "" : "s"} in view.`
        }
        contentClassName="space-y-6"
      >
        <WorkspaceFilterBar className="gap-4 xl:flex-row xl:items-center xl:justify-between">
          <p className="max-w-[42rem] text-sm leading-6 text-muted-foreground">
            Account Managers can assign and close journeys. Coordinators can
            update status and execution notes on assigned steps.
          </p>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end xl:flex-nowrap">
            <Select
              value={assignmentFilter}
              onValueChange={(value) =>
                handleAssignmentFilterChange(value as AssignmentFilter)
              }
              disabled={!canManage}
            >
              <SelectTrigger className="h-11 w-full min-w-0 rounded-xl bg-background/85 sm:w-[190px]">
                <SelectValue placeholder="Filter assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All assignees</SelectItem>
                <SelectItem value="me">Assigned to me</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as StatusFilter)}
            >
              <SelectTrigger className="h-11 w-full min-w-0 rounded-xl bg-background/85 sm:w-[190px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {JOURNEY_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {formatLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              className="size-11 shrink-0 rounded-xl self-end sm:self-auto"
              disabled={journeysQuery.isFetching}
              onClick={() => journeysQuery.refetch()}
              aria-label="Refresh patient journeys"
            >
              {journeysQuery.isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </WorkspaceFilterBar>

        {journeysQuery.isLoading ||
        (selectedJourneyId && selectedJourneyQuery.isLoading) ? (
          <div className="flex min-h-[240px] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : journeysQuery.isError || selectedJourneyQuery.isError ? (
          <WorkspaceEmptyState
            title="Unable to load patient journeys"
            description="Refresh the workspace or inspect the patient journeys API."
            icon={<Route className="h-6 w-6" />}
          />
        ) : journeys.length === 0 && !selectedJourney ? (
          <WorkspaceEmptyState
            title="No journeys found"
            description="Start a journey from a request or Start Journey submission to create a plan."
            icon={<Route className="h-6 w-6" />}
          />
        ) : (
          <div className="grid gap-5 xl:grid-cols-[minmax(280px,360px)_1fr]">
            <div className="space-y-3">
              {journeys.map((journey) => {
                const patientName = journey.patient?.full_name ?? "Patient";
                const coordinator = formatProfileName(
                  journey.assigned_coordinator_profile,
                );
                return (
                  <button
                    key={journey.id}
                    type="button"
                    onClick={() => {
                      setSelectedJourneyId(journey.id);
                      router.replace(
                        `${baseNamespace}/patient-journeys?journeyId=${journey.id}`,
                        { scroll: false },
                      );
                    }}
                    className={`w-full rounded-xl border p-4 text-left transition-colors ${
                      selectedJourney?.id === journey.id
                        ? "border-primary bg-primary/10"
                        : "border-border/70 bg-background/60 hover:border-border"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-foreground">
                          {patientName}
                        </p>
                        <Badge variant="outline">
                          {formatLabel(journey.status)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Started {formatDateTime(journey.started_at)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Coordinator: {coordinator ?? "Unassigned"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedJourney && (
              <div className="space-y-5">
                <div className="rounded-xl border border-border/70 bg-background/60 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-semibold text-foreground">
                          {selectedJourney.patient?.full_name ?? "Patient"}
                        </h2>
                        <Badge variant="secondary">
                          {formatLabel(selectedJourney.status)}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>
                          {selectedJourney.patient?.contact_email ?? "No email"}{" "}
                          {selectedJourney.patient?.contact_phone
                            ? `• ${selectedJourney.patient.contact_phone}`
                            : ""}
                        </p>
                        <p>
                          Account Manager:{" "}
                          {formatProfileName(
                            selectedJourney.account_manager_profile,
                          ) ?? "Unassigned"}
                        </p>
                        <p>
                          Sources linked: {selectedJourney.sources?.length ?? 0}
                        </p>
                      </div>
                    </div>

                    <div className="flex w-full flex-col gap-3 lg:w-64">
                      {canManage && (
                        <>
                          <AssignmentControl
                            assigneeId={
                              selectedJourney.assigned_coordinator_profile_id
                            }
                            assigneeLabel={formatProfileName(
                              selectedJourney.assigned_coordinator_profile,
                            )}
                            assigneeDescription={
                              selectedJourney.assigned_coordinator_profile
                                ?.job_title ??
                              selectedJourney.assigned_coordinator_profile
                                ?.email ??
                              null
                            }
                            allowedRoles={["coordinator"]}
                            onAssign={(memberId) => {
                              setSavingJourneyId(selectedJourney.id);
                              updateJourney.mutate({
                                id: selectedJourney.id,
                                data: {
                                  assigned_coordinator_profile_id: memberId,
                                },
                              });
                            }}
                            isPending={savingJourneyId === selectedJourney.id}
                            disabled={!selectedJourneyIsActive}
                            triggerClassName="h-10 w-full justify-start rounded-xl"
                            placeholder="Assign coordinator"
                          />
                          <Select
                            value={selectedJourney.status}
                            disabled={
                              !selectedJourneyIsActive ||
                              savingJourneyId === selectedJourney.id
                            }
                            onValueChange={(status) => {
                              setSavingJourneyId(selectedJourney.id);
                              updateJourney.mutate({
                                id: selectedJourney.id,
                                data: {
                                  status: status as PatientJourneyStatus,
                                },
                              });
                            }}
                          >
                            <SelectTrigger className="h-10 w-full rounded-xl bg-background/85">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {JOURNEY_STATUSES.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {formatLabel(status)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border/70 bg-background/60 p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        Intake Sources
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Original intake records linked to this journey.
                      </p>
                    </div>
                    <Badge variant="outline">
                      {selectedJourney.intake_sources?.length ??
                        selectedJourney.sources?.length ??
                        0}{" "}
                      linked
                    </Badge>
                  </div>

                  {selectedJourney.intake_sources &&
                  selectedJourney.intake_sources.length > 0 ? (
                    <div className="mt-4 grid gap-3">
                      {selectedJourney.intake_sources.map((source) => {
                        const details = compact([
                          source.treatment,
                          source.procedure,
                        ]).join(" - ");
                        const meta = compact([
                          source.email,
                          source.phone,
                          source.country,
                        ]);
                        const hasQueueAccess = canOpenSourceQueue(
                          source.source_type,
                        );
                        return (
                          <div
                            key={source.id}
                            className="rounded-xl border border-border/60 bg-background/70 p-4"
                          >
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                              <div className="min-w-0 space-y-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge variant="secondary">
                                    {formatSourceType(source.source_type)}
                                  </Badge>
                                  {source.status && (
                                    <Badge
                                      variant="outline"
                                      className="capitalize"
                                    >
                                      {formatLabel(source.status)}
                                    </Badge>
                                  )}
                                  {source.documents_count > 0 && (
                                    <Badge variant="outline">
                                      {source.documents_count} document
                                      {source.documents_count === 1 ? "" : "s"}
                                    </Badge>
                                  )}
                                  {source.missing_source && (
                                    <Badge variant="destructive">
                                      Source missing
                                    </Badge>
                                  )}
                                </div>
                                <div className="space-y-1">
                                  <p className="font-medium text-foreground">
                                    {source.full_name ?? "Unnamed intake"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Received{" "}
                                    {formatDateTime(source.source_created_at)}
                                  </p>
                                  {meta.length > 0 && (
                                    <p className="text-sm text-muted-foreground">
                                      {meta.join(" • ")}
                                    </p>
                                  )}
                                </div>
                                {details && (
                                  <div>
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground/80">
                                      Treatment
                                    </p>
                                    <p className="text-sm text-foreground">
                                      {details}
                                    </p>
                                  </div>
                                )}
                                {source.medical_context && (
                                  <div>
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground/80">
                                      Medical context
                                    </p>
                                    <p className="whitespace-pre-line text-sm text-muted-foreground">
                                      {source.medical_context}
                                    </p>
                                  </div>
                                )}
                                {source.message && (
                                  <div>
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground/80">
                                      Message
                                    </p>
                                    <p className="whitespace-pre-line text-sm text-muted-foreground">
                                      {source.message}
                                    </p>
                                  </div>
                                )}
                                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                  {source.budget_range && (
                                    <Badge
                                      variant="outline"
                                      className="font-normal"
                                    >
                                      Budget: {source.budget_range}
                                    </Badge>
                                  )}
                                  {source.travel_window && (
                                    <Badge
                                      variant="outline"
                                      className="font-normal"
                                    >
                                      Timeline: {source.travel_window}
                                    </Badge>
                                  )}
                                  {source.companions && (
                                    <Badge
                                      variant="outline"
                                      className="font-normal"
                                    >
                                      Companions: {source.companions}
                                    </Badge>
                                  )}
                                  {source.contact_preference && (
                                    <Badge
                                      variant="outline"
                                      className="font-normal"
                                    >
                                      Prefers: {source.contact_preference}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              {hasQueueAccess ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-10 rounded-xl lg:shrink-0"
                                  onClick={() =>
                                    router.push(
                                      getSourceQueueHref(
                                        source.source_type,
                                        baseNamespace,
                                        source.source_id,
                                      ),
                                    )
                                  }
                                >
                                  Open queue
                                </Button>
                              ) : (
                                <p className="rounded-xl border border-dashed border-border/70 px-3 py-2 text-xs text-muted-foreground lg:max-w-44 lg:shrink-0">
                                  Queue access is restricted for this role.
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-4 rounded-xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                      No intake source details are available for this journey.
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  {(selectedJourney.steps ?? []).map((step, index) => {
                    const draft = stepDrafts[step.id] ?? {
                      title: step.title,
                      description: step.description ?? "",
                      status: step.status,
                      coordinator_notes: step.coordinator_notes ?? "",
                    };
                    const isSaving =
                      updateStep.isPending && savingStepId === step.id;
                    const isReordering =
                      reorderSteps.isPending && reorderingStepId === step.id;
                    const stepCount = selectedJourney.steps?.length ?? 0;
                    const canEditCurrentStep =
                      canEditSteps && selectedJourney.status === "active";

                    return (
                      <div
                        key={step.id}
                        className="rounded-xl border border-border/70 bg-background/60 p-5"
                      >
                        <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline">
                                Step {step.position}
                              </Badge>
                              <Badge variant="secondary">
                                {formatLabel(draft.status)}
                              </Badge>
                              {step.completed_at && (
                                <span className="text-xs text-muted-foreground">
                                  Completed {formatDateTime(step.completed_at)}
                                </span>
                              )}
                            </div>
                            {canManage ? (
                              <>
                                <Input
                                  value={draft.title}
                                  onChange={(event) =>
                                    updateDraft(step, {
                                      title: event.target.value,
                                    })
                                  }
                                  disabled={!selectedJourneyIsActive}
                                  className="h-10 rounded-xl bg-background/85 font-semibold"
                                />
                                <Textarea
                                  value={draft.description}
                                  onChange={(event) =>
                                    updateDraft(step, {
                                      description: event.target.value,
                                    })
                                  }
                                  rows={3}
                                  disabled={!selectedJourneyIsActive}
                                  className="rounded-xl bg-background/85"
                                />
                              </>
                            ) : (
                              <>
                                <h3 className="font-semibold text-foreground">
                                  {step.title}
                                </h3>
                                {step.description && (
                                  <p className="text-sm text-muted-foreground">
                                    {step.description}
                                  </p>
                                )}
                              </>
                            )}
                            <Textarea
                              value={draft.coordinator_notes}
                              onChange={(event) =>
                                updateDraft(step, {
                                  coordinator_notes: event.target.value,
                                })
                              }
                              placeholder="Coordinator execution notes..."
                              rows={3}
                              disabled={!canEditCurrentStep}
                              className="rounded-xl bg-background/85"
                            />
                          </div>

                          <div className="space-y-3">
                            {canManage && stepCount > 1 && (
                              <div className="grid grid-cols-2 gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-10 w-full rounded-xl"
                                  onClick={() => moveStep(step.id, "up")}
                                  disabled={
                                    !selectedJourneyIsActive ||
                                    index === 0 ||
                                    reorderSteps.isPending
                                  }
                                  aria-label={`Move step ${step.position} up`}
                                >
                                  {isReordering ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <ArrowUp className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-10 w-full rounded-xl"
                                  onClick={() => moveStep(step.id, "down")}
                                  disabled={
                                    !selectedJourneyIsActive ||
                                    index === stepCount - 1 ||
                                    reorderSteps.isPending
                                  }
                                  aria-label={`Move step ${step.position} down`}
                                >
                                  {isReordering ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <ArrowDown className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            )}
                            <Select
                              value={draft.status}
                              disabled={!canEditCurrentStep}
                              onValueChange={(status) =>
                                updateDraft(step, {
                                  status: status as PatientJourneyStepStatus,
                                })
                              }
                            >
                              <SelectTrigger className="h-10 rounded-xl bg-background/85">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {STEP_STATUSES.map((status) => (
                                  <SelectItem key={status} value={status}>
                                    {formatLabel(status)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {canEditCurrentStep && (
                              <Button
                                className="h-10 w-full rounded-xl"
                                onClick={() => saveStep(step)}
                                disabled={isSaving}
                              >
                                {isSaving ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving
                                  </>
                                ) : (
                                  "Save Step"
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {canManage && selectedJourneyIsActive && (
                    <div className="rounded-xl border border-dashed border-border/70 bg-background/50 p-5">
                      <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">
                              Step {(selectedJourney.steps?.length ?? 0) + 1}
                            </Badge>
                            <Badge variant="secondary">New Step</Badge>
                          </div>
                          <Input
                            value={newStepDraft.title}
                            onChange={(event) =>
                              setNewStepDraft((current) => ({
                                ...current,
                                title: event.target.value,
                              }))
                            }
                            placeholder="Step title"
                            className="h-10 rounded-xl bg-background/85 font-semibold"
                          />
                          <Textarea
                            value={newStepDraft.description}
                            onChange={(event) =>
                              setNewStepDraft((current) => ({
                                ...current,
                                description: event.target.value,
                              }))
                            }
                            placeholder="Describe the work, handoff, or milestone for this step..."
                            rows={3}
                            className="rounded-xl bg-background/85"
                          />
                        </div>
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground">
                            Add custom journey steps when the template does not
                            cover the patient&apos;s case.
                          </p>
                          <Button
                            className="h-10 w-full rounded-xl"
                            onClick={addStep}
                            disabled={createStep.isPending}
                          >
                            {createStep.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Adding
                              </>
                            ) : (
                              <>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Step
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </WorkspacePanel>
    </div>
  );
}
