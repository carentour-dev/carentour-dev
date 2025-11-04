"use client";

import { useQuery } from "@tanstack/react-query";
import { adminFetch } from "@/components/admin/hooks/useAdminFetch";

export type TeamMember = {
  id: string;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  jobTitle: string | null;
  roles: string[];
};

export const TEAM_MEMBERS_QUERY_KEY = ["admin", "team-members"] as const;

export function useTeamMembers() {
  return useQuery({
    queryKey: TEAM_MEMBERS_QUERY_KEY,
    queryFn: () => adminFetch<TeamMember[]>("/api/admin/team-members"),
    staleTime: 5 * 60 * 1000,
  });
}
