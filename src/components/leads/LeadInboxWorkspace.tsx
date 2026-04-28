"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Link2,
  Loader2,
  RefreshCcw,
  Search,
  UserPlus,
} from "lucide-react";
import { AssignmentControl } from "@/components/admin/AssignmentControl";
import {
  adminFetch,
  useAdminInvalidate,
} from "@/components/admin/hooks/useAdminFetch";
import { PatientSelector } from "@/components/admin/PatientSelector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  WorkspaceEmptyState,
  WorkspaceFilterBar,
  WorkspaceMetricCard,
  WorkspacePageHeader,
  WorkspacePanel,
} from "@/components/workspaces/WorkspacePrimitives";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type LeadStatus =
  | "new"
  | "reviewing"
  | "qualified"
  | "converted"
  | "duplicate"
  | "disqualified"
  | "archived";

type LeadRecord = {
  id: string;
  status: LeadStatus;
  source: string;
  channel: string | null;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  language: string | null;
  procedure_interest: string | null;
  message: string | null;
  quality_score: number | null;
  urgency_tier: "low" | "medium" | "high" | "urgent";
  has_medical_documents: boolean;
  ready_for_consultation: boolean;
  disqualification_reason: string | null;
  assigned_to: string | null;
  contact_request_id: string | null;
  start_journey_submission_id: string | null;
  patient_id: string | null;
  duplicate_of_lead_id: string | null;
  created_at: string;
  last_seen_at: string;
  assigned_profile?: {
    id: string;
    username: string | null;
    email: string | null;
    job_title: string | null;
  } | null;
};

type LeadDetails = LeadRecord & {
  events: Array<{
    id: string;
    event_type: string;
    title: string;
    body: string | null;
    created_at: string;
  }>;
  marketing_consents: Array<{
    id: string;
    channel: string;
    opted_in: boolean;
    preferred_language: string | null;
  }>;
  automation_runs: Array<{
    id: string;
    run_type: string;
    suggested_next_action: string | null;
    confidence: number | null;
    review_state: string;
    created_at: string;
  }>;
};

type ConversionAction =
  | "contact_request"
  | "start_journey"
  | "patient"
  | "existing_patient";

const QUERY_KEY = ["admin", "lead-inquiries"] as const;

const STATUS_OPTIONS: Array<{ value: "all" | LeadStatus; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "new", label: "New" },
  { value: "reviewing", label: "Reviewing" },
  { value: "qualified", label: "Qualified" },
  { value: "converted", label: "Converted" },
  { value: "duplicate", label: "Duplicate" },
  { value: "disqualified", label: "Disqualified" },
  { value: "archived", label: "Archived" },
];

const statusLabel = (status: LeadStatus) =>
  STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;

