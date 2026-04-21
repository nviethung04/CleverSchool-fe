"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Eye,
  Calendar,
  FileText,
  Filter,
  X,
  CheckCircle,
  Clock,
  Edit,
} from "lucide-react";
import { useCurrentLocale, useTypedTranslations } from "@/lib/i18n/client";

export interface FeedbackItem {
  id: string;
  user_id: string;
  name: string; // Tên người gửi
  username: string; // Tài khoản
  title: string; // Tiêu đề
  content: string;
  file_url: string;
  role_id: string | number; // Vai trò (1 = admin, 2 = giáo viên, 3 = học sinh)
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  status?: string | number; // Trạng thái (1 = tiếp nhận, 2 = hoàn thành)
  role?: string; // Vai trò
  response?: string; // Phản hồi
  note?: string; // Ghi chú
  type?: string; // Loại nhận xét
}

interface ListFeedbackProps {
  feedbacks: FeedbackItem[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  // Filter states
  sortOrder: "newest" | "oldest";
  roleFilter: "student" | "teacher" | "admin" | "all";
  statusFilter: "pending" | "completed" | "all";
  fromDate: string;
  toDate: string;
  // Loading states
  updatingStatusIds: string[]; // Track which feedbacks are being updated
  // User info
  userType?: "admin" | "teacher" | "student";
  // Handlers
  onPageChange: (page: number) => void;
  onViewFeedback: (id: string) => void;
  onEditFeedback: (id: string) => void;
  onCreateFeedback: () => void;
  onSortOrderChange: (value: "newest" | "oldest") => void;
  onRoleFilterChange: (value: "student" | "teacher" | "admin" | "all") => void;
  onStatusFilterChange: (value: "pending" | "completed" | "all") => void;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onClearFilters: () => void;
  onUpdateStatus: (id: string, status: number) => void;
}

export default function ListFeedback({
  feedbacks,
  isLoading,
  currentPage,
  totalPages,
  totalItems,
  sortOrder,
  roleFilter,
  statusFilter,
  fromDate,
  toDate,
  updatingStatusIds,
  userType,
  onPageChange,
  onViewFeedback,
  onEditFeedback,
  onCreateFeedback,
  onSortOrderChange,
  onRoleFilterChange,
  onStatusFilterChange,
  onFromDateChange,
  onToDateChange,
  onClearFilters,
  onUpdateStatus,
}: ListFeedbackProps) {
  const t = useTypedTranslations("manageFeedback");
  const currentLocale = useCurrentLocale();
  const formatDate = (timestamp: string) => {
    // Convert Unix timestamp to Date
    const date = new Date(parseInt(timestamp) * 1000);
    try {
      return new Intl.DateTimeFormat(currentLocale, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return date.toLocaleString();
    }
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (!text || text.length <= maxLength) return text || t("noContent");
    return text.substring(0, maxLength) + "...";
  };

  const getFileCount = (fileInfo: string) => {
    if (!fileInfo || fileInfo.trim() === "") return 0;
    try {
      const files = JSON.parse(fileInfo);
      return Array.isArray(files) ? files.length : 0;
    } catch {
      return 0;
    }
  };

  const getFileUrls = (fileInfo: string): string[] => {
    if (!fileInfo || fileInfo.trim() === "") return [];
    try {
      const files = JSON.parse(fileInfo);
      return Array.isArray(files) ? files : [];
    } catch {
      return [];
    }
  };

  const getStatusBadge = (status?: string | number) => {
    if (!status) return null;

    // Convert to string for comparison
    const statusStr = String(status);

    switch (statusStr) {
      case "1":
      case "pending":
      case "tiếp nhận":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            {t("status.pending")}
          </span>
        );
      case "2":
      case "completed":
      case "hoàn thành":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {t("status.completed")}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const getTypeLabel = (type: string | number | undefined) => {
    if (!type) return t("none");

    switch (String(type)) {
      case "1":
        return t("type.tech");
      case "2":
        return t("type.content");
      case "3":
        return t("type.both");
      default:
        return String(type);
    }
  };

  const getRoleBadge = (role?: string | number) => {
    if (!role) return null;

    // Convert to string for comparison
    const roleStr = String(role);

    switch (roleStr) {
      case "1":
      case "admin":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            {t("role.admin")}
          </span>
        );
      case "2":
      case "teacher":
      case "giáo viên":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            {t("role.teacher")}
          </span>
        );
      case "3":
      case "student":
      case "học sinh":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {t("role.student")}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {role}
          </span>
        );
    }
  };

  const hasActiveFilters = () => {
    return (
      sortOrder !== "newest" ||
      roleFilter !== "all" ||
      statusFilter !== "all" ||
      fromDate ||
      toDate
    );
  };

  // Check if user can see sensitive columns and actions
  const canSeeSensitiveInfo = userType === "admin";
  const canUpdateStatus = userType === "admin";

