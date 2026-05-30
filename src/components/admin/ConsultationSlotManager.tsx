"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarPlus, Loader2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ComboBox } from "@/components/ui/combobox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { DoctorSelector } from "@/components/admin/DoctorSelector";
import {
  adminFetch,
  useAdminInvalidate,
} from "@/components/admin/hooks/useAdminFetch";
import {
  WorkspaceEmptyState,
  WorkspacePanel,
  WorkspaceStatusBadge,
} from "@/components/workspaces/WorkspacePrimitives";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";
import { getDefaultTimeZone, TIMEZONE_OPTIONS } from "@/lib/timezones";

type SlotRow = Database["public"]["Tables"]["consultation_slots"]["Row"];
type DoctorRow = Database["public"]["Tables"]["doctors"]["Row"];
type ConsultationRow =
  Database["public"]["Tables"]["patient_consultations"]["Row"];
type PatientRow = Database["public"]["Tables"]["patients"]["Row"];

type ConsultationSlotRecord = SlotRow & {
  doctors?: Pick<DoctorRow, "id" | "name" | "title" | "specialization"> | null;
  patient_consultations?:
    | (Pick<
        ConsultationRow,
        "id" | "patient_id" | "status" | "scheduled_at"
      > & {
        patients?: Pick<
          PatientRow,
          "id" | "full_name" | "contact_email"
        > | null;
      })
    | null;
};

export type ConsultationSlotManagerConsultation = ConsultationRow & {
  patients?: Pick<
    PatientRow,
    "id" | "full_name" | "contact_email" | "contact_phone" | "nationality"
  > | null;
  doctors?: Pick<DoctorRow, "id" | "name" | "title"> | null;
  contact_requests?: {
    id: string;
    status: string | null;
    request_type: string | null;
    origin: string | null;
  } | null;
};

type ConsultationSlotManagerProps = {
  consultations?: ConsultationSlotManagerConsultation[];
  onManageConsultation?: (
    consultation: ConsultationSlotManagerConsultation,
  ) => void;
};

const bookingTypes = ["video", "phone", "onsite"] as const;
const slotStatuses = [
  "available",
  "held",
  "booked",
  "blocked",
  "cancelled",
] as const;
const manuallyManagedSlotStatuses = [
  "available",
  "blocked",
  "cancelled",
] as const;

const bookingTypeLabels: Record<(typeof bookingTypes)[number], string> = {
  video: "Video",
  phone: "Phone Call",
  onsite: "Onsite",
};

const slotStatusLabels: Record<(typeof slotStatuses)[number], string> = {
  available: "Available",
  held: "Held",
  booked: "Booked",
  blocked: "Blocked",
  cancelled: "Cancelled",
};

const getStatusOptions = (current: SlotFormValues["status"]) =>
  current === "held" || current === "booked"
    ? [current, ...manuallyManagedSlotStatuses]
    : manuallyManagedSlotStatuses;

const getStatusOptionLabel = (status: SlotFormValues["status"]) =>
  status === "held" || status === "booked"
    ? `${slotStatusLabels[status]} (system)`
    : slotStatusLabels[status];

const formSchema = z
  .object({
    doctor_id: z.string().uuid({ message: "Select a doctor" }),
    booking_type: z.enum(bookingTypes),
    status: z.enum(slotStatuses),
    starts_at: z.string().min(1, "Provide a start time"),
    ends_at: z.string().min(1, "Provide an end time"),
    timezone: z.string().min(2).max(60),
    location: z.string().optional(),
    meeting_url: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine((data) => new Date(data.ends_at) > new Date(data.starts_at), {
    path: ["ends_at"],
    message: "End time must be after start time",
  })
  .superRefine((data, ctx) => {
    if (data.booking_type === "onsite" && !data.location?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["location"],
        message: "Onsite consultation slots require a location",
      });
    }
  });

type SlotFormValues = z.infer<typeof formSchema>;

const QUERY_KEY = ["admin", "consultation-slots"] as const;

const toDateTimeLocal = (date: Date) => {
  const pad = (num: number) => num.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
};

const toIsoString = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date");
  }
  return date.toISOString();
};

const defaultStart = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(9, 0, 0, 0);
  return date;
};

const defaultEnd = (start: Date) => {
  const date = new Date(start);
  date.setMinutes(date.getMinutes() + 30);
  return date;
};

const formatSlotStatus = (status: SlotRow["status"]) =>
  slotStatusLabels[status] ?? status;

