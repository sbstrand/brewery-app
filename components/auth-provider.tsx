"use client";

import { createContext, ReactNode, useContext } from "react";
import { AppUser, UserRole } from "@/lib/types";

type AuthContextValue = {
  currentUser: AppUser;
  isAdmin: boolean;
  loading: boolean;
};

const emptyUser: AppUser = { id: "", name: "", email: "", role: "General User", status: "active" };

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  serverUser
}: {
  children: ReactNode;
  serverUser: Partial<AppUser> | null;
}) {
  const currentUser: AppUser = serverUser?.id
    ? { ...emptyUser, ...serverUser } as AppUser
    : emptyUser;

  return (
    <AuthContext.Provider value={{ currentUser, isAdmin: currentUser.role === "Admin", loading: false }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider.");
  return context;
}

export function useRole(): UserRole {
  return useAuth().currentUser.role;
}
