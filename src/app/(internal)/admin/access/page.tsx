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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Plus, Search, Settings2, Shield } from "lucide-react";
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
  name: string | null;
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

const normalizeRoleSlug = (value: string): string => {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
};

const PROTECTED_ROLE_SLUGS = new Set(["user", "admin"]);
const sortUnique = (values: string[]) =>
  Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));

export default function AccessManagementPage() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [data, setData] = useState<AccessPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilters, setRoleFilters] = useState<string[]>([]);
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
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createRoleSaving, setCreateRoleSaving] = useState(false);
  const [createRoleName, setCreateRoleName] = useState("");
  const [createRoleSlug, setCreateRoleSlug] = useState("");
  const [createRoleDescription, setCreateRoleDescription] = useState("");
  const [createRolePermissions, setCreateRolePermissions] = useState<string[]>(
    [],
  );
  const [createRoleSuperuser, setCreateRoleSuperuser] = useState(false);
  const [createPermissionSearch, setCreatePermissionSearch] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [rolePendingDeletion, setRolePendingDeletion] =
    useState<RoleRecord | null>(null);
  const [deletingRole, setDeletingRole] = useState(false);

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

  useEffect(() => {
    if (slugManuallyEdited) {
      return;
    }
    const nextSlug = normalizeRoleSlug(createRoleName);
    setCreateRoleSlug(nextSlug);
  }, [createRoleName, slugManuallyEdited]);

  const filteredUsers = useMemo(() => {
    if (!data?.users) {
      return [];
    }

    const query = search.trim().toLowerCase();

    return data.users.filter((user) => {
      const roles = user.roles.length ? user.roles : ["user"];
      const matchesSearch =
        !query ||
        user.username?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        roles.some((role) => role.toLowerCase().includes(query));

      const matchesRole =
        !roleFilters.length || roleFilters.some((role) => roles.includes(role));

      return matchesSearch && matchesRole;
    });
  }, [data?.users, roleFilters, search]);

  const availablePermissions = useMemo(() => {
    if (!data) {
      return [];
    }

    const map = new Map<string, PermissionRecord>();

    for (const permission of data.permissions ?? []) {
      if (!permission?.slug) {
        continue;
      }
      map.set(permission.slug, permission);
    }

    for (const role of data.roles ?? []) {
      for (const permission of role.permissions ?? []) {
        if (!permission?.slug) {
          continue;
        }
        if (!map.has(permission.slug)) {
          map.set(permission.slug, {
            id: permission.id ?? permission.slug,
            slug: permission.slug,
            name: permission.name ?? permission.slug,
            description: permission.description ?? null,
          });
        }
      }
    }

    return Array.from(map.values()).sort((a, b) =>
      (a.slug ?? "").localeCompare(b.slug ?? ""),
    );
  }, [data]);

  const rolePermissionMap = useMemo(() => {
    const mapping = new Map<string, Set<string>>();
    if (!data?.roles?.length) {
      return mapping;
    }
    for (const role of data.roles) {
      if (!role?.slug) {
        continue;
      }
      const permissions = new Set<string>();
      if (role.is_superuser) {
        permissions.add("admin.access");
      }
      for (const permission of role.permissions ?? []) {
        if (permission?.slug) {
          permissions.add(permission.slug);
        }
      }
      mapping.set(role.slug, permissions);
    }
    return mapping;
  }, [data?.roles]);

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

  const createDialogPermissions = useMemo(() => {
    if (!availablePermissions.length) {
      return [];
    }
    if (!createPermissionSearch.trim()) {
      return availablePermissions;
    }
    const query = createPermissionSearch.toLowerCase();
    return availablePermissions.filter((permission) => {
      const description = permission.description ?? "";
      return (
        permission.slug.toLowerCase().includes(query) ||
        (permission.name ?? "").toLowerCase().includes(query) ||
        description.toLowerCase().includes(query)
      );
    });
  }, [availablePermissions, createPermissionSearch]);

  const roleOptions = useMemo(() => {
    const entries = new Map<string, { slug: string; name: string }>();

    for (const role of data?.roles ?? []) {
      if (!role?.slug) {
        continue;
      }
      const label = role.name?.trim().length ? role.name.trim() : role.slug;
      entries.set(role.slug, { slug: role.slug, name: label });
    }

    if (!entries.has("user")) {
      entries.set("user", { slug: "user", name: "User" });
    }

    return Array.from(entries.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [data?.roles]);

  useEffect(() => {
    if (!roleOptions.length) {
      setRoleFilters([]);
      return;
    }
    setRoleFilters((current) => {
      const next = current.filter((role) =>
        roleOptions.some((option) => option.slug === role),
      );
      return next.length === current.length ? current : next;
    });
  }, [roleOptions]);

  const selectedRoleNames = useMemo(() => {
    if (!roleFilters.length) {
      return [];
    }
    return roleOptions
      .filter((option) => roleFilters.includes(option.slug))
      .map((option) => option.name);
  }, [roleFilters, roleOptions]);

  const roleFilterLabel = selectedRoleNames.length
    ? selectedRoleNames.length === 1
      ? selectedRoleNames[0]
      : `${selectedRoleNames.length} roles`
    : "All roles";

  const initialUserRoles = useMemo(() => {
    if (!selectedUser) return [];
    const roles = selectedUser.roles.includes("user")
      ? selectedUser.roles
      : [...selectedUser.roles, "user"];
    return sortUnique(roles);
  }, [selectedUser]);

  const hasUnsavedRoleChanges = useMemo(() => {
    if (!selectedUser) return false;
    const current = sortUnique(selectedRoles);
    if (current.length !== initialUserRoles.length) {
      return true;
    }
    return current.some((role, index) => role !== initialUserRoles[index]);
  }, [initialUserRoles, selectedRoles, selectedUser]);

  const hasUnsavedCreateRoleChanges = useMemo(
    () =>
      Boolean(createRoleName.trim()) ||
      Boolean(createRoleSlug.trim()) ||
      Boolean(createRoleDescription.trim()) ||
      createRolePermissions.length > 0 ||
      createRoleSuperuser,
    [
      createRoleDescription,
      createRoleName,
      createRolePermissions.length,
      createRoleSlug,
      createRoleSuperuser,
    ],
  );

  const initialRolePermissions = useMemo(
    () =>
      sortUnique(
        selectedRoleRecord?.permissions?.map((permission) => permission.slug) ??
          [],
      ),
    [selectedRoleRecord],
  );

  const hasUnsavedRolePermissionChanges = useMemo(() => {
    const current = sortUnique(selectedRolePermissions);
    if (current.length !== initialRolePermissions.length) {
      return true;
    }
    return current.some(
      (permission, index) => permission !== initialRolePermissions[index],
    );
  }, [initialRolePermissions, selectedRolePermissions]);

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

  const attemptCloseEditor = () => {
    if (
      !hasUnsavedRoleChanges ||
      window.confirm("Discard unsaved role changes?")
    ) {
      closeEditor();
    }
  };

  const roleGrantsAdminAccess = (role: string) => {
    if (!role) {
      return false;
    }
    if (role === "admin") {
      return true;
    }
    return rolePermissionMap.get(role)?.has("admin.access") ?? false;
  };

  const toggleRole = (role: string, checked: boolean) => {
    setSelectedRoles((current) => {
      const normalized = new Set(current);

      if (checked) {
        normalized.add(role);
        return Array.from(normalized);
      }

      normalized.delete(role);

      const nextRoles = Array.from(normalized);
      const editingSelf =
        selectedUser?.user_id && currentUser?.id
          ? selectedUser.user_id === currentUser.id
          : false;

      if (
        editingSelf &&
        !nextRoles.some((candidate) => roleGrantsAdminAccess(candidate))
      ) {
        toast({
          title: "Admin access required",
          description:
            "You must keep at least one role that grants admin console access.",
          variant: "destructive",
        });
        return current;
      }

      return nextRoles;
    });
  };

  const resetCreateRoleForm = () => {
    setCreateRoleName("");
    setCreateRoleSlug("");
    setCreateRoleDescription("");
    setCreateRolePermissions([]);
    setCreateRoleSuperuser(false);
    setCreatePermissionSearch("");
    setSlugManuallyEdited(false);
  };

  const openCreateRoleDialog = () => {
    resetCreateRoleForm();
    setCreateRoleSaving(false);
    setCreateDialogOpen(true);
  };

  const closeCreateRoleDialog = () => {
    setCreateDialogOpen(false);
    setCreateRoleSaving(false);
    resetCreateRoleForm();
  };

  const attemptCloseCreateRoleDialog = () => {
    if (
      !hasUnsavedCreateRoleChanges ||
      window.confirm("Discard new role draft?")
    ) {
      closeCreateRoleDialog();
    }
  };

  const toggleCreateRolePermission = (
    permissionSlug: string,
    enabled: boolean,
  ) => {
    if (!permissionSlug) {
      return;
    }
    setCreateRolePermissions((current) => {
      const normalized = new Set(current);
      if (enabled) {
        normalized.add(permissionSlug);
      } else {
        normalized.delete(permissionSlug);
      }
      return Array.from(normalized);
    });
  };

  const handleSuperuserToggle = (enabled: boolean) => {
    setCreateRoleSuperuser(enabled);
    if (enabled) {
      setCreateRolePermissions([]);
    }
  };

  const isCreateRoleValid = useMemo(() => {
    const nameValid = createRoleName.trim().length >= 2;
    const slugValid = normalizeRoleSlug(createRoleSlug).length > 0;
    return nameValid && slugValid;
  }, [createRoleName, createRoleSlug]);

  const handleCreateRole = async () => {
    if (!isCreateRoleValid) {
      toast({
        title: "Review new role details",
        description: "Provide a name and slug before creating the role.",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreateRoleSaving(true);
      const authHeaders = await getAuthHeaders();
      const trimmedName = createRoleName.trim();
      const normalizedSlug = normalizeRoleSlug(createRoleSlug);
      const descriptionValue = createRoleDescription.trim();
      const requestedPermissions = createRoleSuperuser
        ? []
        : Array.from(new Set(createRolePermissions));

      const response = await fetch("/api/admin/roles", {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          slug: normalizedSlug,
          description: descriptionValue.length ? descriptionValue : undefined,
          is_superuser: createRoleSuperuser,
          permissions: requestedPermissions,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error ?? "Failed to create role.");
      }

      const payload = (await response.json()) as { role: RoleRecord };

      setData((current) => {
        if (!current) {
          return current;
        }
        const nextRoles = [...current.roles, payload.role].sort((a, b) =>
          a.slug.localeCompare(b.slug),
        );
        return {
          ...current,
          roles: nextRoles,
        };
      });

      toast({
        title: "Role created",
        description: `${payload.role.name} is now available for assignments.`,
      });

      closeCreateRoleDialog();
    } catch (createError: any) {
      console.error(createError);
      toast({
        title: "Unable to create role",
        description:
          createError?.message ??
          "Something went wrong while creating the role.",
        variant: "destructive",
      });
    } finally {
      setCreateRoleSaving(false);
    }
  };

  const openDeleteRoleDialog = (role: RoleRecord) => {
    setRolePendingDeletion(role);
  };

  const closeDeleteRoleDialog = () => {
    if (deletingRole) {
      return;
    }
    setRolePendingDeletion(null);
  };

  const handleDeleteRole = async () => {
    const roleToDelete = rolePendingDeletion;
    if (!roleToDelete) {
      return;
    }

    try {
      setDeletingRole(true);
      const authHeaders = await getAuthHeaders();
      const response = await fetch(
        `/api/admin/roles?id=${encodeURIComponent(roleToDelete.id)}`,
        {
          method: "DELETE",
          headers: authHeaders,
        },
      );

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.error ?? "Failed to delete role.");
      }

      setData((current) => {
        if (!current) {
          return current;
        }

        const filteredRoles = current.roles.filter(
          (role) => role.id !== roleToDelete.id,
        );

        const updatedUsers = current.users.map((user) => {
          if (!user.roles.includes(roleToDelete.slug)) {
            return user;
          }
          const updatedRoles = user.roles.filter(
            (roleSlug) => roleSlug !== roleToDelete.slug,
          );
          return {
            ...user,
            roles: updatedRoles,
          };
        });

        return {
          ...current,
          roles: filteredRoles,
          users: updatedUsers,
        };
      });

      setSelectedRoles((current) =>
        current.filter((roleSlug) => roleSlug !== roleToDelete.slug),
      );

      if (selectedRoleRecord?.id === roleToDelete.id) {
        closeRolePermissionEditor();
      }

      toast({
        title: "Role deleted",
        description: `${roleToDelete.name ?? roleToDelete.slug} has been removed.`,
      });
    } catch (deleteError: any) {
      console.error(deleteError);
      toast({
        title: "Unable to delete role",
        description: deleteError?.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingRole(false);
      setRolePendingDeletion(null);
    }
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

  const attemptCloseRolePermissionEditor = () => {
    if (
      !hasUnsavedRolePermissionChanges ||
      window.confirm("Discard unsaved permission changes?")
    ) {
      closeRolePermissionEditor();
    }
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
    const hasAdminRole = roles.includes("admin");
    const hasAdminPermission = roles.some((role) =>
      rolePermissionMap.get(role)?.has("admin.access"),
    );
    return (
      <div className="flex flex-wrap gap-1">
        {roles.map((role) => (
          <Badge key={role} variant="outline" className="capitalize">
            {role.replace(/[-_]/g, " ")}
          </Badge>
        ))}
        {hasAdminPermission && !hasAdminRole ? (
          <Badge variant="secondary" className="capitalize">
            admin access
          </Badge>
        ) : null}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Access Management
          </h1>
          <p className="text-sm text-muted-foreground">
            Assign roles and fine-tune permissions for your team. Admins retain
            full access.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={openCreateRoleDialog}
            className="gap-2"
            disabled={createDialogOpen || createRoleSaving}
          >
            <Plus className="h-4 w-4" />
            New role
          </Button>
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full gap-2 text-left transition-colors md:w-auto"
            >
              <Settings2 className="h-4 w-4" />
              <span className="truncate">{roleFilterLabel}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Filter by role</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={roleFilters.length === 0}
              onCheckedChange={(checked) => {
                if (checked === true) {
                  setRoleFilters([]);
                }
              }}
            >
              All roles
            </DropdownMenuCheckboxItem>
            {roleOptions.length ? (
              <>
                <DropdownMenuSeparator />
                {roleOptions.map((role) => (
                  <DropdownMenuCheckboxItem
                    key={role.slug}
                    checked={roleFilters.includes(role.slug)}
                    onCheckedChange={(checked) => {
                      setRoleFilters((current) => {
                        if (checked === true) {
                          if (current.includes(role.slug)) {
                            return current;
                          }
                          return [...current, role.slug];
                        }
                        return current.filter(
                          (roleSlug) => roleSlug !== role.slug,
                        );
                      });
                    }}
                    className="capitalize"
                  >
                    {role.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
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
                      <DialogContent
                        className="max-w-lg"
                        unsaved={
                          hasUnsavedRoleChanges && selectedUser?.id === user.id
                        }
                      >
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
                            onClick={attemptCloseEditor}
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
                  <div className="flex items-center gap-2">
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
                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-1"
                      disabled={
                        PROTECTED_ROLE_SLUGS.has(role.slug) ||
                        deletingRole ||
                        Boolean(rolePendingDeletion)
                      }
                      onClick={() => openDeleteRoleDialog(role)}
                    >
                      Delete
                    </Button>
                  </div>
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
        open={createDialogOpen}
        onOpenChange={(open) => {
          if (!open && createDialogOpen) {
            if (createRoleSaving) {
              return;
            }
            closeCreateRoleDialog();
          }
        }}
      >
        <DialogContent
          className="max-w-xl"
          unsaved={hasUnsavedCreateRoleChanges}
        >
          <DialogHeader>
            <DialogTitle>Create role</DialogTitle>
            <DialogDescription>
              Define a new role and choose which permissions it grants.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Role name
              </label>
              <Input
                value={createRoleName}
                onChange={(event) => setCreateRoleName(event.target.value)}
                placeholder="Operations coordinator"
                autoFocus
                disabled={createRoleSaving}
              />
              <p className="text-xs text-muted-foreground">
                Appears throughout the admin console.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Role slug
              </label>
              <Input
                value={createRoleSlug}
                onChange={(event) => {
                  const raw = event.target.value;
                  if (!raw.trim()) {
                    setSlugManuallyEdited(false);
                    setCreateRoleSlug("");
                    return;
                  }
                  setSlugManuallyEdited(true);
                  setCreateRoleSlug(normalizeRoleSlug(raw));
                }}
                placeholder="operations-coordinator"
                disabled={createRoleSaving}
              />
              <p className="text-xs text-muted-foreground">
                Lowercase identifier used internally. Letters, numbers, and
                hyphens only.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Description (optional)
              </label>
              <Textarea
                value={createRoleDescription}
                onChange={(event) =>
                  setCreateRoleDescription(event.target.value)
                }
                placeholder="Explain what this role can access."
                disabled={createRoleSaving}
              />
            </div>

            <div className="flex items-start justify-between gap-3 rounded-lg border border-border/60 bg-muted/10 p-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Superuser access
                </p>
                <p className="text-xs text-muted-foreground">
                  Superusers inherit every permission automatically.
                </p>
              </div>
              <Switch
                checked={createRoleSuperuser}
                onCheckedChange={handleSuperuserToggle}
                disabled={createRoleSaving}
              />
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Permissions
                </p>
                <p className="text-xs text-muted-foreground">
                  {createRoleSuperuser
                    ? "Superuser roles grant every permission automatically."
                    : "Select the permissions this role should grant by default."}
                </p>
              </div>
              {!createRoleSuperuser && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={createPermissionSearch}
                    onChange={(event) =>
                      setCreatePermissionSearch(event.target.value)
                    }
                    placeholder="Search permissions"
                    className="pl-9"
                    disabled={createRoleSaving}
                  />
                </div>
              )}
              {createRoleSuperuser ? null : (
                <div className="max-h-[24rem] overflow-y-auto rounded-md border border-border/60">
                  <div className="space-y-2 p-3">
                    {createDialogPermissions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {availablePermissions.length === 0
                          ? "No permissions have been configured yet."
                          : "No permissions match your search."}
                      </p>
                    ) : (
                      createDialogPermissions.map((permission) => {
                        const checked = createRolePermissions.includes(
                          permission.slug,
                        );
                        return (
                          <label
                            key={permission.id}
                            className="flex items-start gap-3 rounded-md border border-transparent p-2 transition hover:border-border/70"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(value) =>
                                toggleCreateRolePermission(
                                  permission.slug,
                                  Boolean(value),
                                )
                              }
                              disabled={createRoleSaving}
                            />
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-foreground">
                                  {permission.name ?? permission.slug}
                                </span>
                                <Badge variant="outline">
                                  {permission.slug}
                                </Badge>
                              </div>
                              {permission.description ? (
                                <p className="text-xs text-muted-foreground">
                                  {permission.description}
                                </p>
                              ) : null}
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
              {createRoleSuperuser ? (
                <div className="rounded-md border border-dashed border-border/60 bg-muted/10 p-3 text-xs text-muted-foreground">
                  Superuser roles do not require manual permission selection.
                </div>
              ) : null}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={attemptCloseCreateRoleDialog}
              disabled={createRoleSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateRole}
              disabled={createRoleSaving || !isCreateRoleValid}
              className="gap-2"
            >
              {createRoleSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create role"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(rolePendingDeletion)}
        onOpenChange={(open) => {
          if (!open) {
            closeDeleteRoleDialog();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete role</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the{" "}
              <strong>
                {rolePendingDeletion?.name ??
                  rolePendingDeletion?.slug ??
                  "selected"}
              </strong>{" "}
              role and unassign it from all team members. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingRole}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRole}
              disabled={deletingRole}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingRole ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete role"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={roleDialogOpen}
        onOpenChange={(open) => !open && closeRolePermissionEditor()}
      >
        <DialogContent
          className="max-w-xl"
          unsaved={hasUnsavedRolePermissionChanges}
        >
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
              onClick={attemptCloseRolePermissionEditor}
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
