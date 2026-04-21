"use client"
import React from "react"
import { useTranslations } from "next-intl"
import { useState , useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Undo2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox"
import { Save } from "lucide-react"
import { GetPermissions, UpdateRolePermissions, GetActivePermissions, UpdatePermissionStatus } from "@/lib/api/permissions"
import PermissionStatusManagement from "./components/permission-status-management"
import RolePermissionsManagement from "./components/role-permissions-management"

function CheckboxWithIndeterminate({
  checked,
  indeterminate,
  onCheckedChange,
}: {
  checked: boolean
  indeterminate: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <Checkbox
      checked={checked}
      onCheckedChange={onCheckedChange}
      className="h-4 w-4 sm:h-5 sm:w-5 accent-blue-500 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
      ref={node => {
        if (node) {
          const input = node.querySelector("input[type=checkbox]") as HTMLInputElement | null;
          if (input) inputRef.current = input;
        }
      }}
    />
  );
}

export default function PermissionsPage() {
  const t = useTranslations("users.permissions");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"role-permissions" | "permission-status">("role-permissions");
  const [rawRolePermissions, setRawRolePermissions] = useState<any[]>([]);
  const [rawPermissions, setRawPermissions] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({});
  const [permissionStatus, setPermissionStatus] = useState<Record<string, boolean>>({});
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [permissionGroups, setPermissionGroups] = useState<
    { id: string; name: string; sort_position?: number; permissions: { id: string; name: string }[] }[]
  >([]);
  const [hasPermissionStatusChanged, setHasPermissionStatusChanged] = useState(false);

  const handleSavePermissions = async () => {
    try {
      setIsLoading(true);
      
      if (activeTab === "role-permissions") {
        // Save role permissions
        const role_permissions = rawRolePermissions.map((rolePerm) => {
          const newPermissions: Record<string, any> = {};
          Object.entries(rolePerm.permissions).forEach(([groupKey, group]: [string, any]) => {
            const newActions: Record<string, boolean> = {};
            Object.entries(group.actions).forEach(([actionKey]) => {
              newActions[actionKey] = !!permissions[rolePerm.role.id]?.[`${groupKey}-${actionKey}`];
            });
            newPermissions[groupKey] = {
              ...group,
              actions: newActions,
            };
          });
          return {
            role: rolePerm.role,
            permissions: newPermissions,
          };
        });

        const permissionsArr = rawPermissions;

        await UpdateRolePermissions({
          role_permissions,
          permissions: permissionsArr,
        });
        
        alert(t('updateSuccess'));
      } else if (activeTab === "permission-status") {
        // Save permission status
        const permissionsToUpdate = permissionGroups.map((group) => ({
          key: group.id,
          name: group.name,
          sort_position: group.sort_position || 0,
          actions: group.permissions.map((permission) => ({
            key: permission.id,
            name: permission.name,
            is_display: permissionStatus[`${group.id}-${permission.id}`] || false,
          })),
        }));

        await UpdatePermissionStatus({
          permissions: permissionsToUpdate,
        });
        
        setHasPermissionStatusChanged(true);
        alert(t("updatePermissionStatusSuccess"));
      }
    } catch (error) {
      if (activeTab === "role-permissions") {
        alert(t('updateFailed'));
      } else {
        alert(t("updatePermissionStatusFailed"));
      }
      console.error("Cập nhật thất bại", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  useEffect(() => {
    fetchPermissions();
    fetchPermissionStatus();
  }, []);
  
  const fetchPermissionStatus = async () => {
    try {
      const result = await GetActivePermissions();
      const apiData = result.data || {};
      
      // Update permission status based on API response
      const initialPermissionStatus: Record<string, boolean> = {};
      apiData.permissions?.forEach((group: any) => {
        group.actions.forEach((action: any) => {
          initialPermissionStatus[`${group.key}-${action.key}`] = action.is_display || false;
        });
      });
      setPermissionStatus(initialPermissionStatus);
    } catch (error) {
      console.error("Lỗi khi lấy trạng thái quyền:", error);
      // If API fails, keep the default status (all enabled)
    }
  };
  
  const fetchPermissions = async () => {
    try {
      const result = await GetPermissions();
      const apiData = result.data || {};

      setRawRolePermissions(apiData.role_permissions || []);
      setRawPermissions(apiData.permissions || []);

      const rolesData =
        apiData.role_permissions?.map((item: any) => ({
          id: item.role.id,
          name: item.role.name,
        })) || [];
      setRoles(rolesData);

      const permissionGroupsData =
        apiData.permissions?.map((group: any) => ({
          id: group.key,
          name: group.name,
          sort_position: group.sort_position,
          permissions: group.actions.map((action: any) => ({
            id: action.key,
            name: action.name,
          })),
        })) || [];
      setPermissionGroups(permissionGroupsData);

      const initialPermissions: Record<string, Record<string, boolean>> = {};
      apiData.role_permissions?.forEach((rolePerm: any) => {
        const roleId = rolePerm.role.id;
        initialPermissions[roleId] = {};
        Object.entries(rolePerm.permissions).forEach(([groupKey, group]: [string, any]) => {
          Object.entries(group.actions).forEach(([actionKey, value]) => {
            initialPermissions[roleId][`${groupKey}-${actionKey}`] = Boolean(value);
          });
        });
      });
      setPermissions(initialPermissions);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách quyền:", error);
    }
  };

  const handlePermissionChange = (roleId: string, permissionId: string, checked: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        [permissionId]: checked,
      },
    }))
  }

  const handleGroupPermissionChange = (roleId: string, groupId: string, checked: boolean) => {
    const group = permissionGroups.find((g) => g.id === groupId)
    if (!group) return

    setPermissions((prev) => ({
      ...prev,
      [roleId]: {
        ...prev[roleId],
        ...Object.fromEntries(
          group.permissions.map((permission) => [
            `${groupId}-${permission.id}`,
            checked,
          ])
        ),
      },
    }))
  }

  const isGroupChecked = (roleId: string, groupId: string) => {
    const group = permissionGroups.find((g) => g.id === groupId)
    if (!group) return false

    return group.permissions.every(
      (permission) => permissions[roleId][`${groupId}-${permission.id}`]
    )
  }

  const isGroupIndeterminate = (roleId: string, groupId: string) => {
    const group = permissionGroups.find((g) => g.id === groupId)
    if (!group) return false

    const checkedCount = group.permissions.filter(
      (permission) => permissions[roleId][`${groupId}-${permission.id}`]
    ).length

    return checkedCount > 0 && checkedCount < group.permissions.length
  }

  const handlePermissionStatusChange = (permissionId: string, enabled: boolean) => {
    setHasPermissionStatusChanged(true);
    setPermissionStatus((prev) => ({
      ...prev,
      [permissionId]: enabled,
    }));

    // If disabling a permission, remove it from all roles
    if (!enabled) {
      setPermissions((prev) => {
        const newPermissions = { ...prev };
        Object.keys(newPermissions).forEach((roleId) => {
          newPermissions[roleId] = {
            ...newPermissions[roleId],
            [permissionId]: false,
          };
        });
        return newPermissions;
      });
    }
  }

  const handleGroupStatusChange = (groupId: string, enabled: boolean) => {
    setHasPermissionStatusChanged(true);
    const group = permissionGroups.find((g) => g.id === groupId);
    if (!group) return;

    const updates: Record<string, boolean> = {};
    group.permissions.forEach((permission) => {
      const permissionKey = `${groupId}-${permission.id}`;
      updates[permissionKey] = enabled;
    });

    setPermissionStatus((prev) => ({
      ...prev,
      ...updates,
    }));

    if (!enabled) {
      setPermissions((prev) => {
        const newPermissions = { ...prev };
        Object.keys(newPermissions).forEach((roleId) => {
          Object.keys(updates).forEach((permissionKey) => {
            newPermissions[roleId] = {
              ...newPermissions[roleId],
              [permissionKey]: false,
            };
          });
        });
        return newPermissions;
      });
    }
  }

  const isGroupStatusEnabled = (groupId: string) => {
    const group = permissionGroups.find((g) => g.id === groupId);
    if (!group) return false;

    return group.permissions.every(
      (permission) => permissionStatus[`${groupId}-${permission.id}`]
    );
  }

  const isGroupStatusIndeterminate = (groupId: string) => {
    const group = permissionGroups.find((g) => g.id === groupId);
    if (!group) return false;

    const enabledCount = group.permissions.filter(
      (permission) => permissionStatus[`${groupId}-${permission.id}`]
    ).length;

    return enabledCount > 0 && enabledCount < group.permissions.length;
  }

  const handleTabChange = async (newTab: "role-permissions" | "permission-status") => {
    if (activeTab === "permission-status" && newTab === "role-permissions" && hasPermissionStatusChanged) {
      setIsLoading(true);
      try {
        await fetchPermissions();
        await fetchPermissionStatus();
        setHasPermissionStatusChanged(false);
      } catch (error) {
        console.error(t("reloadDataError"), error);
      } finally {
        setIsLoading(false);
      }
    }
    setActiveTab(newTab);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {message && (
        <div
          className={`p-3 rounded-lg mb-4 ${
            message.type === "success"
              ? "bg-green-100 text-green-700 border border-green-200"
              : "bg-red-100 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              {t('title')}
            </h1>
            <p className="text-muted-foreground mt-1">{t('description')}</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button 
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 sm:px-6 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border-0 w-full sm:w-auto" 
            onClick={handleSavePermissions} 
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="mr-2 h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full inline-block" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {activeTab === "role-permissions" ? t('saveChanges') : t("savePermissionStatus")}
          </Button>

          <Button
            variant="outline"
            className="border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 font-medium px-4 sm:px-6 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 w-full sm:w-auto"
            onClick={() => {
              fetchPermissions();
              fetchPermissionStatus();
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="mr-2 h-4 w-4 animate-spin border-2 border-gray-500 border-t-transparent rounded-full inline-block" />
            ) : (
              <Undo2 className="mr-2 h-4 w-4" />
            )}
            {t('undoChanges')}
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => handleTabChange("role-permissions")}
            disabled={isLoading}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "role-permissions"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isLoading && activeTab === "permission-status" ? (
              <span className="flex items-center">
                <span className="mr-2 h-4 w-4 animate-spin border-2 border-blue-500 border-t-transparent rounded-full inline-block" />
                {t("loading")}
              </span>
            ) : (
              t("rolePermissionsTab")
            )}
          </button>
          <button
            onClick={() => handleTabChange("permission-status")}
            disabled={isLoading}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "permission-status"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {t("permissionStatusTab")}
          </button>
        </nav>
      </div>
      
      {/* Content based on active tab */}
      {activeTab === "role-permissions" && (
        <RolePermissionsManagement
          roles={roles}
          permissionGroups={permissionGroups}
          permissions={permissions}
          permissionStatus={permissionStatus}
          onPermissionChange={handlePermissionChange}
          onGroupPermissionChange={handleGroupPermissionChange}
          isGroupChecked={isGroupChecked}
          isGroupIndeterminate={isGroupIndeterminate}
        />
      )}

      {activeTab === "permission-status" && (
        <PermissionStatusManagement
          permissionGroups={permissionGroups}
          permissionStatus={permissionStatus}
          onPermissionStatusChange={handlePermissionStatusChange}
          onGroupStatusChange={handleGroupStatusChange}
          isGroupStatusEnabled={isGroupStatusEnabled}
          isGroupStatusIndeterminate={isGroupStatusIndeterminate}
        />
      )}

      {/* Floating Save Button */}
      <div className="fixed bottom-6 right-6 z-10">
        <Button 
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 border-0 min-w-[160px]" 
          onClick={handleSavePermissions} 
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="mr-2 h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full inline-block" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {activeTab === "role-permissions" ? t('saveChanges') : t("savePermissionStatus")}
        </Button>
      </div>
    </div>
  )
}