"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function OperationsStartJourneyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [defaultApplied, setDefaultApplied] = useState(false);

  useEffect(() => {
    if (defaultApplied) {
      return;
    }

    const params = new URLSearchParams(searchParams);
    params.set("tab", "start-journey");
    if (!params.has("assigned")) {
      params.set("assigned", "me");
    }
    const query = params.toString();
    router.replace(`/operations/requests${query ? `?${query}` : ""}`, {
      scroll: false,
    });
    setDefaultApplied(true);
  }, [defaultApplied, router, searchParams]);

  return null;
}
