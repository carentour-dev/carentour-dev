"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Pencil, PlusCircle, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import {
  adminFetch,
  useAdminInvalidate,
} from "@/components/admin/hooks/useAdminFetch";
import { useToast } from "@/hooks/use-toast";
import { PatientSelector } from "@/components/admin/PatientSelector";
import { DoctorSelector } from "@/components/admin/DoctorSelector";
import { TreatmentSelector } from "@/components/admin/TreatmentSelector";

const reviewSchema = z.object({
  id: z.string().uuid().optional(),
  patient_name: z.string().min(2),
  patient_country: z.string().optional().nullable(),
  patient_id: z.string().uuid().optional().nullable(),
  doctor_id: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim().length === 0
        ? undefined
        : value,
    z.string({ required_error: "Select a doctor" }).uuid(),
  ),
  treatment_id: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim().length === 0
        ? undefined
        : value,
    z.string({ required_error: "Select a treatment" }).uuid(),
  ),
  procedure_name: z.string().optional().nullable(),
  rating: z.coerce.number().min(0).max(5),
  review_text: z.string().min(10),
  recovery_time: z.string().optional().nullable(),
  is_verified: z.boolean().optional(),
  published: z.boolean().optional(),
  highlight: z.boolean().optional(),
  display_order: z.coerce.number().int().optional(),
  locale: z.string().optional(),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

const storySchema = z.object({
  id: z.string().uuid().optional(),
  patient_id: z.string().uuid().optional().nullable(),
  doctor_id: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim().length === 0 ? null : value,
    z.string().uuid().optional().nullable(),
  ),
  treatment_id: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim().length === 0
        ? undefined
        : value,
    z.string({ required_error: "Select a treatment" }).uuid(),
  ),
  headline: z.string().min(4),
  excerpt: z.string().optional().nullable(),
  body_markdown: z.string().min(20),
  published: z.boolean().optional(),
  featured: z.boolean().optional(),
  display_order: z.coerce.number().int().optional(),
  locale: z.string().optional(),
});

type StoryFormValues = z.infer<typeof storySchema>;

const REVIEWS_KEY = ["admin", "testimonials", "reviews"] as const;
const STORIES_KEY = ["admin", "testimonials", "stories"] as const;

