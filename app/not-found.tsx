"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/context/auth-context";
import { getDefaultRoute } from "@/lib/utils/route-utils";

export default function NotFound() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthenticated && user) {
        // Redirect đến trang mặc định theo role
        const defaultRoute = getDefaultRoute(user);
        router.replace(defaultRoute);
      } else {
        // Nếu chưa đăng nhập thì redirect đến login
        router.replace("/login");
      }
    }, 2000);

    // Cleanup để tránh memory leak
    return () => clearTimeout(timer);
  }, [router, user, isAuthenticated]);

  // Hiển thị thông báo trong lúc chờ
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center text-lg font-medium">
        Trang không tồn tại. Chuyển tới trang chủ sau 2s...
      </div>
    </div>
  );
}
