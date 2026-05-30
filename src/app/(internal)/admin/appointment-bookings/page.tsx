"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  AlertTriangle,
  Bell,
  BellOff,
  CalendarClock,
  CheckCircle2,
  Loader2,
  MoreHorizontal,
  RotateCcw,
} from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  adminFetch,
  useAdminInvalidate,
} from "@/components/admin/hooks/useAdminFetch";
import {
  WorkspaceEmptyState,
  WorkspaceFilterBar,
  WorkspaceMetricCard,
  WorkspacePageHeader,
  WorkspacePanel,
  WorkspaceStatusBadge,
} from "@/components/workspaces/WorkspacePrimitives";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type BookingRow = Database["public"]["Tables"]["appointment_bookings"]["Row"];
type PatientRow = Database["public"]["Tables"]["patients"]["Row"];
type DoctorRow = Database["public"]["Tables"]["doctors"]["Row"];
type ContactRequestRow =
  Database["public"]["Tables"]["contact_requests"]["Row"];
type ConsultationSlotRow =
  Database["public"]["Tables"]["consultation_slots"]["Row"];
type ConsultationRow =
  Database["public"]["Tables"]["patient_consultations"]["Row"];

type BookingRecord = BookingRow & {
  patients?: Pick<
    PatientRow,
    "id" | "full_name" | "contact_email" | "contact_phone" | "nationality"
  > | null;
  doctors?: Pick<DoctorRow, "id" | "name" | "title" | "specialization"> | null;
  contact_requests?: Pick<
    ContactRequestRow,
    | "id"
    | "status"
    | "request_type"
    | "origin"
    | "treatment"
    | "email"
    | "phone"
  > | null;
  consultation_slots?: Pick<
    ConsultationSlotRow,
    "id" | "status" | "starts_at" | "ends_at" | "timezone"
  > | null;
  patient_consultations?: Pick<
    ConsultationRow,
    "id" | "status" | "scheduled_at"
  > | null;
};

type AvailableSlotRecord = ConsultationSlotRow & {
  doctors?: Pick<DoctorRow, "id" | "name" | "title" | "specialization"> | null;
};

type BookingActivityEntry = {
  id: string;
  at: string;
  title: string;
  detail?: string | null;
  type?: string | null;
};

type ReminderAuditEntry = {
  id: string;
  key: string;
  label: string;
  source: "Automatic" | "Manual";
  status: string;
  attemptedAt: string | null;
  email: string | null;
  emailId: string | null;
  error: string | null;
};

type ReminderActionResponse = {
  booking: BookingRecord;
  reminder: {
    success: boolean;
    dryRun: boolean;
    checked: number;
    processed: number;
    results?: Array<{
      key?: string;
      status?: string;
      email?: string;
      emailId?: string | null;
      error?: string;
      preview?: {
        subject?: string;
        text?: string;
      };
    }>;
  };
};

const bookingStatuses = [
  "requested",
  "held",
  "confirmed",
  "reschedule_requested",
  "cancelled",
  "expired",
  "completed",
  "no_show",
] as const;
type BookingStatus = (typeof bookingStatuses)[number];
type StatusFilter = BookingStatus | "active" | "all";
type ArchiveFilter = "active" | "archived" | "all";
type ReminderFilter = "all" | "pending" | "sent" | "failed" | "none";
type BookingAction =
  | "confirm"
  | "release"
  | "cancel"
  | "request_reschedule"
  | "archive";

const QUERY_KEY = ["admin", "appointment-bookings"] as const;
const AVAILABLE_SLOTS_QUERY_KEY = [
  "admin",
  "appointment-booking-available-slots",
] as const;
const ACTIVE_QUEUE_STATUSES: BookingStatus[] = [
  "requested",
  "held",
  "reschedule_requested",
];
const CLOSED_QUEUE_STATUSES: BookingStatus[] = [
  "cancelled",
  "expired",
  "completed",
  "no_show",
];

const statusLabels: Record<BookingStatus, string> = {
  requested: "Requested",
  held: "Held",
  confirmed: "Confirmed",
  reschedule_requested: "Reschedule requested",
  cancelled: "Cancelled",
  expired: "Expired",
  completed: "Completed",
  no_show: "No show",
};

const actionLabels: Record<BookingAction, string> = {
  confirm: "Confirm booking",
  release: "Release hold",
  cancel: "Cancel booking",
  request_reschedule: "Needs reschedule",
  archive: "Archive record",
};

const actionDescriptions: Record<BookingAction, string> = {
  confirm:
    "Confirm the selected slot and create the linked patient consultation.",
  release:
    "Free the held slot and keep the booking open as a coordinator request.",
  cancel: "Close this booking and release any held slot.",
  request_reschedule:
    "Flag this booking for reschedule follow-up without selecting a new slot now.",
  archive:
    "Clear this closed booking from the default queue while keeping its audit history.",
};

const getStatusTone = (status: BookingStatus) => {
  switch (status) {
    case "confirmed":
    case "completed":
      return "success" as const;
    case "held":
    case "reschedule_requested":
      return "warning" as const;
    case "cancelled":
    case "expired":
    case "no_show":
      return "danger" as const;
    case "requested":
    default:
      return "default" as const;
  }
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return format(date, "PPp");
};

const formatBookingType = (value: BookingRow["booking_type"]) =>
  value === "onsite" ? "Onsite" : value === "phone" ? "Phone" : "Video";

const formatNullable = (value: string | null | undefined) =>
  value && value.trim().length > 0 ? value : "Not set";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isConfirmedBooking = (booking: Pick<BookingRecord, "status">) =>
  booking.status === "confirmed";

