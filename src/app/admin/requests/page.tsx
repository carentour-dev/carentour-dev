"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FileQuestion, Inbox, Loader2, RefreshCcw } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AssignmentControl } from "@/components/admin/AssignmentControl";
import { PatientSelector } from "@/components/admin/PatientSelector";
import {
  adminFetch,
  useAdminInvalidate,
} from "@/components/admin/hooks/useAdminFetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import type { Database, Tables } from "@/integrations/supabase/types";

type ContactRequestRow = Tables<"contact_requests">;
type ContactRequest = ContactRequestRow & {
  assigned_profile?: {
    id: string;
    username: string | null;
    avatar_url: string | null;
    email: string | null;
    job_title: string | null;
  } | null;
  assigned_secure_profile?: {
    id: string | null;
    username: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
};
type ContactRequestStatus = ContactRequest["status"];
type StatusFilter = (typeof STATUS_OPTIONS)[number]["value"];
type RequestTab = "contact" | "consultation";
type PatientConsultationRow =
  Database["public"]["Tables"]["patient_consultations"]["Row"] & {
    contact_requests?: Pick<
      ContactRequest,
      "id" | "status" | "request_type" | "origin"
    > | null;
  };

const isRecord = (value: unknown): value is Record<string, unknown | null> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const coerceArchivedFlag = (value: unknown): boolean => {
  if (value === true) return true;

  if (typeof value === "number") {
    return value === 1;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (
      normalized === "true" ||
      normalized === "1" ||
      normalized === "archived"
    ) {
      return true;
    }
    try {
      const parsed = JSON.parse(value);
      return coerceArchivedFlag(parsed);
    } catch {
      // fall through to substring heuristics below
    }
  }

  if (Array.isArray(value)) {
    return value.some((item) => coerceArchivedFlag(item));
  }

  if (isRecord(value)) {
    if ("archived" in value) {
      return coerceArchivedFlag(value.archived);
    }
    if ("is_archived" in value) {
      return coerceArchivedFlag(value.is_archived);
    }
    if (typeof value.status === "string") {
      return value.status.trim().toLowerCase() === "archived";
    }
    if (typeof value.state === "string") {
      return value.state.trim().toLowerCase() === "archived";
    }
    if (
      Array.isArray(value.flags) &&
      value.flags.some((flag) => coerceArchivedFlag(flag))
    ) {
      return true;
    }
    if (
      Array.isArray(value.tags) &&
      value.tags.some((tag) => coerceArchivedFlag(tag))
    ) {
      return true;
    }
  }

  if (value == null) {
    return false;
  }

  const serialized =
    typeof value === "string"
      ? value.toLowerCase()
      : JSON.stringify(value).toLowerCase();

  if (
    /"archived"\s*:\s*(true|"true"|1|"1")/.test(serialized) ||
    /"flags"\s*:\s*\[[^\]]*"archived"/.test(serialized) ||
    /"tags"\s*:\s*\[[^\]]*"archived"/.test(serialized)
  ) {
    return true;
  }

  return false;
};

const STATUS_LABELS: Record<ContactRequestStatus, string> = {
  new: "New",
  in_progress: "In Progress",
  resolved: "Resolved",
};

const STATUS_OPTIONS: Array<{
  value: "all" | ContactRequestStatus;
  label: string;
}> = [
  { value: "all", label: "All requests" },
  { value: "new", label: STATUS_LABELS.new },
  { value: "in_progress", label: STATUS_LABELS.in_progress },
  { value: "resolved", label: STATUS_LABELS.resolved },
];

const REQUEST_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "general", label: "General inquiry" },
  { value: "consultation", label: "Consultation intake" },
  { value: "start_journey", label: "Start Journey intake" },
];

const QUERY_KEY = ["admin", "contact-requests"] as const;

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "Not provided";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return "Not provided";
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const capitalize = (value: string | null) => {
  if (!value) return "General";
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};

type AssignmentFilter = "all" | "me" | "unassigned";

const ASSIGNMENT_FILTER_OPTIONS: Array<{
  value: AssignmentFilter;
  label: string;
}> = [
  { value: "all", label: "All assignees" },
  { value: "me", label: "Assigned to me" },
  { value: "unassigned", label: "Unassigned" },
];

