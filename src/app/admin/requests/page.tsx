"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FileQuestion, Inbox, Loader2, RefreshCcw } from "lucide-react";
import { adminFetch, useAdminInvalidate } from "@/components/admin/hooks/useAdminFetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import type { Tables } from "@/integrations/supabase/types";

type ContactRequest = Tables<"contact_requests">;
type ContactRequestStatus = ContactRequest["status"];
type StatusFilter = (typeof STATUS_OPTIONS)[number]["value"];
type RequestTab = "contact" | "consultation";

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

const QUERY_KEY = ["admin", "contact-requests"] as const;

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

const capitalize = (value: string | null) => {
  if (!value) return "General";
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export default function AdminRequestsPage() {
  const [activeTab, setActiveTab] = useState<RequestTab>("consultation");
  const [statusFilters, setStatusFilters] = useState<Record<RequestTab, StatusFilter>>({
    contact: "all",
    consultation: "all",
  });
  const [notesDraft, setNotesDraft] = useState("");
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
    queryFn: () => fetchRequests(statusFilters.contact, "general"),
  });

  const consultationQuery = useQuery({
    queryKey: [...QUERY_KEY, "consultation", statusFilters.consultation],
    queryFn: () => fetchRequests(statusFilters.consultation, "consultation"),
  });

  const updateRequest = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Pick<ContactRequest, "status" | "notes">> }) =>
      adminFetch<ContactRequest>(`/api/admin/requests/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (request) => {
      invalidate(QUERY_KEY);
      toast({
        title: "Request updated",
        description: `Status set to ${STATUS_LABELS[request.status]}.`,
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
  };

  const openDialogFor = (request: ContactRequest) => {
    setActiveRequest(request);
    setNotesDraft(request.notes ?? "");
    setDialogOpen(true);
  };

  const handleStatusChange = async (requestId: string, status: ContactRequestStatus) => {
    setUpdatingId(requestId);
    await updateRequest.mutateAsync({ id: requestId, data: { status } });
  };

  const handleSaveNotes = async () => {
    if (!activeRequest) return;
    setUpdatingId(activeRequest.id);
    await updateRequest.mutateAsync({
      id: activeRequest.id,
      data: { notes: notesDraft.trim().length > 0 ? notesDraft.trim() : null },
    });
    closeDialog();
  };

  const contactRequests = contactQuery.data ?? [];
  const consultationRequests = consultationQuery.data ?? [];

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
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Received</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Treatment</TableHead>
                        <TableHead>Travel Window</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[140px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {consultationRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="align-top">
                            <div className="flex flex-col">
                              <span className="font-medium">{formatDateTime(request.created_at)}</span>
                              <span className="text-xs text-muted-foreground">
                                Updated {formatDateTime(request.updated_at)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="space-y-1">
                              <p className="font-semibold">
                                {request.first_name} {request.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">{request.email}</p>
                              {request.phone && <p className="text-sm text-muted-foreground">{request.phone}</p>}
                              {request.country && (
                                <p className="text-xs text-muted-foreground uppercase">
                                  Based in {request.country}
                                </p>
                              )}
                              {request.contact_preference && (
                                <p className="text-xs font-medium text-primary">
                                  Prefers: {request.contact_preference}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="space-y-1">
                              <span className="text-sm text-foreground">
                                {request.treatment ?? "Not specified"}
                              </span>
                              {request.budget_range && (
                                <p className="text-xs text-muted-foreground">
                                  Budget: {request.budget_range}
                                </p>
                              )}
                              {request.medical_reports && (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  Reports: {request.medical_reports}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="space-y-1">
                              <span className="text-sm text-foreground">
                                {request.travel_window ?? "Not specified"}
                              </span>
                              {request.companions && (
                                <p className="text-xs text-muted-foreground">
                                  Companion plan: {request.companions}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <Select
                              value={request.status}
                              onValueChange={(value) => {
                                void handleStatusChange(request.id, value as ContactRequestStatus);
                              }}
                              disabled={updatingId === request.id || updateRequest.isPending}
                            >
                              <SelectTrigger className="w-[140px]">
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
                          </TableCell>
                          <TableCell className="align-top text-right">
                            <Button variant="outline" size="sm" onClick={() => openDialogFor(request)}>
                              View
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
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Received</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Treatment</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[140px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contactRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="align-top">
                            <div className="flex flex-col">
                              <span className="font-medium">{formatDateTime(request.created_at)}</span>
                              <span className="text-xs text-muted-foreground">
                                Updated {formatDateTime(request.updated_at)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="space-y-1">
                              <p className="font-semibold">
                                {request.first_name} {request.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">{request.email}</p>
                              {request.phone && <p className="text-sm text-muted-foreground">{request.phone}</p>}
                              {request.country && (
                                <p className="text-xs text-muted-foreground uppercase">{request.country}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="space-y-1">
                              <span className="text-sm text-foreground">{request.treatment ?? "Not specified"}</span>
                              {request.notes && (
                                <p className="text-xs text-muted-foreground line-clamp-2">Note: {request.notes}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <Badge variant="secondary">{capitalize(request.request_type)}</Badge>
                          </TableCell>
                          <TableCell className="align-top">
                            <Select
                              value={request.status}
                              onValueChange={(value) => {
                                void handleStatusChange(request.id, value as ContactRequestStatus);
                              }}
                              disabled={updatingId === request.id || updateRequest.isPending}
                            >
                              <SelectTrigger className="w-[140px]">
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
                          </TableCell>
                          <TableCell className="align-top text-right">
                            <Button variant="outline" size="sm" onClick={() => openDialogFor(request)}>
                              View
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

              {activeRequest.request_type === "consultation" && (
                <>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-muted-foreground">Travel & Logistics</h3>
                    <div className="rounded-md border border-border/60 bg-muted/20 p-3 text-sm text-foreground space-y-1">
                      <p>Treatment: {activeRequest.treatment ?? "Not provided"}</p>
                      <p>Destination: {activeRequest.destination ?? "Not provided"}</p>
                      <p>Travel window: {activeRequest.travel_window ?? "Not provided"}</p>
                      {activeRequest.companions && <p>Companions: {activeRequest.companions}</p>}
                      {activeRequest.budget_range && <p>Budget guidance: {activeRequest.budget_range}</p>}
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
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={() => void handleSaveNotes()} disabled={updatingId === activeRequest?.id}>
              {updatingId === activeRequest?.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving
                </>
              ) : (
                "Save notes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
