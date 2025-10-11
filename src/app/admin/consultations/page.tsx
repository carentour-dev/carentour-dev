"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { DateTimePicker } from "@/components/ui/date-time-picker";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { adminFetch, useAdminInvalidate } from "@/components/admin/hooks/useAdminFetch";
import { PatientSelector } from "@/components/admin/PatientSelector";
import { DoctorSelector } from "@/components/admin/DoctorSelector";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";
import { CalendarClock, Loader2, PlusCircle } from "lucide-react";
import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";

type ConsultationRow = Database["public"]["Tables"]["patient_consultations"]["Row"];
type PatientRow = Database["public"]["Tables"]["patients"]["Row"];
type DoctorRow = Database["public"]["Tables"]["doctors"]["Row"];
type ContactRequestRow = Database["public"]["Tables"]["contact_requests"]["Row"];

type ConsultationRecord = ConsultationRow & {
  patients?: Pick<PatientRow, "id" | "full_name" | "contact_email" | "contact_phone" | "nationality"> | null;
  doctors?: Pick<DoctorRow, "id" | "name" | "title"> | null;
  contact_requests?: Pick<ContactRequestRow, "id" | "status" | "request_type" | "origin"> | null;
};

const consultationStatuses = ["scheduled", "rescheduled", "completed", "cancelled", "no_show"] as const;
type ConsultationStatus = (typeof consultationStatuses)[number];
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (value?: string | null): value is string => Boolean(value && uuidPattern.test(value));

const nullableUuidField = z.preprocess(
  (value) => {
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
    return value ?? null;
  },
  z.string().uuid().nullable(),
);

const formSchema = z.object({
  patient_id: z.string().uuid({ message: "Select a patient" }),
  doctor_id: nullableUuidField,
  contact_request_id: nullableUuidField,
  scheduled_at: z.string().min(1, "Provide a schedule"),
  duration_minutes: z
    .union([z.string(), z.number()])
    .optional()
    .transform((value) => {
      if (value === undefined || value === null) {
        return undefined;
      }
      if (typeof value === "number") {
        return value;
      }
      const trimmed = value.trim();
      if (trimmed.length === 0) {
        return undefined;
      }
      const parsed = Number(trimmed);
      return Number.isFinite(parsed) ? parsed : NaN;
    })
    .refine((value) => value === undefined || (Number.isInteger(value) && value >= 5 && value <= 480), {
      message: "Duration must be between 5 and 480 minutes",
    }),
  timezone: z.string().min(1).max(60),
  location: z.string().optional(),
  meeting_url: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(consultationStatuses),
});

type ConsultationFormValues = z.infer<typeof formSchema>;

const QUERY_KEY = ["admin", "patient-consultations"] as const;

const toDateTimeLocal = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (num: number) => num.toString().padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
};

const toIsoString = (value: string) => {
  if (!value) return new Date().toISOString();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date");
  }
  return date.toISOString();
};

export default function AdminConsultationsPage() {
  const [statusFilter, setStatusFilter] = useState<ConsultationStatus | "all">("all");
  const [upcomingOnly, setUpcomingOnly] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConsultation, setEditingConsultation] = useState<ConsultationRecord | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const schedulePrefillKeyRef = useRef<string | null>(null);

  const invalidate = useAdminInvalidate();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: [...QUERY_KEY, statusFilter, upcomingOnly],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }
      if (upcomingOnly) {
        params.set("upcomingOnly", "true");
      }
      return adminFetch<ConsultationRecord[]>(`/api/admin/consultations${params.size ? `?${params}` : ""}`);
    },
  });

const form = useForm<ConsultationFormValues>({
  resolver: zodResolver(formSchema),
  defaultValues: {
    patient_id: "",
    doctor_id: null,
    contact_request_id: null,
    scheduled_at: "",
    duration_minutes: undefined,
    timezone: "UTC",
    location: "",
    meeting_url: "",
    notes: "",
    status: "scheduled",
  },
  });

