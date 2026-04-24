"use client";

import Link from "next/link";
import type { ReactElement } from "react";
import { useTranslations } from "next-intl";
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DrawerClose } from "@/components/ui/drawer";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";

type HeaderAuthActionsProps = {
  variant: "desktop" | "mobile";
  mobileCloseBehavior?: "drawer" | "none";
};

function MaybeDrawerClose({
  children,
  enabled,
}: {
  children: ReactElement;
  enabled: boolean;
}) {
  return enabled ? <DrawerClose asChild>{children}</DrawerClose> : children;
}

function SignInButton({
  mobile,
  useDrawerClose,
}: {
  mobile: boolean;
  useDrawerClose: boolean;
}) {
  const t = useTranslations("Header");
  const button = (
    <Button
      variant="ghost"
      size={mobile ? "default" : "sm"}
      className={mobile ? "justify-start" : undefined}
      asChild
    >
      <Link href="/auth">
        <User className={mobile ? "mr-2 h-4 w-4" : "mr-1 h-4 w-4"} />
        {t("signIn")}
      </Link>
    </Button>
  );

  return mobile ? (
    <MaybeDrawerClose enabled={useDrawerClose}>{button}</MaybeDrawerClose>
  ) : (
    button
  );
}

function HeaderAuthActionsContent({
  variant,
  mobileCloseBehavior = "drawer",
}: HeaderAuthActionsProps) {
  const t = useTranslations("Header");
  const { user, signOut } = useAuth();
  const { profile } = useUserProfile();
  const mobile = variant === "mobile";
  const useDrawerClose = mobile && mobileCloseBehavior === "drawer";

  if (!user) {
    return <SignInButton mobile={mobile} useDrawerClose={useDrawerClose} />;
  }

  if (mobile) {
    return (
      <>
        <MaybeDrawerClose enabled={useDrawerClose}>
          <Link
            href="/dashboard"
            className="block text-sm text-muted-foreground transition-smooth hover:text-primary"
          >
            {t("dashboardGreeting", {
              name: profile?.displayName || t("userFallback"),
            })}
          </Link>
        </MaybeDrawerClose>
        <MaybeDrawerClose enabled={useDrawerClose}>
          <Button variant="ghost" className="justify-start" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            {t("signOut")}
          </Button>
        </MaybeDrawerClose>
      </>
    );
  }

  return (
    <>
      <Link
        href="/dashboard"
        className="hidden text-sm text-muted-foreground transition-smooth hover:text-primary lg:inline"
      >
        {t("dashboardGreeting", {
          name: profile?.displayName || t("userFallback"),
        })}
      </Link>
      <Button variant="ghost" size="sm" onClick={signOut}>
        <LogOut className="mr-1 h-4 w-4" />
        {t("signOut")}
      </Button>
    </>
  );
}

export default function HeaderAuthActions(props: HeaderAuthActionsProps) {
  return (
    <AuthProvider>
      <HeaderAuthActionsContent {...props} />
    </AuthProvider>
  );
}