const getSlotActionLabel = (booking: Pick<BookingRecord, "status"> | null) =>
  booking && isConfirmedBooking(booking) ? "Reschedule slot" : "Assign slot";

const getActionNoteLabel = (action: BookingAction | undefined) =>
  action === "cancel" ? "Cancellation reason" : "Coordinator note";

const shouldShowCoordinatorNotes = (booking: BookingRecord) =>
  booking.status !== "cancelled" ||
  (Boolean(booking.notes) && booking.notes !== booking.cancellation_reason);

const getMetadataRecord = (booking: BookingRecord) => {
  const metadata = booking.metadata;
  return isRecord(metadata) ? metadata : null;
};

const reminderKeyLabels: Record<string, string> = {
  twentyFourHour: "24-hour reminder",
  twoHour: "2-hour reminder",
  manual: "Manual reminder",
};

const getReminderKeyLabel = (key: string) =>
  reminderKeyLabels[key] ?? "Reminder";

const getReminderSource = (key: string): ReminderAuditEntry["source"] =>
  key === "manual" ? "Manual" : "Automatic";

const getReminderStatusLabel = (status: string) => {
  if (status === "sent") return "Sent";
  if (status === "failed") return "Failed";
  if (status === "skipped") return "Skipped";
  if (status === "dry_run") return "Previewed";
  return status;
};

const getReminderRecord = (booking: BookingRecord, key: string) => {
  const reminders = getMetadataRecord(booking)?.reminders;
  if (!isRecord(reminders)) return null;
  const reminder = reminders[key];
  return isRecord(reminder) ? reminder : null;
};

const getReminderAttemptStatus = (booking: BookingRecord, key: string) => {
  const status = getReminderRecord(booking, key)?.status;
  return typeof status === "string" ? status : null;
};

const getBookingReminderAudit = (
  booking: BookingRecord,
): ReminderAuditEntry[] => {
  const metadata = getMetadataRecord(booking);
  const entries: ReminderAuditEntry[] = [];
  const seen = new Set<string>();

  const pushEntry = (
    raw: Record<string, unknown>,
    fallbackKey: string,
    index: number,
  ) => {
    const key = typeof raw.key === "string" ? raw.key : fallbackKey;
    const status = typeof raw.status === "string" ? raw.status : null;
    if (!status) return;

    const attemptedAt =
      typeof raw.attemptedAt === "string"
        ? raw.attemptedAt
        : typeof raw.at === "string"
          ? raw.at
          : null;
    const email = typeof raw.email === "string" ? raw.email : null;
    const emailId = typeof raw.emailId === "string" ? raw.emailId : null;
    const error = typeof raw.error === "string" ? raw.error : null;
    const dedupeKey = [
      key,
      status,
      attemptedAt ?? "",
      email ?? "",
      emailId ?? "",
      error ?? "",
    ].join("|");

    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);

    entries.push({
      id:
        typeof raw.id === "string"
          ? raw.id
          : `reminder-${fallbackKey}-${index}`,
      key,
      label: getReminderKeyLabel(key),
      source: getReminderSource(key),
      status,
      attemptedAt,
      email,
      emailId,
      error,
    });
  };

  const reminderEvents = metadata?.reminderEvents;
  if (Array.isArray(reminderEvents)) {
    reminderEvents.forEach((item, index) => {
      if (isRecord(item)) pushEntry(item, "event", index);
    });
  }

  const reminders = metadata?.reminders;
  if (isRecord(reminders)) {
    ["manual", "twoHour", "twentyFourHour"].forEach((key, index) => {
      const reminder = reminders[key];
      if (isRecord(reminder)) pushEntry(reminder, key, index);
    });
  }

  return entries.sort((left, right) => {
    const leftTime = left.attemptedAt
      ? new Date(left.attemptedAt).getTime()
      : 0;
    const rightTime = right.attemptedAt
      ? new Date(right.attemptedAt).getTime()
      : 0;
    return rightTime - leftTime;
  });
};

const getNextReminderSummary = (booking: BookingRecord) => {
  if (booking.archived_at) return "Archived booking; reminders are disabled.";
  if (booking.status !== "confirmed") {
    return "Reminders start after the booking is confirmed.";
  }
  if (!booking.confirmed_starts_at) {
    return "No confirmed time is set, so reminders cannot be scheduled.";
  }

  const startsAt = new Date(booking.confirmed_starts_at);
  if (Number.isNaN(startsAt.getTime())) {
    return "The confirmed time is invalid, so reminders cannot be scheduled.";
  }

  const msUntil = startsAt.getTime() - Date.now();
  if (msUntil <= 0) return "The appointment time has passed.";

  const twoHourStatus = getReminderAttemptStatus(booking, "twoHour");
  const twentyFourHourStatus = getReminderAttemptStatus(
    booking,
    "twentyFourHour",
  );

  if (msUntil <= 2 * 60 * 60 * 1000) {
    return twoHourStatus
      ? `2-hour reminder already ${getReminderStatusLabel(twoHourStatus).toLowerCase()}.`
      : "Eligible for the 2-hour automatic reminder.";
  }

  if (msUntil <= 24 * 60 * 60 * 1000) {
    return twentyFourHourStatus
      ? `24-hour reminder already ${getReminderStatusLabel(twentyFourHourStatus).toLowerCase()}.`
      : "Eligible for the 24-hour automatic reminder.";
  }

  return "Automatic reminder window has not opened yet.";
};

const getReminderTone = (status: string) => {
  if (status === "sent") return "success" as const;
  if (status === "failed") return "danger" as const;
  if (status === "skipped") return "warning" as const;
  return "default" as const;
};

