"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ListFeedback, { type FeedbackItem } from "./components/list-feedback";
import { GetFeedbackList, updateFeedbackStatus } from "@/lib/api/feedbacks";
import {
  createFeedbackRoute,
  getDetailFeedbackRoute,
  editFeedbackRoute,
} from "@/lib/utils/route-utils";
import { useAuth } from "@/lib/context/auth-context";

export default function FeedbackPage() {
  const router = useRouter();
  const { user } = useAuth();

  // State management
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filter states
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [roleFilter, setRoleFilter] = useState<
    "student" | "teacher" | "admin" | "all"
  >("all");
  const [statusFilter, setStatusFilter] = useState<
    "pending" | "completed" | "all"
  >("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  // Loading states
  const [updatingStatusIds, setUpdatingStatusIds] = useState<string[]>([]);

  const itemsPerPage = 10;

  // Load data
  useEffect(() => {
    loadFeedbacks(currentPage, itemsPerPage);
  }, [
    currentPage,
    itemsPerPage,
    sortOrder,
    roleFilter,
    statusFilter,
    fromDate,
    toDate,
  ]);

  // Filter handlers
  const handleSortOrderChange = (value: "newest" | "oldest") => {
    setSortOrder(value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleRoleFilterChange = (
    value: "student" | "teacher" | "admin" | "all"
  ) => {
    setRoleFilter(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: "pending" | "completed" | "all") => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleFromDateChange = (value: string) => {
    setFromDate(value);
    setCurrentPage(1);
  };

  const handleToDateChange = (value: string) => {
    setToDate(value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSortOrder("newest");
    setRoleFilter("all");
    setStatusFilter("all");
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
  };

  const handleUpdateStatus = async (id: string, status: number) => {
    try {
      // Add to loading state
      setUpdatingStatusIds((prev) => [...prev, id]);

      await updateFeedbackStatus(id, status);
      toast.success("Cập nhật trạng thái thành công!");
      // Reload data to reflect changes
      loadFeedbacks(currentPage, itemsPerPage);
    } catch (error) {
      console.error("Error updating feedback status:", error);
      toast.error("Không thể cập nhật trạng thái");
    } finally {
      // Remove from loading state
      setUpdatingStatusIds((prev) =>
        prev.filter((feedbackId) => feedbackId !== id)
      );
    }
  };

  // Convert role filter to role_id for API
  const getRoleIdForApi = (roleFilter: string) => {
    switch (roleFilter) {
      case "student":
        return "3";
      case "teacher":
        return "2";
      case "admin":
        return "1";
      default:
        return "all";
    }
  };

  // Convert status filter to status for API
  const getStatusForApi = (statusFilter: string) => {
    switch (statusFilter) {
      case "pending":
        return "1";
      case "completed":
        return "2";
      default:
        return "all";
    }
  };

  // Convert date to Unix timestamp
  const convertDateToUnixTimestamp = (
    dateString: string
  ): string | undefined => {
    if (!dateString) return undefined;

    // Create Date object from date string (YYYY-MM-DD format)
    const date = new Date(dateString + "T00:00:00");

    // Convert to Unix timestamp (seconds since epoch)
    const unixTimestamp = Math.floor(date.getTime() / 1000);

    return unixTimestamp.toString();
  };

  const loadFeedbacks = async (page = 1, limit = itemsPerPage) => {
    setIsLoading(true);
    try {
      const response = await GetFeedbackList(
        page,
        limit,
        sortOrder,
        getRoleIdForApi(roleFilter),
        getStatusForApi(statusFilter),
        convertDateToUnixTimestamp(fromDate),
        convertDateToUnixTimestamp(toDate)
      );

      if (response && response.data) {
        setFeedbacks(response.data.feedbacks || []);
        setTotalItems(parseInt(response.data.total) || 0);
        setTotalPages(Math.ceil((parseInt(response.data.total) || 0) / limit));
      } else {
        setFeedbacks([]);
        setTotalItems(0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Error loading feedbacks:", error);
      toast.error("Không thể tải danh sách nhận xét");
      setFeedbacks([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleViewFeedback = (id: string) => {
    router.push(getDetailFeedbackRoute(user, id));
  };

  const handleEditFeedback = (id: string) => {
    router.push(editFeedbackRoute(user, id));
  };

  const handleCreateFeedback = () => {
    router.push(createFeedbackRoute(user));
  };

  return (
    <ListFeedback
      feedbacks={feedbacks}
      isLoading={isLoading}
      currentPage={currentPage}
      totalPages={totalPages}
      totalItems={totalItems}
      sortOrder={sortOrder}
      roleFilter={roleFilter}
      statusFilter={statusFilter}
      fromDate={fromDate}
      toDate={toDate}
      updatingStatusIds={updatingStatusIds}
      userType={user?.type}
      onPageChange={handlePageChange}
      onViewFeedback={handleViewFeedback}
      onEditFeedback={handleEditFeedback}
      onCreateFeedback={handleCreateFeedback}
      onSortOrderChange={handleSortOrderChange}
      onRoleFilterChange={handleRoleFilterChange}
      onStatusFilterChange={handleStatusFilterChange}
      onFromDateChange={handleFromDateChange}
      onToDateChange={handleToDateChange}
      onClearFilters={handleClearFilters}
      onUpdateStatus={handleUpdateStatus}
    />
  );
}
