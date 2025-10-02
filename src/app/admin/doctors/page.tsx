"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { adminFetch, useAdminInvalidate } from "@/components/admin/hooks/useAdminFetch";
import { Loader2, Pencil, PlusCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Form schema keeps runtime validation in sync with Supabase types.
const urlSchema = z
  .string()
  .trim()
  .refine(
    (value) =>
      value.length === 0 ||
      value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.startsWith("/"),
    {
      message: "Invalid URL",
    },
  );

const doctorSchema = z.object({
  name: z.string().min(2, "Name is required"),
  title: z.string().min(2, "Title is required"),
  specialization: z.string().min(2, "Specialization is required"),
  bio: z.string().optional(),
  experience_years: z.coerce.number().int().min(0),
  education: z.string().optional(),
  languages_input: z.string().optional(),
  achievements_input: z.string().optional(),
  certifications_input: z.string().optional(),
  patient_rating: z.coerce.number().min(0).max(5).optional(),
  total_reviews: z.coerce.number().int().min(0).optional(),
  successful_procedures: z.coerce.number().int().min(0).optional(),
  research_publications: z.coerce.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
  avatar_url: urlSchema.nullable().optional(),
});

type DoctorFormValues = z.infer<typeof doctorSchema>;

type DoctorPayload = {
  name: string;
  title: string;
  specialization: string;
  bio?: string;
  experience_years: number;
  education?: string;
  languages?: string[];
  achievements?: string[];
  certifications?: string[];
  patient_rating?: number;
  total_reviews?: number;
  successful_procedures?: number;
  research_publications?: number;
  is_active?: boolean;
  avatar_url?: string | null;
};

type DoctorRecord = DoctorPayload & {
  id: string;
  languages?: string[] | null;
  achievements?: string[] | null;
  certifications?: string[] | null;
};

const QUERY_KEY = ["admin", "doctors"] as const;

export default function AdminDoctorsPage() {
  const [search, setSearch] = useState("");
  const [specializationFilter, setSpecializationFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<DoctorRecord | null>(null);
  const invalidate = useAdminInvalidate();
  const { toast } = useToast();

  const form = useForm<DoctorFormValues>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      name: "",
      title: "",
      specialization: "",
      bio: "",
      experience_years: 0,
      education: "",
      languages_input: "",
      achievements_input: "",
      certifications_input: "",
      patient_rating: undefined,
      total_reviews: undefined,
      successful_procedures: undefined,
      research_publications: undefined,
      is_active: true,
      avatar_url: null,
    },
  });

  const doctorsQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => adminFetch<DoctorRecord[]>("/api/admin/doctors"),
  });

  const createDoctor = useMutation({
    mutationFn: (payload: DoctorPayload) =>
      adminFetch<DoctorRecord>("/api/admin/doctors", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (_doctor, payload) => {
      invalidate(QUERY_KEY);
      closeDialog();
      toast({
        title: "Doctor created",
        description: `${payload?.name ?? "Doctor"} is now visible in the directory`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create doctor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateDoctor = useMutation({
    mutationFn: ({ id, data }: { id: string; data: DoctorPayload }) =>
      adminFetch<DoctorRecord>(`/api/admin/doctors/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (doctor) => {
      invalidate(QUERY_KEY);
      closeDialog();
      toast({
        title: "Doctor updated",
        description: `${doctor.name} has been updated`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update doctor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteDoctor = useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/api/admin/doctors/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      invalidate(QUERY_KEY);
      toast({
        title: "Doctor removed",
        description: "The doctor profile has been deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete doctor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const specializations = useMemo(() => {
    if (!doctorsQuery.data) return [] as string[];
    return Array.from(new Set(doctorsQuery.data.map((doctor) => doctor.specialization))).sort();
  }, [doctorsQuery.data]);

  const filteredDoctors = useMemo(() => {
    if (!doctorsQuery.data) return [] as DoctorRecord[];

    return doctorsQuery.data.filter((doctor) => {
      const matchesSearch = [doctor.name, doctor.title, doctor.specialization]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesSpecialization =
        specializationFilter === "all" || doctor.specialization === specializationFilter;

      return matchesSearch && matchesSpecialization;
    });
  }, [doctorsQuery.data, search, specializationFilter]);

  const openCreateDialog = () => {
    setEditingDoctor(null);
    form.reset({
      name: "",
      title: "",
      specialization: "",
      bio: "",
      experience_years: 0,
      education: "",
      languages_input: "",
      achievements_input: "",
      certifications_input: "",
      patient_rating: undefined,
      total_reviews: undefined,
      successful_procedures: undefined,
      research_publications: undefined,
      is_active: true,
      avatar_url: null,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (doctor: DoctorRecord) => {
    setEditingDoctor(doctor);
    form.reset({
      name: doctor.name,
      title: doctor.title,
      specialization: doctor.specialization,
      bio: doctor.bio ?? "",
      experience_years: doctor.experience_years,
      education: doctor.education ?? "",
      languages_input: (doctor.languages ?? []).join(", "),
      achievements_input: (doctor.achievements ?? []).join(", "),
      certifications_input: (doctor.certifications ?? []).join(", "),
      patient_rating: doctor.patient_rating,
      total_reviews: doctor.total_reviews,
      successful_procedures: doctor.successful_procedures ?? undefined,
      research_publications: doctor.research_publications ?? undefined,
      is_active: doctor.is_active ?? true,
      avatar_url: doctor.avatar_url ?? null,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingDoctor(null);
  };

  // Allow the Radix dialog to control visibility while resetting form state on close.
  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      closeDialog();
    } else {
      setDialogOpen(true);
    }
  };

  const toArray = (value?: string | null) =>
    value
      ?.split(",")
      .map((item) => item.trim())
      .filter(Boolean) ?? [];

  const onSubmit = (values: DoctorFormValues) => {
    const payload: DoctorPayload = {
      name: values.name.trim(),
      title: values.title.trim(),
      specialization: values.specialization.trim(),
      bio: values.bio?.trim() || undefined,
      experience_years: values.experience_years,
      education: values.education?.trim() || undefined,
      languages: toArray(values.languages_input),
      achievements: toArray(values.achievements_input),
      certifications: toArray(values.certifications_input),
      patient_rating: values.patient_rating,
      total_reviews: values.total_reviews,
      successful_procedures: values.successful_procedures,
      research_publications: values.research_publications,
      is_active: values.is_active ?? true,
      avatar_url: values.avatar_url?.trim()
        ? values.avatar_url.trim()
        : undefined,
    };

    if (editingDoctor) {
      updateDoctor.mutate({ id: editingDoctor.id, data: payload });
    } else {
      createDoctor.mutate(payload);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Doctors</h1>
          <p className="text-sm text-muted-foreground">
            Manage medical experts, clinical experience, and availability for Care N Tour patients.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={openCreateDialog}>
              <PlusCircle className="h-4 w-4" />
              Add Doctor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingDoctor ? "Edit Doctor" : "Add Doctor"}</DialogTitle>
              <DialogDescription>
                Provide credentials and profile details. You can refine the record later with additional data.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <Input placeholder="Dr. Layla Khalil" {...field} />
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
                        <Input placeholder="Chief Ophthalmologist" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="specialization"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specialization</FormLabel>
                        <Input placeholder="Refractive Surgery" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="experience_years"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Experience (years)</FormLabel>
                        <Input
                          type="number"
                          min={0}
                          {...field}
                          onChange={(event) => field.onChange(Number(event.target.value))}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="education"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Education</FormLabel>
                      <Input placeholder="Johns Hopkins Fellowship" {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Biography</FormLabel>
                      <Textarea rows={3} placeholder="Short overview shown on doctor profiles." {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="languages_input"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Languages</FormLabel>
                      <FormDescription>Comma separated list (e.g. English, Arabic).</FormDescription>
                      <Input {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="achievements_input"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Achievements</FormLabel>
                        <FormDescription>Comma separated (e.g. 1,500+ surgeries).</FormDescription>
                        <Input {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="certifications_input"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Certifications</FormLabel>
                        <FormDescription>Comma separated (e.g. Board Certified).</FormDescription>
                        <Input {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="patient_rating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Patient rating</FormLabel>
                        <Input
                          type="number"
                          min={0}
                          max={5}
                          step="0.1"
                          {...field}
                          onChange={(event) => field.onChange(Number(event.target.value))}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="total_reviews"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total reviews</FormLabel>
                        <Input
                          type="number"
                          min={0}
                          {...field}
                          onChange={(event) => field.onChange(Number(event.target.value))}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="successful_procedures"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total procedures</FormLabel>
                        <Input
                          type="number"
                          min={0}
                          {...field}
                          onChange={(event) => field.onChange(Number(event.target.value))}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="research_publications"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Research publications</FormLabel>
                        <Input
                          type="number"
                          min={0}
                          {...field}
                          onChange={(event) => field.onChange(Number(event.target.value))}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        value={(field.value ?? true) ? "active" : "inactive"}
                        onValueChange={(value) => field.onChange(value === "active")}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="avatar_url"
                  render={({ field }) => (
                    <FormItem>
                      <ImageUploader
                        label="Profile photo"
                        description="Upload a square image for best results."
                        value={field.value ?? ""}
                        onChange={(url) => field.onChange(url ?? null)}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={closeDialog}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createDoctor.isPending || updateDoctor.isPending}>
                    {(createDoctor.isPending || updateDoctor.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingDoctor ? "Save changes" : "Create doctor"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </header>

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <span>Doctor directory</span>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                placeholder="Search doctors..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="sm:w-48 lg:w-72"
              />
              <Select value={specializationFilter} onValueChange={setSpecializationFilter}>
                <SelectTrigger className="sm:w-44">
                  <SelectValue placeholder="Filter specialization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {specializations.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {doctorsQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name &amp; Title</TableHead>
                  <TableHead>Specialization</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead className="w-32 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDoctors.map((doctor) => (
                  <TableRow key={doctor.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{doctor.name}</span>
                        <span className="text-xs text-muted-foreground">{doctor.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{doctor.specialization}</Badge>
                    </TableCell>
                    <TableCell>{doctor.experience_years} yrs</TableCell>
                    <TableCell>
                      {typeof doctor.patient_rating === "number"
                        ? `${doctor.patient_rating.toFixed(1)}/5`
                        : "—"}
                    </TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(doctor)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        disabled={deleteDoctor.isPending}
                        onClick={() => deleteDoctor.mutate(doctor.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {filteredDoctors.length === 0 && !doctorsQuery.isLoading && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                      No doctors found. Adjust filters or create a new record.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
