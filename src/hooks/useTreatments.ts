import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { normalizeTreatment, type NormalizedTreatment } from "@/lib/treatments";

type TreatmentRow = Database["public"]["Tables"]["treatments"]["Row"];
type TreatmentProceduresRow =
  Database["public"]["Tables"]["treatment_procedures"]["Row"];

type SupabaseTreatment = TreatmentRow & {
  treatment_procedures: TreatmentProceduresRow[];
};

const fetchTreatments = async (): Promise<NormalizedTreatment[]> => {
  const { data, error } = await supabase
    .from("treatments")
    .select("*, treatment_procedures:treatment_procedures(*)")
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as SupabaseTreatment[];
  return rows.map((row) =>
    normalizeTreatment(row, row.treatment_procedures ?? []),
  );
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
