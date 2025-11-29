"use client";

import {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
} from "react";
import type { NavigationLink } from "@/lib/navigation";

type NavigationContextValue = {
  initialNavigationLinks: NavigationLink[];
};

const NavigationContext = createContext<NavigationContextValue | undefined>(
  undefined,
);

type NavigationProviderProps = PropsWithChildren<{
  initialNavigationLinks?: NavigationLink[];
}>;

export function NavigationProvider({
  children,
  initialNavigationLinks,
}: NavigationProviderProps) {
  const value = useMemo(
    () => ({
      initialNavigationLinks: initialNavigationLinks?.length
        ? initialNavigationLinks
        : [],
    }),
    [initialNavigationLinks],
  );

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useInitialNavigationLinks(): NavigationLink[] {
  const context = useContext(NavigationContext);
  return context?.initialNavigationLinks ?? [];
}
