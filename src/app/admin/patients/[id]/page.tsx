"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  FileDown,
  FileText,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";
import type {
  PatientDetails,
  PatientDocumentSummary,
} from "@/server/modules/patients/module";
import { adminFetch } from "@/components/admin/hooks/useAdminFetch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_LABELS: Record<string, string> = {
  potential: "Potential",
  confirmed: "Confirmed",
};

const STATUS_BADGE_VARIANT: Record<string, "outline" | "success"> = {
  potential: "outline",
  confirmed: "success",
};

const SOURCE_LABELS: Record<string, string> = {
  organic: "Organic",
  staff: "Team created",
  imported: "Imported",
};

const SOURCE_BADGE_VARIANT: Record<
  string,
  "default" | "secondary" | "outline"
> = {
  organic: "secondary",
  staff: "default",
  imported: "outline",
};

const CHANNEL_LABELS: Record<string, string> = {
  portal_signup: "Portal signup",
  admin_console: "Admin console",
  operations_dashboard: "Operations dashboard",
  api: "API integration",
  import: "Data import",
  unknown: "Unknown channel",
};

const DOCUMENT_SOURCE_LABELS: Record<PatientDocumentSummary["source"], string> =
  {
    contact_request: "Contact request",
    start_journey: "Start Journey",
    storage: "Storage",
  };

const CREATED_BY_FALLBACK_LABELS: Record<string, string> = {
  portal_signup: "Self signup",
  admin_console: "Admin console",
  operations_dashboard: "Operations team",
  api: "API client",
  import: "Data import",
};

type TimelineEvent = {
  id: string;
  timestamp: string | null;
  title: string;
  description?: string;
  icon: ReactNode;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "outline" | "ghost" | "success";
  metadata?: { label: string; value: string }[];
};

const patientDetailsKey = (patientId: string | undefined) =>
  ["admin", "patients", "details", patientId] as const;

const formatDate = (
  value: string | null | undefined,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, options).format(date);
};

const formatDateTime = (value: string | null | undefined) =>
  formatDate(value, { dateStyle: "medium", timeStyle: "short" });

