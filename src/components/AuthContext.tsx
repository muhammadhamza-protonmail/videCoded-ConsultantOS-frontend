"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authApi, setToken, clearToken, getToken, User } from "@/lib/api";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: { username: string; email: string; password: string; role: string }) => Promise<void>;
  refreshUser: () => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const applyUser = (u: User) => {
    console.log("[Auth] Applying user state:", u.username, u.role);
    setUser(u);
  };

  // On mount, restore session from stored token
  useEffect(() => {
    const token = getToken();
    console.log("[Auth] Restore session, token exists:", !!token);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!token) { setIsLoading(false); return; }
    
    authApi.me()
      .then((me) => {
        console.log("[Auth] Profile fetched successfully");
        applyUser(me);
      })
      .catch((err) => {
        console.error("[Auth] Session restore failed:", err);
        clearToken();
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (username: string, password: string) => {
    console.log("[Auth] Attempting login for:", username);
    const { access_token } = await authApi.login(username, password);
    console.log("[Auth] Login success, token received");
    setToken(access_token);
    
    console.log("[Auth] Fetching user profile...");
    const me = await authApi.me();
    console.log("[Auth] Profile fetched, applying user...");
    applyUser(me);
    
    console.log("[Auth] Navigating to dashboard...");
    router.push("/dashboard");
  };

  const register = async (data: { username: string; email: string; password: string; role: string }) => {
    await authApi.register(data);
    await login(data.username, data.password);
  };

  const refreshUser = async () => {
    const me = await authApi.me();
    applyUser(me);
    return me;
  };

  const logout = () => {
    console.log("[Auth] Logging out");
    clearToken();
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
