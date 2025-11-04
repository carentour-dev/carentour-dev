"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Download,
  FileQuestion,
  Loader2,
  Paperclip,
  Plane,
  RefreshCcw,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PatientSelector } from "@/components/admin/PatientSelector";
import { AssignmentControl } from "@/components/admin/AssignmentControl";
import {
  adminFetch,
  useAdminInvalidate,
} from "@/components/admin/hooks/useAdminFetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type StartJourneySubmissionRow =
  Database["public"]["Tables"]["start_journey_submissions"]["Row"];
type StartJourneySubmission = StartJourneySubmissionRow & {
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
type SubmissionStatus = StartJourneySubmission["status"];
type StatusFilter = (typeof STATUS_OPTIONS)[number]["value"];

const SUBMISSION_DOCUMENT_TYPES = [
  "passport",
  "medical_records",
  "insurance",
  "other",
] as const;
type SubmissionDocumentType = (typeof SUBMISSION_DOCUMENT_TYPES)[number];

type SubmissionDocument = {
  id: string;
  type: SubmissionDocumentType;
  originalName: string;
  storedName: string;
  path: string;
  bucket: string;
  size: number;
  url: string | null;
  uploadedAt: string;
};

const DOCUMENT_TYPE_LABELS: Record<SubmissionDocumentType, string> = {
  passport: "Passport",
  medical_records: "Medical Records",
  insurance: "Insurance",
  other: "Other",
};

const formatFileSize = (bytes: number | null | undefined) => {
  if (!Number.isFinite(bytes ?? NaN) || (bytes ?? 0) <= 0) {
    return "—";
  }

  const value = bytes as number;
  const units = ["B", "KB", "MB", "GB"] as const;
  const index = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    units.length - 1,
  );
  const size = value / Math.pow(1024, index);
  const precision = size >= 10 || index === 0 ? 0 : 1;
  return `${size.toFixed(precision)} ${units[index]}`;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseSubmissionDocuments = (value: unknown): SubmissionDocument[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!isRecord(item)) return null;

      const {
        id,
        type,
        originalName,
        storedName,
        path,
        bucket,
        size,
        url,
        uploadedAt,
      } = item;

      if (
        typeof id !== "string" ||
        typeof originalName !== "string" ||
        typeof storedName !== "string" ||
        typeof path !== "string" ||
        typeof bucket !== "string" ||
        typeof uploadedAt !== "string"
      ) {
        return null;
      }

      const normalizedType =
        typeof type === "string" &&
        SUBMISSION_DOCUMENT_TYPES.includes(type as SubmissionDocumentType)
          ? (type as SubmissionDocumentType)
          : "other";

      const normalizedSize =
        typeof size === "number" && Number.isFinite(size) ? size : 0;
      const normalizedUrl = typeof url === "string" ? url : null;

      return {
        id,
        type: normalizedType,
        originalName,
        storedName,
        path,
        bucket,
        size: normalizedSize,
        url: normalizedUrl,
        uploadedAt,
      } satisfies SubmissionDocument;
    })
    .filter(Boolean) as SubmissionDocument[];
};

const STATUS_LABELS: Record<SubmissionStatus, string> = {
  new: "New",
  reviewing: "Reviewing",
  contacted: "Contacted",
  consultation_scheduled: "Consultation Scheduled",
  completed: "Completed",
  archived: "Archived",
};

const STATUS_OPTIONS: Array<{
  value: "all" | SubmissionStatus;
  label: string;
}> = [
  { value: "all", label: "All submissions" },
  { value: "new", label: STATUS_LABELS.new },
  { value: "reviewing", label: STATUS_LABELS.reviewing },
  { value: "contacted", label: STATUS_LABELS.contacted },
  {
    value: "consultation_scheduled",
    label: STATUS_LABELS.consultation_scheduled,
  },
  { value: "completed", label: STATUS_LABELS.completed },
  { value: "archived", label: STATUS_LABELS.archived },
];

const QUERY_KEY = ["admin", "start-journey-submissions"] as const;

type AssignmentFilter = "all" | "me" | "unassigned";

