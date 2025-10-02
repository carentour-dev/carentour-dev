"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminFetch, useAdminInvalidate } from "@/components/admin/hooks/useAdminFetch";
import { Loader2, Pencil, PlusCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const optionalUuid = z.preprocess(
  (value) => {
    if (typeof value === "string" && value.trim() === "") {
      return null;
    }
    return value;
  },
  z.string().uuid().nullable().optional(),
);

const patientSchema = z.object({
  user_id: optionalUuid,
  full_name: z.string().min(2),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().optional(),
  nationality: z.string().optional(),
  preferred_language: z.string().optional(),
  preferred_currency: z.string().optional(),
  date_of_birth: z
    .string()
    .regex(/^(\d{4})-(\d{2})-(\d{2})$/)
    .optional(),
  sex: z.enum(["female", "male", "non_binary", "prefer_not_to_say"]).optional(),
  notes: z.string().optional(),
});

type PatientFormValues = z.infer<typeof patientSchema>;

type PatientPayload = {
  user_id?: string | null;
  full_name: string;
  contact_email?: string | null;
  contact_phone?: string | null;
  nationality?: string | null;
  preferred_language?: string | null;
  preferred_currency?: string | null;
  date_of_birth?: string | null;
  sex?: "female" | "male" | "non_binary" | "prefer_not_to_say" | null;
  notes?: string | null;
};

type PatientRecord = PatientPayload & {
  id: string;
  created_at?: string;
  updated_at?: string;
};

const QUERY_KEY = ["admin", "patients"] as const;

export default function AdminPatientsPage() {
  const [search, setSearch] = useState("");
  const [nationalityFilter, setNationalityFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<PatientRecord | null>(null);
  const invalidate = useAdminInvalidate();
  const { toast } = useToast();

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      user_id: "",
      full_name: "",
      contact_email: "",
      contact_phone: "",
      nationality: "",
      preferred_language: "",
      preferred_currency: "",
      date_of_birth: "",
      sex: undefined,
      notes: "",
    },
  });

  const patientsQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => adminFetch<PatientRecord[]>("/api/admin/patients"),
  });

  const createPatient = useMutation({
    mutationFn: (payload: PatientPayload) =>
      adminFetch<PatientRecord>("/api/admin/patients", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (_patient, payload) => {
      invalidate(QUERY_KEY);
      closeDialog();
      toast({
        title: "Patient added",
        description: `${payload?.full_name ?? "Patient"} has been captured.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add patient",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePatient = useMutation({
    mutationFn: ({ id, data }: { id: string; data: PatientPayload }) =>
      adminFetch<PatientRecord>(`/api/admin/patients/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (patient) => {
      invalidate(QUERY_KEY);
      closeDialog();
      toast({
        title: "Patient updated",
        description: `${patient.full_name} has been updated.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update patient",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deletePatient = useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/api/admin/patients/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      invalidate(QUERY_KEY);
      toast({
        title: "Patient removed",
        description: "The patient record has been deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete patient",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const nationalities = useMemo(() => {
    if (!patientsQuery.data) return [] as string[];
    return Array.from(
      new Set(
        patientsQuery.data
          .map((patient) => patient.nationality?.trim())
          .filter((nation): nation is string => Boolean(nation)),
      ),
    ).sort();
  }, [patientsQuery.data]);

  const filteredPatients = useMemo(() => {
    if (!patientsQuery.data) return [] as PatientRecord[];

    return patientsQuery.data.filter((patient) => {
      const query = search.toLowerCase();
      const matchesSearch =
        [patient.full_name, patient.contact_email, patient.contact_phone]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesNationality =
        nationalityFilter === "all" ||
        (patient.nationality ?? "").toLowerCase() === nationalityFilter.toLowerCase();

      return matchesSearch && matchesNationality;
    });
  }, [patientsQuery.data, search, nationalityFilter]);

  const openCreateDialog = () => {
    setEditingPatient(null);
    form.reset({
      user_id: "",
      full_name: "",
      contact_email: "",
      contact_phone: "",
      nationality: "",
      preferred_language: "",
      preferred_currency: "",
      date_of_birth: "",
      sex: undefined,
      notes: "",
    });
    setDialogOpen(true);
  };

  const openEditDialog = (patient: PatientRecord) => {
    setEditingPatient(patient);
    form.reset({
      user_id: patient.user_id ?? "",
      full_name: patient.full_name,
      contact_email: patient.contact_email ?? "",
      contact_phone: patient.contact_phone ?? "",
      nationality: patient.nationality ?? "",
      preferred_language: patient.preferred_language ?? "",
      preferred_currency: patient.preferred_currency ?? "",
      date_of_birth: patient.date_of_birth ?? "",
      sex: patient.sex ?? undefined,
      notes: patient.notes ?? "",
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingPatient(null);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      closeDialog();
    } else {
      setDialogOpen(true);
    }
  };

  const onSubmit = (values: PatientFormValues) => {
    const payload: PatientPayload = {
      user_id: values.user_id?.trim() ? values.user_id.trim() : null,
      full_name: values.full_name.trim(),
      contact_email: values.contact_email?.trim() || null,
      contact_phone: values.contact_phone?.trim() || null,
      nationality: values.nationality?.trim() || null,
      preferred_language: values.preferred_language?.trim() || null,
      preferred_currency: values.preferred_currency?.trim() || null,
      date_of_birth: values.date_of_birth || null,
      sex: values.sex ?? null,
      notes: values.notes?.trim() || null,
    };

    if (editingPatient) {
      updatePatient.mutate({ id: editingPatient.id, data: payload });
    } else {
      createPatient.mutate(payload);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Patients</h1>
          <p className="text-sm text-muted-foreground">
            Maintain traveler records, emergency contacts, and preferences to streamline concierge coordination.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={openCreateDialog}>
              <PlusCircle className="h-4 w-4" />
              Add Patient
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingPatient ? "Edit Patient" : "Add Patient"}</DialogTitle>
              <DialogDescription>
                Capture patient contact details and notes. Link to an existing Supabase user if applicable.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full name</FormLabel>
                        <Input placeholder="Jane Doe" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="date_of_birth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of birth</FormLabel>
                        <Input type="date" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="contact_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <Input placeholder="patient@email.com" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <Input placeholder="+1 555 0100" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="nationality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nationality</FormLabel>
                        <Input placeholder="United States" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="preferred_language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred language</FormLabel>
                        <Input placeholder="English" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="preferred_currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred currency</FormLabel>
                        <Input placeholder="USD" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sex"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sex (optional)</FormLabel>
                        <Select
                          value={field.value ?? "unspecified"}
                          onValueChange={(value) => field.onChange(value === "unspecified" ? undefined : value)}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="unspecified">Not specified</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="non_binary">Non-binary</SelectItem>
                            <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="user_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supabase user ID</FormLabel>
                        <Input placeholder="Optional user UUID" {...field} />
                        <FormDescription>Link to an existing auth user if available.</FormDescription>
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
                      <FormLabel>Coordinator notes</FormLabel>
                      <Textarea rows={3} placeholder="Special considerations, dietary needs, etc." {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={closeDialog}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createPatient.isPending || updatePatient.isPending}>
                    {(createPatient.isPending || updatePatient.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingPatient ? "Save changes" : "Create patient"}
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
            <span>Patient directory</span>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                placeholder="Search patients..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="sm:w-48 lg:w-72"
              />
              <Select value={nationalityFilter} onValueChange={setNationalityFilter}>
                <SelectTrigger className="sm:w-44">
                  <SelectValue placeholder="Filter nationality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {nationalities.map((nation) => (
                    <SelectItem key={nation} value={nation}>
                      {nation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {patientsQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Nationality</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead className="w-32 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{patient.full_name}</span>
                        {patient.date_of_birth ? (
                          <span className="text-xs text-muted-foreground">DOB: {patient.date_of_birth}</span>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <span>{patient.contact_email || "—"}</span>
                        <span className="text-muted-foreground">{patient.contact_phone || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell>{patient.nationality || "—"}</TableCell>
                    <TableCell>{patient.preferred_language || "—"}</TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(patient)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        disabled={deletePatient.isPending}
                        onClick={() => deletePatient.mutate(patient.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {filteredPatients.length === 0 && !patientsQuery.isLoading && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                      No patients found. Adjust filters or add a new record.
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