  if (isLoading) {
    return (
      <div className="container mx-auto px-2 md:px-4 py-4 md:py-8">
        <Card>
          <CardHeader>
            <div className="h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-gray-200 rounded animate-pulse"
                ></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 md:px-4 py-4 md:py-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">{t("title")}</CardTitle>
              <CardDescription>{t("subtitle")}</CardDescription>
            </div>
            <Button onClick={onCreateFeedback} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              {t("createFeedback")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {/* Sắp xếp */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {t("filters.sort")}
                </Label>
                <Select value={sortOrder} onValueChange={onSortOrderChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">
                      {t("filters.newest")}
                    </SelectItem>
                    <SelectItem value="oldest">
                      {t("filters.oldest")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Đối tượng - chỉ hiển thị cho admin */}
              {canSeeSensitiveInfo && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {t("filters.role")}
                  </Label>
                  <Select value={roleFilter} onValueChange={onRoleFilterChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("common.all")}</SelectItem>
                      <SelectItem value="student">
                        {t("role.student")}
                      </SelectItem>
                      <SelectItem value="teacher">
                        {t("role.teacher")}
                      </SelectItem>
                      <SelectItem value="admin">{t("role.admin")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Trạng thái */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {t("filters.status")}
                </Label>
                <Select
                  value={statusFilter}
                  onValueChange={onStatusFilterChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("common.all")}</SelectItem>
                    <SelectItem value="pending">
                      {t("status.pending")}
                    </SelectItem>
                    <SelectItem value="completed">
                      {t("status.completed")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Từ ngày */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {t("filters.fromDate")}
                </Label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => onFromDateChange(e.target.value)}
                  className="text-sm"
                />
              </div>

              {/* Đến ngày */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {t("filters.toDate")}
                </Label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => onToDateChange(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Total count */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
              <FileText className="h-4 w-4" />
              <span className="font-medium">
                {t("totalFeedback", { total: String(totalItems) })}
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {canSeeSensitiveInfo && (
                    <TableHead className="text-center">
                      {t("columns.senderName")}
                    </TableHead>
                  )}
                  {canSeeSensitiveInfo && (
                    <TableHead className="text-center">
                      {t("columns.username")}
                    </TableHead>
                  )}
                  <TableHead className="text-center">
                    {t("columns.title")}
                  </TableHead>
                  <TableHead className="text-center">
                    {t("columns.content")}
                  </TableHead>
                  <TableHead className="text-center">
                    {t("columns.response")}
                  </TableHead>
                  {canSeeSensitiveInfo && (
                    <TableHead className="text-center">
                      {t("columns.role")}
                    </TableHead>
                  )}
                  <TableHead className="text-center">
                    {t("columns.status")}
                  </TableHead>
                  <TableHead className="text-center">
                    {t("columns.attachments")}
                  </TableHead>
                  <TableHead className="text-center">
                    {t("columns.createdAt")}
                  </TableHead>
                  <TableHead className="text-center">
                    {t("columns.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedbacks.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={canSeeSensitiveInfo ? 12 : 7}
                      className="text-center py-8 text-gray-500"
                    >
                      {t("empty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  feedbacks.map((feedback) => (
                    <TableRow key={feedback.id}>
                      {canSeeSensitiveInfo && (
                        <TableCell className="text-center">
                          <div className="font-medium">{feedback.name}</div>
                        </TableCell>
                      )}
                      {canSeeSensitiveInfo && (
                        <TableCell className="text-center">
                          <div className="font-medium">{feedback.username}</div>
                        </TableCell>
                      )}
                      <TableCell className="text-center">
                        <div className="text-sm text-gray-600">
                          {truncateText(feedback.title, 50)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="text-sm text-gray-600">
                          {truncateText(feedback.content, 100)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="text-sm text-gray-600">
                          {feedback.response ? t("haveResponse") : ""}
                        </div>
                      </TableCell>
                      {canSeeSensitiveInfo && (
                        <TableCell className="text-center">
                          {getRoleBadge(feedback.role_id)}
                        </TableCell>
                      )}
                      <TableCell className="text-center">
                        {getStatusBadge(feedback.status)}
                      </TableCell>
                      <TableCell className="text-center">
                        {getFileUrls(feedback.file_url).length > 0 ? (
                          <div className="flex flex-col items-center gap-1.5">
                            {getFileUrls(feedback.file_url).map((url, idx) => (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-700 border border-blue-300 rounded-md shadow-sm hover:bg-blue-50 hover:border-blue-500 transition-all duration-150"
                                style={{
                                  minWidth: 120,
                                  justifyContent: "center",
                                }}
                              >
                                <FileText className="w-5 h-5" />
                                {t("viewFile")}
                                {getFileUrls(feedback.file_url).length > 1
                                  ? ` #${idx + 1}`
                                  : ""}
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">
                            
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center space-x-1 text-sm text-gray-600">
                          <span>{formatDate(feedback.created_at)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewFeedback(feedback.id)}
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            title={t("actions.view")}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          {/* Edit button - only visible for admin users */}
                          {userType === "admin" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEditFeedback(feedback.id)}
                              className="text-green-600 hover:text-green-800 hover:bg-green-50"
                              title={t("actions.edit")}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}

                          {canUpdateStatus && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const currentStatus = Number(feedback.status);
                                const newStatus = currentStatus === 1 ? 2 : 1;
                                onUpdateStatus(feedback.id, newStatus);
                              }}
                              disabled={updatingStatusIds.includes(feedback.id)}
                              className="text-purple-600 hover:text-purple-800 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              title={t("actions.toggleStatus")}
                            >
                              {updatingStatusIds.includes(feedback.id) ? (
                                <svg
                                  className="animate-spin h-4 w-4 text-purple-600"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                              ) : Number(feedback.status) === 1 ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : (
                                <Clock className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                {t("pagination.status", {
                  from: String((currentPage - 1) * 10 + 1),
                  to: String(Math.min(currentPage * 10, totalItems)),
                  total: String(totalItems),
                })}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  {t("pagination.prev")}
                </Button>
                <div className="flex items-center space-x-1">
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => onPageChange(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  {t("pagination.next")}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
