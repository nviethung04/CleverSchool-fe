"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/auth-context";
import { getDefaultRoute } from "@/lib/utils/route-utils";

export function RoleBasedRouteGuard() {
  const pathname = usePathname();
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only apply logic when user is successfully logged in
    if (isLoading || !isAuthenticated || !user) return;

    // Define role-based route patterns
    const adminRoutes = /^\/admin/;
    const teacherRoutes = /^\/teacher/;

    // Check if user is accessing unauthorized routes
    if (user.type === "teacher" && adminRoutes.test(pathname)) {
      console.log(
        "Teacher trying to access admin route, redirecting to default route"
      );
      const defaultRoute = getDefaultRoute(user);
      router.push(defaultRoute);
      return;
    }

    if (
      user.type === "student" &&
      (adminRoutes.test(pathname) || teacherRoutes.test(pathname))
    ) {
      console.log(
        "Student trying to access admin/teacher route, redirecting to default route"
      );
      const defaultRoute = getDefaultRoute(user);
      router.push(defaultRoute);
      return;
    }

    // Admin can access all routes, so no restriction for admin
  }, [pathname, isAuthenticated, user, isLoading, router]);

  return null;
}