const formatDateTime = (value: string | null | undefined) => {
  if (!value) {
    return "Not provided";
  }
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return "Not provided";
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const getLeadName = (lead: LeadRecord) =>
  lead.full_name ??
  [lead.first_name, lead.last_name].filter(Boolean).join(" ") ??
  "Unnamed lead";

const getAssigneeName = (lead: LeadRecord) =>
  lead.assigned_profile?.username ??
  lead.assigned_profile?.email ??
  (lead.assigned_to ? "Assigned" : null);

const statusClassName = (status: LeadStatus) => {
  if (status === "converted") {
    return "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200";
  }
  if (status === "duplicate" || status === "disqualified") {
    return "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-200";
  }
  if (status === "archived") {
    return "border-border bg-muted text-muted-foreground";
  }
  return "border-primary/20 bg-primary/10 text-primary";
};

const urgencyClassName = (urgency: LeadRecord["urgency_tier"]) => {
  if (urgency === "urgent") {
    return "border-destructive/25 bg-destructive/10 text-destructive";
  }
  if (urgency === "high") {
    return "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-200";
  }
  return "border-border bg-muted text-muted-foreground";
};

export function LeadInboxWorkspace() {
  const [status, setStatus] = useState("all");
  const [source, setSource] = useState("all");
  const [urgency, setUrgency] = useState("all");
  const [assignedTo, setAssignedTo] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [conversionAction, setConversionAction] =
    useState<ConversionAction>("contact_request");
  const [conversionPatientId, setConversionPatientId] = useState<string | null>(
    null,
  );
  const invalidate = useAdminInvalidate();
  const { toast } = useToast();

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (status !== "all") {
      params.set("status", status);
    }
    if (source !== "all") {
      params.set("source", source);
    }
    if (urgency !== "all") {
      params.set("urgency", urgency);
    }
    if (assignedTo !== "all") {
      params.set("assignedTo", assignedTo);
    }
    return params.toString();
  }, [assignedTo, source, status, urgency]);

  const leadsQuery = useQuery({
    queryKey: [...QUERY_KEY, queryString],
    queryFn: () =>
      adminFetch<LeadRecord[]>(
        `/api/admin/leads${queryString ? `?${queryString}` : ""}`,
      ),
  });

  const detailsQuery = useQuery({
    queryKey: [...QUERY_KEY, "details", selectedId],
    queryFn: () => adminFetch<LeadDetails>(`/api/admin/leads/${selectedId}`),
    enabled: Boolean(selectedId),
  });

  const sources = useMemo(() => {
    const values = new Set((leadsQuery.data ?? []).map((lead) => lead.source));
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [leadsQuery.data]);

  const filteredLeads = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) {
      return leadsQuery.data ?? [];
    }

    return (leadsQuery.data ?? []).filter((lead) =>
      [
        getLeadName(lead),
        lead.email,
        lead.phone,
        lead.country,
        lead.procedure_interest,
        lead.source,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(normalizedSearch),
        ),
    );
  }, [leadsQuery.data, search]);

  const metrics = useMemo(() => {
    const leads = leadsQuery.data ?? [];
    return {
      open: leads.filter(
        (lead) =>
          !["converted", "duplicate", "disqualified", "archived"].includes(
            lead.status,
          ),
      ).length,
      urgent: leads.filter((lead) => lead.urgency_tier === "urgent").length,
      qualified: leads.filter((lead) => lead.status === "qualified").length,
      duplicates: leads.filter((lead) => lead.status === "duplicate").length,
    };
  }, [leadsQuery.data]);

  const updateMutation = useMutation({
    mutationFn: (args: { id: string; payload: Record<string, unknown> }) =>
      adminFetch<LeadRecord>(`/api/admin/leads/${args.id}`, {
        method: "PATCH",
        body: JSON.stringify(args.payload),
      }),
    onSuccess: () => {
      invalidate(QUERY_KEY);
      if (selectedId) {
        invalidate([...QUERY_KEY, "details", selectedId]);
      }
    },
    onError: (error) => {
      toast({
        title: "Lead update failed",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    },
  });

  const convertMutation = useMutation({
    mutationFn: (args: {
      id: string;
      action: ConversionAction;
      patientId: string | null;
      notes: string;
    }) =>
      adminFetch(`/api/admin/leads/${args.id}/convert`, {
        method: "POST",
        body: JSON.stringify({
          action: args.action,
          patient_id: args.patientId,
          notes: args.notes,
        }),
      }),
    onSuccess: () => {
      toast({ title: "Lead converted" });
      invalidate(QUERY_KEY);
      if (selectedId) {
        invalidate([...QUERY_KEY, "details", selectedId]);
      }
    },
    onError: (error) => {
      toast({
        title: "Conversion failed",
        description:
          error instanceof Error ? error.message : "Please review the lead.",
        variant: "destructive",
      });
    },
  });

  const selectedLead = detailsQuery.data ?? null;

  return (
    <div className="space-y-8">
      <WorkspacePageHeader
        title="Lead Inbox"
        subtitle="Staging queue for funnel leads before coordinators qualify, dedupe, assign, or convert them into Care N Tour workflows."
        actions={
          <Button
            variant="outline"
            onClick={() => leadsQuery.refetch()}
            disabled={leadsQuery.isFetching}
          >
            {leadsQuery.isFetching ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <WorkspaceMetricCard
          label="Open"
          value={metrics.open}
          icon={ClipboardCheck}
          emphasisTone="info"
        />
        <WorkspaceMetricCard
          label="Urgent"
          value={metrics.urgent}
          icon={AlertTriangle}
          emphasisTone="danger"
        />
        <WorkspaceMetricCard
          label="Qualified"
          value={metrics.qualified}
          icon={CheckCircle2}
          emphasisTone="success"
        />
        <WorkspaceMetricCard
          label="Duplicates"
          value={metrics.duplicates}
          icon={Link2}
          emphasisTone="warning"
        />
      </div>

      <WorkspacePanel
        title="Review Queue"
        description="Filter by lifecycle, source, urgency, and ownership."
        contentClassName="space-y-6"
      >
        <WorkspaceFilterBar className="justify-start">
          <div className="relative min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search leads"
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              {sources.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={urgency} onValueChange={setUrgency}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All urgency</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={assignedTo} onValueChange={setAssignedTo}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All owners</SelectItem>
              <SelectItem value="me">Assigned to me</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
            </SelectContent>
          </Select>
        </WorkspaceFilterBar>

        {leadsQuery.isLoading ? (
          <div className="flex min-h-[260px] items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading leads
          </div>
        ) : filteredLeads.length === 0 ? (
          <WorkspaceEmptyState
            title="No leads in view"
            description="Adjust filters or ingest a lead through the integration endpoints."
            icon={<FileText className="h-8 w-8" />}
          />
        ) : (
          <div className="divide-y divide-border">
            {filteredLeads.map((lead) => (
              <button
                key={lead.id}
                type="button"
                onClick={() => {
                  setSelectedId(lead.id);
                  setNote("");
                  setConversionPatientId(null);
                }}
                className="grid w-full gap-4 px-1 py-5 text-left transition-colors hover:bg-muted/40 md:grid-cols-[1.5fr_1fr_1fr_auto]"
              >
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-foreground">
                      {getLeadName(lead)}
                    </span>
                    <Badge
                      variant="outline"
                      className={statusClassName(lead.status)}
                    >
                      {statusLabel(lead.status)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={urgencyClassName(lead.urgency_tier)}
                    >
                      {lead.urgency_tier}
                    </Badge>
                  </div>
                  <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                    {lead.message ?? "No message provided."}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {lead.email ?? "No email"} • {lead.phone ?? "No phone"}
                  </p>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-foreground">
                    {lead.procedure_interest ?? "Unspecified interest"}
                  </p>
                  <p className="text-muted-foreground">
                    {lead.country ?? "No country"} •{" "}
                    {lead.language ?? "No language"}
                  </p>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-foreground">
                    {lead.source}
                    {lead.channel ? ` / ${lead.channel}` : ""}
                  </p>
                  <p className="text-muted-foreground">
                    Last seen {formatDateTime(lead.last_seen_at)}
                  </p>
                </div>
                <div className="flex items-center justify-end">
                  <span className="text-sm text-muted-foreground">
                    {getAssigneeName(lead) ?? "Unassigned"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </WorkspacePanel>

      <Dialog
        open={Boolean(selectedId)}
        onOpenChange={() => setSelectedId(null)}
      >
        <DialogContent className="max-h-[88vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedLead ? getLeadName(selectedLead) : "Lead details"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Review lead details, assignment, conversion, consent, and
              timeline.
            </DialogDescription>
          </DialogHeader>
          {detailsQuery.isLoading || !selectedLead ? (
            <div className="flex min-h-[240px] items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading lead details
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Detail
                    label="Status"
                    value={statusLabel(selectedLead.status)}
                  />
                  <Detail label="Urgency" value={selectedLead.urgency_tier} />
                  <Detail label="Source" value={selectedLead.source} />
                  <Detail
                    label="Created"
                    value={formatDateTime(selectedLead.created_at)}
                  />
                  <Detail
                    label="Email"
                    value={selectedLead.email ?? "Not provided"}
                  />
                  <Detail
                    label="Phone"
                    value={selectedLead.phone ?? "Not provided"}
                  />
                  <Detail
                    label="Country"
                    value={selectedLead.country ?? "Not provided"}
                  />
                  <Detail
                    label="Interest"
                    value={selectedLead.procedure_interest ?? "Not provided"}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Message</Label>
                  <div className="rounded-lg border bg-muted/30 p-4 text-sm leading-6">
                    {selectedLead.message ?? "No message provided."}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Coordinator actions</Label>
                  <div className="flex flex-wrap gap-3">
                    <AssignmentControl
                      assigneeId={selectedLead.assigned_to}
                      assigneeLabel={getAssigneeName(selectedLead)}
                      onAssign={(memberId) =>
                        updateMutation.mutate({
                          id: selectedLead.id,
                          payload: { assigned_to: memberId },
                        })
                      }
                      isPending={updateMutation.isPending}
                    />
                    <Select
                      value={selectedLead.status}
                      onValueChange={(value) =>
                        updateMutation.mutate({
                          id: selectedLead.id,
                          payload: { status: value },
                        })
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.filter(
                          (option) => option.value !== "all",
                        ).map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Add coordinator note"
                    rows={3}
                  />
                  <Button
                    variant="outline"
                    disabled={
                      note.trim().length === 0 || updateMutation.isPending
                    }
                    onClick={() => {
                      updateMutation.mutate({
                        id: selectedLead.id,
                        payload: { notes: note },
                      });
                      setNote("");
                    }}
                  >
                    Add note
                  </Button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-lg border p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold">Conversion</h3>
                  </div>
                  <div className="space-y-4">
                    <Select
                      value={conversionAction}
                      onValueChange={(value) =>
                        setConversionAction(value as ConversionAction)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contact_request">
                          Convert to contact request
                        </SelectItem>
                        <SelectItem value="start_journey">
                          Convert to Start Journey
                        </SelectItem>
                        <SelectItem value="patient">
                          Create potential patient
                        </SelectItem>
                        <SelectItem value="existing_patient">
                          Link existing patient
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {conversionAction === "existing_patient" ? (
                      <PatientSelector
                        value={conversionPatientId}
                        onValueChange={setConversionPatientId}
                        placeholder="Select patient"
                      />
                    ) : null}
                    <Button
                      className="w-full"
                      disabled={
                        convertMutation.isPending ||
                        selectedLead.status === "converted" ||
                        (conversionAction === "existing_patient" &&
                          !conversionPatientId)
                      }
                      onClick={() =>
                        convertMutation.mutate({
                          id: selectedLead.id,
                          action: conversionAction,
                          patientId: conversionPatientId,
                          notes: note,
                        })
                      }
                    >
                      {convertMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Convert lead
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="mb-3 font-semibold">Consent</h3>
                  <div className="space-y-2">
                    {selectedLead.marketing_consents.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No marketing consent captured.
                      </p>
                    ) : (
                      selectedLead.marketing_consents.map((consent) => (
                        <div
                          key={consent.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span>{consent.channel}</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              consent.opted_in
                                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
                                : "border-border bg-muted text-muted-foreground",
                            )}
                          >
                            {consent.opted_in ? "Opted in" : "Opted out"}
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="mb-3 font-semibold">Timeline</h3>
                  <div className="space-y-4">
                    {selectedLead.events.map((event) => (
                      <div key={event.id} className="space-y-1 border-l pl-3">
                        <p className="text-sm font-medium">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(event.created_at)}
                        </p>
                        {event.body ? (
                          <p className="text-sm text-muted-foreground">
                            {event.body}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedId(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium text-foreground">
        {value}
      </p>
    </div>
  );
}
