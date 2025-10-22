"use client";

import { useMemo } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, ShieldPlus, UserPlus2 } from "lucide-react";
import { cn } from "@/lib/utils";

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

  const form = useForm<CreateAccountValues>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: {
      email: "",
      name: "",
      roles: [],
    },
  });

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
              Staff accounts can also be edited from Access for advanced role
              management.
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
                      <TableHead className="hidden md:table-cell">
                        Created
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">
                          {account.username ?? "—"}
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
                        <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                          {new Date(account.created_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
