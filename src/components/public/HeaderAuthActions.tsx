"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DrawerClose } from "@/components/ui/drawer";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";

type HeaderAuthActionsProps = {
  variant: "desktop" | "mobile";
};

function SignInButton({ mobile }: { mobile: boolean }) {
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

  return mobile ? <DrawerClose asChild>{button}</DrawerClose> : button;
}

function HeaderAuthActionsContent({ variant }: HeaderAuthActionsProps) {
  const t = useTranslations("Header");
  const { user, signOut } = useAuth();
  const { profile } = useUserProfile();
  const mobile = variant === "mobile";

  if (!user) {
    return <SignInButton mobile={mobile} />;
  }

  if (mobile) {
    return (
      <>
        <DrawerClose asChild>
          <Link
            href="/dashboard"
            className="block text-sm text-muted-foreground transition-smooth hover:text-primary"
          >
            {t("dashboardGreeting", {
              name: profile?.displayName || t("userFallback"),
            })}
          </Link>
        </DrawerClose>
        <DrawerClose asChild>
          <Button variant="ghost" className="justify-start" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            {t("signOut")}
          </Button>
        </DrawerClose>
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
