"use client"
import React from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Permission {
  id: string;
  name: string;
}

interface PermissionGroup {
  id: string;
  name: string;
  sort_position?: number;
  permissions: Permission[];
}

interface Role {
  id: string;
  name: string;
}

interface CheckboxWithIndeterminateProps {
  checked: boolean;
  indeterminate: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function CheckboxWithIndeterminate({
  checked,
  indeterminate,
  onCheckedChange,
}: CheckboxWithIndeterminateProps) {
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

interface RolePermissionsManagementProps {
  roles: Role[];
  permissionGroups: PermissionGroup[];
  permissions: Record<string, Record<string, boolean>>;
  permissionStatus: Record<string, boolean>;
  onPermissionChange: (roleId: string, permissionId: string, checked: boolean) => void;
  onGroupPermissionChange: (roleId: string, groupId: string, checked: boolean) => void;
  isGroupChecked: (roleId: string, groupId: string) => boolean;
  isGroupIndeterminate: (roleId: string, groupId: string) => boolean;
}

export default function RolePermissionsManagement({
  roles,
  permissionGroups,
  permissions,
  permissionStatus,
  onPermissionChange,
  onGroupPermissionChange,
  isGroupChecked,
  isGroupIndeterminate,
}: RolePermissionsManagementProps) {
  const t = useTranslations("users.permissions");

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-gray-900">{t('permissionTable')}</CardTitle>
        <CardDescription className="text-gray-600">{t('permissionTableDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="border-0">
            <TableHeader className="bg-gray-50">
              <TableRow className="border-b">
                <TableHead className="w-[200px] sm:w-[250px] font-bold text-gray-900 p-3 sm:p-4 text-sm sm:text-base">
                  {t('functionalPermissions')}
                </TableHead>
                {roles.map((role) => (
                  <TableHead key={role.id} className="text-center font-bold text-gray-900 p-3 sm:p-4 text-sm sm:text-base min-w-[80px]">
                    <div className="hidden sm:block">
                      {role.name === 'admin' ? t('roleAdmin') : 
                       role.name === 'teacher' ? t('roleTeacher') : 
                       role.name === 'student' ? t('roleStudent') : role.name}
                    </div>
                    <div className="sm:hidden text-xs">
                      {role.name === 'admin' ? t('roleAdmin') : 
                       role.name === 'teacher' ? t('roleTeacher') : 
                       role.name === 'student' ? t('roleStudent') : role.name}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissionGroups.map((group) => (
                <React.Fragment key={group.id}>
                  <TableRow className="bg-blue-50 border-b">
                    <TableCell className="font-bold text-blue-800 p-3 sm:p-4 text-sm sm:text-base">
                      {group.name}
                    </TableCell>
                    {roles.map((role) => (
                      <TableCell key={`${role.id}-${group.id}`} className="text-center align-middle p-3 sm:p-4">
                        <div className="flex justify-center">
                          <CheckboxWithIndeterminate
                            checked={isGroupChecked(role.id, group.id)}
                            indeterminate={isGroupIndeterminate(role.id, group.id)}
                            onCheckedChange={(checked) =>
                              onGroupPermissionChange(role.id, group.id, checked as boolean)
                            }
                          />
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                  {group.permissions.map((permission) => {
                    const permissionKey = `${group.id}-${permission.id}`;
                    const isDisabled = !permissionStatus[permissionKey];
                    
                    return (
                      <TableRow 
                        key={permission.id} 
                        className={`${isDisabled ? 'bg-gray-100 opacity-60' : 'bg-white hover:bg-gray-50'} border-b border-gray-100`}
                      >
                        <TableCell className="pl-6 sm:pl-8 text-gray-800 p-3 sm:p-4 text-sm sm:text-base relative">
                          <div className="flex items-center">
                            {permission.name}
                            {isDisabled && (
                              <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">
                                {t("disabledPermission")}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        {roles.map((role) => (
                          <TableCell key={`${role.id}-${group.id}-${permission.id}`} className="text-center align-middle p-3 sm:p-4">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={permissions[role.id][permissionKey] && !isDisabled}
                                disabled={isDisabled}
                                onCheckedChange={(checked) =>
                                  !isDisabled && onPermissionChange(role.id, permissionKey, checked as boolean)
                                }
                                className="h-4 w-4 sm:h-5 sm:w-5"
                              />
                            </div>
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
