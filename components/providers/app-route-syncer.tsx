"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/context/auth-context";

export function AppRouteSyncer() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Khi user bị logout hoặc token hết hạn, xóa last_visited_path
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.removeItem("last_visited_path");
    }
  }, [isAuthenticated]);

  return null;
}
