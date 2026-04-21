"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useRouter, useParams } from "next/navigation";
import type { User } from "../types/auth";
import type { Permission } from "../api/auth";
import {
  login as apiLogin,
  logout as apiLogout,
  getCurrentUser,
} from "../api/auth";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  // permissions: Permission[]
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export let logoutFn: (() => void) | null = null;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  // const [permissions, setPermissions] = useState<Permission[]>([])
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || "vi";

  useEffect(() => {
    // Check if user is already logged in
    const storedToken = localStorage.getItem("token");
    const storedUser = getCurrentUser();

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
    }

    setIsLoading(false);
  }, []);

  // Update the login function in the AuthProvider to handle the new role-based routing
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { token, user } = await apiLogin(username, password);

      // const permissions = await getRolePermissions(user.role_id, token)

      // Save to localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      // localStorage.setItem("permissions", JSON.stringify(permissions))

      // Update state
      setToken(token);
      setUser(user);
      // setPermissions(permissions)
      // Redirect based on user type
      if (user.type === "student") {
        router.push(`/${locale}/assignments`);
      } else if (user.type === "teacher") {
        router.push(`/${locale}/teacher/weekly-lessons`);
      } else if (user.type === "admin") {
        router.push(`/${locale}/admin/dashboard`);
      } 
    } catch (error: any) {
      const message = error?.response?.data?.message;
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    apiLogout();
    setUser(null);
    setToken(null);
    setError(null);
    router.push("/login");
  };

  logoutFn = logout;

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout,
    // permissions,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
