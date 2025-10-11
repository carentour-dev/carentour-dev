"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  CalendarCheck,
  CalendarDays,
  Clock,
  ExternalLink,
  Inbox,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  Sparkles,
  Star,
  Stethoscope,
  Video,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { usePatientPortalData } from "@/hooks/usePatientPortalData";
import { cn } from "@/lib/utils";

const requestStatusLabels = {
  new: "New",
  in_progress: "In progress",
  resolved: "Resolved",
} as const;

const consultationStatusLabels = {
  scheduled: "Scheduled",
  rescheduled: "Rescheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No show",
} as const;

const appointmentStatusLabels = {
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  rescheduled: "Rescheduled",
} as const;

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Not set";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
};

const formatRelativeTime = (value: string | null | undefined) => {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const diff = date.getTime() - Date.now();
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const divisions: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 1000 * 60 * 60 * 24 * 365],
    ["month", 1000 * 60 * 60 * 24 * 30],
    ["week", 1000 * 60 * 60 * 24 * 7],
    ["day", 1000 * 60 * 60 * 24],
    ["hour", 1000 * 60 * 60],
    ["minute", 1000 * 60],
  ];

  for (const [unit, amount] of divisions) {
    if (Math.abs(diff) >= amount || unit === "minute") {
      return rtf.format(Math.round(diff / amount), unit);
    }
  }

  return "";
};

const scrollToSection = (id: string) => {
  if (typeof window === "undefined") return;
  const section = document.getElementById(id);
  section?.scrollIntoView({ behavior: "smooth", block: "start" });
};

