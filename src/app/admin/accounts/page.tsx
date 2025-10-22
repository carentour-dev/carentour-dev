"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import {
  adminFetch,
  useAdminInvalidate,
} from "@/components/admin/hooks/useAdminFetch";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUploader } from "@/components/admin/ImageUploader";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Pencil, ShieldPlus, UserPlus2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const createAccountSchema = z.object({
  email: z
    .string({ required_error: "Email is required." })
    .trim()
    .min(1, "Email is required.")
    .email("Enter a valid email address."),
  name: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || value.length >= 2, {
      message: "Name must be at least 2 characters.",
    }),
  roles: z.array(z.string().min(1)).min(1, "Select at least one role."),
});

type CreateAccountValues = z.infer<typeof createAccountSchema>;

const sexOptions = [
  "female",
  "male",
  "non-binary",
  "prefer_not_to_say",
] as const;
type SexOption = (typeof sexOptions)[number];
const sexOptionLabels: Record<SexOption, string> = {
  female: "Female",
  male: "Male",
  "non-binary": "Non-binary",
  prefer_not_to_say: "Prefer not to say",
};
const phoneRegex = /^[+0-9()[\]\s-]{6,}$/;

const staffDetailsSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(120, "Name must be at most 120 characters."),
  avatarUrl: z
    .string()
    .url("Upload a valid image.")
    .max(2048, "Avatar URL is too long.")
    .optional()
    .nullable(),
  dateOfBirth: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date in YYYY-MM-DD format.")
    .refine(
      (value) => {
        const parsed = new Date(value);
        return !Number.isNaN(parsed.getTime());
      },
      { message: "Enter a valid date." },
    ),
  nationality: z
    .string()
    .trim()
    .min(2, "Nationality must be at least 2 characters.")
    .max(120, "Nationality must be at most 120 characters."),
  jobTitle: z
    .string()
    .trim()
    .min(2, "Job title must be at least 2 characters.")
    .max(180, "Job title must be at most 180 characters."),
  phone: z
    .string()
    .trim()
    .min(6, "Phone number must be at least 6 characters.")
    .max(40, "Phone number must be at most 40 characters.")
    .regex(
      phoneRegex,
      "Phone number can only include digits, spaces, parentheses, dashes, or '+'",
    ),
  sex: z.enum(sexOptions, {
    required_error: "Select the option that best matches their HR records.",
  }),
  language: z
    .string()
    .trim()
    .min(2, "Preferred language must be at least 2 characters.")
    .max(80, "Preferred language must be at most 80 characters."),
});

type StaffDetailsValues = z.infer<typeof staffDetailsSchema>;

type RoleRecord = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
};

type TeamAccount = {
  id: string;
  user_id: string;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  nationality: string | null;
  job_title: string | null;
  phone: string | null;
  language: string | null;
  sex: string | null;
  roles: string[];
  primary_role: string | null;
  created_at: string;
  updated_at: string;
};

type AccountsPayload = {
  roles: RoleRecord[];
  accounts: TeamAccount[];
};