const formatAssignee = (
  record: Pick<
    ContactRequest,
    "assigned_to" | "assigned_profile" | "assigned_secure_profile"
  >,
) => {
  const profile = record.assigned_profile;
  if (profile?.id) {
    const label =
      profile.username?.trim() ??
      profile.email?.split("@")[0]?.trim() ??
      "Team member";
    const description = profile.job_title ?? profile.email ?? null;
    return {
      id: record.assigned_to ?? profile.id,
      label,
      description,
    };
  }

  const secureProfile = record.assigned_secure_profile;
  if (secureProfile?.id) {
    const label =
      secureProfile.username?.trim() ??
      secureProfile.email?.split("@")[0]?.trim() ??
      "Team member";
    const description = secureProfile.email ?? null;
    return {
      id: record.assigned_to ?? secureProfile.id ?? null,
      label,
      description,
    };
  }

  if (record.assigned_to) {
    return {
      id: record.assigned_to,
      label: "Assigned",
      description: record.assigned_to.slice(0, 8),
    };
  }

  return {
    id: null,
    label: null,
    description: null,
  };
};

export default function AdminRequestsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const baseNamespace = pathname.startsWith("/operations")
    ? "/operations"
    : "/admin";
  const patientsPath = `${baseNamespace}/patients`;
  const consultationsPath = `${baseNamespace}/consultations`;
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<RequestTab>("consultation");
  const initialAssignmentParam = searchParams.get("assigned");
  const initialAssignmentFilter: AssignmentFilter =
    initialAssignmentParam === "me" || initialAssignmentParam === "unassigned"
      ? (initialAssignmentParam as AssignmentFilter)
      : "all";
  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentFilter>(
    initialAssignmentFilter,
  );
  const [statusFilters, setStatusFilters] = useState<
    Record<RequestTab, StatusFilter>
  >({
    contact: "all",
    consultation: "all",
  });
  const [notesDraft, setNotesDraft] = useState("");
  const [requestTypeDraft, setRequestTypeDraft] = useState("general");
  const [customRequestType, setCustomRequestType] = useState("");
  const [patientIdDraft, setPatientIdDraft] = useState<string | null>(null);
  const [activeRequest, setActiveRequest] = useState<ContactRequest | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [archiveOverrides, setArchiveOverrides] = useState<
    Record<string, boolean>
  >({});
  const [showArchivedOnly, setShowArchivedOnly] = useState(false);

  const { toast } = useToast();
  const invalidate = useAdminInvalidate();

  useEffect(() => {
    const param = searchParams.get("assigned");
    const nextFilter: AssignmentFilter =
      param === "me" || param === "unassigned"
        ? (param as AssignmentFilter)
        : "all";
    setAssignmentFilter((prev) => (prev === nextFilter ? prev : nextFilter));
  }, [searchParams]);

  const handleAssignmentFilterChange = (value: AssignmentFilter) => {
    setAssignmentFilter(value);
    const params = new URLSearchParams(searchParams);
    if (value === "all") {
      params.delete("assigned");
    } else {
      params.set("assigned", value);
    }
    const query = params.toString();
    const target = query ? `${pathname}?${query}` : pathname;
    router.replace(target, { scroll: false });
  };

  const consultationStatus: StatusFilter = showArchivedOnly
    ? "all"
    : statusFilters.consultation;
  const contactStatus: StatusFilter = showArchivedOnly
    ? "all"
    : statusFilters.contact;

  const fetchRequests = async (
    status: StatusFilter,
    requestType?: string,
    assignment: AssignmentFilter = "all",
  ) => {
    const params = new URLSearchParams();
    if (status !== "all") {
      params.set("status", status);
    }
    if (requestType) {
      params.set("requestType", requestType);
    }
    if (assignment === "me") {
      params.set("assignedTo", "me");
    } else if (assignment === "unassigned") {
      params.set("assignedTo", "unassigned");
    }
    const query = params.toString();
    return adminFetch<ContactRequest[]>(
      `/api/admin/requests${query ? `?${query}` : ""}`,
    );
  };

  const contactQuery = useQuery({
    queryKey: [
      ...QUERY_KEY,
      "contact",
      contactStatus,
      showArchivedOnly,
      assignmentFilter,
    ],
    queryFn: () => fetchRequests(contactStatus, undefined, assignmentFilter),
  });

  const consultationQuery = useQuery({
    queryKey: [
      ...QUERY_KEY,
      "consultation",
      consultationStatus,
      showArchivedOnly,
      assignmentFilter,
    ],
    queryFn: () =>
      fetchRequests(consultationStatus, "consultation", assignmentFilter),
  });

  useEffect(() => {
    setArchiveOverrides((prev) => {
      if (
        Object.keys(prev).length === 0 &&
        !contactQuery.data &&
        !consultationQuery.data
      ) {
        return prev;
      }

      const combined = [
        ...(consultationQuery.data ?? []),
        ...(contactQuery.data ?? []),
      ];

      if (combined.length === 0 && Object.keys(prev).length === 0) {
        return prev;
      }

      const next: Record<string, boolean> = { ...prev };
      let changed = false;

      for (const [id, overrideValue] of Object.entries(prev)) {
        const matching = combined.find((request) => request.id === id);
        if (!matching) {
          delete next[id];
          changed = true;
          continue;
        }

        if (isArchived(matching) === overrideValue) {
          delete next[id];
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [contactQuery.data, consultationQuery.data]);

  const updateRequest = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<
        Pick<
          ContactRequest,
          | "status"
          | "notes"
          | "request_type"
          | "patient_id"
          | "portal_metadata"
          | "assigned_to"
        >
      >;
    }) =>
      adminFetch<ContactRequest>(`/api/admin/requests/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (request) => {
      invalidate(QUERY_KEY);
      setActiveRequest(request);
      setRequestTypeDraft(request.request_type ?? "general");
      setCustomRequestType(
        REQUEST_TYPE_OPTIONS.some(
          (option) => option.value === (request.request_type ?? ""),
        )
          ? ""
          : (request.request_type ?? ""),
      );
      setPatientIdDraft(request.patient_id ?? null);
      toast({
        title: "Request updated",
        description: `Status: ${STATUS_LABELS[request.status]} · Type: ${capitalize(request.request_type)}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setUpdatingId(null);
    },
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setActiveRequest(null);
    setNotesDraft("");
    setRequestTypeDraft("general");
    setCustomRequestType("");
    setPatientIdDraft(null);
  };

  const openDialogFor = (request: ContactRequest) => {
    setActiveRequest(request);
    setNotesDraft(request.notes ?? "");
    const inferredType = request.request_type ?? "general";
    setRequestTypeDraft(inferredType);
    setCustomRequestType(
      REQUEST_TYPE_OPTIONS.some((option) => option.value === inferredType)
        ? ""
        : inferredType,
    );
    setPatientIdDraft(request.patient_id ?? null);
    setDialogOpen(true);
  };

  const handleStatusChange = async (
    requestId: string,
    status: ContactRequestStatus,
  ) => {
    setUpdatingId(requestId);
    await updateRequest.mutateAsync({ id: requestId, data: { status } });
  };

  const handleSaveDetails = async () => {
    if (!activeRequest) return;
    const trimmedType = requestTypeDraft.trim();
    const normalizedType = trimmedType.length > 0 ? trimmedType : "general";
    const trimmedNotes = notesDraft.trim();
    const existingNotes = activeRequest.notes ?? "";
    let notesPayload: string | undefined;
    const patientPayload = patientIdDraft ?? null;

    if (trimmedNotes.length > 0) {
      notesPayload = trimmedNotes;
    } else if (existingNotes.trim().length > 0 && trimmedNotes.length === 0) {
      // sending an empty string signals the API to clear the notes
      notesPayload = "";
    }

    setUpdatingId(activeRequest.id);
    await updateRequest.mutateAsync({
      id: activeRequest.id,
      data: {
        notes: notesPayload,
        request_type: normalizedType,
        patient_id: patientPayload,
      },
    });
    closeDialog();
  };

  const deleteRequest = useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/api/admin/requests/${id}`, {
        method: "DELETE",
      }),
    onMutate: (id) => {
      setDeletingId(id);
    },
    onSuccess: (_result, id) => {
      invalidate(QUERY_KEY);
      if (activeRequest?.id === id) {
        closeDialog();
      }
      toast({ title: "Request deleted" });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setDeletingId(null);
    },
  });

  const isArchived = (request: ContactRequest) => {
    if (coerceArchivedFlag(request.portal_metadata)) {
      return true;
    }
    return false;
  };

  const getArchivedState = (request: ContactRequest) => {
    const override = archiveOverrides[request.id];
    if (override !== undefined) {
      return override;
    }
    return isArchived(request);
  };

  const handleArchiveToggle = async (request: ContactRequest) => {
    const currentlyArchived = getArchivedState(request);
    const nextArchived = !currentlyArchived;
    setArchiveOverrides((prev) => ({
      ...prev,
      [request.id]: nextArchived,
    }));

    const existingMetadata = isRecord(request.portal_metadata)
      ? { ...request.portal_metadata }
      : {};

    if (nextArchived) {
      existingMetadata.archived = true;
    } else {
      delete existingMetadata.archived;
      delete existingMetadata.is_archived;
    }

    const nextMetadata =
      Object.keys(existingMetadata).length > 0
        ? (existingMetadata as ContactRequest["portal_metadata"])
        : null;

    setUpdatingId(request.id);
    try {
      await updateRequest.mutateAsync({
        id: request.id,
        data: { portal_metadata: nextMetadata },
      });
    } catch {
      setArchiveOverrides((prev) => ({
        ...prev,
        [request.id]: currentlyArchived,
      }));
    }
  };

  const handleDelete = (id: string) => {
    deleteRequest.mutate(id);
  };

  const handleAssignmentChange = async (
    request: ContactRequest,
    assigneeId: string | null,
  ) => {
    const normalizedAssignee = assigneeId ?? null;
    if (request.assigned_to === normalizedAssignee) {
      return;
    }

    setUpdatingId(request.id);
    await updateRequest.mutateAsync({
      id: request.id,
      data: { assigned_to: normalizedAssignee },
    });
  };

  const matchesArchiveView = (request: ContactRequest) => {
    const archived = getArchivedState(request);
    return showArchivedOnly ? archived : !archived;
  };

  const contactRequests = (contactQuery.data ?? [])
    .filter((request) => (request.request_type ?? "general") !== "consultation")
    .filter(matchesArchiveView);
  const consultationRequests = (consultationQuery.data ?? []).filter(
    matchesArchiveView,
  );

  const selectedPatientForDialog = useMemo(
    () => patientIdDraft ?? activeRequest?.patient_id ?? null,
    [patientIdDraft, activeRequest?.patient_id],
  );

  const relatedConsultationsQuery = useQuery({
    queryKey: [...QUERY_KEY, "patient-consultations", selectedPatientForDialog],
    queryFn: () =>
      selectedPatientForDialog
        ? adminFetch<PatientConsultationRow[]>(
            `/api/admin/consultations?patientId=${encodeURIComponent(selectedPatientForDialog)}`,
          )
        : Promise.resolve([]),
    enabled: selectedPatientForDialog !== null,
    staleTime: 30_000,
  });

  const handleSchedule = (request: ContactRequest) => {
    const hasLinkedPatient = Boolean(request.patient_id);
    const isPortalRequest =
      Boolean(request.user_id) || request.origin === "portal";

    if (!hasLinkedPatient) {
      if (!isPortalRequest) {
        const params = new URLSearchParams({
          new: "1",
          fromRequestId: request.id,
        });
        if (request.first_name || request.last_name) {
          params.set(
            "fullName",
            `${request.first_name ?? ""} ${request.last_name ?? ""}`.trim(),
          );
        }
        if (request.email) {
          params.set("email", request.email);
        }
        if (request.phone) {
          params.set("phone", request.phone);
        }
        const query = params.toString();
        router.push(query ? `${patientsPath}?${query}` : patientsPath);
        return;
      }

      openDialogFor(request);
      return;
    }

    const params = new URLSearchParams({
      schedule: "1",
      contactRequestId: request.id,
      patientId: request.patient_id,
    });
    const query = params.toString();
    router.push(query ? `${consultationsPath}?${query}` : consultationsPath);
  };

  const getScheduleButtonLabel = (request: ContactRequest) => {
    const isPortalRequest =
      Boolean(request.user_id) || request.origin === "portal";
    if (!isPortalRequest && !request.patient_id) {
      return "Add Patient";
    }
    return "Schedule";
  };

  const getScheduleTooltip = (request: ContactRequest) => {
    if (!request.patient_id) {
      return Boolean(request.user_id) || request.origin === "portal"
        ? "Link this request to a patient before scheduling"
        : "Open the add patient form to capture this requester";
    }
    return "Open the scheduling form with this patient pre-filled";
  };

  const renderConsultationSummary = () => {
    if (!selectedPatientForDialog) {
      return null;
    }

    if (relatedConsultationsQuery.isLoading) {
      return (
        <div className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/10 p-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading related consultations…
        </div>
      );
    }

    if (relatedConsultationsQuery.isError) {
      return (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          Failed to load related consultations. Try again later.
        </div>
      );
    }

    const consultations = relatedConsultationsQuery.data ?? [];

    if (consultations.length === 0) {
      return (
        <div className="text-sm text-muted-foreground">
          No consultations linked to this patient yet. Scheduling will create
          the first one.
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {consultations.map((consultation) => (
          <div
            key={consultation.id}
            className="rounded-md border border-border/60 bg-muted/10 p-3 text-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">
                Consultation on {formatDateTime(consultation.scheduled_at)}
              </span>
              <Badge variant="outline" className="capitalize">
                {consultation.status.replace("_", " ")}
              </Badge>
            </div>
            {consultation.contact_request_id && (
              <p className="text-xs text-muted-foreground">
                Linked request: {consultation.contact_request_id}
              </p>
            )}
          </div>
        ))}
      </div>
    );
  };

  const updateStatusFilter = (tab: RequestTab, value: StatusFilter) => {
    setStatusFilters((prev) => ({ ...prev, [tab]: value }));
  };

  return (
    <div className="space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as RequestTab)}
        className="space-y-6"
      >
        <div className="overflow-x-auto pb-1">
          <TabsList className="inline-flex gap-2">
            <TabsTrigger
              value="consultation"
              className="whitespace-nowrap px-4"
            >
              Consultation Requests
            </TabsTrigger>
            <TabsTrigger value="contact" className="whitespace-nowrap px-4">
              Contact Form Inbox
            </TabsTrigger>
          </TabsList>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Toggle archived view to review closed requests.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={assignmentFilter}
              onValueChange={(value) =>
                handleAssignmentFilterChange(value as AssignmentFilter)
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter assignee" />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNMENT_FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Switch
                id="show-archived-toggle"
                checked={showArchivedOnly}
                onCheckedChange={(checked) => setShowArchivedOnly(checked)}
              />
              <Label
                htmlFor="show-archived-toggle"
                className="text-sm font-normal text-muted-foreground"
              >
                Show archived only
              </Label>
            </div>
          </div>
        </div>

        <TabsContent value="consultation" className="mt-6">
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Inbox className="h-5 w-5 text-primary" />
                  Consultation Requests
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Detailed intake submissions from the Get Free Consultation
                  flow for medical concierge follow-up.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Select
                  value={consultationStatus}
                  onValueChange={(value) =>
                    updateStatusFilter("consultation", value as StatusFilter)
                  }
                  disabled={showArchivedOnly}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={consultationQuery.isFetching}
                  onClick={() => consultationQuery.refetch()}
                  aria-label="Refresh consultation requests"
                >
                  {consultationQuery.isFetching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCcw className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {consultationQuery.isLoading && (
                <div className="flex min-h-[200px] items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}

              {consultationQuery.isError && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                  Failed to load consultation requests. Please try refreshing
                  the page.
                </div>
              )}

              {!consultationQuery.isLoading &&
                consultationRequests.length === 0 && (
                  <div className="rounded-md border border-dashed border-muted-foreground/30 p-8 text-center">
                    <FileQuestion className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No consultation requests match this filter yet.
                    </p>
                  </div>
                )}

              {consultationRequests.length > 0 && (
                <div className="space-y-4">
                  {consultationRequests.map((request) => {
                    const scheduleTooltip = getScheduleTooltip(request);
                    const scheduleLabel = getScheduleButtonLabel(request);
                    const archived = getArchivedState(request);
                    const archiveLabel = archived ? "Unarchive" : "Archive";
                    const assignment = formatAssignee(request);
                    const isRowUpdating =
                      updateRequest.isPending && updatingId === request.id;
                    const isRowDeleting =
                      deleteRequest.isPending && deletingId === request.id;
                    return (
                      <div
                        key={request.id}
                        className="rounded-xl border border-border/60 bg-card/60 p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md"
                      >
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex flex-1 flex-col gap-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-lg font-semibold text-foreground">
                                    {request.first_name} {request.last_name}
                                  </p>
                                  <Badge
                                    variant="secondary"
                                    className="capitalize"
                                  >
                                    {request.origin ?? "web"}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="capitalize"
                                  >
                                    {capitalize(request.request_type)}
                                  </Badge>
                                  {assignment.label && (
                                    <Badge
                                      variant="outline"
                                      className="gap-1 text-xs font-normal"
                                    >
                                      Assigned • {assignment.label}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                  <span>
                                    Received{" "}
                                    {formatDateTime(request.created_at)}
                                  </span>
                                  <span>
                                    Updated {formatDateTime(request.updated_at)}
                                  </span>
                                </div>
                                <div className="space-y-1 text-sm text-muted-foreground">
                                  <p>{request.email}</p>
                                  {request.phone && <p>{request.phone}</p>}
                                  {request.country && (
                                    <p className="uppercase">
                                      Based in {request.country}
                                    </p>
                                  )}
                                  {request.contact_preference && (
                                    <p className="font-medium text-primary">
                                      Prefers: {request.contact_preference}
                                    </p>
                                  )}
                                  {request.patient_id && (
                                    <Badge
                                      variant="outline"
                                      className="mt-1 w-fit text-xs font-normal"
                                    >
                                      Linked patient •{" "}
                                      {request.patient_id.slice(0, 8)}
                                      {request.patient_id.length > 8 ? "…" : ""}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground/80">
                                  Treatment
                                </p>
                                <p className="text-sm text-foreground">
                                  {request.treatment ?? "Not specified"}
                                </p>
                                <div className="mt-1 space-y-1 text-xs text-muted-foreground">
                                  {request.budget_range && (
                                    <div>
                                      <p className="text-xs uppercase tracking-wide text-muted-foreground/80">
                                        Budget
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {request.budget_range}
                                      </p>
                                    </div>
                                  )}
                                  {request.medical_reports && (
                                    <div>
                                      <p className="text-xs uppercase tracking-wide text-muted-foreground/80">
                                        Medical Reports
                                      </p>
                                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                                        {request.medical_reports}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {request.health_background &&
                                request.health_background.trim().length > 0 && (
                                  <div>
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground/80">
                                      Background
                                    </p>
                                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                                      {request.health_background}
                                    </p>
                                  </div>
                                )}
                              <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground/80">
                                  Travel window
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {formatDateTime(request.travel_window)}
                                </p>
                                {request.companions && (
                                  <p className="text-xs text-muted-foreground">
                                    Companion plan: {request.companions}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-stretch gap-2 md:items-end md:text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDialogFor(request)}
                            >
                              View
                            </Button>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleSchedule(request)}
                                    className="w-full"
                                  >
                                    {scheduleLabel}
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>{scheduleTooltip}</TooltipContent>
                            </Tooltip>
                            <AssignmentControl
                              assigneeId={assignment.id}
                              assigneeLabel={assignment.label}
                              assigneeDescription={assignment.description}
                              onAssign={(memberId) => {
                                void handleAssignmentChange(request, memberId);
                              }}
                              isPending={isRowUpdating}
                              disabled={isRowDeleting}
                            />
                            <div className="space-y-1 text-xs text-muted-foreground md:text-right">
                              <p className="uppercase tracking-wide text-muted-foreground/80">
                                Status
                              </p>
                              <Select
                                value={request.status}
                                onValueChange={(value) => {
                                  void handleStatusChange(
                                    request.id,
                                    value as ContactRequestStatus,
                                  );
                                }}
                                disabled={isRowUpdating || isRowDeleting}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {STATUS_OPTIONS.filter(
                                    (option) => option.value !== "all",
                                  ).map((option) => (
                                    <SelectItem
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex flex-col items-end gap-2 sm:flex-row sm:justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                className="sm:w-auto"
                                onClick={() =>
                                  void handleArchiveToggle(request)
                                }
                                disabled={
                                  (updateRequest.isPending &&
                                    updatingId === request.id) ||
                                  (deleteRequest.isPending &&
                                    deletingId === request.id)
                                }
                              >
                                {updatingId === request.id &&
                                updateRequest.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                    Updating
                                  </>
                                ) : (
                                  archiveLabel
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive sm:w-auto"
                                onClick={() => handleDelete(request.id)}
                                disabled={
                                  deleteRequest.isPending &&
                                  deletingId === request.id
                                }
                              >
                                {deletingId === request.id &&
                                deleteRequest.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                    Deleting
                                  </>
                                ) : (
                                  "Delete"
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="mt-6">
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Inbox className="h-5 w-5 text-primary" />
                  Contact Requests
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Track inbound inquiries from the public contact form and
                  coordinate follow-up.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Select
                  value={contactStatus}
                  onValueChange={(value) =>
                    updateStatusFilter("contact", value as StatusFilter)
                  }
                  disabled={showArchivedOnly}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={contactQuery.isFetching}
                  onClick={() => contactQuery.refetch()}
                  aria-label="Refresh contact requests"
                >
                  {contactQuery.isFetching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCcw className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {contactQuery.isLoading && (
                <div className="flex min-h-[200px] items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}

              {contactQuery.isError && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                  Failed to load contact requests. Please try refreshing the
                  page.
                </div>
              )}

              {!contactQuery.isLoading && contactRequests.length === 0 && (
                <div className="rounded-md border border-dashed border-muted-foreground/30 p-8 text-center">
                  <FileQuestion className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No contact requests found for this filter.
                  </p>
                </div>
              )}

              {contactRequests.length > 0 && (
                <div className="space-y-4">
                  {contactRequests.map((request) => {
                    const scheduleTooltip = getScheduleTooltip(request);
                    const scheduleLabel = getScheduleButtonLabel(request);
                    const archived = getArchivedState(request);
                    const archiveLabel = archived ? "Unarchive" : "Archive";
                    const assignment = formatAssignee(request);
                    const isRowUpdating =
                      updateRequest.isPending && updatingId === request.id;
                    const isRowDeleting =
                      deleteRequest.isPending && deletingId === request.id;

                    return (
                      <div
                        key={request.id}
                        className="rounded-xl border border-border/60 bg-card/60 p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md"
                      >
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex flex-1 flex-col gap-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-lg font-semibold text-foreground">
                                    {request.first_name} {request.last_name}
                                  </p>
                                  <Badge
                                    variant="secondary"
                                    className="capitalize"
                                  >
                                    {request.origin ?? "web"}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="capitalize"
                                  >
                                    {capitalize(request.request_type)}
                                  </Badge>
                                  {assignment.label && (
                                    <Badge
                                      variant="outline"
                                      className="gap-1 text-xs font-normal"
                                    >
                                      Assigned • {assignment.label}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                  <span>
                                    Received{" "}
                                    {formatDateTime(request.created_at)}
                                  </span>
                                  <span>
                                    Updated {formatDateTime(request.updated_at)}
                                  </span>
                                </div>
                                <div className="space-y-1 text-sm text-muted-foreground">
                                  <p>{request.email}</p>
                                  {request.phone && <p>{request.phone}</p>}
                                  {request.country && (
                                    <p className="uppercase">
                                      {request.country}
                                    </p>
                                  )}
                                  {request.contact_preference && (
                                    <p className="font-medium text-primary">
                                      Prefers: {request.contact_preference}
                                    </p>
                                  )}
                                  {request.patient_id && (
                                    <Badge
                                      variant="outline"
                                      className="mt-1 w-fit text-xs font-normal"
                                    >
                                      Linked patient •{" "}
                                      {request.patient_id.slice(0, 8)}
                                      {request.patient_id.length > 8 ? "…" : ""}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-3">
                                <div>
                                  <p className="text-xs uppercase tracking-wide text-muted-foreground/80">
                                    Treatment
                                  </p>
                                  <p className="text-sm text-foreground">
                                    {request.treatment &&
                                    request.treatment.trim().length > 0
                                      ? request.treatment
                                      : "Not specified"}
                                  </p>
                                </div>
                                {request.health_background &&
                                  request.health_background.trim().length >
                                    0 && (
                                    <div>
                                      <p className="text-xs uppercase tracking-wide text-muted-foreground/80">
                                        Background
                                      </p>
                                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                                        {request.health_background}
                                      </p>
                                    </div>
                                  )}
                                <div>
                                  <p className="text-xs uppercase tracking-wide text-muted-foreground/80">
                                    Travel window
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {request.travel_window
                                      ? formatDateTime(request.travel_window)
                                      : "Not provided"}
                                  </p>
                                  {request.companions && (
                                    <p className="text-xs text-muted-foreground">
                                      Companion plan: {request.companions}
                                    </p>
                                  )}
                                </div>
                                {request.notes &&
                                  request.notes.trim().length > 0 && (
                                    <div>
                                      <p className="text-xs uppercase tracking-wide text-muted-foreground/80">
                                        Note
                                      </p>
                                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                                        {request.notes}
                                      </p>
                                    </div>
                                  )}
                              </div>
                              <div className="space-y-2 text-sm text-muted-foreground">
                                {request.additional_questions &&
                                  request.additional_questions.trim().length >
                                    0 && (
                                    <p>
                                      <span className="font-medium text-muted-foreground/90">
                                        Additional details:&nbsp;
                                      </span>
                                      {request.additional_questions}
                                    </p>
                                  )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-stretch gap-2 md:items-end md:text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDialogFor(request)}
                            >
                              View
                            </Button>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleSchedule(request)}
                                    className="w-full"
                                  >
                                    {scheduleLabel}
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>{scheduleTooltip}</TooltipContent>
                            </Tooltip>
                            <AssignmentControl
                              assigneeId={assignment.id}
                              assigneeLabel={assignment.label}
                              assigneeDescription={assignment.description}
                              onAssign={(memberId) => {
                                void handleAssignmentChange(request, memberId);
                              }}
                              isPending={isRowUpdating}
                              disabled={isRowDeleting}
                            />
                            <div className="space-y-1 text-xs text-muted-foreground md:text-right">
                              <p className="uppercase tracking-wide text-muted-foreground/80">
                                Status
                              </p>
                              <Select
                                value={request.status}
                                onValueChange={(value) => {
                                  void handleStatusChange(
                                    request.id,
                                    value as ContactRequestStatus,
                                  );
                                }}
                                disabled={isRowUpdating || isRowDeleting}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {STATUS_OPTIONS.filter(
                                    (option) => option.value !== "all",
                                  ).map((option) => (
                                    <SelectItem
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex flex-col items-end gap-2 sm:flex-row sm:justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                className="sm:w-auto"
                                onClick={() =>
                                  void handleArchiveToggle(request)
                                }
                                disabled={
                                  (updateRequest.isPending &&
                                    updatingId === request.id) ||
                                  (deleteRequest.isPending &&
                                    deletingId === request.id)
                                }
                              >
                                {updatingId === request.id &&
                                updateRequest.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                    Updating
                                  </>
                                ) : (
                                  archiveLabel
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive sm:w-auto"
                                onClick={() => handleDelete(request.id)}
                                disabled={
                                  deleteRequest.isPending &&
                                  deletingId === request.id
                                }
                              >
                                {deletingId === request.id &&
                                deleteRequest.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                    Deleting
                                  </>
                                ) : (
                                  "Delete"
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {activeRequest?.request_type === "consultation"
                ? "Consultation Request Details"
                : "Contact Request Details"}
            </DialogTitle>
            <DialogDescription>
              Review the submission and capture any internal notes for your
              team.
            </DialogDescription>
          </DialogHeader>

          {activeRequest && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Submitted
                </h3>
                <p className="text-sm">
                  {formatDateTime(activeRequest.created_at)}
                </p>
                <Badge variant="outline" className="capitalize">
                  Source: {activeRequest.origin ?? "web"}
                </Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Contact
                </h3>
                <p className="text-sm font-medium">
                  {activeRequest.first_name} {activeRequest.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {activeRequest.email}
                </p>
                {activeRequest.phone && (
                  <p className="text-sm text-muted-foreground">
                    {activeRequest.phone}
                  </p>
                )}
                {activeRequest.country && (
                  <p className="text-xs uppercase text-muted-foreground">
                    {activeRequest.country}
                  </p>
                )}
                {activeRequest.contact_preference && (
                  <p className="text-xs text-muted-foreground">
                    Prefers: {activeRequest.contact_preference}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Request type
                </h3>
                <Select
                  value={
                    REQUEST_TYPE_OPTIONS.some(
                      (option) => option.value === requestTypeDraft,
                    )
                      ? requestTypeDraft
                      : "custom"
                  }
                  onValueChange={(value) => {
                    if (value === "custom") {
                      setRequestTypeDraft(
                        customRequestType.trim().length > 0
                          ? customRequestType
                          : "",
                      );
                      return;
                    }
                    setRequestTypeDraft(value);
                  }}
                >
                  <SelectTrigger className="w-[240px]">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {REQUEST_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Custom value…</SelectItem>
                  </SelectContent>
                </Select>
                {(!REQUEST_TYPE_OPTIONS.some(
                  (option) => option.value === requestTypeDraft,
                ) ||
                  requestTypeDraft === "") && (
                  <Input
                    value={requestTypeDraft}
                    onChange={(event) => {
                      const value = event.target.value;
                      setRequestTypeDraft(value);
                      setCustomRequestType(value);
                    }}
                    placeholder="e.g. vip, referral"
                  />
                )}
              </div>

              {activeRequest.request_type === "consultation" && (
                <>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-muted-foreground">
                      Travel & Logistics
                    </h3>
                    <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-sm text-foreground space-y-1">
                      <p>
                        Treatment: {activeRequest.treatment ?? "Not provided"}
                      </p>
                      <p>
                        Travel window:{" "}
                        {formatDateTime(activeRequest.travel_window)}
                      </p>
                      {activeRequest.companions && (
                        <p>Companions: {activeRequest.companions}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-muted-foreground">
                      Health Background
                    </h3>
                    <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-sm text-foreground whitespace-pre-line">
                      {activeRequest.message}
                    </div>
                  </div>
                  {activeRequest.medical_reports && (
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-muted-foreground">
                        Medical Reports
                      </h3>
                      <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-sm text-foreground whitespace-pre-line">
                        {activeRequest.medical_reports}
                      </div>
                    </div>
                  )}
                  {activeRequest.additional_questions && (
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-muted-foreground">
                        Additional Questions
                      </h3>
                      <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-sm text-foreground whitespace-pre-line">
                        {activeRequest.additional_questions}
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeRequest.request_type !== "consultation" && (
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    Message
                  </h3>
                  <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-sm text-foreground">
                    {activeRequest.message}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Internal notes
                </h3>
                <Textarea
                  value={notesDraft}
                  onChange={(event) => setNotesDraft(event.target.value)}
                  placeholder="Add coordination notes or handoff details..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Linked patient
                </h3>
                <PatientSelector
                  value={patientIdDraft}
                  onValueChange={(value) => setPatientIdDraft(value)}
                  placeholder="Select patient to link…"
                  className="w-full"
                />
                {selectedPatientForDialog ? (
                  <div className="rounded-md border border-border/60 bg-muted/10 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs uppercase text-muted-foreground">
                        Consultations for this patient
                      </span>
                      {activeRequest.contact_preference && (
                        <Badge variant="outline" className="capitalize">
                          Prefers {activeRequest.contact_preference}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-2 space-y-2">
                      {renderConsultationSummary()}
                    </div>
                    <Button
                      className="mt-3 w-full"
                      disabled={!selectedPatientForDialog}
                      onClick={() =>
                        handleSchedule({
                          ...activeRequest,
                          patient_id: selectedPatientForDialog,
                        })
                      }
                    >
                      Schedule consultation
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Choose a patient record to enable scheduling and track
                    follow-up.
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleSaveDetails()}
              disabled={updatingId === activeRequest?.id}
            >
              {updatingId === activeRequest?.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
