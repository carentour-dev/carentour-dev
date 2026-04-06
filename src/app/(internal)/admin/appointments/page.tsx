"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import {
  adminFetch,
  useAdminInvalidate,
} from "@/components/admin/hooks/useAdminFetch";
import { PatientSelector } from "@/components/admin/PatientSelector";
import { DoctorSelector } from "@/components/admin/DoctorSelector";
import {
  WorkspaceEmptyState,
  WorkspaceFilterBar,
  WorkspacePageHeader,
  WorkspacePanel,
  WorkspaceStatusBadge,
} from "@/components/workspaces/WorkspacePrimitives";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";
import { Loader2, PlusCircle } from "lucide-react";
import { format } from "date-fns";

type AppointmentRow =
  Database["public"]["Tables"]["patient_appointments"]["Row"];
type PatientRow = Database["public"]["Tables"]["patients"]["Row"];
type DoctorRow = Database["public"]["Tables"]["doctors"]["Row"];
type ServiceProviderRow =
  Database["public"]["Tables"]["service_providers"]["Row"];
type ConsultationRow =
  Database["public"]["Tables"]["patient_consultations"]["Row"];

type AppointmentRecord = AppointmentRow & {
  patients?: Pick<
    PatientRow,
    "id" | "full_name" | "contact_email" | "contact_phone" | "nationality"
  > | null;
  doctors?: Pick<DoctorRow, "id" | "name" | "title"> | null;
  service_provider?: Pick<
    ServiceProviderRow,
    "id" | "name" | "facility_type"
  > | null;
  patient_consultations?: Pick<
    ConsultationRow,
    "id" | "scheduled_at" | "status"
  > | null;
};

const appointmentStatuses = [
  "scheduled",
  "confirmed",
  "completed",
  "cancelled",
  "rescheduled",
] as const;
type AppointmentStatus = (typeof appointmentStatuses)[number];

const getAppointmentStatusTone = (status: AppointmentStatus) => {
  switch (status) {
    case "completed":
      return "success" as const;
    case "cancelled":
      return "danger" as const;
    case "rescheduled":
      return "warning" as const;
    case "confirmed":
      return "info" as const;
    default:
      return "default" as const;
  }
};

const nullableUuidField = z.preprocess((value) => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return value ?? null;
}, z.string().uuid().nullable());

const formSchema = z.object({
  patient_id: z.string().uuid({ message: "Select a patient" }),
  doctor_id: nullableUuidField,
  facility_id: nullableUuidField,
  consultation_id: nullableUuidField,
  title: z.string().min(3, "Title is required"),
  appointment_type: z.string().min(2, "Appointment type is required"),
  starts_at: z.string().min(1, "Provide a start time"),
  ends_at: z.string().optional(),
  status: z.enum(appointmentStatuses),
  timezone: z.string().min(1).max(60),
  location: z.string().optional(),
  pre_visit_instructions: z.string().optional(),
  notes: z.string().optional(),
});

type AppointmentFormValues = z.infer<typeof formSchema>;

const QUERY_KEY = ["admin", "patient-appointments"] as const;

