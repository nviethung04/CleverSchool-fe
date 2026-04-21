"use client"
import React from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
    <div className="flex items-center">
      <input
        ref={inputRef}
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
      />
    </div>
  );
}

interface PermissionStatusManagementProps {
  permissionGroups: PermissionGroup[];
  permissionStatus: Record<string, boolean>;
  onPermissionStatusChange: (permissionId: string, enabled: boolean) => void;
  onGroupStatusChange: (groupId: string, enabled: boolean) => void;
  isGroupStatusEnabled: (groupId: string) => boolean;
  isGroupStatusIndeterminate: (groupId: string) => boolean;
}

export default function PermissionStatusManagement({
  permissionGroups,
  permissionStatus,
  onPermissionStatusChange,
  onGroupStatusChange,
  isGroupStatusEnabled,
  isGroupStatusIndeterminate,
}: PermissionStatusManagementProps) {
  const t = useTranslations("users.permissions.permissionStatusManagement");
  
  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-gray-900">{t("title")}</CardTitle>
        <CardDescription className="text-gray-600">
          {t("description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table className="border-0">
            <TableHeader className="bg-gray-50">
              <TableRow className="border-b">
                <TableHead className="w-[60%] font-bold text-gray-900 p-3 sm:p-4 text-sm sm:text-base">
                  {t("functionColumn")}
                </TableHead>
                <TableHead className="w-[20%] text-center font-bold text-gray-900 p-3 sm:p-4 text-sm sm:text-base">
                  {t("statusColumn")}
                </TableHead>
                <TableHead className="w-[20%] text-center font-bold text-gray-900 p-3 sm:p-4 text-sm sm:text-base">
                  {t("actionColumn")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissionGroups.map((group) => (
                <React.Fragment key={group.id}>
                  <TableRow className="bg-blue-50 border-b">
                    <TableCell className="font-bold text-blue-800 p-3 sm:p-4 text-sm sm:text-base">
                      <div className="flex items-center justify-between">
                        <span>{group.name}</span>
                        <span className="text-xs text-gray-600">
                          {t("activeCount", {
                            active: group.permissions.filter(p => permissionStatus[`${group.id}-${p.id}`]).length,
                            total: group.permissions.length
                          })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center align-middle p-3 sm:p-4">
                      <div className="flex justify-center">
                        <CheckboxWithIndeterminate
                          checked={isGroupStatusEnabled(group.id)}
                          indeterminate={isGroupStatusIndeterminate(group.id)}
                          onCheckedChange={(checked) =>
                            onGroupStatusChange(group.id, checked as boolean)
                          }
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center align-middle p-3 sm:p-4">
                      <div className="flex justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-300 hover:bg-green-50"
                          onClick={() => onGroupStatusChange(group.id, true)}
                          disabled={isGroupStatusEnabled(group.id)}
                        >
                          {t("restoreAll")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                          onClick={() => onGroupStatusChange(group.id, false)}
                          disabled={!group.permissions.some(p => permissionStatus[`${group.id}-${p.id}`])}
                        >
                          {t("disableAll")}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {group.permissions.map((permission) => {
                    const permissionKey = `${group.id}-${permission.id}`;
                    const isEnabled = permissionStatus[permissionKey];
                    
                    return (
                      <TableRow 
                        key={permission.id} 
                        className={`${isEnabled ? 'bg-white hover:bg-gray-50' : 'bg-red-50'} border-b border-gray-100`}
                      >
                        <TableCell className="pl-6 sm:pl-8 text-gray-800 p-3 sm:p-4 text-sm sm:text-base">
                          <div className="flex items-center justify-between">
                            <span className={isEnabled ? '' : 'line-through text-gray-500'}>
                              {permission.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center align-middle p-3 sm:p-4">
                          <div className="flex justify-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              isEnabled 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {isEnabled ? t("statusActive") : t("statusDisabled")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center align-middle p-3 sm:p-4">
                          <div className="flex justify-center">
                            <Button
                              size="sm"
                              variant="outline"
                              className={`${
                                isEnabled 
                                  ? 'text-red-600 border-red-300 hover:bg-red-50' 
                                  : 'text-green-600 border-green-300 hover:bg-green-50'
                              }`}
                              onClick={() => onPermissionStatusChange(permissionKey, !isEnabled)}
                            >
                              {isEnabled ? t("disable") : t("restore")}
                            </Button>
                          </div>
                        </TableCell>
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
