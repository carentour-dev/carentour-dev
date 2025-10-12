"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import Image from "next/image";
import { useTheme } from "next-themes";

export default function CmsLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const check = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/auth");
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();
      setAuthorized(!!data && ["admin", "editor"].includes((data as any).role));
    };
    check();
  }, [router]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (authorized === null) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Loading CMS…</CardTitle>
          </CardHeader>
          <CardContent>Checking your permissions.</CardContent>
        </Card>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Access denied</CardTitle>
          </CardHeader>
          <CardContent>
            You need Admin or Editor permissions to access the CMS.
            <div className="mt-4">
              <Button asChild>
                <Link href="/">Go home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/cms" className="flex items-center gap-3">
            <Image
              src={mounted && resolvedTheme === "dark" ? "/care-n-tour-logo-light.png" : "/care-n-tour-logo-dark.png"}
              alt="Care N Tour logo"
              width={140}
              height={48}
              className="h-10 w-auto"
              priority
            />
            <span className="hidden text-base font-semibold tracking-wide text-muted-foreground md:inline">
              CMS
            </span>
          </Link>
          <Button asChild variant="outline" size="sm">
            <Link href="/cms/new">New Page</Link>
          </Button>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
