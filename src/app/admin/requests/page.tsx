"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FileQuestion, Inbox, Loader2, RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { PatientSelector } from "@/components/admin/PatientSelector";
import { adminFetch, useAdminInvalidate } from "@/components/admin/hooks/useAdminFetch";
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

type ContactRequest = Tables<"contact_requests">;
type ContactRequestStatus = ContactRequest["status"];
type StatusFilter = (typeof STATUS_OPTIONS)[number]["value"];
type RequestTab = "contact" | "consultation";
type PatientConsultationRow = Database["public"]["Tables"]["patient_consultations"]["Row"] & {
  contact_requests?: Pick<ContactRequest, "id" | "status" | "request_type" | "origin"> | null;
};

const STATUS_LABELS: Record<ContactRequestStatus, string> = {
  new: "New",
  in_progress: "In Progress",
  resolved: "Resolved",
};

const STATUS_OPTIONS: Array<{ value: "all" | ContactRequestStatus; label: string }> = [
  { value: "all", label: "All requests" },
  { value: "new", label: STATUS_LABELS.new },
  { value: "in_progress", label: STATUS_LABELS.in_progress },
  { value: "resolved", label: STATUS_LABELS.resolved },
];

const REQUEST_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "general", label: "General inquiry" },
  { value: "consultation", label: "Consultation intake" },
];

const QUERY_KEY = ["admin", "contact-requests"] as const;

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "Not provided";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return "Not provided";
  }
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
};

