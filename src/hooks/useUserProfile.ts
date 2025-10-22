import { useState, useEffect, useMemo, useCallback } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  normalizeRoles,
  pickPrimaryRole,
  RoleSlug,
  hasAnyRole,
  hasRole,
} from "@/lib/auth/roles";

type ProfileState = {
  username: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  sex: string | null;
  nationality: string | null;
  phone: string | null;
  roles: RoleSlug[];
  primaryRole: RoleSlug | null;
  permissions: string[];
  displayName: string;
  initials: string;
};

export type UserProfile = ProfileState & {
  hasRole: (role: RoleSlug) => boolean;
  hasAnyRole: (roles: RoleSlug[]) => boolean;
  hasPermission: (permission: string) => boolean;
};

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profileState, setProfileState] = useState<ProfileState | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user?.id) {
      setProfileState(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [profileResult, rolesResult, permissionsResult] = await Promise.all(
        [
          supabase
            .from("profiles")
            .select(
              "username, avatar_url, date_of_birth, sex, nationality, phone",
            )
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase.rpc("current_user_roles"),
          supabase.rpc("current_user_permissions"),
        ],
      );

      if (profileResult.error && profileResult.error.code !== "PGRST116") {
        console.error("Error fetching profile:", profileResult.error);
        setProfileState(null);
        return;
      }

      if (rolesResult.error) {
        console.error("Error fetching roles:", rolesResult.error);
        setProfileState(null);
        return;
      }

      if (permissionsResult.error) {
        console.error("Error fetching permissions:", permissionsResult.error);
      }

      const rawRoles = normalizeRoles(
        Array.isArray(rolesResult.data) ? rolesResult.data : [],
      );
      const roles = rawRoles.length ? rawRoles : ["user"];
      const permissions = Array.isArray(permissionsResult.data)
        ? Array.from(new Set(permissionsResult.data))
        : [];

      const username =
        profileResult.data?.username || user.user_metadata?.username;
      const displayName = username || "User";
      const initials = displayName.charAt(0).toUpperCase();

      setProfileState({
        username: profileResult.data?.username || null,
        avatar_url: profileResult.data?.avatar_url || null,
        date_of_birth: profileResult.data?.date_of_birth ?? null,
        sex: profileResult.data?.sex ?? null,
        nationality: profileResult.data?.nationality ?? null,
        phone: profileResult.data?.phone ?? null,
        roles,
        primaryRole: pickPrimaryRole(roles),
        permissions,
        displayName,
        initials,
      });
    } catch (error) {
      console.error("Error in useUserProfile:", error);
      setProfileState(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.user_metadata?.username]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const profile = useMemo<UserProfile | null>(() => {
    if (!profileState) {
      return null;
    }

    const { roles, permissions } = profileState;

    return {
      ...profileState,
      hasRole: (role: RoleSlug) => hasRole(roles, role),
      hasAnyRole: (allowed: RoleSlug[]) => hasAnyRole(roles, allowed),
      hasPermission: (permission: string) => permissions.includes(permission),
    };
  }, [profileState]);

  return { profile, loading, refresh: fetchProfile };
};
