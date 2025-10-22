"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Settings2, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type RoleRecord = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  is_superuser: boolean;
  permissions: PermissionRecord[];
};

type PermissionRecord = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
};

type UserRecord = {
  id: string;
  user_id: string;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
  roles: string[];
  created_at: string;
  updated_at: string;
};

type AccessPayload = {
  roles: RoleRecord[];
  permissions: PermissionRecord[];
  users: UserRecord[];
};

export default function AccessManagementPage() {
  const { toast } = useToast();
  const [data, setData] = useState<AccessPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedRoleRecord, setSelectedRoleRecord] =
    useState<RoleRecord | null>(null);
  const [selectedRolePermissions, setSelectedRolePermissions] = useState<
    string[]
  >([]);
  const [permissionSearch, setPermissionSearch] = useState("");
  const [savingPermissions, setSavingPermissions] = useState(false);

  const getAuthHeaders = async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session?.access_token) {
      throw new Error("Missing or expired session. Please sign in again.");
    }

    return {
      Authorization: `Bearer ${session.access_token}`,
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const authHeaders = await getAuthHeaders();
        const response = await fetch("/api/admin/roles", {
          headers: authHeaders,
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body?.error ?? "Failed to load role assignments");
        }
        const payload = (await response.json()) as AccessPayload;
        setData(payload);
        setError(null);
      } catch (fetchError: any) {
        console.error(fetchError);
        setError(fetchError?.message ?? "Unable to load access configuration.");
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredUsers = useMemo(() => {
    if (!data?.users) {
      return [];
    }
    if (!search.trim()) {
      return data.users;
    }
    const query = search.toLowerCase();
    return data.users.filter((user) => {
      return (
        user.username?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.roles.some((role) => role.toLowerCase().includes(query))
      );
    });
  }, [data?.users, search]);

  const availablePermissions = useMemo(
    () => data?.permissions ?? [],
    [data?.permissions],
  );

  const filteredPermissions = useMemo(() => {
    if (!availablePermissions.length) {
      return [];
    }
    if (!permissionSearch.trim()) {
      return availablePermissions;
    }
    const query = permissionSearch.toLowerCase();
    return availablePermissions.filter((permission) => {
      const description = permission.description ?? "";
      return (
        permission.slug.toLowerCase().includes(query) ||
        permission.name.toLowerCase().includes(query) ||
        description.toLowerCase().includes(query)
      );
    });
  }, [availablePermissions, permissionSearch]);

  const openEditor = (user: UserRecord) => {
    const roles = user.roles.includes("user")
      ? user.roles
      : [...user.roles, "user"];
    setSelectedUser(user);
    setSelectedRoles(roles);
    setDialogOpen(true);
  };

  const closeEditor = () => {
    setDialogOpen(false);
    setSelectedUser(null);
    setSelectedRoles([]);
  };

  const toggleRole = (role: string, checked: boolean) => {
    setSelectedRoles((current) => {
      const normalized = new Set(current);
      if (checked) {
        normalized.add(role);
      } else {
        normalized.delete(role);
      }
      return Array.from(normalized);
    });
  };

  const handleSave = async () => {
    if (!selectedUser) {
      return;
    }

    setSaving(true);
    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch(`/api/admin/roles/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roles: selectedRoles }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error ?? "Failed to update roles");
      }

      const payload = (await response.json()) as { roles: string[] };

      setData((current) => {
        if (!current) {
          return current;
        }
        return {
          ...current,
          users: current.users.map((user) =>
            user.id === selectedUser.id
              ? { ...user, roles: payload.roles }
              : user,
          ),
        };
      });

      toast({
        title: "Roles updated",
        description: `${selectedUser.username ?? selectedUser.email ?? "User"} now has ${payload.roles.join(", ")}.`,
      });

      closeEditor();
    } catch (saveError: any) {
      console.error(saveError);
      toast({
        title: "Unable to update roles",
        description: saveError?.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const openRolePermissionEditor = (role: RoleRecord) => {
    setSelectedRoleRecord(role);
    setSelectedRolePermissions(
      role.permissions?.map((permission) => permission.slug) ?? [],
    );
    setPermissionSearch("");
    setRoleDialogOpen(true);
  };

  const closeRolePermissionEditor = () => {
    setRoleDialogOpen(false);
    setSelectedRoleRecord(null);
    setSelectedRolePermissions([]);
    setPermissionSearch("");
  };

  const toggleRolePermission = (permissionSlug: string, enabled: boolean) => {
    if (!permissionSlug) {
      return;
    }
    setSelectedRolePermissions((current) => {
      if (enabled) {
        if (current.includes(permissionSlug)) {
          return current;
        }
        return [...current, permissionSlug];
      }
      return current.filter((slug) => slug !== permissionSlug);
    });
  };

  const handleRolePermissionSave = async () => {
    if (!selectedRoleRecord) {
      return;
    }

    try {
      setSavingPermissions(true);
      const authHeaders = await getAuthHeaders();
      const permissions = Array.from(new Set(selectedRolePermissions)).sort(
        (a, b) => a.localeCompare(b),
      );

      const response = await fetch(
        `/api/admin/roles/${selectedRoleRecord.id}/permissions`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders,
          },
          body: JSON.stringify({ permissions }),
        },
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error ?? "Unable to update role permissions");
      }

      const body = (await response.json()) as { role: RoleRecord };

      setData((current) => {
        if (!current) {
          return current;
        }
        return {
          ...current,
          roles: current.roles.map((role) =>
            role.id === body.role.id ? body.role : role,
          ),
        };
      });

      toast({
        title: "Permissions updated",
        description: `${body.role.name ?? body.role.slug} now has ${body.role.permissions.length} permission${body.role.permissions.length === 1 ? "" : "s"}.`,
      });

      closeRolePermissionEditor();
    } catch (saveError: any) {
      console.error(saveError);
      toast({
        title: "Unable to update role permissions",
        description: saveError?.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingPermissions(false);
    }
  };

  const renderRoles = (roles: string[]) => {
    if (!roles.length) {
      return <Badge variant="outline">user</Badge>;
    }
    return (
      <div className="flex flex-wrap gap-1">
        {roles.map((role) => (
          <Badge key={role} variant="outline" className="capitalize">
            {role.replace(/[-_]/g, " ")}
          </Badge>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Access Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Assign roles and fine-tune permissions for your team. Admins retain
            full access.
          </p>
        </div>
      </header>

      <section className="flex items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email, or role"
            className="pl-9"
          />
        </div>
      </section>

      {loading ? (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading access configuration…
        </div>
      ) : error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-destructive">
          {error}
        </div>
      ) : (
        <div className="rounded-xl border border-border/70 bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead className="hidden md:table-cell">Updated</TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.username ?? "—"}
                  </TableCell>
                  <TableCell>{user.email ?? "—"}</TableCell>
                  <TableCell>{renderRoles(user.roles)}</TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                    {new Date(
                      user.updated_at ?? user.created_at,
                    ).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog
                      open={dialogOpen && selectedUser?.id === user.id}
                      onOpenChange={(open) =>
                        open ? openEditor(user) : closeEditor()
                      }
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1">
                          <Shield className="h-4 w-4" />
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Assign roles</DialogTitle>
                          <DialogDescription>
                            Configure which parts of the platform{" "}
                            {user.username ?? user.email ?? "this user"} can
                            access.
                          </DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="max-h-64 pr-3">
                          <div className="space-y-3 py-4">
                            {data?.roles.map((role) => {
                              const checked = selectedRoles.includes(role.slug);
                              const isUserRole = role.slug === "user";
                              return (
                                <label
                                  key={role.id}
                                  className="flex items-start gap-3 rounded-lg border border-border/60 p-3"
                                >
                                  <Checkbox
                                    checked={checked || isUserRole}
                                    onCheckedChange={(value) =>
                                      toggleRole(role.slug, Boolean(value))
                                    }
                                    disabled={isUserRole}
                                  />
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium capitalize">
                                        {role.slug.replace(/[-_]/g, " ")}
                                      </span>
                                      {role.is_superuser ? (
                                        <Badge
                                          variant="secondary"
                                          className="text-xs"
                                        >
                                          full access
                                        </Badge>
                                      ) : null}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {role.description ??
                                        "No description provided."}
                                    </p>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </ScrollArea>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={closeEditor}
                            disabled={saving}
                          >
                            Cancel
                          </Button>
                          <Button onClick={handleSave} disabled={saving}>
                            {saving ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving
                              </>
                            ) : (
                              "Save"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <section className="rounded-xl border border-border/70 bg-muted/30 p-6">
        <h2 className="text-lg font-semibold">Permission reference</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Review each role to see the permissions it grants. Roles combine
          permissions so you can apply consistent access patterns.
        </p>
        <div className="space-y-4">
          {data?.roles?.map((role) => {
            const readableRole = role.name ?? role.slug.replace(/[-_]/g, " ");
            const permissions = role.permissions ?? [];
            return (
              <div
                key={role.id}
                className="rounded-lg border border-border/60 bg-background p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold capitalize">
                      {readableRole}
                    </span>
                    <Badge
                      variant="outline"
                      className="uppercase tracking-wide"
                    >
                      {role.slug}
                    </Badge>
                    {role.is_superuser ? (
                      <Badge variant="secondary" className="text-xs uppercase">
                        full access
                      </Badge>
                    ) : null}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    disabled={role.is_superuser}
                    onClick={() => openRolePermissionEditor(role)}
                  >
                    <Settings2 className="h-4 w-4" />
                    Edit
                  </Button>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {role.description ?? "No description provided."}
                </p>
                <div className="mt-4 space-y-3">
                  {role.is_superuser ? (
                    <div className="rounded-md border border-border/50 bg-muted/20 p-3 text-sm text-muted-foreground">
                      This role inherits every permission in the system.
                    </div>
                  ) : permissions.length ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      {permissions.map((permission) => {
                        const permissionKey = permission.id ?? permission.slug;
                        return (
                          <div
                            key={`${role.id}-${permissionKey}`}
                            className="rounded-md border border-border/60 bg-card/50 p-3"
                          >
                            <span className="font-medium">
                              {permission.slug}
                            </span>
                            <p className="pt-1 text-sm text-muted-foreground">
                              {permission.description ??
                                "No description provided."}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-md border border-dashed border-border/50 bg-muted/20 p-3 text-sm text-muted-foreground">
                      No permissions assigned yet.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {!data?.roles?.length ? (
            <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
              No roles have been configured yet.
            </div>
          ) : null}
        </div>
      </section>

      <Dialog
        open={roleDialogOpen}
        onOpenChange={(open) => !open && closeRolePermissionEditor()}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit role permissions</DialogTitle>
            <DialogDescription>
              Select which permissions this role grants. Changes apply
              immediately after saving.
            </DialogDescription>
          </DialogHeader>
          {selectedRoleRecord ? (
            <div className="space-y-4">
              <div className="rounded-md border border-border/60 bg-muted/20 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold capitalize">
                    {selectedRoleRecord.name ??
                      selectedRoleRecord.slug.replace(/[-_]/g, " ")}
                  </span>
                  <Badge variant="outline" className="uppercase tracking-wide">
                    {selectedRoleRecord.slug}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedRoleRecord.description ?? "No description provided."}
                </p>
              </div>
              <div className="space-y-3">
                <Input
                  placeholder="Search permissions…"
                  value={permissionSearch}
                  onChange={(event) => setPermissionSearch(event.target.value)}
                />
                <div
                  className="pr-3"
                  style={{
                    maxHeight: "clamp(0px, 60vh, 24rem)",
                    overflowY: "auto",
                  }}
                >
                  <div className="space-y-3 py-1">
                    {filteredPermissions.length ? (
                      filteredPermissions.map((permission) => {
                        const checked = selectedRolePermissions.includes(
                          permission.slug,
                        );
                        return (
                          <label
                            key={permission.id}
                            className="flex items-start gap-3 rounded-lg border border-border/60 bg-card/50 p-3"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(value) =>
                                toggleRolePermission(
                                  permission.slug,
                                  Boolean(value),
                                )
                              }
                            />
                            <div className="space-y-1">
                              <span className="font-medium">
                                {permission.slug}
                              </span>
                              <p className="text-sm text-muted-foreground">
                                {permission.description ??
                                  "No description provided."}
                              </p>
                            </div>
                          </label>
                        );
                      })
                    ) : availablePermissions.length ? (
                      <div className="rounded-md border border-dashed border-border/50 bg-muted/20 p-3 text-sm text-muted-foreground">
                        No permissions match your search.
                      </div>
                    ) : (
                      <div className="rounded-md border border-dashed border-border/50 bg-muted/20 p-3 text-sm text-muted-foreground">
                        No permissions have been created yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
              Select a role to begin editing its permissions.
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeRolePermissionEditor}
              disabled={savingPermissions}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRolePermissionSave}
              disabled={savingPermissions || !selectedRoleRecord}
            >
              {savingPermissions ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
