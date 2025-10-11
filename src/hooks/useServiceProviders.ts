import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ServiceProviderRow = Database["public"]["Tables"]["service_providers"]["Row"];

interface UseServiceProvidersOptions {
  limit?: number;
}

const fetchServiceProviders = async ({
  limit,
}: UseServiceProvidersOptions): Promise<ServiceProviderRow[]> => {
  let query = supabase
    .from("service_providers")
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

export const useServiceProviders = (options: UseServiceProvidersOptions = {}) => {
  const {
    data: serviceProviders = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["service-providers", options],
    queryFn: () => fetchServiceProviders(options),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return {
    serviceProviders,
    loading,
    error: error instanceof Error ? error.message : null,
  };
};
