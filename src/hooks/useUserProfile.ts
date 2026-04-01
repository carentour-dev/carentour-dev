import { useState, useEffect, useMemo, useCallback, useRef } from "react";

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
  job_title: string | null;
  language: string | null;
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
  const userId = user?.id ?? null;
  const [profileState, setProfileState] = useState<ProfileState | null>(null);
  const [loading, setLoading] = useState(true);
  const inFlightUserIdRef = useRef<string | null>(null);
  const hydratedUserIdRef = useRef<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (userId && inFlightUserIdRef.current === userId) {
      return;
    }

    if (!userId) {
      inFlightUserIdRef.current = null;
      hydratedUserIdRef.current = null;
      setProfileState(null);
      setLoading(false);
      return;
    }

    inFlightUserIdRef.current = userId;
    const isFirstHydrationForUser = hydratedUserIdRef.current !== userId;
    if (isFirstHydrationForUser) {
      setLoading(true);
    }
    try {
      const profilePromise = Promise.all([
        supabase
          .from("profiles")
          .select(
            "username, avatar_url, date_of_birth, sex, nationality, phone, job_title, language",
          )
          .eq("user_id", userId)
          .maybeSingle(),
        supabase.rpc("current_user_roles"),
        supabase.rpc("current_user_permissions"),
      ]);
      const timeoutPromise = new Promise<never>((_, reject) => {
        window.setTimeout(
          () => reject(new Error("PROFILE_FETCH_TIMEOUT")),
          3000,
        );
      });
      const [profileResult, rolesResult, permissionsResult] =
        await Promise.race([profilePromise, timeoutPromise]);

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

      // Sync auth metadata to profile if fields are missing
      const profile = profileResult.data;
      const hasIncompleteProfile =
        profile &&
        (!profile.date_of_birth ||
          !profile.sex ||
          !profile.nationality ||
          !profile.phone);

      if (hasIncompleteProfile && user.user_metadata) {
        const metadata = user.user_metadata;
        const updatePayload: Record<string, string | null> = {};

        if (!profile.date_of_birth && metadata.date_of_birth) {
          updatePayload.date_of_birth = metadata.date_of_birth;
        }
        if (!profile.sex && metadata.sex) {
          updatePayload.sex = metadata.sex;
        }
        if (!profile.nationality && metadata.nationality) {
          updatePayload.nationality = metadata.nationality;
        }
        if (!profile.phone && metadata.phone) {
          updatePayload.phone = metadata.phone;
        }

        if (Object.keys(updatePayload).length > 0) {
          const { error: updateError } = await supabase
            .from("profiles")
            .update(updatePayload)
            .eq("user_id", userId);

          if (updateError) {
            console.error("Error syncing metadata to profile:", updateError);
          } else {
            // Merge the updated fields back into profile data
            Object.assign(profile, updatePayload);
          }
        }
      }

      const rawRoles = normalizeRoles(
        Array.isArray(rolesResult.data) ? rolesResult.data : [],
      );
      const roles = rawRoles.length ? rawRoles : ["user"];
      const permissions = Array.isArray(permissionsResult.data)
        ? Array.from(
            new Set(
              permissionsResult.data
                .map((entry) =>
                  typeof entry === "string" ? entry.trim().toLowerCase() : "",
                )
                .filter((entry) => entry.length > 0),
            ),
          )
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
        job_title: profileResult.data?.job_title ?? null,
        language: profileResult.data?.language ?? null,
        roles,
        primaryRole: pickPrimaryRole(roles),
        permissions,
        displayName,
        initials,
      });
      hydratedUserIdRef.current = userId;
    } catch (error) {
      if (
        !(error instanceof Error && error.message === "PROFILE_FETCH_TIMEOUT")
      ) {
        console.error("Error in useUserProfile:", error);
      }
      setProfileState(null);
    } finally {
      if (inFlightUserIdRef.current === userId) {
        inFlightUserIdRef.current = null;
      }
      setLoading(false);
    }
  }, [user, userId]);

  useEffect(() => {
    // Keep authenticated users in loading state until their first profile fetch settles.
    if (userId && hydratedUserIdRef.current !== userId) {
      setLoading(true);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const profile = useMemo<UserProfile | null>(() => {
    if (!profileState) {
      return null;
    }

    const { roles, permissions } = profileState;
    const hasAdminAccess =
      roles.includes("admin") || permissions.includes("admin.access");

    return {
      ...profileState,
      hasRole: (role: RoleSlug) => hasRole(roles, role),
      hasAnyRole: (allowed: RoleSlug[]) => hasAnyRole(roles, allowed),
      hasPermission: (permission: string) =>
        hasAdminAccess || permissions.includes(permission),
    };
  }, [profileState]);

  return { profile, loading, refresh: fetchProfile };
};