const resetForm = useCallback(
  (overrides?: Partial<ConsultationFormValues>) => {
    form.reset({
      patient_id: "",
      doctor_id: null,
      contact_request_id: null,
      scheduled_at: "",
      duration_minutes: undefined,
        timezone: "UTC",
        location: "",
        meeting_url: "",
        notes: "",
        status: "scheduled",
        ...overrides,
      });
    },
    [form],
  );

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingConsultation(null);
    resetForm();
  };

  const openCreateDialog = () => {
    setEditingConsultation(null);
    resetForm();
    setDialogOpen(true);
  };

const openEditDialog = (consultation: ConsultationRecord) => {
  setEditingConsultation(consultation);
  resetForm({
    patient_id: consultation.patient_id,
    doctor_id: consultation.doctor_id ?? null,
    contact_request_id: consultation.contact_request_id ?? null,
    scheduled_at: toDateTimeLocal(consultation.scheduled_at),
    duration_minutes: consultation.duration_minutes ?? undefined,
      timezone: consultation.timezone ?? "UTC",
      location: consultation.location ?? "",
      meeting_url: consultation.meeting_url ?? "",
      notes: consultation.notes ?? "",
      status: consultation.status,
    });
    setDialogOpen(true);
  };

  useEffect(() => {
    const scheduleFlag = searchParams.get("schedule");

    if (scheduleFlag !== "1") {
      schedulePrefillKeyRef.current = null;
      return;
    }

    const patientIdParam = searchParams.get("patientId");
    const contactRequestIdParam = searchParams.get("contactRequestId");
    const key = `${scheduleFlag}:${patientIdParam ?? ""}:${contactRequestIdParam ?? ""}`;

    if (schedulePrefillKeyRef.current === key) {
      return;
    }

    schedulePrefillKeyRef.current = key;

    resetForm({
      patient_id: patientIdParam ?? "",
      contact_request_id: contactRequestIdParam ?? null,
    });
    setEditingConsultation(null);
    setDialogOpen(true);

    router.replace("/admin/consultations", { scroll: false });
  }, [resetForm, router, searchParams]);

  const contactRequestIdField = form.watch("contact_request_id");
  const normalizedContactRequestId = useMemo(() => {
    if (typeof contactRequestIdField !== "string") {
      return null;
    }
    const trimmed = contactRequestIdField.trim();
    return trimmed.length > 0 ? trimmed : null;
  }, [contactRequestIdField]);

  const isContactRequestIdValid = isUuid(normalizedContactRequestId);

  const contactRequestQuery = useQuery({
    queryKey: ["admin", "contact-request", normalizedContactRequestId],
    queryFn: () =>
      normalizedContactRequestId
        ? adminFetch<ContactRequestRow>(`/api/admin/requests/${normalizedContactRequestId}`)
        : Promise.resolve(null),
    enabled: isContactRequestIdValid,
    staleTime: 30_000,
  });

  const renderLinkedRequestSummary = () => {
    if (!normalizedContactRequestId) {
      return null;
    }

    if (!isContactRequestIdValid) {
      return (
        <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          Provide a valid request ID to load the original intake.
        </div>
      );
    }

    if (contactRequestQuery.isLoading) {
      return (
        <div className="mt-4 flex items-center gap-2 rounded-md border border-border/60 bg-muted/10 p-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading request details…
        </div>
      );
    }

    if (contactRequestQuery.isError) {
      return (
        <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          Failed to load request details. You can still continue scheduling.
        </div>
      );
    }

    const request = contactRequestQuery.data;

    if (!request) {
      return (
        <div className="mt-4 rounded-md border border-border/60 bg-muted/10 p-3 text-sm text-muted-foreground">
          No request details found for this ID.
        </div>
      );
    }

    const travelDate = request.travel_window ? new Date(request.travel_window) : null;
    const travelDisplay =
      travelDate && !Number.isNaN(travelDate.getTime()) ? format(travelDate, "PPpp") : request.travel_window ?? "";

    return (
      <div className="mt-4 rounded-md border border-primary/30 bg-primary/5 p-4 text-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase text-muted-foreground">Linked intake</p>
            <p className="font-medium text-foreground">
              {request.first_name} {request.last_name}
            </p>
            <p className="text-xs text-muted-foreground">{request.email}</p>
            {request.phone && <p className="text-xs text-muted-foreground">{request.phone}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {request.status.replace("_", " ")}
            </Badge>
            <Badge variant="secondary" className="capitalize">
              {request.request_type ?? "general"}
            </Badge>
            {request.origin && (
              <Badge variant="ghost" className="capitalize">
                {request.origin}
              </Badge>
            )}
          </div>
        </div>
        {request.treatment && (
          <p className="mt-3 text-xs uppercase text-muted-foreground">
            Treatment interest:&nbsp;
            <span className="normal-case text-foreground">{request.treatment}</span>
          </p>
        )}
        {request.travel_window && (
          <p className="text-xs uppercase text-muted-foreground">
            Travel window:&nbsp;
            <span className="normal-case text-foreground">{travelDisplay}</span>
          </p>
        )}
        {request.message && (
          <p className="mt-3 line-clamp-3 text-sm text-muted-foreground whitespace-pre-line">{request.message}</p>
        )}
      </div>
    );
  };

  const syncLinkedRequest = useCallback(
    async (requestId: string, patientId: string) => {
      try {
        await adminFetch<ContactRequestRow>(`/api/admin/requests/${requestId}`, {
          method: "PATCH",
          body: JSON.stringify({
            status: "in_progress",
            patient_id: patientId,
          }),
        });
        invalidate(["admin", "contact-requests"]);
      } catch (error) {
        console.error("Failed to sync linked contact request", error);
        toast({
          title: "Linked request update failed",
          description:
            error instanceof Error ? error.message : "Unable to update the linked request status.",
          variant: "destructive",
        });
      }
    },
    [invalidate, toast],
  );

  const createMutation = useMutation({
    mutationFn: (payload: ConsultationFormValues) =>
      adminFetch<ConsultationRecord>("/api/admin/consultations", {
        method: "POST",
        body: JSON.stringify({
          ...payload,
          doctor_id: payload.doctor_id || null,
          contact_request_id: payload.contact_request_id || null,
          scheduled_at: toIsoString(payload.scheduled_at),
          duration_minutes: payload.duration_minutes ?? null,
          location: payload.location?.trim() || null,
          meeting_url: payload.meeting_url?.trim() || null,
          notes: payload.notes?.trim() || null,
        }),
      }),
    onSuccess: async (_consultation, variables) => {
      invalidate(QUERY_KEY);
      if (variables?.contact_request_id && variables.patient_id) {
        await syncLinkedRequest(variables.contact_request_id, variables.patient_id);
      }
      toast({ title: "Consultation scheduled" });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to schedule consultation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ConsultationFormValues }) =>
      adminFetch<ConsultationRecord>(`/api/admin/consultations/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...data,
          doctor_id: data.doctor_id || null,
          contact_request_id: data.contact_request_id || null,
          scheduled_at: toIsoString(data.scheduled_at),
          duration_minutes: data.duration_minutes ?? null,
          location: data.location?.trim() || null,
          meeting_url: data.meeting_url?.trim() || null,
          notes: data.notes?.trim() || null,
        }),
      }),
    onSuccess: async (_consultation, variables) => {
      invalidate(QUERY_KEY);
      if (variables?.data.contact_request_id && variables.data.patient_id) {
        await syncLinkedRequest(variables.data.contact_request_id, variables.data.patient_id);
      }
      toast({ title: "Consultation updated" });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update consultation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/api/admin/consultations/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      invalidate(QUERY_KEY);
      toast({ title: "Consultation deleted" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete consultation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const consultations = useMemo(() => query.data ?? [], [query.data]);

  const groupedByStatus = useMemo(() => {
    return consultations.reduce<Record<ConsultationStatus, number>>(
      (acc, consultation) => {
        acc[consultation.status] = (acc[consultation.status] ?? 0) + 1;
        return acc;
      },
      {
        scheduled: 0,
        rescheduled: 0,
        completed: 0,
        cancelled: 0,
        no_show: 0,
      },
    );
  }, [consultations]);

  const onSubmit = (values: ConsultationFormValues) => {
    if (editingConsultation) {
      updateMutation.mutate({ id: editingConsultation.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
            <CalendarClock className="h-6 w-6 text-primary" />
            Patient Consultations
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitor scheduled consultations and coordinate next steps across the care team.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Schedule consultation
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <CardTitle>Consultations</CardTitle>
            <CardDescription>
              {consultations.length === 0
                ? "No consultations match the current filters."
                : `${consultations.length} consultation${consultations.length === 1 ? "" : "s"} in view.`}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ConsultationStatus | "all")}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {consultationStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 text-sm">
              <Switch checked={upcomingOnly} onCheckedChange={setUpcomingOnly} id="upcoming-only" />
              <label htmlFor="upcoming-only" className="text-muted-foreground">
                Upcoming only
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3 text-sm">
            {consultationStatuses.map((status) => (
              <Badge
                key={status}
                variant={statusFilter === status ? "default" : "secondary"}
                className="flex items-center gap-1"
              >
                <span className="capitalize">{status.replace("_", " ")}</span>
                <span className="text-xs">{groupedByStatus[status]}</span>
              </Badge>
            ))}
          </div>
          <Separator />
          {query.isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading consultations…
            </div>
          ) : consultations.length === 0 ? (
            <div className="rounded-lg border border-dashed border-muted-foreground/30 p-10 text-center">
              <p className="font-medium text-foreground">No consultations found.</p>
              <p className="text-sm text-muted-foreground">
                Adjust filters or schedule a new consultation to see it here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Contact Request</TableHead>
                    <TableHead className="w-[140px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consultations.map((consultation) => (
                    <TableRow key={consultation.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-foreground">
                            {consultation.patients?.full_name ?? "Unknown patient"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {consultation.patients?.contact_email ?? consultation.patient_id}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {consultation.doctors ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{consultation.doctors.name}</span>
                            <span className="text-xs text-muted-foreground">{consultation.doctors.title}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {format(new Date(consultation.scheduled_at), "PPpp")}
                          </span>
                          {consultation.duration_minutes ? (
                            <span className="text-xs text-muted-foreground">
                              {consultation.duration_minutes} minutes
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            consultation.status === "scheduled" || consultation.status === "rescheduled"
                              ? "default"
                              : consultation.status === "completed"
                                ? "success"
                                : "secondary"
                          }
                          className="capitalize"
                        >
                          {consultation.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {consultation.contact_requests ? (
                          <div className="flex flex-col">
                            <span className="text-sm">
                              {consultation.contact_requests.request_type ?? "general"}
                            </span>
                            <span className="text-xs text-muted-foreground capitalize">
                              {consultation.contact_requests.status} • {consultation.contact_requests.origin}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Not linked</span>
                        )}
                      </TableCell>
                      <TableCell className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(consultation)}>
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive"
                          onClick={() => deleteMutation.mutate(consultation.id)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => (!open ? closeDialog() : setDialogOpen(open))}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingConsultation ? "Edit consultation" : "Schedule consultation"}</DialogTitle>
            <DialogDescription>
              {editingConsultation
                ? "Adjust the schedule, doctor, or notes for this consultation."
                : "Link a patient to an upcoming consultation slot for your care coordinators."}
            </DialogDescription>
          </DialogHeader>
          {renderLinkedRequestSummary()}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="patient_id"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Patient</FormLabel>
                      <FormControl>
                        <PatientSelector value={field.value} onValueChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="doctor_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Doctor (optional)</FormLabel>
                      <FormControl>
                        <DoctorSelector
                          value={field.value ?? null}
                          onValueChange={(value) => field.onChange(value)}
                          allowClear
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contact_request_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Linked request (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Paste contact request ID"
                          value={field.value ?? ""}
                          onChange={(event) => field.onChange(event.target.value || null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="scheduled_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scheduled for</FormLabel>
                      <FormControl>
                        <DateTimePicker
                          value={field.value}
                          onChange={field.onChange}
                          minuteStep={15}
                          defaultHour={9}
                          defaultMinute={0}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="duration_minutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={5}
                          max={480}
                          placeholder="30"
                          value={field.value ?? ""}
                          onChange={(event) => field.onChange(event.target.value || undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timezone</FormLabel>
                      <FormControl>
                        <Input placeholder="UTC" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {consultationStatuses.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status.replace("_", " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Location (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="On-site clinic or virtual" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="meeting_url"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Meeting link (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://zoom.us/..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes for coordination</FormLabel>
                    <FormControl>
                      <Textarea rows={4} placeholder="Pre-consultation checklist, interpreter needs, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {editingConsultation ? "Save changes" : "Schedule consultation"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