const getBookingEmailStatus = (booking: BookingRecord) => {
  const metadata = getMetadataRecord(booking);
  if (!metadata) return null;

  const notifications = metadata.notifications;
  if (
    typeof notifications !== "object" ||
    notifications === null ||
    Array.isArray(notifications)
  ) {
    return null;
  }

  const bookingEmail = notifications.bookingEmail;
  if (
    typeof bookingEmail !== "object" ||
    bookingEmail === null ||
    Array.isArray(bookingEmail) ||
    typeof bookingEmail.status !== "string"
  ) {
    return null;
  }

  if (bookingEmail.status === "sent") return "sent";
  if (bookingEmail.status === "failed") return "failed";
  if (bookingEmail.status === "skipped") return "skipped";
  return null;
};

const getBookingReminderStatus = (booking: BookingRecord) => {
  const metadata = getMetadataRecord(booking);
  const reminders =
    metadata &&
    typeof metadata.reminders === "object" &&
    metadata.reminders !== null &&
    !Array.isArray(metadata.reminders)
      ? metadata.reminders
      : null;

  const twentyFourHour =
    reminders &&
    typeof reminders.twentyFourHour === "object" &&
    reminders.twentyFourHour !== null &&
    !Array.isArray(reminders.twentyFourHour)
      ? reminders.twentyFourHour
      : null;
  const twoHour =
    reminders &&
    typeof reminders.twoHour === "object" &&
    reminders.twoHour !== null &&
    !Array.isArray(reminders.twoHour)
      ? reminders.twoHour
      : null;
  const manual =
    reminders &&
    typeof reminders.manual === "object" &&
    reminders.manual !== null &&
    !Array.isArray(reminders.manual)
      ? reminders.manual
      : null;

  const statuses = [
    twentyFourHour?.status,
    twoHour?.status,
    manual?.status,
  ].filter((status): status is string => typeof status === "string");

  if (statuses.includes("failed")) return "failed";
  if (manual?.status === "sent") return "sent manually";
  if (twoHour?.status === "sent") return "2h sent";
  if (twentyFourHour?.status === "sent") return "24h sent";

  if (
    booking.status === "confirmed" &&
    booking.confirmed_starts_at &&
    new Date(booking.confirmed_starts_at).getTime() > Date.now()
  ) {
    return "pending";
  }

  return null;
};

const getBookingReminderFilterState = (
  booking: BookingRecord,
): Exclude<ReminderFilter, "all"> => {
  const reminders = getBookingReminderAudit(booking);
  const statuses = reminders.map((reminder) => reminder.status);

  if (statuses.includes("failed")) return "failed";
  if (statuses.includes("sent")) return "sent";

  if (
    booking.status === "confirmed" &&
    !booking.archived_at &&
    booking.confirmed_starts_at &&
    new Date(booking.confirmed_starts_at).getTime() > Date.now()
  ) {
    return "pending";
  }

  return "none";
};

const reminderFilterLabels: Record<ReminderFilter, string> = {
  all: "All reminders",
  pending: "Reminder pending",
  sent: "Reminder sent",
  failed: "Reminder failed",
  none: "No reminder activity",
};

const getBookingActivity = (booking: BookingRecord): BookingActivityEntry[] => {
  const metadata = getMetadataRecord(booking);
  const storedActivity = Array.isArray(metadata?.activity)
    ? metadata.activity.flatMap((item, index): BookingActivityEntry[] => {
        if (typeof item !== "object" || item === null || Array.isArray(item)) {
          return [];
        }

        const at = typeof item.at === "string" ? item.at : null;
        const title = typeof item.title === "string" ? item.title : null;
        if (!at || !title) return [];

        return [
          {
            id:
              typeof item.id === "string"
                ? item.id
                : `metadata-activity-${index}`,
            at,
            title,
            detail: typeof item.detail === "string" ? item.detail : null,
            type: typeof item.type === "string" ? item.type : null,
          },
        ];
      })
    : [];

  const derivedActivity: BookingActivityEntry[] = [
    {
      id: "created",
      at: booking.created_at,
      title: "Record created",
      detail: `Source: ${booking.source}`,
      type: "created",
    },
  ];

  if (booking.archived_at) {
    derivedActivity.push({
      id: "archived_at",
      at: booking.archived_at,
      title: "Record archived",
      detail: booking.archive_note,
      type: "archived",
    });
  }

  return [...storedActivity, ...derivedActivity].sort(
    (left, right) => new Date(right.at).getTime() - new Date(left.at).getTime(),
  );
};

const getReminderResult = (response: ReminderActionResponse) =>
  response.reminder.results?.[0] ?? null;

