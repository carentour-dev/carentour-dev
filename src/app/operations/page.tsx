"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUserProfile } from "@/hooks/useUserProfile";
import { createEntitlementContext } from "@/lib/operations/entitlements";
import { getAccessibleOperationsSections } from "@/lib/operations/sections";

export default function OperationsOverviewPage() {
  const { profile, loading } = useUserProfile();

  const entitlements = useMemo(
    () =>
      profile
        ? createEntitlementContext({
            permissions: profile.permissions,
            roles: profile.roles,
          })
        : createEntitlementContext(),
    [profile],
  );

  const sections = useMemo(
    () =>
      getAccessibleOperationsSections(entitlements, {
        includeOverview: false,
      }),
    [entitlements],
  );

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Operations Overview
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Access the tools that match your role. Sections below adapt to the
          permissions granted to your staff account.
        </p>
      </header>

      {loading ? (
        <Card>
          <CardHeader>
            <CardTitle>Loading permissions…</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Preparing your Operations workspace.
            </p>
          </CardContent>
        </Card>
      ) : sections.length ? (
        <div className="grid gap-6 md:grid-cols-2">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Card key={section.id} className="transition hover:shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <Icon className="h-5 w-5 text-primary" />
                    {section.label}
                  </CardTitle>
                  <Button asChild variant="ghost" size="icon">
                    <Link href={section.href}>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  <CardDescription>{section.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No operations modules assigned</CardTitle>
            <CardDescription>
              Your account has access to the Operations workspace, but no
              sections have been enabled yet. Reach out to an administrator if
              this is unexpected.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/auth/support">Contact support</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
