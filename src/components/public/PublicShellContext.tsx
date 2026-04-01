"use client";

import { createContext, useContext, type PropsWithChildren } from "react";

const PublicShellContext = createContext(false);

export function PublicShellProvider({ children }: PropsWithChildren) {
  return (
    <PublicShellContext.Provider value={true}>
      {children}
    </PublicShellContext.Provider>
  );
}

export function usePublicShellOwner() {
  return useContext(PublicShellContext);
}
