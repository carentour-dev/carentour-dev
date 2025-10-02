import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type FacilityRow = Database["public"]["Tables"]["facilities"]["Row"];

interface UseFacilitiesOptions {
  limit?: number;
}

const fetchFacilities = async ({ limit }: UseFacilitiesOptions): Promise<FacilityRow[]> => {
  let query = supabase
    .from("facilities")
    .select("*")
    .eq("is_partner", true)
    .order("rating", { ascending: false });

  if (typeof limit === "number") {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
};

export const useFacilities = (options: UseFacilitiesOptions = {}) => {
  const {
    data: facilities = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["facilities", options],
    queryFn: () => fetchFacilities(options),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return {
    facilities,
    loading,
    error: error instanceof Error ? error.message : null,
  };
};