export default function TestimonialsAdminPage() {
  const [activeTab, setActiveTab] = useState("reviews");
  const [editingReview, setEditingReview] = useState<ReviewFormValues | null>(
    null,
  );
  const [editingStory, setEditingStory] = useState<StoryFormValues | null>(
    null,
  );
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [storyDialogOpen, setStoryDialogOpen] = useState(false);
  const invalidate = useAdminInvalidate();
  const { toast } = useToast();

  const reviewsQuery = useQuery({
    queryKey: REVIEWS_KEY,
    queryFn: () => adminFetch<any[]>("/api/admin/testimonials/reviews"),
  });

  const storiesQuery = useQuery({
    queryKey: STORIES_KEY,
    queryFn: () => adminFetch<any[]>("/api/admin/testimonials/stories"),
  });

  const reviewForm = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      patient_name: "",
      patient_country: "",
      patient_id: null,
      doctor_id: "",
      treatment_id: "",
      procedure_name: "",
      rating: 5,
      review_text: "",
      recovery_time: "",
      is_verified: true,
      published: true,
      highlight: false,
      display_order: 0,
      locale: "en",
    },
  });

  const storyForm = useForm<StoryFormValues>({
    resolver: zodResolver(storySchema),
    defaultValues: {
      patient_id: null,
      doctor_id: null,
      treatment_id: "",
      headline: "",
      excerpt: "",
      body_markdown: "",
      published: true,
      featured: false,
      display_order: 0,
      locale: "en",
    },
  });

  const hasUnsavedReviewChanges = reviewForm.formState.isDirty;
  const hasUnsavedStoryChanges = storyForm.formState.isDirty;

  const attemptCloseReviewDialog = () => {
    if (
      !hasUnsavedReviewChanges ||
      window.confirm("Discard unsaved review changes?")
    ) {
      setReviewDialogOpen(false);
    }
  };

  const attemptCloseStoryDialog = () => {
    if (
      !hasUnsavedStoryChanges ||
      window.confirm("Discard unsaved story changes?")
    ) {
      setStoryDialogOpen(false);
    }
  };

  const createReview = useMutation({
    mutationFn: (payload: ReviewFormValues) =>
      adminFetch("/api/admin/testimonials/reviews", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      invalidate(REVIEWS_KEY);
      setReviewDialogOpen(false);
      toast({ title: "Review saved" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save review",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateReview = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReviewFormValues }) =>
      adminFetch(`/api/admin/testimonials/reviews/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      invalidate(REVIEWS_KEY);
      setReviewDialogOpen(false);
      toast({ title: "Review updated" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update review",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteReview = useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/api/admin/testimonials/reviews/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      invalidate(REVIEWS_KEY);
      toast({ title: "Review deleted" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete review",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createStory = useMutation({
    mutationFn: (payload: StoryFormValues) =>
      adminFetch("/api/admin/testimonials/stories", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      invalidate(STORIES_KEY);
      setStoryDialogOpen(false);
      toast({ title: "Story saved" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save story",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateStory = useMutation({
    mutationFn: ({ id, data }: { id: string; data: StoryFormValues }) =>
      adminFetch(`/api/admin/testimonials/stories/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      invalidate(STORIES_KEY);
      setStoryDialogOpen(false);
      toast({ title: "Story updated" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update story",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteStory = useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/api/admin/testimonials/stories/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      invalidate(STORIES_KEY);
      toast({ title: "Story deleted" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete story",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const openNewReview = () => {
    setEditingReview(null);
    reviewForm.reset({
      patient_name: "",
      patient_country: "",
      patient_id: null,
      doctor_id: "",
      treatment_id: "",
      procedure_name: "",
      rating: 5,
      review_text: "",
      recovery_time: "",
      is_verified: true,
      published: true,
      highlight: false,
      display_order: 0,
      locale: "en",
    });
    setReviewDialogOpen(true);
  };

  const openEditReview = (review: any) => {
    const values: ReviewFormValues = {
      id: review.id,
      patient_name: review.patient_name ?? "",
      patient_country: review.patient_country ?? "",
      patient_id: review.patient_id ?? null,
      doctor_id: review.doctor_id ?? "",
      treatment_id: review.treatment_id ?? "",
      procedure_name: review.procedure_name ?? "",
      rating: review.rating,
      review_text: review.review_text ?? "",
      recovery_time: review.recovery_time ?? "",
      is_verified: review.is_verified ?? true,
      published: review.published ?? true,
      highlight: review.highlight ?? false,
      display_order: review.display_order ?? 0,
      locale: review.locale ?? "en",
    };
    setEditingReview(values);
    reviewForm.reset(values);
    setReviewDialogOpen(true);
  };

  const openNewStory = () => {
    setEditingStory(null);
    storyForm.reset({
      patient_id: null,
      doctor_id: null,
      treatment_id: "",
      headline: "",
      excerpt: "",
      body_markdown: "",
      published: true,
      featured: false,
      display_order: 0,
      locale: "en",
    });
    setStoryDialogOpen(true);
  };

  const openEditStory = (story: any) => {
    const values: StoryFormValues = {
      id: story.id,
      patient_id: story.patient_id ?? null,
      doctor_id: story.doctor_id ?? null,
      treatment_id: story.treatment_id ?? "",
      headline: story.headline ?? "",
      excerpt: story.excerpt ?? "",
      body_markdown: story.body_markdown ?? "",
      published: story.published ?? true,
      featured: story.featured ?? false,
      display_order: story.display_order ?? 0,
      locale: story.locale ?? "en",
    };
    setEditingStory(values);
    storyForm.reset(values);
    setStoryDialogOpen(true);
  };

  const reviewDialogSubmit = reviewForm.handleSubmit((values) => {
    const { id, ...rest } = values;

    const payload: ReviewFormValues = {
      ...rest,
      patient_country: rest.patient_country?.trim()
        ? rest.patient_country
        : null,
      procedure_name: rest.procedure_name?.trim() || null,
      recovery_time: rest.recovery_time?.trim() || null,
    } as ReviewFormValues;

    if (id) {
      updateReview.mutate({ id, data: { ...payload, id } as ReviewFormValues });
    } else {
      createReview.mutate(payload);
    }
  });

  const storyDialogSubmit = storyForm.handleSubmit((values) => {
    const { id, ...rest } = values;

    const payload: StoryFormValues = {
      ...rest,
      excerpt: rest.excerpt?.trim() || null,
    } as StoryFormValues;

    if (id) {
      updateStory.mutate({ id, data: { ...payload, id } as StoryFormValues });
    } else {
      createStory.mutate(payload);
    }
  });

  const reviews = useMemo(() => reviewsQuery.data ?? [], [reviewsQuery.data]);
  const stories = useMemo(() => storiesQuery.data ?? [], [storiesQuery.data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Testimonials
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage patient reviews and long-form stories used across the marketing
          site.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-fit">
          <TabsTrigger value="reviews">Patient Reviews</TabsTrigger>
          <TabsTrigger value="stories">Patient Stories</TabsTrigger>
        </TabsList>

        <TabsContent value="reviews">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Patient Reviews</CardTitle>
              <Button onClick={openNewReview} className="gap-2">
                <PlusCircle className="h-4 w-4" /> Add Review
              </Button>
            </CardHeader>
            <CardContent>
              {reviewsQuery.isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : reviews.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  No reviews yet. Add your first testimonial.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Treatment</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-24 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviews.map((review) => (
                      <TableRow key={review.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">
                              {review.patient_name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {review.patient_country ??
                                "International Patient"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {review.treatment_name ??
                            review.treatment_slug ??
                            "—"}
                        </TableCell>
                        <TableCell>{review.doctors?.name || "—"}</TableCell>
                        <TableCell>
                          {Number(review.rating).toFixed(1)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-1 text-xs">
                            {review.published ? (
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                                Published
                              </span>
                            ) : (
                              <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                                Hidden
                              </span>
                            )}
                            {review.is_verified && (
                              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-700">
                                Verified
                              </span>
                            )}
                            {review.highlight && (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">
                                Highlight
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditReview(review)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => deleteReview.mutate(review.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stories">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Patient Stories</CardTitle>
              <Button onClick={openNewStory} className="gap-2">
                <PlusCircle className="h-4 w-4" /> Add Story
              </Button>
            </CardHeader>
            <CardContent>
              {storiesQuery.isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : stories.length === 0 ? (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  No patient stories yet. Add a story to share detailed success
                  journeys.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Headline</TableHead>
                      <TableHead>Treatment</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-24 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stories.map((story) => (
                      <TableRow key={story.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">
                              {story.headline}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {story.patients?.full_name || "Anon."}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {story.treatment_name ?? story.treatment_slug ?? "—"}
                        </TableCell>
                        <TableCell>{story.doctors?.name || "—"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs">
                            {story.published ? (
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                                Published
                              </span>
                            ) : (
                              <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                                Hidden
                              </span>
                            )}
                            {story.featured && (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">
                                Featured
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditStory(story)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => deleteStory.mutate(story.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          unsaved={hasUnsavedReviewChanges}
        >
          <DialogHeader>
            <DialogTitle>
              {editingReview ? "Edit Review" : "Add Review"}
            </DialogTitle>
            <DialogDescription>
              Patient testimonials appear on treatment and doctor pages.
            </DialogDescription>
          </DialogHeader>
          <Form {...reviewForm}>
            <form onSubmit={reviewDialogSubmit} className="space-y-4">
              <FormField
                control={reviewForm.control}
                name="patient_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link to Patient (Optional)</FormLabel>
                    <FormControl>
                      <PatientSelector
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Search and select patient..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={reviewForm.control}
                name="patient_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="John Doe" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={reviewForm.control}
                  name="patient_country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder="United States"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={reviewForm.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rating</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="5"
                          step="0.5"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={reviewForm.control}
                name="review_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Review Text</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={4}
                        placeholder="Write the patient's review..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={reviewForm.control}
                  name="doctor_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Doctor</FormLabel>
                      <FormControl>
                        <DoctorSelector
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Choose doctor"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={reviewForm.control}
                  name="treatment_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Treatment</FormLabel>
                      <FormControl>
                        <TreatmentSelector
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Choose treatment"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={reviewForm.control}
                name="procedure_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Procedure Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        placeholder="Coronary Bypass"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={reviewForm.control}
                name="recovery_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recovery Time</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        placeholder="4-6 weeks"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-6">
                <FormField
                  control={reviewForm.control}
                  name="is_verified"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Verified</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={reviewForm.control}
                  name="published"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Published</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={reviewForm.control}
                  name="highlight"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Highlight</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={attemptCloseReviewDialog}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Review</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Story Dialog */}
      <Dialog open={storyDialogOpen} onOpenChange={setStoryDialogOpen}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          unsaved={hasUnsavedStoryChanges}
        >
          <DialogHeader>
            <DialogTitle>
              {editingStory ? "Edit Story" : "Add Story"}
            </DialogTitle>
            <DialogDescription>
              Long-form patient success stories for the stories page.
            </DialogDescription>
          </DialogHeader>
          <Form {...storyForm}>
            <form onSubmit={storyDialogSubmit} className="space-y-4">
              <FormField
                control={storyForm.control}
                name="patient_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link to Patient (Optional)</FormLabel>
                    <FormControl>
                      <PatientSelector
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Search and select patient..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={storyForm.control}
                name="headline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Headline</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Patient's Journey to Recovery"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={storyForm.control}
                  name="doctor_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Doctor (Optional)</FormLabel>
                      <FormControl>
                        <DoctorSelector
                          value={field.value ?? null}
                          onValueChange={field.onChange}
                          placeholder="Choose doctor"
                          allowClear
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={storyForm.control}
                  name="treatment_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Treatment</FormLabel>
                      <FormControl>
                        <TreatmentSelector
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Choose treatment"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={storyForm.control}
                name="excerpt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Excerpt (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value ?? ""}
                        rows={2}
                        placeholder="Brief summary..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={storyForm.control}
                name="body_markdown"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Story Content (Markdown)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={8}
                        placeholder="Write the full patient story in markdown..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-6">
                <FormField
                  control={storyForm.control}
                  name="published"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Published</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={storyForm.control}
                  name="featured"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Featured</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={attemptCloseStoryDialog}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Story</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
