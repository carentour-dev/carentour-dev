"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
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
import { Badge } from "@/components/ui/badge";
import { ImageUploader } from "@/components/admin/ImageUploader";
import {
  adminFetch,
  useAdminInvalidate,
} from "@/components/admin/hooks/useAdminFetch";
import { Loader2, Pencil, PlusCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const hotelSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional(),
  star_rating: z.coerce.number().int().min(1).max(5),
  nightly_rate: z.coerce.number().min(0).optional(),
  currency: z.string().optional(),
  distance_to_facility_km: z.coerce.number().min(0).optional(),
  address_line1: z.string().optional(),
  address_city: z.string().optional(),
  address_country: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email().optional(),
  website: z.string().url().optional(),
  amenities_input: z.string().optional(),
  medical_services_input: z.string().optional(),
  is_partner: z.boolean().optional(),
  rating: z.coerce.number().min(0).max(5).optional(),
  review_count: z.coerce.number().int().min(0).optional(),
  hero_image: z.string().url().nullable().optional(),
});

type HotelFormValues = z.infer<typeof hotelSchema>;

type HotelPayload = {
  name: string;
  slug: string;
  description?: string | null;
  star_rating: number;
  nightly_rate?: number | null;
  currency?: string | null;
  distance_to_facility_km?: number | null;
  address?: Record<string, unknown> | null;
  contact_info?: Record<string, unknown> | null;
  amenities?: string[];
  medical_services?: string[];
  images?: Record<string, unknown> | null;
  is_partner?: boolean;
  rating?: number | null;
  review_count?: number | null;
};

type HotelRecord = HotelPayload & {
  id: string;
  amenities?: string[] | null;
  medical_services?: string[] | null;
};

const QUERY_KEY = ["admin", "hotels"] as const;

const csvToArray = (value?: string | null) =>
  value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean) ?? [];