const statusBadgeVariant = (status: string) => {
  switch (status) {
    case "new":
    case "scheduled":
    case "confirmed":
      return "default" as const;
    case "in_progress":
    case "rescheduled":
      return "secondary" as const;
    case "completed":
      return "secondary" as const;
    case "cancelled":
    case "no_show":
    case "resolved":
      return "outline" as const;
    default:
      return "secondary" as const;
  }
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const {
    patient,
    requests,
    consultations,
    appointments,
    reviews,
    isLoading: portalLoading,
    error,
    refetch,
  } = usePatientPortalData();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [authLoading, user, router]);

  const isLoading = authLoading || profileLoading || portalLoading;

  const pendingRequests = useMemo(
    () => requests.filter((request) => request.status !== "resolved"),
    [requests],
  );

  const sortedRequests = useMemo(
    () =>
      [...requests].sort(
        (a, b) => new Date(b.created_at ?? "").getTime() - new Date(a.created_at ?? "").getTime(),
      ),
    [requests],
  );

  const upcomingConsultations = useMemo(() => {
    const now = Date.now();
    return consultations
      .filter((consultation) => {
        if (!consultation.scheduled_at) return false;
        const schedule = new Date(consultation.scheduled_at).getTime();
        return (
          schedule >= now &&
          (consultation.status === "scheduled" || consultation.status === "rescheduled")
        );
      })
      .sort(
        (a, b) =>
          new Date(a.scheduled_at ?? "").getTime() - new Date(b.scheduled_at ?? "").getTime(),
      );
  }, [consultations]);

  const nextConsultation = upcomingConsultations[0] ?? null;

  const upcomingAppointments = useMemo(() => {
    const now = Date.now();
    const activeStatuses = new Set(["scheduled", "confirmed", "rescheduled"]);
    return appointments
      .filter((appointment) => {
        if (!appointment.starts_at) return false;
        const start = new Date(appointment.starts_at).getTime();
        return start >= now && activeStatuses.has(appointment.status);
      })
      .sort(
        (a, b) =>
          new Date(a.starts_at ?? "").getTime() - new Date(b.starts_at ?? "").getTime(),
      );
  }, [appointments]);

  const recentReviews = useMemo(
    () =>
      [...reviews].sort(
        (a, b) => new Date(b.created_at ?? "").getTime() - new Date(a.created_at ?? "").getTime(),
      ),
    [reviews],
  );

  const quickActions = [
    {
      title: "Start a New Request",
      description:
        pendingRequests.length > 0
          ? `${pendingRequests.length} active request${pendingRequests.length === 1 ? "" : "s"}`
          : "Tell us what you need next",
      icon: Inbox,
      action: () => router.push("/contact"),
      accentClass:
        "bg-sky-500/15 text-sky-600 dark:text-sky-100 group-hover:bg-sky-500/25 group-hover:text-sky-700 dark:group-hover:text-sky-50",
    },
    {
      title: "Schedule Consultation",
      description: nextConsultation
        ? `Next on ${formatDateTime(nextConsultation.scheduled_at)}`
        : "Book time with your coordinator",
      icon: CalendarCheck,
      action: () => router.push("/consultation"),
      accentClass:
        "bg-emerald-500/15 text-emerald-600 dark:text-emerald-100 group-hover:bg-emerald-500/25 group-hover:text-emerald-700 dark:group-hover:text-emerald-50",
    },
    {
      title: "View Appointments",
      description:
        upcomingAppointments.length > 0
          ? `${upcomingAppointments.length} upcoming appointment${upcomingAppointments.length === 1 ? "" : "s"}`
          : "Keep track of your visit schedule",
      icon: CalendarDays,
      action: () => scrollToSection("appointments"),
      accentClass:
        "bg-blue-500/15 text-blue-600 dark:text-blue-100 group-hover:bg-blue-500/25 group-hover:text-blue-700 dark:group-hover:text-blue-50",
    },
    {
      title: "Share a Review",
      description: reviews.length > 0 ? "View and update your feedback" : "Help future patients by sharing your story",
      icon: Star,
      action: () => scrollToSection("reviews"),
      accentClass:
        "bg-amber-500/15 text-amber-600 dark:text-amber-100 group-hover:bg-amber-500/25 group-hover:text-amber-700 dark:group-hover:text-amber-50",
    },
  ];

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 xl:items-start">
            <div className="flex items-center gap-4 xl:col-span-2">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile?.avatar_url ?? undefined} alt="User avatar" />
                <AvatarFallback className="text-lg bg-primary/10">
                  {profile?.initials ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Welcome back{profile?.displayName ? `, ${profile.displayName}` : ""} 👋
                </h1>
                <p className="text-muted-foreground">
                  Track your requests, appointments, and progress from one place.
                </p>
              </div>
            </div>
            {patient && (
              <div className="w-full rounded-2xl border border-border/60 bg-muted/20 px-6 py-5 text-left shadow-sm xl:col-span-1">
                <p className="text-sm text-muted-foreground">Patient ID</p>
                <p className="text-lg font-semibold text-foreground">{patient.id}</p>
              </div>
            )}
          </div>
        </div>

        {error ? (
          <Card className="mb-8 border-destructive/30 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-destructive">We couldn&apos;t load your dashboard</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-destructive">
              <p>{error}</p>
              <Button variant="destructive" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {isLoading ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p>Loading your patient portal…</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Quick actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {quickActions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <Button
                          key={action.title}
                          variant="ghost"
                          className="group h-full justify-start gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4 text-left text-foreground transition-colors duration-200 hover:border-primary/40 hover:bg-muted/30 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                          onClick={action.action}
                        >
                          <div
                            className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                              action.accentClass,
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold tracking-tight transition-colors group-hover:text-foreground">
                              {action.title}
                            </div>
                            <div className="text-sm text-muted-foreground transition-colors group-hover:text-foreground">
                              {action.description}
                            </div>
                          </div>
                          <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card id="requests">
                <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Inbox className="h-5 w-5 text-primary" />
                      Your requests
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {requests.length === 0
                        ? "You haven't submitted any requests yet."
                        : "Track the status of requests you submitted to our care team."}
                    </p>
                  </div>
                  <Badge variant={pendingRequests.length > 0 ? "default" : "outline"}>
                    {pendingRequests.length} active
                  </Badge>
                </CardHeader>
                <CardContent>
                  {requests.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border/60 p-6 text-center">
                      <p className="font-medium text-foreground">No requests yet</p>
                      <p className="text-sm text-muted-foreground">
                        Need help planning or have questions? Submit a request and our team will respond quickly.
                      </p>
                      <Button className="mt-3" onClick={() => router.push("/contact")}>
                        Start a request
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sortedRequests.slice(0, 5).map((request) => (
                        <div
                          key={request.id}
                          className="rounded-xl border border-border/60 bg-muted/10 p-4 transition-colors hover:border-primary/30"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="space-y-1">
                              <p className="text-sm font-semibold text-foreground">
                                {request.request_type === "consultation" ? "Consultation request" : "General inquiry"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Submitted {formatDateTime(request.created_at)}
                              </p>
                            </div>
                            <Badge variant={statusBadgeVariant(request.status)} className="capitalize">
                              {requestStatusLabels[request.status]}
                            </Badge>
                          </div>
                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            <div>
                              <p className="text-xs text-muted-foreground">Treatment interest</p>
                              <p className="text-sm">
                                {request.treatment && request.treatment.trim().length > 0
                                  ? request.treatment
                                  : "Not specified"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Origin</p>
                              <p className="text-sm capitalize">{request.origin ?? "web"}</p>
                            </div>
                          </div>
                          {request.notes ? (
                            <p className="mt-3 text-sm text-muted-foreground">Team notes: {request.notes}</p>
                          ) : null}
                        </div>
                      ))}
                      {requests.length > 5 ? (
                        <p className="text-xs text-muted-foreground">
                          Showing latest five requests. Contact your coordinator for older submissions.
                        </p>
                      ) : null}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card id="reviews">
                <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-primary" />
                      Your reviews
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {reviews.length === 0
                        ? "Share your experience to help future patients."
                        : "Review the feedback you've shared with our network."}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Talk with concierge
                  </Button>
                </CardHeader>
                <CardContent>
                  {reviews.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border/60 p-6 text-center">
                      <p className="font-medium text-foreground">No reviews yet</p>
                      <p className="text-sm text-muted-foreground">
                        We celebrate every story. Reach out to your coordinator when you&apos;re ready to share yours.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentReviews.slice(0, 3).map((review) => (
                        <div key={review.id} className="rounded-xl border border-border/60 bg-muted/10 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-foreground">
                                {review.doctors?.name ?? "Care N Tour Specialist"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Shared {formatDateTime(review.created_at)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 text-amber-500">
                              {Array.from({ length: 5 }).map((_, index) => (
                                <Star
                                  key={index}
                                  className={cn(
                                    "h-4 w-4",
                                    index < Math.round(review.rating ?? 0) ? "fill-amber-500" : "opacity-30",
                                  )}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="mt-3 text-sm leading-relaxed text-foreground/90">{review.review_text}</p>
                          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {review.treatments?.name ? (
                              <span className="rounded-full bg-muted px-3 py-1">
                                Treatment: {review.treatments.name}
                              </span>
                            ) : null}
                            {review.recovery_time ? (
                              <span className="rounded-full bg-muted px-3 py-1">
                                Recovery: {review.recovery_time}
                              </span>
                            ) : null}
                            <span className="rounded-full bg-muted px-3 py-1">
                              Visibility: {review.published ? "Published" : "Draft"}
                            </span>
                          </div>
                        </div>
                      ))}
                      {reviews.length > 3 ? (
                        <p className="text-xs text-muted-foreground">
                          Showing your three most recent reviews. Contact your coordinator to update older feedback.
                        </p>
                      ) : null}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card id="consultation">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Scheduled consultation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingConsultations.length > 0 ? (
                    <div className="space-y-4">
                      {upcomingConsultations.map((consultation) => (
                        <div key={consultation.id} className="rounded-lg border border-border/70 bg-muted/10 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {formatDateTime(consultation.scheduled_at)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatRelativeTime(consultation.scheduled_at)}
                              </p>
                            </div>
                            <Badge variant={statusBadgeVariant(consultation.status)}>
                              {consultationStatusLabels[consultation.status]}
                            </Badge>
                          </div>
                          <div className="mt-3 space-y-2 text-sm">
                            {consultation.doctors ? (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Stethoscope className="h-4 w-4" />
                                <span>{consultation.doctors.name}</span>
                              </div>
                            ) : null}
                            {consultation.location ? (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>{consultation.location}</span>
                              </div>
                            ) : null}
                            {consultation.meeting_url ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={() => window.open(consultation.meeting_url ?? "#", "_blank")}
                              >
                                <Video className="mr-2 h-4 w-4" />
                                Join virtual meeting
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      ))}
                      {consultations.length > upcomingConsultations.length ? (
                        <p className="text-xs text-muted-foreground">
                          Showing {upcomingConsultations.length} upcoming consultations. Contact your coordinator for past visits or schedule changes.
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border/60 p-6 text-center">
                      <p className="font-medium text-foreground">No consultations scheduled</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        When your first consultation is confirmed, we&apos;ll list it here with preparation steps.
                      </p>
                      <Button className="mt-3" onClick={() => router.push("/consultation")}>
                        Schedule consultation
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card id="appointments">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    Upcoming appointments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingAppointments.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border/60 p-6 text-center">
                      <p className="font-medium text-foreground">No appointments scheduled</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Your upcoming visits will appear here once they&apos;re confirmed by the care team.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcomingAppointments.map((appointment) => (
                        <div key={appointment.id} className="rounded-lg border border-border/70 bg-muted/10 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-foreground">{appointment.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {appointment.appointment_type}
                              </p>
                            </div>
                            <Badge variant={statusBadgeVariant(appointment.status)}>
                              {appointmentStatusLabels[appointment.status]}
                            </Badge>
                          </div>
                          <div className="mt-3 space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>{formatDateTime(appointment.starts_at)}</span>
                            </div>
                            {appointment.location ? (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>{appointment.location}</span>
                              </div>
                            ) : null}
                            {appointment.doctors ? (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Stethoscope className="h-4 w-4" />
                                <span>{appointment.doctors.name}</span>
                              </div>
                            ) : null}
                            {appointment.pre_visit_instructions ? (
                              <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                                {appointment.pre_visit_instructions}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      ))}
                      {appointments.length > upcomingAppointments.length ? (
                        <p className="text-xs text-muted-foreground">
                          Showing the next {upcomingAppointments.length} appointments. Contact your coordinator for the full schedule.
                        </p>
                      ) : null}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Need help?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Our medical coordinators are here to help with any questions about next steps, travel arrangements, or medical records.
                  </p>
                  <div className="space-y-2">
                    <Button size="sm" className="w-full" onClick={() => router.push("/contact")}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Message concierge
                    </Button>
                    <Button size="sm" variant="outline" className="w-full" asChild>
                      <Link href="tel:+201001741666">
                        <Phone className="mr-2 h-4 w-4" />
                        +20 100 174 1666
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ExternalLink className="h-5 w-5" />
                    Travel resources
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    Access our travel guides, accommodation partners, and recovery planning tips to make your medical journey seamless.
                  </p>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href="/travel-info">
                      View travel guide
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
