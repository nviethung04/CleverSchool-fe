"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import ProfessionalPagination from "@/components/ui/professional-pagination";
import ExportData from "@/components/ui/export-data";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getSchoolReport,
  exportSchoolReport,
  SchoolReportData,
} from "@/lib/api/export-import";
import { useTranslations } from "next-intl";

interface Week {
  label: string;
  startTimestamp: number;
  endTimestamp: number;
}

interface SchoolReportTabProps {
  weeks: Week[];
  selectedWeek: string;
  onWeekChange: (week: string) => void;
}

export default function SchoolReportTab({
  weeks,
  selectedWeek,
  onWeekChange,
}: SchoolReportTabProps) {
  const t = useTranslations("exportReport");
  const [schoolData, setSchoolData] = useState<SchoolReportData[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Helper function to get current week timestamps
  const getCurrentWeekTimestamps = () => {
    const selectedWeekData = weeks.find((w) => w.label === selectedWeek);
    if (!selectedWeekData)
      return { start_date: undefined, end_date: undefined };
    return {
      start_date: selectedWeekData.startTimestamp,
      end_date: selectedWeekData.endTimestamp,
    };
  };

  // Fetch school report data
  const fetchSchoolReport = async (
    page: number = currentPage,
    limit: number = pageSize
  ) => {
    setLoading(true);
    try {
      const { start_date, end_date } = getCurrentWeekTimestamps();
      const response = await getSchoolReport({
        page,
        limit,
        start_date,
        end_date,
      });
      setSchoolData(response.data.schools);
      setTotalPages(response.data.total_pages);
      setTotalCount(parseInt(response.data.total));
    } catch (error) {
      console.error("Error fetching school report:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle export school report
  const handleExportSchoolReport = async () => {
    setExporting(true);
    try {
      const { start_date, end_date } = getCurrentWeekTimestamps();
      const response = await exportSchoolReport({
        start_date,
        end_date,
      });
      // Create download link
      const blob = new Blob([response], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `dashboard_schools-${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting school report:", error);
    } finally {
      setExporting(false);
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchSchoolReport(page, pageSize);
  };

  // Handle page size change
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
    fetchSchoolReport(1, size);
  };

  // Fetch school data when week is selected
  useEffect(() => {
    if (selectedWeek) {
      fetchSchoolReport();
    }
  }, [selectedWeek]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <Label htmlFor="week-select" className="whitespace-nowrap">
              Chọn tuần:
            </Label>
            <Select value={selectedWeek} onValueChange={onWeekChange}>
              <SelectTrigger className="w-full sm:w-[250px]">
                <SelectValue placeholder="Chọn tuần" />
              </SelectTrigger>
              <SelectContent>
                {weeks.map((week) => (
                  <SelectItem key={week.label} value={week.label}>
                    {week.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-auto">
            <ExportData
              onExport={handleExportSchoolReport}
              exporting={exporting}
              label={t("exportButton")}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">{t("loadingData")}</span>
          </div>
        ) : (
          <>
            <TooltipProvider>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("table.stt")}</TableHead>
                      <TableHead>{t("table.schoolName")}</TableHead>
                      <TableHead>{t("table.totalStudents")}</TableHead>
                      <TableHead>{t("table.totalTeachers")}</TableHead>
                      <TableHead>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">
                              {t("table.activeTeachersSep8")}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              Số giáo viên đăng nhập ít nhất 1 lần từ ngày
                              08/09/2025
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TableHead>
                      <TableHead>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">
                              {t("table.activeStudentsSep15")}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              Số học sinh đăng nhập thành công ít nhất 1
                              lần từ ngày 15/09/2025
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TableHead>
                      <TableHead>
                        {t("table.completedHomeworkSep15")}
                      </TableHead>
                      <TableHead>
                        {t("table.completedHomeworkSelectedWeek")}
                      </TableHead>
                      <TableHead>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">
                              {t("table.activeStudentsSelectedWeek")}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Số HS có vào Clever School trong tuần chọn</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableHead>
                      <TableHead>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">
                              {t("table.activeTeachersSelectedWeek")}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Số GV có vào Clever School trong tuần gần nhất</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schoolData.map((school, index) => (
                      <TableRow key={school.school_id}>
                        <TableCell>
                          {(currentPage - 1) * pageSize + index + 1}
                        </TableCell>
                        <TableCell className="font-medium">
                          {school.school_name}
                        </TableCell>
                        <TableCell>{school.total_students}</TableCell>
                        <TableCell>{school.total_teachers}</TableCell>
                        <TableCell>
                          {school.active_teachers_from_sep8}
                        </TableCell>
                        <TableCell>
                          {school.active_students_from_sep15}
                        </TableCell>
                        <TableCell>
                          {school.students_completed_homework_from_sep15}
                        </TableCell>
                        <TableCell>
                          {school.students_completed_homework_selected_week ===
                          "-1"
                            ? "N/A"
                            : school.students_completed_homework_selected_week}
                        </TableCell>
                        <TableCell>
                          {school.active_students_selected_week === "-1"
                            ? "N/A"
                            : school.active_students_selected_week}
                        </TableCell>
                        <TableCell>
                          {school.active_teachers_selected_week === "-1"
                            ? "N/A"
                            : school.active_teachers_selected_week}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TooltipProvider>

            <ProfessionalPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              pageSizeOptions={[10, 20, 50]}
              itemName="trường"
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}