const formatFileSize = (bytes: number | null | undefined) => {
  if (bytes === null || bytes === undefined) return "—";
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${
    units[exponent]
  }`;
};

const fetchPatientDetails = async (patientId: string) =>
  adminFetch<PatientDetails>(`/api/admin/patients/${patientId}/details`);

type InfoItemProps = {
  label: string;
  value: ReactNode;
  secondary?: ReactNode;
};

function InfoItem({ label, value, secondary }: InfoItemProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-sm text-foreground">{value ?? "—"}</span>
      {secondary ? (
        <span className="text-xs text-muted-foreground">{secondary}</span>
      ) : null}
    </div>
  );
}

export default function PatientDetailsPage() {
  const params = useParams();
  const rawId = params?.id;
  const patientId =
    typeof rawId === "string"
      ? rawId
      : Array.isArray(rawId)
        ? rawId[0]
        : undefined;
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const basePath = pathname.startsWith("/operations")
    ? "/operations"
    : "/admin";

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: patientDetailsKey(patientId),
    queryFn: () => fetchPatientDetails(patientId as string),
    enabled: Boolean(patientId),
    staleTime: 30_000,
  });

  const details = data ?? null;
  const timelineEvents = useMemo(
    () => (details ? buildTimeline(details) : []),
    [details],
  );
  const uniqueDocuments = useMemo(
    () => (details ? dedupeDocuments(details.documents) : []),
    [details],
  );

  if (!patientId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-md border-destructive/40">
          <CardHeader className="flex flex-row items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>Patient not specified</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Provide a patient identifier to view their profile.
            </p>
            <Button
              variant="outline"
              onClick={() => router.push(`${basePath}/patients`)}
            >
              Back to patients
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-sm">Loading patient details…</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-lg border-destructive/40">
          <CardHeader className="flex flex-row items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle>Unable to load patient details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {(error as Error)?.message ??
                "An unexpected error occurred while fetching patient data."}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push(`${basePath}/patients`)}
              >
                Back to patients
              </Button>
              <Button onClick={() => void refetch()}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Patient not found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The requested patient record does not exist.
            </p>
            <Button
              variant="outline"
              onClick={() => router.push(`${basePath}/patients`)}
            >
              Back to patients
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const patient = details.patient;
  const createdByFallback = getCreatedByFallback(patient);
  const creatorName =
    patient.creator_profile?.username ?? patient.creator_profile?.email ?? null;
  const creatorMeta =
    patient.creator_profile?.job_title ??
    patient.creator_profile?.email ??
    (patient.creator_profile ? "Team member" : null);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`${basePath}/patients`}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to patients
        </Link>
        <Badge
          variant={STATUS_BADGE_VARIANT[patient.status] ?? "outline"}
          className="self-start"
        >
          {STATUS_LABELS[patient.status] ?? patient.status}
        </Badge>
        <Badge variant={SOURCE_BADGE_VARIANT[patient.source] ?? "secondary"}>
          {SOURCE_LABELS[patient.source] ?? patient.source}
        </Badge>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle className="text-2xl font-semibold">
              {patient.full_name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Patient since {formatDate(patient.created_at)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {patient.contact_email ? (
              <Button asChild size="sm" variant="outline">
                <a href={`mailto:${patient.contact_email}`}>
                  <Mail className="h-4 w-4" />
                  Email
                </a>
              </Button>
            ) : null}
            {patient.contact_phone ? (
              <Button asChild size="sm" variant="outline">
                <a href={`tel:${patient.contact_phone}`}>
                  <Phone className="h-4 w-4" />
                  Call
                </a>
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <InfoItem
              label="Email"
              value={
                patient.contact_email ? (
                  <Link
                    href={`mailto:${patient.contact_email}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {patient.contact_email}
                  </Link>
                ) : (
                  "—"
                )
              }
              secondary={patient.email_verified ? "Email verified" : undefined}
            />
            <InfoItem
              label="Phone"
              value={
                patient.contact_phone ? (
                  <Link
                    href={`tel:${patient.contact_phone}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {patient.contact_phone}
                  </Link>
                ) : (
                  "—"
                )
              }
            />
            <InfoItem label="Nationality" value={patient.nationality ?? "—"} />
            <InfoItem
              label="Preferred language"
              value={patient.preferred_language ?? "—"}
            />
            <InfoItem
              label="Preferred currency"
              value={patient.preferred_currency ?? "—"}
            />
            <InfoItem
              label="Date of birth"
              value={patient.date_of_birth ?? "—"}
            />
          </div>

          <Separator />

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">
                Portal account
              </h3>
              <InfoItem
                label="Account email"
                value={
                  patient.auth_user?.email ? (
                    <Link
                      href={`mailto:${patient.auth_user.email}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {patient.auth_user.email}
                    </Link>
                  ) : (
                    (patient.contact_email ?? "—")
                  )
                }
                secondary={
                  patient.auth_user?.created_at
                    ? `Created ${formatDate(patient.auth_user.created_at)}`
                    : undefined
                }
              />
              <InfoItem
                label="Last sign-in"
                value={formatDateTime(patient.auth_user?.last_sign_in_at)}
              />
              <InfoItem
                label="Profile"
                value={
                  patient.portal_profile?.username ??
                  patient.portal_profile?.email ??
                  "—"
                }
                secondary={patient.portal_profile?.phone ?? undefined}
              />
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">
                Creation details
              </h3>
              <InfoItem
                label="Created via"
                value={
                  CHANNEL_LABELS[patient.created_channel] ??
                  patient.created_channel
                }
              />
              <InfoItem
                label="Created by"
                value={
                  patient.creator_profile && creatorName ? (
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{creatorName}</span>
                      <span className="text-xs text-muted-foreground">
                        {creatorMeta}
                      </span>
                    </div>
                  ) : (
                    (createdByFallback ?? "—")
                  )
                }
              />
              <InfoItem
                label="Confirmed by"
                value={
                  patient.confirmed_by_profile ? (
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {patient.confirmed_by_profile.username ??
                          patient.confirmed_by_profile.email}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {patient.confirmed_by_profile.job_title ??
                          patient.confirmed_by_profile.email ??
                          "Team member"}
                      </span>
                    </div>
                  ) : (
                    "—"
                  )
                }
                secondary={
                  patient.confirmed_at
                    ? `Confirmed ${formatDateTime(patient.confirmed_at)}`
                    : undefined
                }
              />
            </div>
          </div>

          {patient.notes ? (
            <div className="rounded-lg border bg-muted/40 p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Internal notes
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground">
                {patient.notes}
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="intake">Intake</TabsTrigger>
          <TabsTrigger value="care">Care</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {timelineEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No activity recorded yet for this patient.
                </p>
              ) : (
                <div className="space-y-6">
                  {timelineEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 rounded-lg border border-muted/60 bg-card/40 p-4"
                    >
                      <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        {event.icon}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">
                            {event.title}
                          </span>
                          {event.badge ? (
                            <Badge variant={event.badgeVariant ?? "secondary"}>
                              {event.badge}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(event.timestamp)}
                        </p>
                        {event.description ? (
                          <p className="text-sm text-muted-foreground">
                            {event.description}
                          </p>
                        ) : null}
                        {event.metadata && event.metadata.length > 0 ? (
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {event.metadata.map((meta) => (
                              <span
                                key={`${event.id}-${meta.label}`}
                                className="rounded-full bg-muted px-2 py-0.5"
                              >
                                <span className="font-semibold text-foreground/80">
                                  {meta.label}:
                                </span>{" "}
                                {meta.value}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="intake" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact requests</CardTitle>
            </CardHeader>
            <CardContent>
              {details.contact_requests.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No contact form submissions recorded for this patient.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Requester</TableHead>
                        <TableHead>Origin</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {details.contact_requests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-foreground">
                                {formatDate(request.created_at, {
                                  dateStyle: "medium",
                                })}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(request.created_at, {
                                  timeStyle: "short",
                                })}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-foreground">
                                {request.first_name} {request.last_name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {request.email}
                              </span>
                              {request.phone ? (
                                <span className="text-xs text-muted-foreground">
                                  {request.phone}
                                </span>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {request.origin ?? "web"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {request.status.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[240px]">
                            <span className="line-clamp-3 text-sm text-muted-foreground">
                              {request.notes ?? "—"}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Start Journey submissions</CardTitle>
            </CardHeader>
            <CardContent>
              {details.start_journey_submissions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No Start Journey intake forms linked to this patient.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Treatment</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Origin</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {details.start_journey_submissions.map((submission) => (
                        <TableRow key={submission.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-foreground">
                                {formatDate(submission.created_at, {
                                  dateStyle: "medium",
                                })}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(submission.created_at, {
                                  timeStyle: "short",
                                })}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-foreground">
                                {submission.treatment_name ?? "—"}
                              </span>
                              {submission.procedure_name ? (
                                <span className="text-xs text-muted-foreground">
                                  {submission.procedure_name}
                                </span>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {submission.status.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {submission.origin ?? "web"}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[240px]">
                            <span className="line-clamp-3 text-sm text-muted-foreground">
                              {submission.notes ?? "—"}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="care" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Consultations</CardTitle>
            </CardHeader>
            <CardContent>
              {details.consultations.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No consultations scheduled for this patient.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Scheduled</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {details.consultations.map((consultation) => (
                        <TableRow key={consultation.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-foreground">
                                {formatDateTime(consultation.scheduled_at)}
                              </span>
                              {consultation.timezone ? (
                                <span className="text-xs text-muted-foreground">
                                  {consultation.timezone}
                                </span>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-foreground">
                                {consultation.doctors?.name ?? "—"}
                              </span>
                              {consultation.coordinator_profile ? (
                                <span className="text-xs text-muted-foreground">
                                  Coordinator:{" "}
                                  {consultation.coordinator_profile.username ??
                                    consultation.coordinator_profile.email}
                                </span>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {consultation.status.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[240px]">
                            <span className="line-clamp-3 text-sm text-muted-foreground">
                              {consultation.notes ?? "—"}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              {details.appointments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No appointments scheduled for this patient.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Starts</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {details.appointments.map((appointment) => (
                        <TableRow key={appointment.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-foreground">
                                {formatDateTime(appointment.starts_at)}
                              </span>
                              {appointment.timezone ? (
                                <span className="text-xs text-muted-foreground">
                                  {appointment.timezone}
                                </span>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-foreground">
                                {appointment.title}
                              </span>
                              {appointment.doctors?.name ? (
                                <span className="text-xs text-muted-foreground">
                                  Doctor: {appointment.doctors.name}
                                </span>
                              ) : null}
                              {appointment.service_provider?.name ? (
                                <span className="text-xs text-muted-foreground">
                                  Facility: {appointment.service_provider.name}
                                </span>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {appointment.status.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[240px]">
                            <span className="line-clamp-3 text-sm text-muted-foreground">
                              {appointment.notes ?? "—"}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Uploaded documents</CardTitle>
            </CardHeader>
            <CardContent>
              {uniqueDocuments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No documents uploaded by this patient yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Uploaded</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {uniqueDocuments.map((document) => (
                        <TableRow key={document.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-foreground">
                                {document.label}
                              </span>
                              {document.type ? (
                                <span className="text-xs uppercase tracking-wide text-muted-foreground">
                                  {document.type.replace(/_/g, " ")}
                                </span>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {DOCUMENT_SOURCE_LABELS[document.source] ??
                                document.source}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatDateTime(document.uploaded_at)}
                          </TableCell>
                          <TableCell>{formatFileSize(document.size)}</TableCell>
                          <TableCell>
                            {document.signed_url ? (
                              <Button
                                asChild
                                size="sm"
                                variant="outline"
                                className="gap-1"
                              >
                                <a
                                  href={document.signed_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <FileDown className="h-4 w-4" />
                                  Download
                                </a>
                              </Button>
                            ) : (
                              <Badge variant="ghost">Unavailable</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Doctor reviews</CardTitle>
            </CardHeader>
            <CardContent>
              {details.reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No published doctor reviews from this patient.
                </p>
              ) : (
                <div className="space-y-4">
                  {details.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="rounded-lg border border-muted/60 bg-card/40 p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {review.doctors?.name ?? "Doctor review"}
                        </span>
                        <Badge variant="secondary">
                          Rating {review.rating}/5
                        </Badge>
                        {review.published ? (
                          <Badge variant="outline">Published</Badge>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {review.review_text}
                      </p>
                      <div className="mt-3 text-xs text-muted-foreground">
                        {formatDate(review.created_at)} •{" "}
                        {review.treatments?.name ?? "Treatment unspecified"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Patient stories</CardTitle>
            </CardHeader>
            <CardContent>
              {details.stories.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No long-form patient stories recorded.
                </p>
              ) : (
                <div className="space-y-4">
                  {details.stories.map((story) => (
                    <div
                      key={story.id}
                      className="rounded-lg border border-muted/60 bg-card/40 p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {story.headline}
                        </span>
                        {story.published ? (
                          <Badge variant="outline">Published</Badge>
                        ) : (
                          <Badge variant="ghost">Draft</Badge>
                        )}
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {story.excerpt ?? "No excerpt provided."}
                      </p>
                      <div className="mt-3 text-xs text-muted-foreground">
                        {formatDate(story.created_at)} •{" "}
                        {story.treatments?.name ?? "Treatment unspecified"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function buildTimeline(details: PatientDetails): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const patient = details.patient;
  const createdByFallback = getCreatedByFallback(patient);
  const creatorLabel =
    patient.creator_profile?.username ??
    patient.creator_profile?.email ??
    createdByFallback ??
    "—";

  events.push({
    id: "patient-created",
    timestamp: patient.created_at,
    title: "Patient record created",
    description:
      patient.source === "organic"
        ? "Patient registered via the public portal."
        : "Record created by the operations team.",
    icon: <User className="h-4 w-4" />,
    badge: SOURCE_LABELS[patient.source] ?? patient.source,
    badgeVariant: SOURCE_BADGE_VARIANT[patient.source] ?? "secondary",
    metadata: [
      {
        label: "Channel",
        value:
          CHANNEL_LABELS[patient.created_channel] ?? patient.created_channel,
      },
      {
        label: "Created by",
        value: creatorLabel,
      },
    ],
  });

  if (patient.confirmed_at) {
    events.push({
      id: "patient-confirmed",
      timestamp: patient.confirmed_at,
      title: "Patient confirmed",
      description: "Record marked as confirmed.",
      icon: <ShieldCheck className="h-4 w-4" />,
      badge: "Confirmed",
      badgeVariant: "success",
      metadata: [
        {
          label: "Confirmed by",
          value:
            patient.confirmed_by_profile?.username ??
            patient.confirmed_by_profile?.email ??
            "—",
        },
      ],
    });
  }

  for (const request of details.contact_requests) {
    events.push({
      id: `contact-${request.id}`,
      timestamp: request.created_at,
      title: "Contact request submitted",
      description: `${request.first_name} ${request.last_name} submitted a ${request.request_type ?? "general"} inquiry.`,
      icon: <Mail className="h-4 w-4" />,
      badge: request.status.replace(/_/g, " "),
      badgeVariant: "secondary",
      metadata: [
        { label: "Origin", value: request.origin ?? "web" },
        { label: "Email", value: request.email },
      ],
    });
  }

  for (const submission of details.start_journey_submissions) {
    events.push({
      id: `journey-${submission.id}`,
      timestamp: submission.created_at,
      title: "Start Journey submission",
      description:
        submission.treatment_name ??
        submission.procedure_name ??
        "New Start Journey intake received.",
      icon: <FileText className="h-4 w-4" />,
      badge: submission.status.replace(/_/g, " "),
      badgeVariant: "secondary",
      metadata: [
        { label: "Origin", value: submission.origin ?? "web" },
        {
          label: "Resolved",
          value: submission.resolved_at
            ? formatDateTime(submission.resolved_at)
            : "—",
        },
      ],
    });
  }

  for (const consultation of details.consultations) {
    events.push({
      id: `consultation-${consultation.id}`,
      timestamp: consultation.scheduled_at,
      title: "Consultation scheduled",
      description: consultation.doctors?.name ?? "Consultation with specialist",
      icon: <Calendar className="h-4 w-4" />,
      badge: consultation.status.replace(/_/g, " "),
      badgeVariant: "secondary",
      metadata: [
        {
          label: "Coordinator",
          value:
            consultation.coordinator_profile?.username ??
            consultation.coordinator_profile?.email ??
            "—",
        },
      ],
    });
  }

  for (const appointment of details.appointments) {
    events.push({
      id: `appointment-${appointment.id}`,
      timestamp: appointment.starts_at,
      title: "Appointment",
      description: appointment.title,
      icon: <Calendar className="h-4 w-4" />,
      badge: appointment.status.replace(/_/g, " "),
      badgeVariant: "secondary",
      metadata: [
        {
          label: "Doctor",
          value: appointment.doctors?.name ?? "—",
        },
        {
          label: "Facility",
          value: appointment.service_provider?.name ?? "—",
        },
      ],
    });
  }

  return events
    .filter((event) => event.timestamp)
    .sort((a, b) => {
      const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return bTime - aTime;
    });
}

function dedupeDocuments(documents: PatientDocumentSummary[]) {
  const map = new Map<string, PatientDocumentSummary>();
  for (const document of documents) {
    const key = document.path ?? document.id;
    if (!map.has(key)) {
      map.set(key, document);
      continue;
    }
    const existing = map.get(key)!;
    map.set(key, {
      ...existing,
      signed_url: existing.signed_url ?? document.signed_url ?? null,
      uploaded_at: existing.uploaded_at ?? document.uploaded_at ?? null,
      size: existing.size ?? document.size ?? null,
      metadata: {
        ...(existing.metadata ?? {}),
        ...(document.metadata ?? {}),
      },
    });
  }
  return Array.from(map.values());
}

function getCreatedByFallback(
  patient: PatientDetails["patient"],
): string | null {
  if (patient.creator_profile) {
    return null;
  }

  const specificLabel = CREATED_BY_FALLBACK_LABELS[patient.created_channel];
  if (specificLabel) {
    return specificLabel;
  }

  if (patient.source === "organic") {
    return "Self signup";
  }

  if (patient.source === "staff") {
    return "Team member";
  }

  return null;
}