const ReminderAuditPanel = ({ booking }: { booking: BookingRecord }) => {
  const reminders = getBookingReminderAudit(booking);
  const lastReminder = reminders[0] ?? null;
  const shouldShowAttemptList =
    reminders.length > 1 ||
    reminders.some(
      (reminder) =>
        reminder.status === "failed" || reminder.status === "skipped",
    );

  return (
    <div className="space-y-3">
      <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
        Reminder audit
      </div>
      <div className="grid gap-3 rounded-md border border-border p-3 text-sm md:grid-cols-3">
        <div>
          <div className="text-xs font-medium text-muted-foreground">
            Last reminder
          </div>
          <div className="mt-1 font-medium">
            {lastReminder
              ? `${lastReminder.label} ${getReminderStatusLabel(lastReminder.status).toLowerCase()}`
              : "No reminder sent"}
          </div>
          {lastReminder?.attemptedAt ? (
            <div className="mt-1 text-xs text-muted-foreground">
              {formatDateTime(lastReminder.attemptedAt)}
            </div>
          ) : null}
        </div>
        <div>
          <div className="text-xs font-medium text-muted-foreground">
            Recipient
          </div>
          <div className="mt-1 font-medium">
            {formatNullable(lastReminder?.email)}
          </div>
          {lastReminder?.emailId ? (
            <details className="mt-1 text-xs text-muted-foreground">
              <summary className="cursor-pointer select-none">
                Delivery details
              </summary>
              <div className="mt-1 break-all">
                Email delivery ID: {lastReminder.emailId}
              </div>
            </details>
          ) : null}
        </div>
        <div>
          <div className="text-xs font-medium text-muted-foreground">
            Next automatic reminder
          </div>
          <div className="mt-1 text-muted-foreground">
            {getNextReminderSummary(booking)}
          </div>
        </div>
      </div>

      {shouldShowAttemptList ? (
        <div className="space-y-2">
          {reminders.map((reminder) => (
            <div
              key={reminder.id}
              className="grid gap-3 border-b border-border pb-3 last:border-b-0 md:grid-cols-[minmax(150px,1fr)_minmax(130px,0.8fr)_minmax(180px,1.2fr)]"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{reminder.label}</span>
                  <WorkspaceStatusBadge tone={getReminderTone(reminder.status)}>
                    {getReminderStatusLabel(reminder.status)}
                  </WorkspaceStatusBadge>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {reminder.source}
                  {reminder.attemptedAt
                    ? ` · ${formatDateTime(reminder.attemptedAt)}`
                    : ""}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                <div>{formatNullable(reminder.email)}</div>
                {reminder.emailId ? (
                  <details className="mt-1 text-xs">
                    <summary className="cursor-pointer select-none">
                      Delivery details
                    </summary>
                    <div className="mt-1 break-all">
                      Email delivery ID: {reminder.emailId}
                    </div>
                  </details>
                ) : null}
              </div>
              <div className="text-sm text-muted-foreground">
                {reminder.error ?? "No failure recorded."}
              </div>
            </div>
          ))}
        </div>
      ) : reminders.length === 0 ? (
        <div className="rounded-md border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
          No reminder attempts have been recorded for this booking yet.
        </div>
      ) : null}
    </div>
  );
};

