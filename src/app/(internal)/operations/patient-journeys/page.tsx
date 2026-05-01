"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AdminPatientJourneysPage from "@/app/(internal)/admin/patient-journeys/page";

export default function OperationsPatientJourneysPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const defaultAppliedRef = useRef(false);

  useEffect(() => {
    if (searchParams.has("assigned") || searchParams.has("journeyId")) {
      defaultAppliedRef.current = true;
      return;
    }

    if (!defaultAppliedRef.current) {
      defaultAppliedRef.current = true;
      const params = new URLSearchParams(searchParams);
      params.set("assigned", "me");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    }
  }, [pathname, router, searchParams]);

  return <AdminPatientJourneysPage />;
}
