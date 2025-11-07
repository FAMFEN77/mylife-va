"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, type AuthUser } from "@/lib/api";

export type Role = AuthUser["role"];

export type NavItem = {
  href: string;
  label: string;
  roles?: Role[];
};

type AuthContextType = {
  authenticatedUser: AuthUser | null;
  token: string | null;
  loading: boolean;
  setToken: (token: string | null) => void;
  setAuthenticatedUser: (user: AuthUser | null) => void;
  logout: () => void;
  navItems: NavItem[];
  isManager: boolean;
};

const defaultContext: AuthContextType = {
  authenticatedUser: null,
  token: null,
  loading: true,
  setToken: () => {},
  setAuthenticatedUser: () => {},
  logout: () => {},
  navItems: [],
  isManager: false,
};

const AuthContext = createContext<AuthContextType>(defaultContext);

const BASE_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/assistant", label: "Assistant" },
  { href: "/boards", label: "Kanban" },
  { href: "/reminders", label: "Reminders" },
  { href: "/customers", label: "Klanten" },
  { href: "/time", label: "Uren" },
  { href: "/trips", label: "Ritten" },
  { href: "/expenses", label: "Declaraties" },
  { href: "/leave", label: "Verlof" },
  { href: "/inspections", label: "Inspecties" },
  { href: "/invoices", label: "Facturen" },
  { href: "/settings", label: "Instellingen" },
];

const MANAGER_NAV_ITEMS: NavItem[] = [
  { href: "/team", label: "Team", roles: ["MANAGER"] },
  { href: "/availability", label: "Beschikbaarheid", roles: ["MANAGER"] },
  { href: "/planner", label: "Planner", roles: ["MANAGER"] },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authenticatedUser, setAuthenticatedUser] = useState<AuthUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const setToken = (newToken: string | null) => {
    setTokenState(newToken);
    if (typeof window === "undefined") {
      return;
    }
    if (newToken) {
      localStorage.setItem("accessToken", newToken);
    } else {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const saved = localStorage.getItem("accessToken");
    if (!saved) {
      setLoading(false);
      return;
    }
    setTokenState(saved);
    api
      .me()
      .then((user) => {
        setAuthenticatedUser(user);
      })
      .catch(() => {
        setToken(null);
        setAuthenticatedUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const logout = () => {
    setToken(null);
    setAuthenticatedUser(null);
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  const isManager = authenticatedUser?.role === "MANAGER";

  const navItems = useMemo<NavItem[]>(() => {
    if (!authenticatedUser) {
      return BASE_NAV_ITEMS;
    }
    const extra = isManager ? MANAGER_NAV_ITEMS : [];
    const combined = [...BASE_NAV_ITEMS, ...extra].filter(
      (item) => !item.roles || item.roles.includes(authenticatedUser.role),
    );
    const unique = new Map<string, NavItem>();
    combined.forEach((item) => {
      if (!unique.has(item.href)) {
        unique.set(item.href, item);
      }
    });
    return Array.from(unique.values());
  }, [authenticatedUser, isManager]);

  return (
    <AuthContext.Provider
      value={{
        authenticatedUser,
        token,
        loading,
        setToken,
        setAuthenticatedUser,
        logout,
        navItems,
        isManager,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
