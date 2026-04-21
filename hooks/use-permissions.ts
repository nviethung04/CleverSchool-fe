import { useState, useEffect } from "react";
import { useAuth } from "@/lib/context/auth-context";
import { getRolePermissions } from "@/lib/api/auth";

interface PermissionAction {
  [key: string]: boolean;
}

interface PermissionGroup {
  name: string;
  sort_position: number;
  actions: PermissionAction;
}

interface PermissionData {
  key: string;
  value: PermissionGroup;
}

export function usePermissions() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<PermissionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user?.role_id) {
        setPermissions([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response: any = await getRolePermissions(user.role_id);

        // Xử lý cấu trúc dữ liệu từ API
        let permissionsList: PermissionData[] = [];
        if (response && typeof response === "object") {
          // Nếu response có cấu trúc như API trả về (từ data bạn cung cấp)
          if (
            response.data &&
            response.data.permissions &&
            Array.isArray(response.data.permissions)
          ) {
            permissionsList = response.data.permissions;
          }
          // Nếu response.permissions là array trực tiếp (từ getRolePermissions hiện tại)
          else if (
            response.permissions &&
            Array.isArray(response.permissions)
          ) {
            permissionsList = response.permissions;
          }
          // Nếu response là array trực tiếp (fallback)
          else if (Array.isArray(response)) {
            permissionsList = response;
          }
        }

        setPermissions(permissionsList);
      } catch (err: any) {
        console.error("Error fetching permissions:", err);
        setError(err.message || "Không thể tải quyền");
        setPermissions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [user?.role_id]);

  // Helper function to check if user has a specific permission
  const hasPermission = (resource: string, action: string = ""): boolean => {
    if (!resource || !Array.isArray(permissions)) {
      return false;
    }

    return permissions.some((permissionData) => {
      if (!permissionData || !permissionData.value) {
        return false;
      }

      const { key, value } = permissionData;

      // Kiểm tra tên resource (key hoặc name)
      const resourceMatch =
        key === resource ||
        value.name === resource ||
        key.includes(resource) ||
        value.name.includes(resource);

      if (!resourceMatch) {
        return false;
      }

      // Nếu không chỉ định action cụ thể, chỉ cần resource match
      if (!action) {
        return true;
      }

      // Kiểm tra action cụ thể
      return value.actions && value.actions[action] === true;
    });
  };

  // Specific permission checks for common actions
  const canEditLessons = (): boolean => {
    return hasPermission("lessons", "update") || user?.type === "admin"; // Quyền chỉnh sửa bài học
  };

  const canDeleteLessons = (): boolean => {
    return hasPermission("lessons", "destroy") || user?.type === "admin"; // Quyền xóa bài học
  };

  const canCreateLessons = (): boolean => {
    return hasPermission("lessons", "store") || user?.type === "admin"; // Quyền tạo bài học
  };

  const canEditLessonPlans = (): boolean => {
    return hasPermission("lesson-plans", "update") || user?.type === "admin"; // Quyền chỉnh sửa bài giảng
  };

  const canDeleteLessonPlans = (): boolean => {
    return hasPermission("lesson-plans", "destroy") || user?.type === "admin"; // Quyền xóa bài giảng
  };

  const canCreateLessonPlans = (): boolean => {
    return hasPermission("lesson-plans", "store") || user?.type === "admin"; // Quyền tạo bài giảng
  };

  const canManageAssignments = (): boolean => {
    return (
      hasPermission("homeworks", "update") ||
      hasPermission("exams", "update") ||
      hasPermission("exercises", "update") ||
      user?.type === "admin"
    ); // Quyền quản lý bài tập (homeworks, exams, exercises)
  };

  return {
    permissions,
    loading,
    error,
    hasPermission,
    canEditLessons,
    canDeleteLessons,
    canCreateLessons,
    canEditLessonPlans,
    canDeleteLessonPlans,
    canCreateLessonPlans,
    canManageAssignments,
  };
}