const ASSIGNMENT_FILTER_OPTIONS: Array<{
  value: AssignmentFilter;
  label: string;
}> = [
  { value: "all", label: "All assignees" },
  { value: "me", label: "Assigned to me" },
  { value: "unassigned", label: "Unassigned" },
];

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

const formatTravelDates = (travelDates: any) => {
  if (!travelDates || typeof travelDates !== "object") return "Not specified";
  const { from, to } = travelDates;
  if (!from) return "Not specified";

  const fromDate = new Date(from);
  const formattedFrom = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(fromDate);

  if (!to) return formattedFrom;

  const toDate = new Date(to);
  const formattedTo = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(toDate);

  return `${formattedFrom} – ${formattedTo}`;
};

const formatSubmissionAssignee = (
  submission: Pick<
    StartJourneySubmission,
    "assigned_to" | "assigned_profile" | "assigned_secure_profile"
  >,
) => {
  const profile = submission.assigned_profile;
  if (profile?.id) {
    const label =
      profile.username?.trim() ??
      profile.email?.split("@")[0]?.trim() ??
      "Team member";
    const description = profile.job_title ?? profile.email ?? null;
    return {
      id: submission.assigned_to ?? profile.id,
      label,
      description,
    };
  }

  const secureProfile = submission.assigned_secure_profile;
  if (secureProfile?.id) {
    const label =
      secureProfile.username?.trim() ??
      secureProfile.email?.split("@")[0]?.trim() ??
      "Team member";
    const description = secureProfile.email ?? null;
    return {
      id: submission.assigned_to ?? secureProfile.id ?? null,
      label,
      description,
    };
  }

  if (submission.assigned_to) {
    return {
      id: submission.assigned_to,
      label: "Assigned",
      description: submission.assigned_to.slice(0, 8),
    };
  }

  return { id: null, label: null, description: null };
};

const isGuestSubmission = (submission: StartJourneySubmission) => {
  return !submission.user_id;
};

const buildPatientPrefillParams = (submission: StartJourneySubmission) => {
  const params = new URLSearchParams({
    new: "1",
    fromStartJourneyId: submission.id,
  });

  const fullName =
    `${submission.first_name ?? ""} ${submission.last_name ?? ""}`
      .replace(/\s+/g, " ")
      .trim();
  if (fullName.length > 0) {
    params.set("fullName", fullName);
  }

  if (submission.email) {
    params.set("email", submission.email);
  }

  if (submission.phone) {
    params.set("phone", submission.phone);
  }

  if (submission.country) {
    params.set("nationality", submission.country);
  }

  const preferredLanguage = submission.language_preference?.trim();
  if (preferredLanguage) {
    params.set("preferredLanguage", preferredLanguage);
  }

  return params;
};

const getActionButtonLabel = (submission: StartJourneySubmission) => {
  if (!submission.patient_id && isGuestSubmission(submission)) {
    return "Add Patient";
  }

  return "Schedule";
};

