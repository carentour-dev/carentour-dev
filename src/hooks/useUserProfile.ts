import { useState, useEffect, useMemo, useCallback, useRef } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
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

type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export const useUserProfile = () => {
  const { user, workspaceAccess } = useAuth();
  const userId = user?.id ?? null;
  const [profileState, setProfileState] = useState<ProfileState | null>(null);
  const [loading, setLoading] = useState(true);
  const inFlightUserIdRef = useRef<string | null>(null);
  const hydratedUserIdRef = useRef<string | null>(null);
  const resolvedAccessRoles = useMemo(
    () =>
      workspaceAccess.userId === userId
        ? normalizeRoles(workspaceAccess.roles)
        : [],
    [userId, workspaceAccess.roles, workspaceAccess.userId],
  );
  const resolvedAccessPermissions = useMemo(
    () =>
      workspaceAccess.userId === userId ? workspaceAccess.permissions : [],
    [userId, workspaceAccess.permissions, workspaceAccess.userId],
  );
  const hasResolvedAccess =
    workspaceAccess.userId === userId && workspaceAccess.resolved;

  const buildAccessBackedProfileState = useCallback(
    (requestedUser: typeof user): ProfileState | null => {
      if (!requestedUser?.id || !hasResolvedAccess) {
        return null;
      }

      const username =
        typeof requestedUser.user_metadata?.username === "string"
          ? requestedUser.user_metadata.username.trim()
          : "";
      const displayName =
        username || requestedUser.email?.split("@")[0]?.trim() || "User";
      const roles = resolvedAccessRoles.length ? resolvedAccessRoles : ["user"];

      return {
        username: username || null,
        avatar_url: null,
        date_of_birth:
          typeof requestedUser.user_metadata?.date_of_birth === "string"
            ? requestedUser.user_metadata.date_of_birth
            : null,
        sex:
          typeof requestedUser.user_metadata?.sex === "string"
            ? requestedUser.user_metadata.sex
            : null,
        nationality:
          typeof requestedUser.user_metadata?.nationality === "string"
            ? requestedUser.user_metadata.nationality
            : null,
        phone:
          typeof requestedUser.user_metadata?.phone === "string"
            ? requestedUser.user_metadata.phone
            : null,
        job_title: null,
        language: null,
        roles,
        primaryRole: pickPrimaryRole(roles),
        permissions: resolvedAccessPermissions,
        displayName,
        initials: displayName.charAt(0).toUpperCase(),
      };
    },
    [hasResolvedAccess, resolvedAccessPermissions, resolvedAccessRoles],
  );

  const fetchProfile = useCallback(async () => {
    const requestedUser = user;
    const requestedUserId = requestedUser?.id ?? null;
    const isActiveRequest = () => inFlightUserIdRef.current === requestedUserId;
    const accessBackedProfile = buildAccessBackedProfileState(requestedUser);

    if (requestedUserId && inFlightUserIdRef.current === requestedUserId) {
      return;
    }

    if (!requestedUserId) {
      inFlightUserIdRef.current = null;
      hydratedUserIdRef.current = null;
      setProfileState(null);
      setLoading(false);
      return;
    }

    inFlightUserIdRef.current = requestedUserId;
    const isFirstHydrationForUser =
      hydratedUserIdRef.current !== requestedUserId;
    if (isFirstHydrationForUser) {
      setLoading(true);
    }

    if (accessBackedProfile) {
      setProfileState((current) => {
        if (!current || hydratedUserIdRef.current !== requestedUserId) {
          return accessBackedProfile;
        }

        return {
          ...current,
          roles: accessBackedProfile.roles,
          primaryRole: accessBackedProfile.primaryRole,
          permissions: accessBackedProfile.permissions,
          displayName: current.displayName || accessBackedProfile.displayName,
          initials: current.initials || accessBackedProfile.initials,
        };
      });
    }

    try {
      const profilePromise = (async () => {
        const profileResult = await supabase
          .from("profiles")
          .select(
            "username, avatar_url, date_of_birth, sex, nationality, phone, job_title, language",
          )
          .eq("user_id", requestedUserId)
          .maybeSingle();

        if (hasResolvedAccess) {
          return {
            profileResult,
            rolesResult: {
              data: resolvedAccessRoles,
              error: null,
            },
            permissionsResult: {
              data: resolvedAccessPermissions,
              error: null,
            },
          };
        }

        const [rolesResult, permissionsResult] = await Promise.all([
          supabase.rpc("current_user_roles"),
          supabase.rpc("current_user_permissions"),
        ]);

        return { profileResult, rolesResult, permissionsResult };
      })();
      const timeoutPromise = new Promise<never>((_, reject) => {
        window.setTimeout(
          () => reject(new Error("PROFILE_FETCH_TIMEOUT")),
          3000,
        );
      });
      const { profileResult, rolesResult, permissionsResult } =
        await Promise.race([profilePromise, timeoutPromise]);

      if (!isActiveRequest()) {
        return;
      }

      if (profileResult.error && profileResult.error.code !== "PGRST116") {
        console.error("Error fetching profile:", profileResult.error);
        setProfileState(accessBackedProfile);
        return;
      }

      if (rolesResult.error) {
        console.error("Error fetching roles:", rolesResult.error);
        setProfileState(accessBackedProfile);
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

      if (hasIncompleteProfile && requestedUser?.user_metadata) {
        const metadata = requestedUser.user_metadata;
        const updatePayload: ProfileUpdate = {};

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
            .eq("user_id", requestedUserId);

          if (!isActiveRequest()) {
            return;
          }

          if (updateError) {
            console.error("Error syncing metadata to profile:", updateError);
          } else {
            // Merge the updated fields back into profile data
            Object.assign(profile, updatePayload);
          }
        }
      }

      const rawRoles = hasResolvedAccess
        ? resolvedAccessRoles
        : normalizeRoles(
            Array.isArray(rolesResult.data) ? rolesResult.data : [],
          );
      const roles = rawRoles.length ? rawRoles : ["user"];
      const permissions: string[] = hasResolvedAccess
        ? resolvedAccessPermissions
        : Array.isArray(permissionsResult.data)
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
        profileResult.data?.username || requestedUser?.user_metadata?.username;
      const displayName =
        username || requestedUser?.email?.split("@")[0] || "User";
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
      hydratedUserIdRef.current = requestedUserId;
    } catch (error) {
      if (!isActiveRequest()) {
        return;
      }
      if (
        !(error instanceof Error && error.message === "PROFILE_FETCH_TIMEOUT")
      ) {
        console.error("Error in useUserProfile:", error);
      }
      setProfileState(accessBackedProfile);
    } finally {
      if (inFlightUserIdRef.current === requestedUserId) {
        inFlightUserIdRef.current = null;
        setLoading(false);
      }
    }
  }, [
    buildAccessBackedProfileState,
    hasResolvedAccess,
    resolvedAccessPermissions,
    resolvedAccessRoles,
    user,
  ]);

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
