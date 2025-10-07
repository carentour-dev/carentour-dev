"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { CalendarDays, Loader2, PlusCircle } from "lucide-react";
import { format } from "date-fns";

type AppointmentRow = Database["public"]["Tables"]["patient_appointments"]["Row"];
type PatientRow = Database["public"]["Tables"]["patients"]["Row"];
type DoctorRow = Database["public"]["Tables"]["doctors"]["Row"];
type FacilityRow = Database["public"]["Tables"]["facilities"]["Row"];
type ConsultationRow = Database["public"]["Tables"]["patient_consultations"]["Row"];

type AppointmentRecord = AppointmentRow & {
  patients?: Pick<PatientRow, "id" | "full_name" | "contact_email" | "contact_phone" | "nationality"> | null;
  doctors?: Pick<DoctorRow, "id" | "name" | "title"> | null;
  facilities?: Pick<FacilityRow, "id" | "name" | "facility_type"> | null;
  patient_consultations?: Pick<ConsultationRow, "id" | "scheduled_at" | "status"> | null;
};

const appointmentStatuses = ["scheduled", "confirmed", "completed", "cancelled", "rescheduled"] as const;
type AppointmentStatus = (typeof appointmentStatuses)[number];

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
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">("all");
  const [upcomingOnly, setUpcomingOnly] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<AppointmentRecord | null>(null);
  const invalidate = useAdminInvalidate();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: [...QUERY_KEY, statusFilter, upcomingOnly],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (upcomingOnly) params.set("upcomingOnly", "true");
      return adminFetch<AppointmentRecord[]>(`/api/admin/appointments${params.size ? `?${params}` : ""}`);
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
          pre_visit_instructions: payload.pre_visit_instructions?.trim() || null,
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
            <CalendarDays className="h-6 w-6 text-primary" />
            Care Appointments
          </h1>
          <p className="text-sm text-muted-foreground">
            Track patient appointments across facilities and ensure everyone has the right context.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add appointment
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <CardTitle>Appointments</CardTitle>
            <CardDescription>
              {appointments.length === 0
                ? "No appointments match the current filters."
                : `${appointments.length} appointment${appointments.length === 1 ? "" : "s"} in view.`}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as AppointmentStatus | "all")}>
              <SelectTrigger className="w-[180px]">
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
            {appointmentStatuses.map((status) => (
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
              Loading appointments…
            </div>
          ) : appointments.length === 0 ? (
            <div className="rounded-lg border border-dashed border-muted-foreground/30 p-10 text-center">
              <p className="font-medium text-foreground">No appointments found.</p>
              <p className="text-sm text-muted-foreground">
                Adjust filters or add a new appointment to see it here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Starts</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Facility</TableHead>
                    <TableHead className="hidden lg:table-cell">Consultation</TableHead>
                    <TableHead className="w-[140px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-foreground">
                            {appointment.patients?.full_name ?? "Unknown patient"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {appointment.patients?.contact_email ?? appointment.patient_id}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {appointment.doctors ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{appointment.doctors.name}</span>
                            <span className="text-xs text-muted-foreground">{appointment.doctors.title}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
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
                      <TableCell>
                        <Badge
                          variant={
                            appointment.status === "scheduled" || appointment.status === "confirmed"
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
                      <TableCell className="hidden lg:table-cell">
                        {appointment.facilities ? (
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{appointment.facilities.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {appointment.facilities.facility_type}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {appointment.patient_consultations ? (
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {format(new Date(appointment.patient_consultations.scheduled_at), "PPpp")}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {appointment.patient_consultations.status.replace("_", " ")}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Not linked</span>
                        )}
                      </TableCell>
                      <TableCell className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(appointment)}>
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
            <DialogTitle>{editingAppointment ? "Edit appointment" : "Create appointment"}</DialogTitle>
            <DialogDescription>
              {editingAppointment
                ? "Update timing or contextual details for this appointment."
                : "Coordinate facility visits and follow-up care for your patients."}
            </DialogDescription>
          </DialogHeader>
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
                  name="facility_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facility ID (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Paste facility ID"
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
                  name="consultation_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Consultation ID (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Link a consultation"
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
                        <Input
                          type="datetime-local"
                          value={field.value}
                          onChange={(event) => field.onChange(event.target.value)}
                          required
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
                        <Input
                          type="datetime-local"
                          value={field.value ?? ""}
                          onChange={(event) => field.onChange(event.target.value || "")}
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
                      <Select value={field.value} onValueChange={field.onChange}>
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
                        <Input placeholder="Clinic room, address, or virtual" {...field} />
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
                      <Textarea rows={3} placeholder="Bring lab results, arrive fasting, etc." {...field} />
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
                      <Textarea rows={3} placeholder="Logistics or reminders for the care team." {...field} />
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