const formatBookingType = (type: SlotRow["booking_type"]) =>
  bookingTypeLabels[type] ?? type;

const getSlotTone = (status: SlotRow["status"]) => {
  if (status === "booked") return "success" as const;
  if (status === "cancelled") return "danger" as const;
  if (status === "held" || status === "blocked") return "warning" as const;
  return "default" as const;
};

export function ConsultationSlotManager({
  consultations = [],
  onManageConsultation,
}: ConsultationSlotManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<ConsultationSlotRecord | null>(
    null,
  );
  const invalidate = useAdminInvalidate();
  const { toast } = useToast();

  const range = useMemo(() => {
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 60);
    return { from: from.toISOString(), to: to.toISOString() };
  }, []);

  const query = useQuery({
    queryKey: [...QUERY_KEY, range.from, range.to],
    queryFn: () => {
      const params = new URLSearchParams({
        from: range.from,
        to: range.to,
      });
      return adminFetch<ConsultationSlotRecord[]>(
        `/api/admin/consultation-slots?${params.toString()}`,
      );
    },
  });

  const initialStart = defaultStart();
  const form = useForm<SlotFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      doctor_id: "",
      booking_type: "video",
      status: "available",
      starts_at: toDateTimeLocal(initialStart),
      ends_at: toDateTimeLocal(defaultEnd(initialStart)),
      timezone: getDefaultTimeZone(),
      location: "",
      meeting_url: "",
      notes: "",
    },
  });
  const watchedBookingType = useWatch({
    control: form.control,
    name: "booking_type",
  });

  const resetForm = () => {
    const start = defaultStart();
    form.reset({
      doctor_id: "",
      booking_type: "video",
      status: "available",
      starts_at: toDateTimeLocal(start),
      ends_at: toDateTimeLocal(defaultEnd(start)),
      timezone: getDefaultTimeZone(),
      location: "",
      meeting_url: "",
      notes: "",
    });
  };

  const openCreateDialog = () => {
    setEditingSlot(null);
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (slot: ConsultationSlotRecord) => {
    setEditingSlot(slot);
    form.reset({
      doctor_id: slot.doctor_id,
      booking_type: slot.booking_type,
      status: slot.status,
      starts_at: toDateTimeLocal(new Date(slot.starts_at)),
      ends_at: toDateTimeLocal(new Date(slot.ends_at)),
      timezone: slot.timezone,
      location: slot.location ?? "",
      meeting_url: slot.meeting_url ?? "",
      notes: slot.notes ?? "",
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingSlot(null);
    resetForm();
  };

  const buildSlotPayload = (values: SlotFormValues) => ({
    ...values,
    starts_at: toIsoString(values.starts_at),
    ends_at: toIsoString(values.ends_at),
    location:
      values.booking_type === "onsite" ? values.location?.trim() || null : null,
    meeting_url:
      values.booking_type === "video"
        ? values.meeting_url?.trim() || null
        : null,
    notes: values.notes?.trim() || null,
  });

  const createMutation = useMutation({
    mutationFn: (values: SlotFormValues) =>
      adminFetch<ConsultationSlotRecord>("/api/admin/consultation-slots", {
        method: "POST",
        body: JSON.stringify(buildSlotPayload(values)),
      }),
    onSuccess: () => {
      invalidate(QUERY_KEY);
      toast({ title: "Consultation slot added" });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add slot",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: SlotFormValues }) =>
      adminFetch<ConsultationSlotRecord>(
        `/api/admin/consultation-slots/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify(buildSlotPayload(values)),
        },
      ),
    onSuccess: () => {
      invalidate(QUERY_KEY);
      toast({ title: "Consultation slot updated" });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update slot",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/api/admin/consultation-slots/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      invalidate(QUERY_KEY);
      toast({ title: "Consultation slot deleted" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete slot",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const slots = query.data ?? [];
  const consultationById = useMemo(() => {
    const map = new Map<string, ConsultationSlotManagerConsultation>();
    for (const consultation of consultations) {
      map.set(consultation.id, consultation);
    }
    return map;
  }, [consultations]);

  return (
    <WorkspacePanel
      title="Doctor Availability"
      description="Publish concrete consultation slots that patients can request or book from the public consultation flow."
      contentClassName="space-y-4"
      actions={
        <Button size="sm" onClick={openCreateDialog}>
          <CalendarPlus className="mr-2 h-4 w-4" />
          Add slot
        </Button>
      }
    >
      {query.isLoading ? (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading consultation slots…
        </div>
      ) : slots.length === 0 ? (
        <WorkspaceEmptyState
          title="No availability published"
          description="Add slots for upcoming doctor consultation availability."
        />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Booked patient</TableHead>
                <TableHead className="w-[120px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {slots.map((slot) => {
                const consultationId =
                  slot.patient_consultation_id ??
                  slot.patient_consultations?.id ??
                  null;
                const consultation = consultationId
                  ? consultationById.get(consultationId)
                  : null;
                const hasLinkedConsultation = Boolean(consultationId);
                const canManageLinkedConsultation =
                  Boolean(consultation) && Boolean(onManageConsultation);
                const canManageSlot =
                  slot.status !== "booked" || !hasLinkedConsultation;

                return (
                  <TableRow key={slot.id}>
                    <TableCell>
                      <div className="font-medium">
                        {slot.doctors?.name ?? "Doctor"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {slot.doctors?.specialization ?? slot.doctor_id}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>{format(new Date(slot.starts_at), "PPp")}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(slot.ends_at), "p")} • {slot.timezone}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatBookingType(slot.booking_type)}
                    </TableCell>
                    <TableCell>
                      <WorkspaceStatusBadge tone={getSlotTone(slot.status)}>
                        {formatSlotStatus(slot.status)}
                      </WorkspaceStatusBadge>
                    </TableCell>
                    <TableCell>
                      {slot.patient_consultations?.patients?.full_name ??
                        (slot.status === "booked" && hasLinkedConsultation
                          ? "Linked consultation"
                          : slot.status === "booked"
                            ? "No linked consultation"
                            : "—")}
                    </TableCell>
                    <TableCell>
                      {canManageLinkedConsultation && consultation ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-9 rounded-xl"
                          onClick={() => onManageConsultation?.(consultation)}
                        >
                          Manage
                        </Button>
                      ) : canManageSlot ? (
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            aria-label="Edit slot"
                            onClick={() => openEditDialog(slot)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            aria-label="Delete slot"
                            disabled={deleteMutation.isPending}
                            onClick={() => {
                              if (
                                window.confirm(
                                  "Delete this consultation slot? This removes it from patient booking options.",
                                )
                              ) {
                                deleteMutation.mutate(slot.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Linked consultation unavailable
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSlot ? "Edit consultation slot" : "Add consultation slot"}
            </DialogTitle>
            <DialogDescription>
              {editingSlot
                ? "Adjust an unbooked slot. Overlapping active slots for the same doctor are rejected."
                : "Publish one bookable slot for a doctor. Overlapping active slots for the same doctor are rejected."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              className="space-y-6"
              onSubmit={form.handleSubmit((values) => {
                if (editingSlot) {
                  updateMutation.mutate({ id: editingSlot.id, values });
                } else {
                  createMutation.mutate(values);
                }
              })}
            >
              <div className="grid gap-5 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="doctor_id"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Doctor</FormLabel>
                      <FormControl>
                        <DoctorSelector
                          value={field.value}
                          onValueChange={(value) => field.onChange(value ?? "")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="booking_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Consultation type</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);

                          if (value === "onsite") {
                            form.setValue("meeting_url", "");
                          } else if (value === "video") {
                            form.setValue("location", "");
                          } else {
                            form.setValue("location", "");
                            form.setValue("meeting_url", "");
                          }
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {bookingTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {bookingTypeLabels[type]}
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
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {getStatusOptions(field.value).map((status) => (
                            <SelectItem key={status} value={status}>
                              {getStatusOptionLabel(status)}
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
                      <FormLabel>Ends at</FormLabel>
                      <FormControl>
                        <DateTimePicker
                          value={field.value}
                          onChange={field.onChange}
                          minuteStep={15}
                          defaultHour={9}
                          defaultMinute={30}
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
                        <ComboBox
                          value={field.value}
                          options={TIMEZONE_OPTIONS}
                          placeholder="Select timezone"
                          searchPlaceholder="Search timezones..."
                          emptyLabel="No timezones found."
                          onChange={field.onChange}
                          className="font-normal"
                          contentClassName="w-[var(--radix-popover-trigger-width)] min-w-[320px] p-0"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {watchedBookingType === "onsite" ? (
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Clinic name or address"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : null}
                {watchedBookingType === "video" ? (
                  <FormField
                    control={form.control}
                    name="meeting_url"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Meeting link</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : null}
              </div>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Internal notes</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
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
                  {editingSlot ? "Save changes" : "Add slot"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </WorkspacePanel>
  );
}