export default function AdminAccountsPage() {
  const { toast } = useToast();
  const invalidate = useAdminInvalidate();

  const { data, isLoading, isError, error } = useQuery<AccountsPayload>({
    queryKey: ["admin", "accounts"],
    queryFn: () => adminFetch<AccountsPayload>("/api/admin/accounts"),
    staleTime: 1000 * 30,
  });

  const assignableRoles = useMemo<RoleRecord[]>(() => {
    if (!data?.roles) return [];
    return data.roles
      .filter((role) => role.slug !== "user")
      .sort((a, b) => a.slug.localeCompare(b.slug));
  }, [data?.roles]);

  const [editingAccount, setEditingAccount] = useState<TeamAccount | null>(
    null,
  );

  const form = useForm<CreateAccountValues>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: {
      email: "",
      name: "",
      roles: [],
    },
  });

  const editForm = useForm<StaffDetailsValues>({
    resolver: zodResolver(staffDetailsSchema),
    defaultValues: {
      displayName: "",
      avatarUrl: null,
      dateOfBirth: "",
      nationality: "",
      jobTitle: "",
      phone: "",
      sex: "prefer_not_to_say",
      language: "",
    },
  });

  const resolveSex = useCallback(
    (value: string | null): SexOption =>
      value && sexOptions.includes(value as SexOption)
        ? (value as SexOption)
        : "prefer_not_to_say",
    [],
  );

  const formatDate = (value: string | null): string => {
    if (!value) {
      return "—";
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return parsed.toLocaleDateString();
  };

  useEffect(() => {
    if (editingAccount) {
      editForm.reset({
        displayName: editingAccount.username ?? "",
        avatarUrl: editingAccount.avatar_url ?? null,
        dateOfBirth: editingAccount.date_of_birth ?? "",
        nationality: editingAccount.nationality ?? "",
        jobTitle: editingAccount.job_title ?? "",
        phone: editingAccount.phone ?? "",
        sex: resolveSex(editingAccount.sex),
        language: editingAccount.language ?? "",
      });
    } else {
      editForm.reset({
        displayName: "",
        avatarUrl: null,
        dateOfBirth: "",
        nationality: "",
        jobTitle: "",
        phone: "",
        sex: "prefer_not_to_say",
        language: "",
      });
    }
  }, [editingAccount, editForm, resolveSex]);

  const mutation = useMutation({
    mutationFn: async (values: CreateAccountValues) => {
      const payload = {
        email: values.email.trim().toLowerCase(),
        name: values.name ? values.name.trim() : undefined,
        roles: values.roles.map((role) => role.toLowerCase()),
      };

      return adminFetch<{ account: TeamAccount }>("/api/admin/accounts", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: ({ account }) => {
      toast({
        title: "Invite sent",
        description: `${account.email ?? "The new team member"} now has ${account.roles.join(", ") || "user"} access.`,
      });
      form.reset({ email: "", name: "", roles: [] });
      invalidate(["admin", "accounts"]);
    },
    onError: (mutationError: unknown) => {
      const message =
        mutationError instanceof Error
          ? mutationError.message
          : "Unable to create the account. Please try again.";
      toast({
        title: "Account creation failed",
        description: message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: StaffDetailsValues) => {
      if (!editingAccount) {
        throw new Error("Select a staff account before saving.");
      }

      const payload = {
        displayName: values.displayName.trim(),
        avatarUrl: values.avatarUrl ?? null,
        dateOfBirth: values.dateOfBirth,
        nationality: values.nationality.trim(),
        jobTitle: values.jobTitle.trim(),
        phone: values.phone.trim(),
        sex: values.sex,
        language: values.language.trim(),
      };

      return adminFetch<{ account: TeamAccount }>(
        `/api/admin/accounts/${editingAccount.id}`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        },
      );
    },
    onSuccess: ({ account }) => {
      toast({
        title: "Staff details updated",
        description: `${account.username ?? account.email ?? "Team member"} is now up to date.`,
      });
      setEditingAccount(null);
      invalidate(["admin", "accounts"]);
    },
    onError: (mutationError: unknown) => {
      const message =
        mutationError instanceof Error
          ? mutationError.message
          : "Unable to update the staff profile. Please try again.";
      toast({
        title: "Update failed",
        description: message,
        variant: "destructive",
      });
    },
  });

  const handleEditSubmit = editForm.handleSubmit((values) =>
    updateMutation.mutate(values),
  );
  const isSavingDetails = updateMutation.isPending;

  const accounts = data?.accounts ?? [];

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Team Accounts
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Invite internal staff without registering them as patients. Newly
          created accounts appear in Access where you can refine roles later.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr,1.3fr]">
        <Card className="border-dashed">
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserPlus2 className="h-5 w-5 text-primary" />
              Create team account
            </CardTitle>
            <CardDescription>
              Sends a Supabase invite email so the teammate can set their
              password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((values) =>
                  mutation.mutate(values),
                )}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="team.member@company.com"
                          autoComplete="email"
                        />
                      </FormControl>
                      <FormDescription>
                        This email receives the invitation and becomes their
                        login username.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Optional — e.g. Dr. Amira Lewis"
                        />
                      </FormControl>
                      <FormDescription>
                        Used for internal labeling in the Access console.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="roles"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Roles</FormLabel>
                      <div className="space-y-3 rounded-lg border border-dashed border-border/70 p-4">
                        {assignableRoles.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No staff roles have been configured yet. Create them
                            from the Access page before inviting team members.
                          </p>
                        ) : (
                          assignableRoles.map((role) => {
                            const checked = field.value.includes(role.slug);
                            return (
                              <label
                                key={role.id}
                                className={cn(
                                  "flex items-start gap-3 rounded-md border border-transparent p-2 transition",
                                  checked
                                    ? "border-primary/60 bg-primary/5"
                                    : "hover:border-border/70",
                                )}
                              >
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(value) => {
                                    const isChecked = Boolean(value);
                                    if (isChecked) {
                                      field.onChange([
                                        ...field.value,
                                        role.slug,
                                      ]);
                                    } else {
                                      field.onChange(
                                        field.value.filter(
                                          (item) => item !== role.slug,
                                        ),
                                      );
                                    }
                                  }}
                                />
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="capitalize">
                                      {role.slug.replace(/[-_]/g, " ")}
                                    </span>
                                    <Badge variant="outline">
                                      #{role.name}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {role.description ??
                                      "No description provided."}
                                  </p>
                                </div>
                              </label>
                            );
                          })
                        )}
                      </div>
                      <FormDescription>
                        Every account automatically receives the basic{" "}
                        <strong>user</strong> role; select any additional
                        permissions they need.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={mutation.isPending || assignableRoles.length === 0}
                >
                  {mutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account…
                    </>
                  ) : (
                    "Send invite"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldPlus className="h-5 w-5 text-primary" />
              Existing team members
            </CardTitle>
            <CardDescription>
              Keep team records current by editing personal details directly in
              the table below. Role changes still live inside Access for now.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading accounts…
              </div>
            ) : isError ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-destructive">
                {(error instanceof Error && error.message) ||
                  "Failed to load team accounts."}
              </div>
            ) : accounts.length === 0 ? (
              <div className="rounded-md border border-dashed border-border/60 bg-muted/30 p-6 text-sm text-muted-foreground">
                No team accounts yet. Invites you send will appear here along
                with their assigned roles.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Details
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        Created
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((account) => {
                      const resolvedSex =
                        account.sex &&
                        sexOptions.includes(account.sex as SexOption)
                          ? sexOptionLabels[account.sex as SexOption]
                          : (account.sex ?? "—");
                      const displayName =
                        account.username ?? account.email ?? "Team member";
                      const initials =
                        displayName
                          .split(/\s+/)
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((part) => part.charAt(0).toUpperCase())
                          .join("") || "ST";

                      return (
                        <TableRow key={account.id}>
                          <TableCell className="min-w-[200px] font-medium">
                            <div className="flex items-start gap-3">
                              <Avatar className="mt-1 h-10 w-10 border border-border/60">
                                <AvatarImage
                                  src={account.avatar_url ?? undefined}
                                  alt={displayName}
                                />
                                <AvatarFallback>{initials}</AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span>{account.username ?? "—"}</span>
                                <span className="text-xs text-muted-foreground">
                                  {account.job_title ?? "—"}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{account.email ?? "—"}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {account.roles.map((role) => (
                                <Badge
                                  key={role}
                                  variant="outline"
                                  className="capitalize"
                                >
                                  {role.replace(/[-_]/g, " ")}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="hidden align-top text-sm text-muted-foreground lg:table-cell">
                            <div className="flex flex-col gap-1">
                              <span>
                                <span className="font-medium text-foreground">
                                  DOB:
                                </span>{" "}
                                {formatDate(account.date_of_birth)}
                              </span>
                              <span>
                                <span className="font-medium text-foreground">
                                  Nationality:
                                </span>{" "}
                                {account.nationality ?? "—"}
                              </span>
                              <span>
                                <span className="font-medium text-foreground">
                                  Language:
                                </span>{" "}
                                {account.language ?? "—"}
                              </span>
                              <span>
                                <span className="font-medium text-foreground">
                                  Phone:
                                </span>{" "}
                                {account.phone ?? "—"}
                              </span>
                              <span>
                                <span className="font-medium text-foreground">
                                  Sex:
                                </span>{" "}
                                {resolvedSex}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                            {new Date(account.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingAccount(account)}
                              disabled={isSavingDetails}
                            >
                              <Pencil className="mr-1 h-4 w-4" />
                              Edit details
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        <Dialog
          open={Boolean(editingAccount)}
          onOpenChange={(open) => {
            if (!open) {
              setEditingAccount(null);
            }
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit staff details</DialogTitle>
              <DialogDescription>
                Update the personal information captured during onboarding.
                These changes sync to the Supabase profile and future invites.
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={handleEditSubmit} className="space-y-6">
                <div className="grid gap-4">
                  <FormField
                    control={editForm.control}
                    name="avatarUrl"
                    render={({ field }) => (
                      <FormItem>
                        <ImageUploader
                          label="Profile photo"
                          description="PNG or JPG up to 5MB"
                          value={field.value ?? null}
                          onChange={(url) => field.onChange(url ?? null)}
                          bucket="media"
                          folder={
                            editingAccount?.user_id
                              ? `staff/${editingAccount.user_id}`
                              : "staff"
                          }
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g. Dr. Amira Lewis"
                            disabled={isSavingDetails}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={editForm.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of birth</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="date"
                              disabled={isSavingDetails}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone number</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="tel"
                              placeholder="e.g. +20 10 1234 5678"
                              disabled={isSavingDetails}
                            />
                          </FormControl>
                          <FormDescription>
                            Used internally for urgent coordination only.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={editForm.control}
                      name="nationality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nationality</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="e.g. Egyptian"
                              disabled={isSavingDetails}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred language</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="e.g. English, Arabic"
                              disabled={isSavingDetails}
                            />
                          </FormControl>
                          <FormDescription>
                            Helps match staff to patient language needs.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={editForm.control}
                    name="jobTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job title</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g. Patient Coordinator"
                            disabled={isSavingDetails}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="sex"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sex</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isSavingDetails}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an option" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {sexOptions.map((option) => (
                              <SelectItem key={option} value={option}>
                                {sexOptionLabels[option]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Stored securely for HR and roster planning.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter className="gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingAccount(null)}
                    disabled={isSavingDetails}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSavingDetails}>
                    {isSavingDetails ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      "Save changes"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
