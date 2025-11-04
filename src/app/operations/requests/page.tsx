"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AdminRequestsPage from "@/app/admin/requests/page";

export default function OperationsRequestsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [defaultApplied, setDefaultApplied] = useState(false);

  useEffect(() => {
    if (searchParams.has("assigned")) {
      if (!defaultApplied) {
        setDefaultApplied(true);
      }
      return;
    }

    if (!defaultApplied) {
      const params = new URLSearchParams(searchParams);
      params.set("assigned", "me");
      const query = params.toString();
      const target = query ? `${pathname}?${query}` : pathname;
      router.replace(target, { scroll: false });
    }
  }, [defaultApplied, pathname, router, searchParams]);

  return <AdminRequestsPage />;
}