export default function AdminHotelsPage() {
  const [search, setSearch] = useState("");
  const [partnerFilter, setPartnerFilter] = useState("all");
  const [starFilter, setStarFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState<HotelRecord | null>(null);
  const invalidate = useAdminInvalidate();
  const { toast } = useToast();

  const form = useForm<HotelFormValues>({
    resolver: zodResolver(hotelSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      star_rating: 4,
      nightly_rate: undefined,
      currency: "USD",
      distance_to_facility_km: undefined,
      address_line1: "",
      address_city: "",
      address_country: "",
      contact_phone: "",
      contact_email: "",
      website: "",
      amenities_input: "",
      medical_services_input: "",
      is_partner: true,
      rating: undefined,
      review_count: undefined,
      hero_image: null,
    },
  });

  const hotelsQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => adminFetch<HotelRecord[]>("/api/admin/hotels"),
  });

  const createHotel = useMutation({
    mutationFn: (payload: HotelPayload) =>
      adminFetch<HotelRecord>("/api/admin/hotels", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (_hotel, payload) => {
      invalidate(QUERY_KEY);
      closeDialog();
      toast({
        title: "Hotel added",
        description: `${payload?.name ?? "Hotel"} has been created.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add hotel",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateHotel = useMutation({
    mutationFn: ({ id, data }: { id: string; data: HotelPayload }) =>
      adminFetch<HotelRecord>(`/api/admin/hotels/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (hotel) => {
      invalidate(QUERY_KEY);
      closeDialog();
      toast({
        title: "Hotel updated",
        description: `${hotel.name} has been updated.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update hotel",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteHotel = useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/api/admin/hotels/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      invalidate(QUERY_KEY);
      toast({
        title: "Hotel removed",
        description: "The hotel has been deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete hotel",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredHotels = useMemo(() => {
    if (!hotelsQuery.data) return [] as HotelRecord[];

    return hotelsQuery.data.filter((hotel) => {
      const matchesSearch = [hotel.name, hotel.slug]
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesStar =
        starFilter === "all" || hotel.star_rating === Number(starFilter);

      const matchesPartner =
        partnerFilter === "all" ||
        (partnerFilter === "partner"
          ? hotel.is_partner !== false
          : hotel.is_partner === false);

      return matchesSearch && matchesStar && matchesPartner;
    });
  }, [hotelsQuery.data, search, starFilter, partnerFilter]);

  const openCreateDialog = () => {
    setEditingHotel(null);
    form.reset({
      name: "",
      slug: "",
      description: "",
      star_rating: 4,
      nightly_rate: undefined,
      currency: "USD",
      distance_to_facility_km: undefined,
      address_line1: "",
      address_city: "",
      address_country: "",
      contact_phone: "",
      contact_email: "",
      website: "",
      amenities_input: "",
      medical_services_input: "",
      is_partner: true,
      rating: undefined,
      review_count: undefined,
      hero_image: null,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (hotel: HotelRecord) => {
    setEditingHotel(hotel);
    const address = (hotel.address ?? {}) as Record<string, unknown>;
    const contact = (hotel.contact_info ?? {}) as Record<string, unknown>;

    form.reset({
      name: hotel.name,
      slug: hotel.slug,
      description: (hotel.description as string) ?? "",
      star_rating: hotel.star_rating,
      nightly_rate: hotel.nightly_rate ?? undefined,
      currency: hotel.currency ?? "",
      distance_to_facility_km: hotel.distance_to_facility_km ?? undefined,
      address_line1: (address["street"] as string) ?? "",
      address_city: (address["city"] as string) ?? "",
      address_country: (address["country"] as string) ?? "",
      contact_phone: (contact["phone"] as string) ?? "",
      contact_email: (contact["email"] as string) ?? "",
      website: (contact["website"] as string) ?? "",
      amenities_input: (hotel.amenities ?? []).join(", "),
      medical_services_input: (hotel.medical_services ?? []).join(", "),
      is_partner: hotel.is_partner ?? true,
      rating: hotel.rating ?? undefined,
      review_count: hotel.review_count ?? undefined,
      hero_image:
        hotel.images && typeof hotel.images === "object"
          ? (((hotel.images as Record<string, unknown>)["hero"] as
              | string
              | undefined) ?? null)
          : null,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingHotel(null);
  };

  const hasUnsavedChanges = form.formState.isDirty;

  const attemptCloseDialog = () => {
    if (!hasUnsavedChanges || window.confirm("Discard unsaved changes?")) {
      closeDialog();
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      closeDialog();
    } else {
      setDialogOpen(true);
    }
  };

  const onSubmit = (values: HotelFormValues) => {
    const payload: HotelPayload = {
      name: values.name.trim(),
      slug: values.slug.trim(),
      description: values.description?.trim() || null,
      star_rating: values.star_rating,
      nightly_rate: values.nightly_rate ?? null,
      currency: values.currency?.trim() || null,
      distance_to_facility_km: values.distance_to_facility_km ?? null,
      address:
        values.address_line1 || values.address_city || values.address_country
          ? {
              street: values.address_line1?.trim() || null,
              city: values.address_city?.trim() || null,
              country: values.address_country?.trim() || null,
            }
          : null,
      contact_info:
        values.contact_phone || values.contact_email || values.website
          ? {
              phone: values.contact_phone?.trim() || null,
              email: values.contact_email?.trim() || null,
              website: values.website?.trim() || null,
            }
          : null,
      amenities: csvToArray(values.amenities_input),
      medical_services: csvToArray(values.medical_services_input),
      is_partner: values.is_partner ?? true,
      rating: values.rating ?? null,
      review_count: values.review_count ?? null,
      images: values.hero_image ? { hero: values.hero_image } : null,
    };

    if (editingHotel) {
      updateHotel.mutate({ id: editingHotel.id, data: payload });
    } else {
      createHotel.mutate(payload);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Hotels
          </h1>
          <p className="text-sm text-muted-foreground">
            Curate recovery-friendly accommodations with concierge amenities and
            medical-grade services.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={openCreateDialog}>
              <PlusCircle className="h-4 w-4" />
              Add Hotel
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl" unsaved={hasUnsavedChanges}>
            <DialogHeader>
              <DialogTitle>
                {editingHotel ? "Edit Hotel" : "Add Hotel"}
              </DialogTitle>
              <DialogDescription>
                Maintain accommodation details to pair patients with the right
                recovery environment.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                className="grid gap-4"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <Input
                          placeholder="Nile View Recovery Suites"
                          {...field}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug</FormLabel>
                        <Input placeholder="nile-view-recovery" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <Textarea
                        rows={3}
                        placeholder="Highlight recovery amenities and services."
                        {...field}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="star_rating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Star rating</FormLabel>
                        <Input
                          type="number"
                          min={1}
                          max={5}
                          {...field}
                          onChange={(event) =>
                            field.onChange(Number(event.target.value))
                          }
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nightly_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nightly rate</FormLabel>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          {...field}
                          onChange={(event) =>
                            field.onChange(Number(event.target.value))
                          }
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Input placeholder="USD" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="distance_to_facility_km"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Distance to service provider (km)</FormLabel>
                        <Input
                          type="number"
                          min={0}
                          step="0.1"
                          {...field}
                          onChange={(event) =>
                            field.onChange(Number(event.target.value))
                          }
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="rating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Guest rating</FormLabel>
                        <Input
                          type="number"
                          min={0}
                          max={5}
                          step="0.1"
                          {...field}
                          onChange={(event) =>
                            field.onChange(Number(event.target.value))
                          }
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="review_count"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Review count</FormLabel>
                        <Input
                          type="number"
                          min={0}
                          {...field}
                          onChange={(event) =>
                            field.onChange(Number(event.target.value))
                          }
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="address_line1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street / district</FormLabel>
                        <Input placeholder="Nile Corniche" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address_city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <Input placeholder="Cairo" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address_country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <Input placeholder="Egypt" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="contact_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <Input placeholder="+20 100 1234567" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <Input
                          placeholder="reservations@hotel.com"
                          {...field}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <Input placeholder="https://hotel.com" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="amenities_input"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amenities</FormLabel>
                        <FormDescription>
                          Comma separated list (Spa, Airport shuttle, ...).
                        </FormDescription>
                        <Input {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="medical_services_input"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Medical services</FormLabel>
                        <FormDescription>
                          Comma separated (Nurse on-call, Accessible rooms,
                          ...).
                        </FormDescription>
                        <Input {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="hero_image"
                  render={({ field }) => (
                    <FormItem>
                      <ImageUploader
                        label="Hero image"
                        description="Primary hotel photo for listings."
                        value={field.value ?? ""}
                        onChange={(url) => field.onChange(url ?? null)}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_partner"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Partner status</FormLabel>
                      <Select
                        value={(field.value ?? true) ? "partner" : "hidden"}
                        onValueChange={(value) =>
                          field.onChange(value === "partner")
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="partner">Partner</SelectItem>
                          <SelectItem value="hidden">Hidden</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={attemptCloseDialog}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createHotel.isPending || updateHotel.isPending}
                  >
                    {(createHotel.isPending || updateHotel.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingHotel ? "Save changes" : "Create hotel"}
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
            <span>Recovery accommodations</span>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                placeholder="Search hotels..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="sm:w-48 lg:w-72"
              />
              <Select value={starFilter} onValueChange={setStarFilter}>
                <SelectTrigger className="sm:w-36">
                  <SelectValue placeholder="Star rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {[5, 4, 3, 2, 1].map((star) => (
                    <SelectItem key={star} value={String(star)}>
                      {star}-star
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={partnerFilter} onValueChange={setPartnerFilter}>
                <SelectTrigger className="sm:w-36">
                  <SelectValue placeholder="Partner status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="partner">Partner</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hotelsQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Stars</TableHead>
                  <TableHead>Nightly rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHotels.map((hotel) => (
                  <TableRow key={hotel.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {hotel.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {hotel.slug}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{hotel.star_rating}-star</Badge>
                    </TableCell>
                    <TableCell>
                      {typeof hotel.nightly_rate === "number"
                        ? `${hotel.nightly_rate.toLocaleString()} ${hotel.currency ?? "USD"}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          hotel.is_partner === false ? "outline" : "default"
                        }
                      >
                        {hotel.is_partner === false ? "Hidden" : "Partner"}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(hotel)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        disabled={deleteHotel.isPending}
                        onClick={() => deleteHotel.mutate(hotel.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {filteredHotels.length === 0 && !hotelsQuery.isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No hotels found. Adjust filters or add a new hotel.
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