const toDateTimeLocal = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (num: number) => num.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}`;
};

const toIsoString = (value: string) => {
  if (!value) return new Date().toISOString();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date");
  }
  return date.toISOString();
};

export default function AdminAppointmentsPage() {
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">(
    "all",
  );
  const [upcomingOnly, setUpcomingOnly] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] =
    useState<AppointmentRecord | null>(null);
  const invalidate = useAdminInvalidate();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: [...QUERY_KEY, statusFilter, upcomingOnly],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (upcomingOnly) params.set("upcomingOnly", "true");
      return adminFetch<AppointmentRecord[]>(
        `/api/admin/appointments${params.size ? `?${params}` : ""}`,
      );
    },
  });

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patient_id: "",
      doctor_id: null,
      facility_id: null,
      consultation_id: null,
      title: "",
      appointment_type: "",
      starts_at: "",
      ends_at: "",
      status: "scheduled",
      timezone: "UTC",
      location: "",
      pre_visit_instructions: "",
      notes: "",
    },
  });

  const hasUnsavedChanges = form.formState.isDirty;

  const attemptCloseDialog = () => {
    if (
      !hasUnsavedChanges ||
      window.confirm("Discard unsaved appointment changes?")
    ) {
      closeDialog();
    }
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingAppointment(null);
    form.reset({
      patient_id: "",
      doctor_id: null,
      facility_id: null,
      consultation_id: null,
      title: "",
      appointment_type: "",
      starts_at: "",
      ends_at: "",
      status: "scheduled",
      timezone: "UTC",
      location: "",
      pre_visit_instructions: "",
      notes: "",
    });
  };

  const openCreateDialog = () => {
    setEditingAppointment(null);
    form.reset({
      patient_id: "",
      doctor_id: null,
      facility_id: null,
      consultation_id: null,
      title: "",
      appointment_type: "",
      starts_at: "",
      ends_at: "",
      status: "scheduled",
      timezone: "UTC",
      location: "",
      pre_visit_instructions: "",
      notes: "",
    });
    setDialogOpen(true);
  };

  const openEditDialog = (appointment: AppointmentRecord) => {
    setEditingAppointment(appointment);
    form.reset({
      patient_id: appointment.patient_id,
      doctor_id: appointment.doctor_id ?? null,
      facility_id: appointment.facility_id ?? null,
      consultation_id: appointment.consultation_id ?? null,
      title: appointment.title,
      appointment_type: appointment.appointment_type,
      starts_at: toDateTimeLocal(appointment.starts_at),
      ends_at: appointment.ends_at ? toDateTimeLocal(appointment.ends_at) : "",
      status: appointment.status,
      timezone: appointment.timezone ?? "UTC",
      location: appointment.location ?? "",
      pre_visit_instructions: appointment.pre_visit_instructions ?? "",
      notes: appointment.notes ?? "",
    });
    setDialogOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: (payload: AppointmentFormValues) =>
      adminFetch<AppointmentRecord>("/api/admin/appointments", {
        method: "POST",
        body: JSON.stringify({
          ...payload,
          doctor_id: payload.doctor_id || null,
          facility_id: payload.facility_id || null,
          consultation_id: payload.consultation_id || null,
          starts_at: toIsoString(payload.starts_at),
          ends_at: payload.ends_at ? toIsoString(payload.ends_at) : null,
          location: payload.location?.trim() || null,
          pre_visit_instructions:
            payload.pre_visit_instructions?.trim() || null,
          notes: payload.notes?.trim() || null,
        }),
      }),
    onSuccess: () => {
      invalidate(QUERY_KEY);
      toast({ title: "Appointment created" });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create appointment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AppointmentFormValues }) =>
      adminFetch<AppointmentRecord>(`/api/admin/appointments/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...data,
          doctor_id: data.doctor_id || null,
          facility_id: data.facility_id || null,
          consultation_id: data.consultation_id || null,
          starts_at: toIsoString(data.starts_at),
          ends_at: data.ends_at ? toIsoString(data.ends_at) : null,
          location: data.location?.trim() || null,
          pre_visit_instructions: data.pre_visit_instructions?.trim() || null,
          notes: data.notes?.trim() || null,
        }),
      }),
    onSuccess: () => {
      invalidate(QUERY_KEY);
      toast({ title: "Appointment updated" });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update appointment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/api/admin/appointments/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      invalidate(QUERY_KEY);
      toast({ title: "Appointment deleted" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete appointment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const appointments = useMemo(() => query.data ?? [], [query.data]);

  const groupedByStatus = useMemo(() => {
    return appointments.reduce<Record<AppointmentStatus, number>>(
      (acc, appointment) => {
        acc[appointment.status] = (acc[appointment.status] ?? 0) + 1;
        return acc;
      },
      {
        scheduled: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
        rescheduled: 0,
      },
    );
  }, [appointments]);

  const onSubmit = (values: AppointmentFormValues) => {
    if (editingAppointment) {
      updateMutation.mutate({ id: editingAppointment.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  return (
    <div className="space-y-8">
      <WorkspacePageHeader
        breadcrumb="Admin"
        title="Care Appointments"
        subtitle="Track patient appointments across service providers and ensure every coordinator, doctor, and patient handoff stays aligned."
        actions={
          <Button size="sm" onClick={openCreateDialog}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add appointment
          </Button>
        }
      />

      <WorkspacePanel
        title="Appointments"
        description={
          appointments.length === 0
            ? "No appointments match the current filters."
            : `${appointments.length} appointment${appointments.length === 1 ? "" : "s"} in view.`
        }
        contentClassName="space-y-6"
      >
        <WorkspaceFilterBar className="gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {appointmentStatuses.map((status) => (
              <WorkspaceStatusBadge
                key={status}
                tone={
                  statusFilter === "all" || statusFilter === status
                    ? getAppointmentStatusTone(status)
                    : "muted"
                }
                className="gap-2 border-border/70 px-3 py-1.5"
              >
                <span>{status.replace("_", " ")}</span>
                <span className="rounded-full bg-background/70 px-1.5 py-0.5 text-[9px] tracking-[0.16em] text-foreground/80">
                  {groupedByStatus[status]}
                </span>
              </WorkspaceStatusBadge>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as AppointmentStatus | "all")
              }
            >
              <SelectTrigger className="w-[180px] bg-background/80">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {appointmentStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-2 text-sm">
              <Switch
                checked={upcomingOnly}
                onCheckedChange={setUpcomingOnly}
                id="upcoming-only"
              />
              <label htmlFor="upcoming-only" className="text-muted-foreground">
                Upcoming only
              </label>
            </div>
          </div>
        </WorkspaceFilterBar>

        {query.isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading appointments…
          </div>
        ) : appointments.length === 0 ? (
          <WorkspaceEmptyState
            title="No appointments found"
            description="Adjust the current filters or create a new appointment to populate this schedule."
          />
        ) : (
          <div className="overflow-hidden rounded-[1.15rem] border border-border/70 bg-background/55">
            <Table>
              <TableHeader>
                <TableRow className="border-border/70 hover:bg-transparent">
                  <TableHead className="h-12 px-5 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                    Patient
                  </TableHead>
                  <TableHead className="h-12 px-5 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                    Doctor
                  </TableHead>
                  <TableHead className="h-12 px-5 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                    Starts
                  </TableHead>
                  <TableHead className="h-12 px-5 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="hidden h-12 px-5 text-xs uppercase tracking-[0.22em] text-muted-foreground lg:table-cell">
                    Service Provider
                  </TableHead>
                  <TableHead className="hidden h-12 px-5 text-xs uppercase tracking-[0.22em] text-muted-foreground lg:table-cell">
                    Consultation
                  </TableHead>
                  <TableHead className="h-12 px-5 text-right text-xs uppercase tracking-[0.22em] text-muted-foreground">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((appointment) => (
                  <TableRow
                    key={appointment.id}
                    className="border-border/70 hover:bg-muted/30"
                  >
                    <TableCell className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-foreground">
                          {appointment.patients?.full_name ?? "Unknown patient"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {appointment.patients?.contact_email ??
                            appointment.patient_id}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      {appointment.doctors ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">
                            {appointment.doctors.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {appointment.doctors.title}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Not assigned
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {format(new Date(appointment.starts_at), "PPpp")}
                        </span>
                        {appointment.ends_at ? (
                          <span className="text-xs text-muted-foreground">
                            Ends {format(new Date(appointment.ends_at), "PPpp")}
                          </span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <Badge
                        variant={
                          appointment.status === "scheduled" ||
                          appointment.status === "confirmed"
                            ? "default"
                            : appointment.status === "completed"
                              ? "success"
                              : "secondary"
                        }
                        className="capitalize"
                      >
                        {appointment.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden px-5 py-4 lg:table-cell">
                      {appointment.service_provider ? (
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {appointment.service_provider.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {appointment.service_provider.facility_type}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Not assigned
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="hidden px-5 py-4 lg:table-cell">
                      {appointment.patient_consultations ? (
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {format(
                              new Date(
                                appointment.patient_consultations.scheduled_at,
                              ),
                              "PPpp",
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {appointment.patient_consultations.status.replace(
                              "_",
                              " ",
                            )}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Not linked
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(appointment)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive"
                          onClick={() => deleteMutation.mutate(appointment.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </WorkspacePanel>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => (!open ? closeDialog() : setDialogOpen(open))}
      >
        <DialogContent
          className="max-h-[min(92vh,860px)] overflow-y-auto sm:max-w-4xl"
          unsaved={hasUnsavedChanges}
        >
          <DialogHeader>
            <DialogTitle>
              {editingAppointment ? "Edit appointment" : "Create appointment"}
            </DialogTitle>
            <DialogDescription>
              {editingAppointment
                ? "Update timing or contextual details for this appointment."
                : "Coordinate service provider visits and follow-up care for your patients."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-7">
              <div className="grid gap-5 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="patient_id"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Patient</FormLabel>
                      <FormControl>
                        <PatientSelector
                          value={field.value}
                          onValueChange={field.onChange}
                        />
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
                  name="facility_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service provider ID (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Paste service provider ID"
                          value={field.value ?? ""}
                          onChange={(event) =>
                            field.onChange(event.target.value || null)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="consultation_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Consultation ID (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Link a consultation"
                          value={field.value ?? ""}
                          onChange={(event) =>
                            field.onChange(event.target.value || null)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Follow-up visit" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="appointment_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Appointment type</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Post-op check" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="starts_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Starts at</FormLabel>
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
                  name="ends_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ends at (optional)</FormLabel>
                      <FormControl>
                        <DateTimePicker
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          minuteStep={15}
                          allowClear
                          placeholder="No end time"
                        />
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
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {appointmentStatuses.map((status) => (
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
                  name="location"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Location (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Clinic room, address, or virtual"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="pre_visit_instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pre-visit instructions (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Bring lab results, arrive fasting, etc."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Internal notes</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Logistics or reminders for the care team."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="border-t border-border/70 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={attemptCloseDialog}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {editingAppointment ? "Save changes" : "Create appointment"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
