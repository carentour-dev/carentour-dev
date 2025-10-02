import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type HotelRow = Database["public"]["Tables"]["hotels"]["Row"];

interface UseHotelsOptions {
  limit?: number;
}

const fetchHotels = async ({ limit }: UseHotelsOptions): Promise<HotelRow[]> => {
  let query = supabase
    .from("hotels")
    .select("*")
    .eq("is_partner", true)
    .order("star_rating", { ascending: false });

  if (typeof limit === "number") {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  return data ?? [];
};

export const useHotels = (options: UseHotelsOptions = {}) => {
  const {
    data: hotels = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["hotels", options],
    queryFn: () => fetchHotels(options),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return {
    hotels,
    loading,
    error: error instanceof Error ? error.message : null,
  };
};