const capitalize = (value: string | null) => {
  if (!value) return "General";
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export default function AdminRequestsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<RequestTab>("consultation");
  const [statusFilters, setStatusFilters] = useState<Record<RequestTab, StatusFilter>>({
    contact: "all",
    consultation: "all",
  });
  const [notesDraft, setNotesDraft] = useState("");
  const [requestTypeDraft, setRequestTypeDraft] = useState("general");
  const [customRequestType, setCustomRequestType] = useState("");
  const [patientIdDraft, setPatientIdDraft] = useState<string | null>(null);
  const [activeRequest, setActiveRequest] = useState<ContactRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { toast } = useToast();
  const invalidate = useAdminInvalidate();

  const fetchRequests = async (status: StatusFilter, requestType?: string) => {
    const params = new URLSearchParams();
    if (status !== "all") {
      params.set("status", status);
    }
    if (requestType) {
      params.set("requestType", requestType);
    }
    const query = params.toString();
    return adminFetch<ContactRequest[]>(`/api/admin/requests${query ? `?${query}` : ""}`);
  };

  const contactQuery = useQuery({
    queryKey: [...QUERY_KEY, "contact", statusFilters.contact],
    queryFn: () => fetchRequests(statusFilters.contact),
  });

  const consultationQuery = useQuery({
    queryKey: [...QUERY_KEY, "consultation", statusFilters.consultation],
    queryFn: () => fetchRequests(statusFilters.consultation, "consultation"),
  });

  const updateRequest = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Pick<ContactRequest, "status" | "notes" | "request_type" | "patient_id">>;
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
        REQUEST_TYPE_OPTIONS.some((option) => option.value === (request.request_type ?? ""))
          ? ""
          : request.request_type ?? "",
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
      REQUEST_TYPE_OPTIONS.some((option) => option.value === inferredType) ? "" : inferredType,
    );
    setPatientIdDraft(request.patient_id ?? null);
    setDialogOpen(true);
  };

  const handleStatusChange = async (requestId: string, status: ContactRequestStatus) => {
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

  const contactRequests = (contactQuery.data ?? []).filter(
    (request) => (request.request_type ?? "general") !== "consultation",
  );
  const consultationRequests = consultationQuery.data ?? [];

  const selectedPatientForDialog = useMemo(() => patientIdDraft ?? activeRequest?.patient_id ?? null, [
    patientIdDraft,
    activeRequest?.patient_id,
  ]);

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
    const isPortalRequest = Boolean(request.user_id) || request.origin === "portal";

    if (!hasLinkedPatient) {
      if (!isPortalRequest) {
        const params = new URLSearchParams({
          new: "1",
          fromRequestId: request.id,
        });
        if (request.first_name || request.last_name) {
          params.set("fullName", `${request.first_name ?? ""} ${request.last_name ?? ""}`.trim());
        }
        if (request.email) {
          params.set("email", request.email);
        }
        if (request.phone) {
          params.set("phone", request.phone);
        }
        router.push(`/admin/patients?${params.toString()}`);
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
    router.push(`/admin/consultations?${params.toString()}`);
  };

  const getScheduleButtonLabel = (request: ContactRequest) => {
    const isPortalRequest = Boolean(request.user_id) || request.origin === "portal";
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
          No consultations linked to this patient yet. Scheduling will create the first one.
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {consultations.map((consultation) => (
          <div key={consultation.id} className="rounded-md border border-border/60 bg-muted/10 p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">Consultation on {formatDateTime(consultation.scheduled_at)}</span>
              <Badge variant="outline" className="capitalize">
                {consultation.status.replace("_", " ")}
              </Badge>
            </div>
            {consultation.contact_request_id && (
              <p className="text-xs text-muted-foreground">Linked request: {consultation.contact_request_id}</p>
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
            <TabsTrigger value="consultation" className="whitespace-nowrap px-4">
              Consultation Requests
            </TabsTrigger>
            <TabsTrigger value="contact" className="whitespace-nowrap px-4">
              Contact Form Inbox
            </TabsTrigger>
          </TabsList>
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
                  Detailed intake submissions from the Get Free Consultation flow for medical concierge follow-up.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Select
                  value={statusFilters.consultation}
                  onValueChange={(value) => updateStatusFilter("consultation", value as StatusFilter)}
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
                  Failed to load consultation requests. Please try refreshing the page.
                </div>
              )}

              {!consultationQuery.isLoading && consultationRequests.length === 0 && (
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
                                  <Badge variant="secondary" className="capitalize">
                                    {request.origin ?? "web"}
                                  </Badge>
                                  <Badge variant="outline">{STATUS_LABELS[request.status]}</Badge>
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                  <span>Received {formatDateTime(request.created_at)}</span>
                                  <span>Updated {formatDateTime(request.updated_at)}</span>
                                </div>
                                <div className="space-y-1 text-sm text-muted-foreground">
                                  <p>{request.email}</p>
                                  {request.phone && <p>{request.phone}</p>}
                                  {request.country && <p className="uppercase">Based in {request.country}</p>}
                                  {request.contact_preference && (
                                    <p className="font-medium text-primary">
                                      Prefers: {request.contact_preference}
                                    </p>
                                  )}
                                  {request.patient_id && (
                                    <Badge variant="outline" className="mt-1 w-fit text-xs font-normal">
                                      Linked patient • {request.patient_id.slice(0, 8)}
                                      {request.patient_id.length > 8 ? "…" : ""}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Treatment</p>
                                <p className="text-sm text-foreground">
                                  {request.treatment ?? "Not specified"}
                                </p>
                                <div className="mt-1 space-y-1 text-xs text-muted-foreground">
                                  {request.budget_range && (
                                    <div>
                                      <p className="text-xs uppercase tracking-wide text-muted-foreground/80">
                                        Budget
                                      </p>
                                      <p className="text-sm text-muted-foreground">{request.budget_range}</p>
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
                              {request.health_background && request.health_background.trim().length > 0 && (
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
                                <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Travel window</p>
                                <p className="text-sm text-muted-foreground">
                                  {formatDateTime(request.travel_window)}
                                </p>
                                {request.companions && (
                                  <p className="text-xs text-muted-foreground">Companion plan: {request.companions}</p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-stretch gap-2 md:items-end md:text-right">
                            <Button variant="outline" size="sm" onClick={() => openDialogFor(request)}>
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
                            <div className="space-y-1 text-xs text-muted-foreground md:text-right">
                              <p className="uppercase tracking-wide text-muted-foreground/80">Status</p>
                              <Select
                                value={request.status}
                                onValueChange={(value) => {
                                  void handleStatusChange(request.id, value as ContactRequestStatus);
                                }}
                                disabled={updatingId === request.id || updateRequest.isPending}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {STATUS_OPTIONS.filter((option) => option.value !== "all").map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
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
                  Track inbound inquiries from the public contact form and coordinate follow-up.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Select
                  value={statusFilters.contact}
                  onValueChange={(value) => updateStatusFilter("contact", value as StatusFilter)}
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
                  Failed to load contact requests. Please try refreshing the page.
                </div>
              )}

              {!contactQuery.isLoading && contactRequests.length === 0 && (
                <div className="rounded-md border border-dashed border-muted-foreground/30 p-8 text-center">
                  <FileQuestion className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No contact requests found for this filter.</p>
                </div>
              )}

              {contactRequests.length > 0 && (
                <div className="space-y-4">
                  {contactRequests.map((request) => {
                    const scheduleTooltip = getScheduleTooltip(request);
                    const scheduleLabel = getScheduleButtonLabel(request);

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
                                  <Badge variant="secondary" className="capitalize">
                                    {request.origin ?? "web"}
                                  </Badge>
                                  <Badge variant="outline" className="capitalize">
                                    {capitalize(request.request_type)}
                                  </Badge>
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                  <span>Received {formatDateTime(request.created_at)}</span>
                                  <span>Updated {formatDateTime(request.updated_at)}</span>
                                </div>
                                <div className="space-y-1 text-sm text-muted-foreground">
                                  <p>{request.email}</p>
                                  {request.phone && <p>{request.phone}</p>}
                                  {request.country && <p className="uppercase">{request.country}</p>}
                                  {request.contact_preference && (
                                    <p className="font-medium text-primary">
                                      Prefers: {request.contact_preference}
                                    </p>
                                  )}
                                  {request.patient_id && (
                                    <Badge variant="outline" className="mt-1 w-fit text-xs font-normal">
                                      Linked patient • {request.patient_id.slice(0, 8)}
                                      {request.patient_id.length > 8 ? "…" : ""}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-3">
                                <div>
                                  <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Treatment</p>
                                  <p className="text-sm text-foreground">
                                    {request.treatment && request.treatment.trim().length > 0
                                      ? request.treatment
                                      : "Not specified"}
                                  </p>
                                </div>
                                {request.health_background && request.health_background.trim().length > 0 && (
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
                                    {request.travel_window ? formatDateTime(request.travel_window) : "Not provided"}
                                  </p>
                                  {request.companions && (
                                    <p className="text-xs text-muted-foreground">
                                      Companion plan: {request.companions}
                                    </p>
                                  )}
                                </div>
                                {request.notes && request.notes.trim().length > 0 && (
                                  <div>
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground/80">Note</p>
                                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                                      {request.notes}
                                    </p>
                                  </div>
                                )}
                              </div>
                              <div className="space-y-2 text-sm text-muted-foreground">
                                {request.additional_questions && request.additional_questions.trim().length > 0 && (
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
                            <Button variant="outline" size="sm" onClick={() => openDialogFor(request)}>
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
                            <div className="space-y-1 text-xs text-muted-foreground md:text-right">
                              <p className="uppercase tracking-wide text-muted-foreground/80">Status</p>
                              <Select
                                value={request.status}
                                onValueChange={(value) => {
                                  void handleStatusChange(request.id, value as ContactRequestStatus);
                                }}
                                disabled={updatingId === request.id || updateRequest.isPending}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {STATUS_OPTIONS.filter((option) => option.value !== "all").map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
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

      <Dialog open={dialogOpen} onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {activeRequest?.request_type === "consultation"
                ? "Consultation Request Details"
                : "Contact Request Details"}
            </DialogTitle>
            <DialogDescription>
              Review the submission and capture any internal notes for your team.
            </DialogDescription>
          </DialogHeader>

          {activeRequest && (
            <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-muted-foreground">Submitted</h3>
              <p className="text-sm">{formatDateTime(activeRequest.created_at)}</p>
              <Badge variant="outline" className="capitalize">
                Source: {activeRequest.origin ?? "web"}
              </Badge>
            </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-muted-foreground">Contact</h3>
                <p className="text-sm font-medium">
                  {activeRequest.first_name} {activeRequest.last_name}
                </p>
                <p className="text-sm text-muted-foreground">{activeRequest.email}</p>
                {activeRequest.phone && <p className="text-sm text-muted-foreground">{activeRequest.phone}</p>}
                {activeRequest.country && (
                  <p className="text-xs uppercase text-muted-foreground">{activeRequest.country}</p>
                )}
                {activeRequest.contact_preference && (
                  <p className="text-xs text-muted-foreground">
                    Prefers: {activeRequest.contact_preference}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">Request type</h3>
                <Select
                  value={
                    REQUEST_TYPE_OPTIONS.some((option) => option.value === requestTypeDraft)
                      ? requestTypeDraft
                      : "custom"
                  }
                  onValueChange={(value) => {
                    if (value === "custom") {
                      setRequestTypeDraft(customRequestType.trim().length > 0 ? customRequestType : "");
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
                {(!REQUEST_TYPE_OPTIONS.some((option) => option.value === requestTypeDraft) ||
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
                    <h3 className="text-sm font-semibold text-muted-foreground">Travel & Logistics</h3>
                    <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-sm text-foreground space-y-1">
                      <p>Treatment: {activeRequest.treatment ?? "Not provided"}</p>
                      <p>
                        Travel window: {formatDateTime(activeRequest.travel_window)}
                      </p>
                      {activeRequest.companions && <p>Companions: {activeRequest.companions}</p>}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-muted-foreground">Health Background</h3>
                    <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-sm text-foreground whitespace-pre-line">
                      {activeRequest.message}
                    </div>
                  </div>
                  {activeRequest.medical_reports && (
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-muted-foreground">Medical Reports</h3>
                      <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-sm text-foreground whitespace-pre-line">
                        {activeRequest.medical_reports}
                      </div>
                    </div>
                  )}
                  {activeRequest.additional_questions && (
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-muted-foreground">Additional Questions</h3>
                      <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-sm text-foreground whitespace-pre-line">
                        {activeRequest.additional_questions}
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeRequest.request_type !== "consultation" && (
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-muted-foreground">Message</h3>
                  <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-sm text-foreground">
                    {activeRequest.message}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">Internal notes</h3>
                <Textarea
                  value={notesDraft}
                  onChange={(event) => setNotesDraft(event.target.value)}
                  placeholder="Add coordination notes or handoff details..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">Linked patient</h3>
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
                    <div className="mt-2 space-y-2">{renderConsultationSummary()}</div>
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
                    Choose a patient record to enable scheduling and track follow-up.
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={() => void handleSaveDetails()} disabled={updatingId === activeRequest?.id}>
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
