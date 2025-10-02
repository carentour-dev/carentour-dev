import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type TreatmentRow = Database["public"]["Tables"]["treatments"]["Row"];

const fetchTreatments = async (): Promise<TreatmentRow[]> => {
  const { data, error } = await supabase
    .from("treatments")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
};

export const useTreatments = () => {
  const {
    data: treatments = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["treatments"],
    queryFn: fetchTreatments,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return {
    treatments,
    loading,
    error: error instanceof Error ? error.message : null,
  };
};