export default function AdminAppointmentBookingsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>("active");
  const [reminderFilter, setReminderFilter] = useState<ReminderFilter>("all");
  const [actionTarget, setActionTarget] = useState<{
    booking: BookingRecord;
    action: BookingAction;
  } | null>(null);
  const [actionNotes, setActionNotes] = useState("");
  const [slotTarget, setSlotTarget] = useState<BookingRecord | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [slotNotes, setSlotNotes] = useState("");
  const [detailsTarget, setDetailsTarget] = useState<BookingRecord | null>(
    null,
  );
  const [reminderPreview, setReminderPreview] = useState<{
    booking: BookingRecord;
    email: string;
    subject: string;
    text: string;
  } | null>(null);
  const invalidate = useAdminInvalidate();
  const { toast } = useToast();

  const slotRange = useMemo(() => {
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 60);
    return { from: from.toISOString(), to: to.toISOString() };
  }, []);

  const query = useQuery({
    queryKey: [...QUERY_KEY, statusFilter, archiveFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (bookingStatuses.includes(statusFilter as BookingStatus)) {
        params.set("status", statusFilter);
      }
      params.set("archived", archiveFilter);
      return adminFetch<BookingRecord[]>(
        `/api/admin/appointment-bookings${params.size ? `?${params}` : ""}`,
      );
    },
    retry: false,
  });

  const availableSlotsQuery = useQuery({
    queryKey: [...AVAILABLE_SLOTS_QUERY_KEY, slotRange.from, slotRange.to],
    enabled: Boolean(slotTarget),
    queryFn: () => {
      const params = new URLSearchParams({
        status: "available",
        from: slotRange.from,
        to: slotRange.to,
      });

      return adminFetch<AvailableSlotRecord[]>(
        `/api/admin/consultation-slots?${params.toString()}`,
      );
    },
    retry: false,
  });

  const queryErrorMessage =
    query.error instanceof Error
      ? query.error.message
      : "The booking queue could not be loaded. Retry in a moment.";

  const statusFilteredBookings = useMemo(() => {
    const rows = query.data ?? [];
    if (statusFilter !== "active") return rows;
    return rows.filter((booking) =>
      ACTIVE_QUEUE_STATUSES.includes(booking.status),
    );
  }, [query.data, statusFilter]);

  const bookings = useMemo(() => {
    if (reminderFilter === "all") return statusFilteredBookings;

    return statusFilteredBookings.filter(
      (booking) => getBookingReminderFilterState(booking) === reminderFilter,
    );
  }, [reminderFilter, statusFilteredBookings]);

  const counts = useMemo(
    () =>
      (query.data ?? []).reduce<Record<BookingStatus, number>>(
        (acc, booking) => {
          acc[booking.status] = (acc[booking.status] ?? 0) + 1;
          return acc;
        },
        {
          requested: 0,
          held: 0,
          confirmed: 0,
          reschedule_requested: 0,
          cancelled: 0,
          expired: 0,
          completed: 0,
          no_show: 0,
        },
      ),
    [query.data],
  );

  const reminderCounts = useMemo(
    () =>
      statusFilteredBookings.reduce<
        Record<Exclude<ReminderFilter, "all">, number>
      >(
        (acc, booking) => {
          const state = getBookingReminderFilterState(booking);
          acc[state] += 1;
          return acc;
        },
        {
          pending: 0,
          sent: 0,
          failed: 0,
          none: 0,
        },
      ),
    [statusFilteredBookings],
  );

  const actionMutation = useMutation({
    mutationFn: ({
      booking,
      action,
      notes,
    }: {
      booking: BookingRecord;
      action: BookingAction;
      notes: string;
    }) =>
      adminFetch<BookingRecord>(
        `/api/admin/appointment-bookings/${booking.id}`,
        {
          method: "POST",
          body: JSON.stringify({
            action,
            notes: action === "cancel" ? null : notes.trim() || null,
            cancellation_reason:
              action === "cancel" ? notes.trim() || null : null,
          }),
        },
      ),
    onSuccess: (_booking, variables) => {
      invalidate(QUERY_KEY);
      toast({ title: actionLabels[variables.action] });
      setActionTarget(null);
      setActionNotes("");
    },
    onError: (error: Error) => {
      toast({
        title: "Booking action failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const slotMutation = useMutation({
    mutationFn: ({
      booking,
      slotId,
      notes,
    }: {
      booking: BookingRecord;
      slotId: string;
      notes: string;
    }) =>
      adminFetch<BookingRecord>(
        `/api/admin/appointment-bookings/${booking.id}`,
        {
          method: "POST",
          body: JSON.stringify({
            action: "assign_slot",
            slot_id: slotId,
            notes: notes.trim() || null,
          }),
        },
      ),
    onSuccess: (_booking, variables) => {
      invalidate(QUERY_KEY);
      invalidate(AVAILABLE_SLOTS_QUERY_KEY);
      toast({
        title: isConfirmedBooking(variables.booking)
          ? "Slot rescheduled"
          : "Slot assigned",
      });
      setSlotTarget(null);
      setSelectedSlotId("");
      setSlotNotes("");
    },
    onError: (error: Error) => {
      toast({
        title: "Slot assignment failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const reminderMutation = useMutation({
    mutationFn: ({
      booking,
      dryRun,
    }: {
      booking: BookingRecord;
      dryRun: boolean;
    }) =>
      adminFetch<ReminderActionResponse>(
        `/api/admin/appointment-bookings/${booking.id}/reminder`,
        {
          method: "POST",
          body: JSON.stringify({ dryRun }),
        },
      ),
    onSuccess: (response, variables) => {
      const result = getReminderResult(response);

      if (variables.dryRun) {
        const preview = result?.preview;
        if (!preview?.subject || !preview.text || !result?.email) {
          toast({
            title: "Reminder preview unavailable",
            description:
              result?.error ??
              "No patient email is available for this booking.",
            variant: "destructive",
          });
          return;
        }

        setReminderPreview({
          booking: variables.booking,
          email: result.email,
          subject: preview.subject,
          text: preview.text,
        });
        return;
      }

      invalidate(QUERY_KEY);
      setDetailsTarget((current) =>
        current?.id === response.booking.id ? response.booking : current,
      );
      toast({
        title:
          result?.status === "sent"
            ? "Reminder sent"
            : "Reminder request completed",
        description: result?.email ? `Sent to ${result.email}.` : undefined,
      });
    },
    onError: (error: Error) => {
      invalidate(QUERY_KEY);
      toast({
        title: "Reminder action failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const openAction = (booking: BookingRecord, action: BookingAction) => {
    setActionTarget({ booking, action });
    setActionNotes("");
  };
  const openSlotDialog = (booking: BookingRecord) => {
    setSlotTarget(booking);
    setSelectedSlotId("");
    setSlotNotes("");
  };

  const canConfirm = (booking: BookingRecord) =>
    Boolean(booking.patient_id && booking.consultation_slot_id) &&
    (booking.status === "requested" || booking.status === "held");
  const canRelease = (booking: BookingRecord) => booking.status === "held";
  const canCancel = (booking: BookingRecord) =>
    !CLOSED_QUEUE_STATUSES.includes(booking.status);
  const canRequestReschedule = (booking: BookingRecord) =>
    ["requested", "held", "confirmed"].includes(booking.status);
  const canAssignSlot = (booking: BookingRecord) =>
    !CLOSED_QUEUE_STATUSES.includes(booking.status);
  const canArchive = (booking: BookingRecord) =>
    CLOSED_QUEUE_STATUSES.includes(booking.status) && !booking.archived_at;
  const canSendReminder = (booking: BookingRecord) =>
    booking.status === "confirmed" &&
    !booking.archived_at &&
    Boolean(booking.confirmed_starts_at) &&
    new Date(booking.confirmed_starts_at).getTime() >
      new Date(slotRange.from).getTime();
  const hasPrimaryBookingActions = (booking: BookingRecord) =>
    canAssignSlot(booking) ||
    canConfirm(booking) ||
    canRelease(booking) ||
    canRequestReschedule(booking);
  const hasBookingActions = (booking: BookingRecord) =>
    hasPrimaryBookingActions(booking) ||
    canSendReminder(booking) ||
    canCancel(booking) ||
    canArchive(booking);
  const filterDescription =
    statusFilter === "active"
      ? "Needs action shows requested, held, and reschedule-requested bookings."
      : statusFilter === "all"
        ? "All statuses includes confirmed, cancelled, expired, completed, and no-show records."
        : `${statusLabels[statusFilter]} bookings only.`;
  const archiveDescription =
    archiveFilter === "active"
      ? "Archived records are hidden from this queue."
      : archiveFilter === "archived"
        ? "Only archived records are shown."
        : "Active and archived records are shown.";
  const reminderDescription =
    reminderFilter === "all"
      ? "No reminder filter is applied."
      : reminderFilter === "pending"
        ? "Confirmed future bookings without a sent or failed reminder."
        : reminderFilter === "sent"
          ? "Bookings with at least one successful reminder attempt."
          : reminderFilter === "failed"
            ? "Bookings with a failed reminder attempt."
            : "Bookings with no reminder attempts or pending reminder.";
  const emptyStateDescription =
    reminderFilter !== "all"
      ? "No bookings match the selected reminder filter."
      : statusFilter === "active"
        ? "No bookings currently need coordinator action. Switch to All statuses to view confirmed or closed bookings."
        : "Change the filter or wait for new consultation slot requests.";

  return (
    <div className="space-y-6">
      <WorkspacePageHeader
        title="Booking Queue"
        subtitle="Review consultation booking workflow records, confirm patient slots, release holds, and handle reschedule requests."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <WorkspaceMetricCard
          label="Requested"
          value={counts.requested}
          icon={CalendarClock}
          emphasisTone="info"
        />
        <WorkspaceMetricCard
          label="Held"
          value={counts.held}
          icon={CalendarClock}
          emphasisTone="warning"
        />
        <WorkspaceMetricCard
          label="Confirmed"
          value={counts.confirmed}
          icon={CheckCircle2}
          emphasisTone="success"
        />
        <WorkspaceMetricCard
          label="Needs reschedule"
          value={counts.reschedule_requested}
          icon={RotateCcw}
          emphasisTone="warning"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <WorkspaceMetricCard
          label="Pending reminders"
          value={reminderCounts.pending}
          icon={Bell}
          emphasisTone="warning"
          helperText="Confirmed future bookings awaiting reminder delivery."
          onClick={() => setReminderFilter("pending")}
        />
        <WorkspaceMetricCard
          label="Sent reminders"
          value={reminderCounts.sent}
          icon={CheckCircle2}
          emphasisTone="success"
          helperText="Bookings with at least one successful reminder."
          onClick={() => setReminderFilter("sent")}
        />
        <WorkspaceMetricCard
          label="Failed reminders"
          value={reminderCounts.failed}
          icon={AlertTriangle}
          emphasisTone="danger"
          helperText="Reminder attempts that need coordinator follow-up."
          onClick={() => setReminderFilter("failed")}
        />
        <WorkspaceMetricCard
          label="No reminder activity"
          value={reminderCounts.none}
          icon={BellOff}
          emphasisTone="muted"
          helperText="Bookings outside reminder tracking or not eligible yet."
          onClick={() => setReminderFilter("none")}
        />
      </div>

      <WorkspaceFilterBar>
        <div className="flex min-w-[240px] flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            Status
          </span>
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as StatusFilter)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Needs action</SelectItem>
              <SelectSeparator />
              {bookingStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {statusLabels[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs leading-5 text-muted-foreground">
            {filterDescription}
          </span>
        </div>
        <div className="flex min-w-[220px] flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            Visibility
          </span>
          <Select
            value={archiveFilter}
            onValueChange={(value) => setArchiveFilter(value as ArchiveFilter)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active records</SelectItem>
              <SelectItem value="archived">Archived records</SelectItem>
              <SelectItem value="all">All records</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs leading-5 text-muted-foreground">
            {archiveDescription}
          </span>
        </div>
        <div className="flex min-w-[220px] flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            Reminder
          </span>
          <Select
            value={reminderFilter}
            onValueChange={(value) =>
              setReminderFilter(value as ReminderFilter)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(reminderFilterLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs leading-5 text-muted-foreground">
            {reminderDescription}
          </span>
        </div>
      </WorkspaceFilterBar>

      <WorkspacePanel
        title="Appointment booking workflow"
        description={
          query.isError
            ? "Unable to load booking workflow records."
            : query.isLoading
              ? "Loading booking workflow records."
              : bookings.length === 0
                ? "No bookings match the current filter."
                : `${bookings.length} booking${bookings.length === 1 ? "" : "s"} in view.`
        }
      >
        {query.isLoading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading booking queue...
          </div>
        ) : query.isError ? (
          <WorkspaceEmptyState
            title="Booking queue could not be loaded"
            description={queryErrorMessage}
            action={
              <Button
                type="button"
                variant="outline"
                onClick={() => void query.refetch()}
              >
                Retry
              </Button>
            }
          />
        ) : bookings.length === 0 ? (
          <WorkspaceEmptyState
            title="No bookings found"
            description={emptyStateDescription}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient / request</TableHead>
                  <TableHead>Slot</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Hold</TableHead>
                  <TableHead className="w-[120px] text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div className="font-medium">
                        {booking.patients?.full_name ??
                          booking.contact_requests?.email ??
                          "Guest request"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {booking.patients?.contact_email ??
                          booking.contact_requests?.phone ??
                          booking.contact_request_id}
                      </div>
                      {booking.contact_request_id ? (
                        <Button
                          asChild
                          variant="link"
                          size="sm"
                          className="h-auto px-0 py-1 text-xs"
                        >
                          <Link href="/admin/requests">Open requests</Link>
                        </Button>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <div>{formatDateTime(booking.requested_starts_at)}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatBookingType(booking.booking_type)} ·{" "}
                        {booking.timezone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>{booking.doctors?.name ?? "Unassigned doctor"}</div>
                      <div className="text-xs text-muted-foreground">
                        {booking.doctors?.specialization ??
                          booking.doctors?.title ??
                          booking.doctor_id ??
                          "No doctor linked"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <WorkspaceStatusBadge
                        tone={getStatusTone(booking.status)}
                      >
                        {statusLabels[booking.status]}
                      </WorkspaceStatusBadge>
                      {getBookingEmailStatus(booking) ? (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Confirmation email {getBookingEmailStatus(booking)}
                        </div>
                      ) : null}
                      {getBookingReminderStatus(booking) ? (
                        <div className="mt-1 text-xs text-muted-foreground">
                          Reminder {getBookingReminderStatus(booking)}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <div>{formatDateTime(booking.hold_expires_at)}</div>
                      {booking.consultation_slots?.status ? (
                        <div className="text-xs text-muted-foreground">
                          Slot {booking.consultation_slots.status}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-2"
                          >
                            Actions
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem
                            onSelect={() => setDetailsTarget(booking)}
                          >
                            View details
                          </DropdownMenuItem>
                          {hasBookingActions(booking) ? (
                            <DropdownMenuSeparator />
                          ) : null}
                          {canAssignSlot(booking) ? (
                            <DropdownMenuItem
                              onSelect={() => openSlotDialog(booking)}
                            >
                              {getSlotActionLabel(booking)}
                            </DropdownMenuItem>
                          ) : null}
                          {canConfirm(booking) ? (
                            <DropdownMenuItem
                              onSelect={() => openAction(booking, "confirm")}
                            >
                              Confirm booking
                            </DropdownMenuItem>
                          ) : null}
                          {canRelease(booking) ? (
                            <DropdownMenuItem
                              onSelect={() => openAction(booking, "release")}
                            >
                              Release hold
                            </DropdownMenuItem>
                          ) : null}
                          {canRequestReschedule(booking) ? (
                            <DropdownMenuItem
                              onSelect={() =>
                                openAction(booking, "request_reschedule")
                              }
                            >
                              Needs reschedule
                            </DropdownMenuItem>
                          ) : null}
                          {canSendReminder(booking) ? (
                            <>
                              {hasPrimaryBookingActions(booking) ? (
                                <DropdownMenuSeparator />
                              ) : null}
                              <DropdownMenuItem
                                disabled={reminderMutation.isPending}
                                onSelect={() =>
                                  reminderMutation.mutate({
                                    booking,
                                    dryRun: true,
                                  })
                                }
                              >
                                Preview reminder
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={reminderMutation.isPending}
                                onSelect={() =>
                                  reminderMutation.mutate({
                                    booking,
                                    dryRun: false,
                                  })
                                }
                              >
                                Send reminder now
                              </DropdownMenuItem>
                            </>
                          ) : null}
                          {canCancel(booking) ? (
                            <>
                              {hasPrimaryBookingActions(booking) ||
                              canSendReminder(booking) ? (
                                <DropdownMenuSeparator />
                              ) : null}
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onSelect={() => openAction(booking, "cancel")}
                              >
                                Cancel booking
                              </DropdownMenuItem>
                            </>
                          ) : null}
                          {canArchive(booking) ? (
                            <>
                              {hasPrimaryBookingActions(booking) ||
                              canSendReminder(booking) ||
                              canCancel(booking) ? (
                                <DropdownMenuSeparator />
                              ) : null}
                              <DropdownMenuItem
                                onSelect={() => openAction(booking, "archive")}
                              >
                                Archive record
                              </DropdownMenuItem>
                            </>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </WorkspacePanel>

      <Dialog
        open={Boolean(detailsTarget)}
        onOpenChange={(open) => {
          if (!open) setDetailsTarget(null);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Booking details</DialogTitle>
            <DialogDescription>
              Current booking state, linked records, notes, and activity.
            </DialogDescription>
          </DialogHeader>
          {detailsTarget ? (
            <div className="max-h-[70vh] space-y-6 overflow-y-auto pr-1">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    Patient
                  </div>
                  <div className="text-sm font-medium">
                    {detailsTarget.patients?.full_name ?? "Guest request"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatNullable(
                      detailsTarget.patients?.contact_email ??
                        detailsTarget.contact_requests?.email,
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatNullable(
                      detailsTarget.patients?.contact_phone ??
                        detailsTarget.contact_requests?.phone,
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    Status
                  </div>
                  <div>
                    <WorkspaceStatusBadge
                      tone={getStatusTone(detailsTarget.status)}
                    >
                      {statusLabels[detailsTarget.status]}
                    </WorkspaceStatusBadge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Confirmation email{" "}
                    {getBookingEmailStatus(detailsTarget) ?? "not sent"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Reminder{" "}
                    {getBookingReminderStatus(detailsTarget) ?? "not pending"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Visibility:{" "}
                    {detailsTarget.archived_at ? "Archived" : "Active"}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    Slot
                  </div>
                  <div className="text-sm font-medium">
                    {formatDateTime(
                      detailsTarget.confirmed_starts_at ??
                        detailsTarget.requested_starts_at,
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatBookingType(detailsTarget.booking_type)} ·{" "}
                    {detailsTarget.timezone}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Slot {detailsTarget.consultation_slots?.status ?? "not set"}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    Doctor
                  </div>
                  <div className="text-sm font-medium">
                    {detailsTarget.doctors?.name ?? "Unassigned doctor"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {detailsTarget.doctors?.specialization ??
                      detailsTarget.doctors?.title ??
                      "No specialty linked"}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {shouldShowCoordinatorNotes(detailsTarget) ? (
                  <div className="space-y-1">
                    <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                      Coordinator notes
                    </div>
                    <div className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground">
                      {formatNullable(detailsTarget.notes)}
                    </div>
                  </div>
                ) : null}
                {detailsTarget.status === "cancelled" ? (
                  <div className="space-y-1">
                    <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                      Cancellation reason
                    </div>
                    <div className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground">
                      {formatNullable(detailsTarget.cancellation_reason)}
                    </div>
                  </div>
                ) : null}
              </div>

              <ReminderAuditPanel booking={detailsTarget} />

              <div className="space-y-3">
                <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Activity timeline
                </div>
                <div className="space-y-3">
                  {getBookingActivity(detailsTarget).map((event) => (
                    <div
                      key={event.id}
                      className="grid grid-cols-[12px_1fr] gap-3"
                    >
                      <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-foreground/70" />
                      <div className="border-b border-border pb-3 last:border-b-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium">
                            {event.title}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(event.at)}
                          </span>
                        </div>
                        {event.detail ? (
                          <div className="mt-1 text-sm text-muted-foreground">
                            {event.detail}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                <div>Booking ID: {detailsTarget.id}</div>
                <div>
                  Consultation ID:{" "}
                  {formatNullable(detailsTarget.patient_consultation_id)}
                </div>
                <div>
                  Slot ID: {formatNullable(detailsTarget.consultation_slot_id)}
                </div>
                <div>
                  Contact request ID:{" "}
                  {formatNullable(detailsTarget.contact_request_id)}
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDetailsTarget(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(reminderPreview)}
        onOpenChange={(open) => {
          if (!open) setReminderPreview(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reminder preview</DialogTitle>
            <DialogDescription>
              Preview the manual reminder before sending it to the patient.
            </DialogDescription>
          </DialogHeader>
          {reminderPreview ? (
            <div className="space-y-4">
              <div className="grid gap-2 text-sm md:grid-cols-2">
                <div>
                  <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    Patient
                  </div>
                  <div className="font-medium">
                    {reminderPreview.booking.patients?.full_name ??
                      "Guest request"}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    Recipient
                  </div>
                  <div className="font-medium">{reminderPreview.email}</div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Subject
                </div>
                <div className="rounded-md border border-border px-3 py-2 text-sm">
                  {reminderPreview.subject}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Message
                </div>
                <pre className="max-h-80 whitespace-pre-wrap rounded-md border border-border px-3 py-2 text-sm leading-6 text-muted-foreground">
                  {reminderPreview.text}
                </pre>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setReminderPreview(null)}
            >
              Close
            </Button>
            <Button
              type="button"
              disabled={!reminderPreview || reminderMutation.isPending}
              onClick={() => {
                if (reminderPreview) {
                  reminderMutation.mutate({
                    booking: reminderPreview.booking,
                    dryRun: false,
                  });
                  setReminderPreview(null);
                }
              }}
            >
              {reminderMutation.isPending ? "Sending..." : "Send reminder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(actionTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setActionTarget(null);
            setActionNotes("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionTarget ? actionLabels[actionTarget.action] : "Booking"}
            </DialogTitle>
            <DialogDescription>
              {actionTarget
                ? actionDescriptions[actionTarget.action]
                : "Review this booking action before continuing."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm font-medium text-foreground">
              {getActionNoteLabel(actionTarget?.action)}
            </div>
            <Textarea
              value={actionNotes}
              rows={4}
              placeholder={getActionNoteLabel(actionTarget?.action)}
              onChange={(event) => setActionNotes(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setActionTarget(null)}
            >
              Close
            </Button>
            <Button
              type="button"
              disabled={!actionTarget || actionMutation.isPending}
              onClick={() => {
                if (actionTarget) {
                  actionMutation.mutate({
                    ...actionTarget,
                    notes: actionNotes,
                  });
                }
              }}
            >
              {actionMutation.isPending ? "Working..." : "Continue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(slotTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setSlotTarget(null);
            setSelectedSlotId("");
            setSlotNotes("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getSlotActionLabel(slotTarget)}</DialogTitle>
            <DialogDescription>
              {slotTarget?.patient_consultation_id
                ? "Move the linked consultation to a new available slot. The old booked slot will be released."
                : "Hold a new available slot for this booking so it can be confirmed next."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <span className="text-sm font-medium text-foreground">
                Available slot
              </span>
              {availableSlotsQuery.isLoading ? (
                <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading available slots...
                </div>
              ) : availableSlotsQuery.isError ? (
                <div className="rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  Available slots could not be loaded.
                </div>
              ) : (availableSlotsQuery.data ?? []).length === 0 ? (
                <div className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground">
                  No available slots in the next 60 days.
                </div>
              ) : (
                <Select
                  value={selectedSlotId}
                  onValueChange={setSelectedSlotId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an available slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {(availableSlotsQuery.data ?? []).map((slot) => (
                      <SelectItem key={slot.id} value={slot.id}>
                        {formatDateTime(slot.starts_at)} ·{" "}
                        {slot.doctors?.name ?? "Unassigned doctor"} ·{" "}
                        {formatBookingType(slot.booking_type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <Textarea
              value={slotNotes}
              rows={4}
              placeholder="Coordinator note"
              onChange={(event) => setSlotNotes(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSlotTarget(null)}
            >
              Close
            </Button>
            <Button
              type="button"
              disabled={
                !slotTarget || !selectedSlotId || slotMutation.isPending
              }
              onClick={() => {
                if (slotTarget && selectedSlotId) {
                  slotMutation.mutate({
                    booking: slotTarget,
                    slotId: selectedSlotId,
                    notes: slotNotes,
                  });
                }
              }}
            >
              {slotMutation.isPending
                ? isConfirmedBooking(slotTarget)
                  ? "Rescheduling..."
                  : "Assigning..."
                : getSlotActionLabel(slotTarget)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