export default function AdminStartJourneyPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialAssignmentParam = searchParams.get("assigned");
  const initialAssignmentFilter: AssignmentFilter =
    initialAssignmentParam === "me" || initialAssignmentParam === "unassigned"
      ? (initialAssignmentParam as AssignmentFilter)
      : "all";
  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentFilter>(
    initialAssignmentFilter,
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [notesDraft, setNotesDraft] = useState("");
  const [patientIdDraft, setPatientIdDraft] = useState<string | null>(null);
  const [activeSubmission, setActiveSubmission] =
    useState<StartJourneySubmission | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [documentLinks, setDocumentLinks] = useState<Record<string, string>>(
    {},
  );
  const [openingDocumentId, setOpeningDocumentId] = useState<string | null>(
    null,
  );

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

  const fetchSubmissions = async (
    status: StatusFilter,
    assignment: AssignmentFilter = "all",
  ) => {
    const params = new URLSearchParams();
    if (status !== "all") {
      params.set("status", status);
    }
    if (assignment === "me") {
      params.set("assignedTo", "me");
    } else if (assignment === "unassigned") {
      params.set("assignedTo", "unassigned");
    }
    const query = params.toString();
    return adminFetch<StartJourneySubmission[]>(
      `/api/admin/start-journey${query ? `?${query}` : ""}`,
    );
  };

  const submissionsQuery = useQuery({
    queryKey: [...QUERY_KEY, statusFilter, assignmentFilter],
    queryFn: () => fetchSubmissions(statusFilter, assignmentFilter),
  });

  const updateSubmission = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<
        Pick<
          StartJourneySubmission,
          "status" | "notes" | "patient_id" | "consultation_id" | "assigned_to"
        >
      >;
    }) =>
      adminFetch<StartJourneySubmission>(`/api/admin/start-journey/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (submission) => {
      invalidate(QUERY_KEY);
      setActiveSubmission(submission);
      setPatientIdDraft(submission.patient_id ?? null);
      toast({
        title: "Submission updated",
        description: `Status: ${STATUS_LABELS[submission.status]}`,
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

  const deleteSubmission = useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/api/admin/start-journey/${id}`, {
        method: "DELETE",
      }),
    onMutate: (id) => {
      setDeletingId(id);
    },
    onSuccess: (_result, id) => {
      invalidate(QUERY_KEY);
      if (activeSubmission?.id === id) {
        closeDialog();
      }
      toast({ title: "Submission deleted" });
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

  const closeDialog = () => {
    setDialogOpen(false);
    setActiveSubmission(null);
    setNotesDraft("");
    setPatientIdDraft(null);
    setDocumentLinks({});
    setOpeningDocumentId(null);
  };

  const openDialogFor = (submission: StartJourneySubmission) => {
    setActiveSubmission(submission);
    setNotesDraft(submission.notes ?? "");
    setPatientIdDraft(submission.patient_id ?? null);
    setDocumentLinks({});
    setOpeningDocumentId(null);
    setDialogOpen(true);
  };

  const handleStatusChange = async (
    submissionId: string,
    status: SubmissionStatus,
  ) => {
    setUpdatingId(submissionId);
    await updateSubmission.mutateAsync({ id: submissionId, data: { status } });
  };

  const handleSaveDetails = async () => {
    if (!activeSubmission) return;
    const trimmedNotes = notesDraft.trim();
    const existingNotes = activeSubmission.notes ?? "";
    let notesPayload: string | undefined;
    const patientPayload = patientIdDraft ?? null;

    if (trimmedNotes.length > 0) {
      notesPayload = trimmedNotes;
    } else if (existingNotes.trim().length > 0 && trimmedNotes.length === 0) {
      notesPayload = "";
    }

    setUpdatingId(activeSubmission.id);
    await updateSubmission.mutateAsync({
      id: activeSubmission.id,
      data: {
        notes: notesPayload,
        patient_id: patientPayload,
      },
    });
    closeDialog();
  };

  const handleDelete = (id: string) => {
    deleteSubmission.mutate(id);
  };

  const handleSchedule = (submission: StartJourneySubmission) => {
    const hasLinkedPatient = Boolean(submission.patient_id);

    if (!hasLinkedPatient) {
      if (isGuestSubmission(submission)) {
        const params = buildPatientPrefillParams(submission);
        router.push(`/admin/patients?${params.toString()}`);
        return;
      }

      openDialogFor(submission);
      return;
    }

    const params = new URLSearchParams({
      schedule: "1",
      startJourneyId: submission.id,
      patientId: submission.patient_id!,
    });
    router.push(`/admin/consultations?${params.toString()}`);
  };

  const handleAssignmentChange = async (
    submission: StartJourneySubmission,
    assigneeId: string | null,
  ) => {
    const normalizedAssignee = assigneeId ?? null;
    if (submission.assigned_to === normalizedAssignee) {
      return;
    }

    setUpdatingId(submission.id);
    await updateSubmission.mutateAsync({
      id: submission.id,
      data: { assigned_to: normalizedAssignee },
    });
  };

  const submissions = submissionsQuery.data ?? [];

  const activeDocuments = useMemo(
    () => parseSubmissionDocuments(activeSubmission?.documents),
    [activeSubmission?.documents],
  );

  const showDocumentsSection =
    activeDocuments.length > 0 ||
    Boolean(activeSubmission?.has_passport) ||
    Boolean(activeSubmission?.has_medical_records) ||
    Boolean(activeSubmission?.has_insurance);

  const languageNotes = activeSubmission?.language_notes?.trim() ?? "";
  const languagePreferenceLabel =
    activeSubmission?.language_preference === "other"
      ? languageNotes || "Other"
      : (activeSubmission?.language_preference ?? (languageNotes || null));
  const showLanguageNotes = Boolean(
    languageNotes &&
      activeSubmission?.language_preference &&
      activeSubmission.language_preference !== "other" &&
      languageNotes !== languagePreferenceLabel,
  );

  const handleOpenDocument = useCallback(
    async (document: SubmissionDocument) => {
      if (!document.path || !document.bucket) {
        toast({
          title: "Document unavailable",
          description: "This document is missing a storage path.",
          variant: "destructive",
        });
        return;
      }

      const cachedUrl = documentLinks[document.id] ?? document.url ?? null;
      if (cachedUrl) {
        window.open(cachedUrl, "_blank", "noopener,noreferrer");
        return;
      }

      setOpeningDocumentId(document.id);

      try {
        const params = new URLSearchParams({
          bucket: document.bucket,
          path: document.path,
        });
        const { url } = await adminFetch<{ url: string }>(
          `/api/admin/start-journey/documents?${params.toString()}`,
        );

        if (!url) {
          throw new Error("Download link was not provided.");
        }

        setDocumentLinks((previous) => ({ ...previous, [document.id]: url }));
        window.open(url, "_blank", "noopener,noreferrer");
      } catch (error) {
        console.error("Failed to open submission document", error);
        toast({
          title: "Unable to open document",
          description:
            error instanceof Error ? error.message : "Please try again later.",
          variant: "destructive",
        });
      } finally {
        setOpeningDocumentId(null);
      }
    },
    [documentLinks, toast],
  );

  const selectedPatientForDialog = useMemo(
    () => patientIdDraft ?? activeSubmission?.patient_id ?? null,
    [patientIdDraft, activeSubmission?.patient_id],
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Plane className="h-5 w-5 text-primary" />
              Start Journey Submissions
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Comprehensive intake forms submitted through the Start Journey
              flow with medical history, travel preferences, and documents.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select
              value={assignmentFilter}
              onValueChange={(value) =>
                handleAssignmentFilterChange(value as AssignmentFilter)
              }
            >
              <SelectTrigger className="w-[200px]">
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
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as StatusFilter)}
            >
              <SelectTrigger className="w-[220px]">
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
              disabled={submissionsQuery.isFetching}
              onClick={() => submissionsQuery.refetch()}
              aria-label="Refresh submissions"
            >
              {submissionsQuery.isFetching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {submissionsQuery.isLoading && (
            <div className="flex min-h-[200px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {submissionsQuery.isError && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              Failed to load submissions. Please try refreshing the page.
            </div>
          )}

          {!submissionsQuery.isLoading && submissions.length === 0 && (
            <div className="rounded-md border border-dashed border-muted-foreground/30 p-8 text-center">
              <FileQuestion className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No submissions match this filter yet.
              </p>
            </div>
          )}

          {submissions.length > 0 && (
            <div className="space-y-4">
              {submissions.map((submission) => {
                const assignment = formatSubmissionAssignee(submission);
                const isRowUpdating =
                  updateSubmission.isPending && updatingId === submission.id;
                const isRowDeleting =
                  deleteSubmission.isPending && deletingId === submission.id;

                return (
                  <div
                    key={submission.id}
                    className="rounded-xl border border-border/60 bg-card/60 p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex flex-1 flex-col gap-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-lg font-semibold text-foreground">
                                {submission.first_name} {submission.last_name}
                              </p>
                              <Badge variant="secondary" className="capitalize">
                                {submission.origin ?? "web"}
                              </Badge>
                              {submission.age && (
                                <Badge variant="outline">
                                  Age: {submission.age}
                                </Badge>
                              )}
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
                                Received {formatDateTime(submission.created_at)}
                              </span>
                              <span>
                                Updated {formatDateTime(submission.updated_at)}
                              </span>
                            </div>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <p>{submission.email}</p>
                              <p>{submission.phone}</p>
                              <p className="uppercase">
                                Based in {submission.country}
                              </p>
                              {submission.consultation_mode && (
                                <p className="font-medium text-primary capitalize">
                                  Prefers: {submission.consultation_mode}{" "}
                                  consultation
                                </p>
                              )}
                              {submission.patient_id && (
                                <Badge
                                  variant="outline"
                                  className="mt-1 w-fit text-xs font-normal"
                                >
                                  Linked patient •{" "}
                                  {submission.patient_id.slice(0, 8)}
                                  {submission.patient_id.length > 8 ? "…" : ""}
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
                              {submission.treatment_name ?? "Not specified"}
                              {submission.procedure_name &&
                                ` — ${submission.procedure_name}`}
                            </p>
                            <div className="mt-1 space-y-1 text-xs text-muted-foreground">
                              {submission.budget_range && (
                                <div>
                                  <p className="text-xs uppercase tracking-wide text-muted-foreground/80">
                                    Budget
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {submission.budget_range}
                                  </p>
                                </div>
                              )}
                              {submission.timeline && (
                                <div>
                                  <p className="text-xs uppercase tracking-wide text-muted-foreground/80">
                                    Timeline
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {submission.timeline}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground/80">
                              Medical Condition
                            </p>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {submission.medical_condition}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground/80">
                              Travel Dates
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatTravelDates(submission.travel_dates)}
                            </p>
                            {submission.companion_travelers && (
                              <p className="text-xs text-muted-foreground">
                                Companions: {submission.companion_travelers}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-stretch gap-2 md:items-end md:text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDialogFor(submission)}
                        >
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleSchedule(submission)}
                          className="w-full"
                        >
                          {getActionButtonLabel(submission)}
                        </Button>
                        <AssignmentControl
                          assigneeId={assignment.id}
                          assigneeLabel={assignment.label}
                          assigneeDescription={assignment.description}
                          onAssign={(memberId) => {
                            void handleAssignmentChange(submission, memberId);
                          }}
                          isPending={isRowUpdating}
                          disabled={isRowDeleting}
                        />
                        <div className="space-y-1 text-xs text-muted-foreground md:text-right">
                          <p className="uppercase tracking-wide text-muted-foreground/80">
                            Status
                          </p>
                          <Select
                            value={submission.status}
                            onValueChange={(value) => {
                              void handleStatusChange(
                                submission.id,
                                value as SubmissionStatus,
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
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDelete(submission.id)}
                          disabled={
                            deleteSubmission.isPending &&
                            deletingId === submission.id
                          }
                        >
                          {deletingId === submission.id &&
                          deleteSubmission.isPending ? (
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
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => (open ? setDialogOpen(true) : closeDialog())}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Start Journey Submission Details</DialogTitle>
            <DialogDescription>
              Review the comprehensive intake form and link to a patient record.
            </DialogDescription>
          </DialogHeader>

          {activeSubmission && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Submitted
                </h3>
                <p className="text-sm">
                  {formatDateTime(activeSubmission.created_at)}
                </p>
                <Badge variant="outline" className="capitalize">
                  Source: {activeSubmission.origin ?? "web"}
                </Badge>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Contact Information
                </h3>
                <p className="text-sm font-medium">
                  {activeSubmission.first_name} {activeSubmission.last_name}
                  {activeSubmission.age && ` (Age: ${activeSubmission.age})`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {activeSubmission.email}
                </p>
                <p className="text-sm text-muted-foreground">
                  {activeSubmission.phone}
                </p>
                <p className="text-xs uppercase text-muted-foreground">
                  {activeSubmission.country}
                </p>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Treatment Details
                </h3>
                <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-sm space-y-1">
                  <p>
                    <strong>Treatment:</strong>{" "}
                    {activeSubmission.treatment_name ?? "Not specified"}
                  </p>
                  {activeSubmission.procedure_name && (
                    <p>
                      <strong>Procedure:</strong>{" "}
                      {activeSubmission.procedure_name}
                    </p>
                  )}
                  {activeSubmission.timeline && (
                    <p>
                      <strong>Timeline:</strong> {activeSubmission.timeline}
                    </p>
                  )}
                  {activeSubmission.budget_range && (
                    <p>
                      <strong>Budget:</strong> {activeSubmission.budget_range}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Medical Information
                </h3>
                <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-sm space-y-2">
                  <div>
                    <p className="font-medium">Medical Condition:</p>
                    <p className="whitespace-pre-line">
                      {activeSubmission.medical_condition}
                    </p>
                  </div>
                  {activeSubmission.previous_treatments && (
                    <div>
                      <p className="font-medium">Previous Treatments:</p>
                      <p className="whitespace-pre-line">
                        {activeSubmission.previous_treatments}
                      </p>
                    </div>
                  )}
                  {activeSubmission.current_medications && (
                    <div>
                      <p className="font-medium">Current Medications:</p>
                      <p className="whitespace-pre-line">
                        {activeSubmission.current_medications}
                      </p>
                    </div>
                  )}
                  {activeSubmission.allergies && (
                    <div>
                      <p className="font-medium">Allergies:</p>
                      <p className="whitespace-pre-line">
                        {activeSubmission.allergies}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Travel Preferences
                </h3>
                <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-sm space-y-1">
                  <p>
                    <strong>Travel Dates:</strong>{" "}
                    {formatTravelDates(activeSubmission.travel_dates)}
                  </p>
                  {activeSubmission.accommodation_type && (
                    <p>
                      <strong>Accommodation:</strong>{" "}
                      {activeSubmission.accommodation_type}
                    </p>
                  )}
                  {activeSubmission.companion_travelers && (
                    <p>
                      <strong>Companions:</strong>{" "}
                      {activeSubmission.companion_travelers}
                    </p>
                  )}
                  {languagePreferenceLabel && (
                    <p>
                      <strong>Language:</strong> {languagePreferenceLabel}
                    </p>
                  )}
                  {showLanguageNotes && (
                    <p className="text-xs text-muted-foreground">
                      Notes: {languageNotes}
                    </p>
                  )}
                  {activeSubmission.dietary_requirements && (
                    <p>
                      <strong>Dietary Requirements:</strong>{" "}
                      {activeSubmission.dietary_requirements}
                    </p>
                  )}
                </div>
              </div>

              {activeSubmission && showDocumentsSection && (
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    Documents
                  </h3>
                  <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-sm space-y-3">
                    {activeDocuments.length === 0 ? (
                      <p>No documents uploaded.</p>
                    ) : (
                      <div className="space-y-3">
                        {activeDocuments.map((document) => (
                          <div
                            key={document.id}
                            className="flex flex-col gap-3 rounded-md border border-border/40 bg-background/60 p-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="flex flex-1 items-start gap-3">
                              <Paperclip className="mt-1 h-4 w-4 text-muted-foreground" />
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-medium text-foreground">
                                    {document.originalName}
                                  </p>
                                  <Badge
                                    variant="outline"
                                    className="capitalize"
                                  >
                                    {DOCUMENT_TYPE_LABELS[document.type]}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {formatFileSize(document.size)} • Uploaded{" "}
                                  {formatDateTime(document.uploadedAt)}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => void handleOpenDocument(document)}
                              disabled={openingDocumentId === document.id}
                              className="w-full sm:w-auto"
                            >
                              {openingDocumentId === document.id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Opening...
                                </>
                              ) : (
                                <>
                                  <Download className="mr-2 h-4 w-4" />
                                  View
                                </>
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {(activeSubmission.has_passport ||
                      activeSubmission.has_medical_records ||
                      activeSubmission.has_insurance) && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {activeSubmission.has_passport && (
                          <Badge variant="outline">Has Passport</Badge>
                        )}
                        {activeSubmission.has_medical_records && (
                          <Badge variant="outline">Has Medical Records</Badge>
                        )}
                        {activeSubmission.has_insurance && (
                          <Badge variant="outline">Has Insurance</Badge>
                        )}
                      </div>
                    )}
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
                  <p className="text-xs text-muted-foreground">
                    Patient linked. You can now schedule a consultation from the
                    main view.
                  </p>
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
              disabled={updatingId === activeSubmission?.id}
            >
              {updatingId === activeSubmission?.id ? (
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
