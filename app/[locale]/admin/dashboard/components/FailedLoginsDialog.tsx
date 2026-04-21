"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, User, Key, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { getFailedLoginsList } from "@/lib/api/dashboard";

interface FailedLogin {
  user_id: number | null;
  role_id: number | null;
  query_params: string;
  request_body: string;
  response_body: string;
  created_at: string;
}

interface FailedLoginsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FailedLoginsDialog({
  open,
  onOpenChange,
}: FailedLoginsDialogProps) {
  const t = useTranslations("admin.dashboard");
  const [failedLogins, setFailedLogins] = useState<FailedLogin[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
  });

  const fetchFailedLogins = async (page = 1) => {
    if (loading) return;

    try {
      setLoading(true);
      const response = await getFailedLoginsList({
        minutes: 3600, // 1 hour
        page,
        limit: 20,
      });

      if (response.code === 200 && response.data) {
        const newLogins = response.data.failed_logins || [];

        if (page === 1) {
          setFailedLogins(newLogins);
        } else {
          // Append for pagination
          setFailedLogins((prev) => [...prev, ...newLogins]);
        }

        setPagination({
          currentPage: response.data.page || 1,
          totalPages: response.data.total_pages || 1,
          totalItems: response.data.total_failed_logins || 0,
          hasNextPage:
            (response.data.page || 1) < (response.data.total_pages || 1),
        });
      }
    } catch (error) {
      console.error("Error fetching failed logins:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (pagination.hasNextPage && !loading) {
      fetchFailedLogins(pagination.currentPage + 1);
    }
  };

  useEffect(() => {
    if (open) {
      fetchFailedLogins(1);
    }
  }, [open]);

  const parseRequestBody = (requestBody: string) => {
    try {
      const parsed = JSON.parse(requestBody);
      return {
        username: parsed.username || "N/A",
        password: "***", // Hide password for security
      };
    } catch {
      return { username: "N/A", password: "***" };
    }
  };

  const parseResponseBody = (responseBody: string) => {
    try {
      const parsed = JSON.parse(responseBody);
      return parsed.message || "Unknown error";
    } catch {
      return "Unknown error";
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            {t("alerts.failedLogins")} ({pagination.totalItems})
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 max-h-[75vh]">
          <div className="space-y-4">
            {failedLogins.length === 0 && !loading ? (
              <div className="text-center py-8 text-gray-500">
                {t("alerts.noFailedLogins")}
              </div>
            ) : (
              failedLogins.map((login, index) => {
                const requestData = parseRequestBody(login.request_body);
                const errorMessage = parseResponseBody(login.response_body);

                return (
                  <div
                    key={index}
                    className="border border-red-200 rounded-lg p-4 bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-red-600" />
                        <span className="font-medium text-red-800">
                          {requestData.username}
                        </span>
                        <Badge variant="destructive" className="text-xs">
                          {t("alerts.loginFailed")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="h-3 w-3" />
                        {formatDateTime(login.created_at)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <Key className="h-3 w-3 text-gray-400" />
                          <span className="font-medium text-gray-700">
                            {t("alerts.attemptedCredentials")}
                          </span>
                        </div>
                        <div className="bg-white rounded p-2 border">
                          <div className="text-gray-600">
                            <strong>{t("alerts.username")}:</strong>{" "}
                            {requestData.username}
                          </div>
                          <div className="text-gray-600">
                            <strong>{t("alerts.password")}:</strong>{" "}
                            {requestData.password}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <AlertTriangle className="h-3 w-3 text-red-500" />
                          <span className="font-medium text-gray-700">
                            {t("alerts.errorMessage")}
                          </span>
                        </div>
                        <div className="bg-red-100 rounded p-2 border border-red-200">
                          <div className="text-red-700 text-sm">
                            {errorMessage}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {loading && (
              <div className="flex items-center justify-center py-4">
                <RefreshCw className="h-5 w-5 animate-spin text-gray-500 mr-2" />
                <span className="text-gray-500">Đang tải...</span>
              </div>
            )}

            {pagination.hasNextPage && !loading && (
              <div className="flex justify-center pt-4">
                <Button onClick={loadMore} variant="outline" className="w-full">
                  Tải thêm
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
