"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  getCourseReport,
  exportCourseReport,
  CourseReportData,
  getCourseStudentsReport,
  getCourseHomeworksReport,
  type StudentInfo,
  type HomeworkReportData,
} from "@/lib/api/export-import";
import {
  getListSchool,
  getListCourse,
  getListTeacher,
} from "@/lib/api/dashboard";
import { useTranslations } from "next-intl";
import { sortAlphabetGeneric, sortByNumberAndAlphabetFromSecondGeneric } from "@/lib/utils";
import { useAuth } from "@/lib/context/auth-context";
import { isSchoolManager } from "@/lib/auth/roles";

interface Week {
  label: string;
  startTimestamp: number;
  endTimestamp: number;
}

interface CourseReportTabProps {
  weeks: Week[];
  selectedWeek: string;
  onWeekChange: (week: string) => void;
}

export default function CourseReportTab({
  weeks,
  selectedWeek,
  onWeekChange,
}: CourseReportTabProps) {
  const { user } = useAuth()
  const t = useTranslations("exportReport");
  const [courseData, setCourseData] = useState<CourseReportData[]>([]);
  const [courseLoading, setCourseLoading] = useState(false);
  const [courseExporting, setCourseExporting] = useState(false);
  const [courseCurrentPage, setCourseCurrentPage] = useState(1);
  const [coursePageSize, setCoursePageSize] = useState(10);
  const [courseTotalPages, setCourseTotalPages] = useState(0);
  const [courseTotalCount, setCourseTotalCount] = useState(0);
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("all");
  const [courses, setCourses] = useState<
    { id: string; name: string; object_title: string }[]
  >([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("all");
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("all");

  // State cho dialog hiển thị học sinh khóa học
  const [studentsDialogOpen, setStudentsDialogOpen] = useState(false);
  const [studentsData, setStudentsData] = useState<StudentInfo[]>([]);
  const [homeworksData, setHomeworksData] = useState<HomeworkReportData[]>([]);
  const [selectedCourseName, setSelectedCourseName] = useState("");
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingHomeworks, setLoadingHomeworks] = useState(false);
  const [dialogActiveTab, setDialogActiveTab] = useState("students");

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

  // Fetch course report data
  const fetchCourseReport = async (
    page: number = courseCurrentPage,
    limit: number = coursePageSize
  ) => {
    setCourseLoading(true);
    try {
      const { start_date, end_date } = getCurrentWeekTimestamps();
      const response = await getCourseReport({
        school_id:
          selectedSchoolId === "all" ? undefined : parseInt(selectedSchoolId),
        course_id: selectedCourseId !== "all" ? selectedCourseId : undefined,
        teacher_id: selectedTeacherId !== "all" ? selectedTeacherId : undefined,
        page,
        limit,
        start_date,
        end_date,
      });
      setCourseData(response.data.courses);
      setCourseTotalPages(response.data.total_pages);
      setCourseTotalCount(parseInt(response.data.total));
    } catch (error) {
      console.error("Error fetching course report:", error);
    } finally {
      setCourseLoading(false);
    }
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return "-";
    const numericValue = Number(timestamp);
    if (Number.isNaN(numericValue)) return timestamp;
    const date = new Date(numericValue * 1000);
    return date.toLocaleString("vi-VN");
  };

  // Gọi API lấy danh sách học sinh & bài luyện tập của khóa học
  const handleOpenCourseStudents = async (course: any) => {
    const { start_date, end_date } = getCurrentWeekTimestamps();
    setSelectedCourseName(course.course_name);
    setStudentsDialogOpen(true);
    setDialogActiveTab("students");
    setStudentsData([]);
    setHomeworksData([]);
    setLoadingStudents(true);
    setLoadingHomeworks(true);

    try {
      const [studentsResponse, homeworksResponse] = await Promise.all([
        getCourseStudentsReport({
          course_id: course.course_id,
          start_date,
          end_date,
        }),
        getCourseHomeworksReport({
          course_id: course.course_id,
          start_date,
          end_date,
        }),
      ]);

      setStudentsData(studentsResponse.data.students || []);
      setHomeworksData(homeworksResponse.data.homeworks || []);
    } catch (error) {
      console.error("Error fetching students report:", error);
    } finally {
      setLoadingStudents(false);
      setLoadingHomeworks(false);
    }
  };

  const handleStudentsDialogChange = (open: boolean) => {
    setStudentsDialogOpen(open);
    if (!open) {
      setDialogActiveTab("students");
      setStudentsData([]);
      setHomeworksData([]);
    }
  };

  // Fetch schools list
  const fetchSchools = async () => {
    try {
      const response = await getListSchool();
      // API returns response.data.data.schools
      if (response.data && response.data.schools) {
        setSchools(
          response.data.schools.map((school: any) => ({
            id: school.id,
            name: school.school_name,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching schools:", error);
    }
  };

  // Fetch courses list (depends on school filter)
  const fetchCourses = async () => {
    try {
      const res = await getListCourse(
        selectedSchoolId !== "all" ? { school_id: selectedSchoolId } : {}
      );
      if (res?.data?.courses) {
        setCourses(
          res.data.courses.map((c: any) => ({
            id: c.id,
            name: c.name,
            object_title: c.object_title,
          }))
        );
      } else if (res?.courses) {
        setCourses(
          res.courses.map((c: any) => ({
            id: c.id,
            name: c.name,
            object_title: c.object_title,
          }))
        );
      }
    } catch (e) {
      console.error("Error fetching courses:", e);
    }
  };

  // Fetch teachers list (depends on school and course filters)
  const fetchTeachers = async () => {
    try {
      const params: any = {};
      if (selectedSchoolId !== "all") params.school_id = selectedSchoolId;
      if (selectedCourseId !== "all") params.course_id = selectedCourseId;
      const res = await getListTeacher(params);
      if (res?.data?.teachers) {
        setTeachers(
          res.data.teachers.map((t: any) => ({ id: t.id, name: t.name }))
        );
      } else if (res?.teachers) {
        setTeachers(res.teachers.map((t: any) => ({ id: t.id, name: t.name })));
      }
    } catch (e) {
      console.error("Error fetching teachers:", e);
    }
  };

  // Handle export course report
  const handleExportCourseReport = async () => {
    setCourseExporting(true);
    try {
      const { start_date, end_date } = getCurrentWeekTimestamps();
      const response = await exportCourseReport({
        school_id:
          selectedSchoolId === "all" ? undefined : parseInt(selectedSchoolId),
        course_id: selectedCourseId !== "all" ? selectedCourseId : undefined,
        teacher_id: selectedTeacherId !== "all" ? selectedTeacherId : undefined,
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
      link.download = `dashboard_courses-${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting course report:", error);
    } finally {
      setCourseExporting(false);
    }
  };

  // Handle course page change
  const handleCoursePageChange = (page: number) => {
    setCourseCurrentPage(page);
    fetchCourseReport(page, coursePageSize);
  };

  // Handle course page size change
  const handleCoursePageSizeChange = (size: number) => {
    setCoursePageSize(size);
    setCourseCurrentPage(1);
    fetchCourseReport(1, size);
  };

  // Handle school selection change
  const handleSchoolChange = (schoolId: string) => {
    setSelectedSchoolId(schoolId);
    setCourseCurrentPage(1);
    setSelectedCourseId("all");
    setSelectedTeacherId("all");
  };

  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    setSelectedTeacherId("all");
    setCourseCurrentPage(1);
  };

  const handleTeacherChange = (teacherId: string) => {
    setSelectedTeacherId(teacherId);
    setCourseCurrentPage(1);
  };

  // Initial load
  useEffect(() => {
    fetchSchools();
  }, []);

  // Fetch courses when school changes
  useEffect(() => {
    fetchCourses();
  }, [selectedSchoolId]);

  // Fetch teachers when school or course changes
  useEffect(() => {
    fetchTeachers();
  }, [selectedSchoolId, selectedCourseId]);

  // Fetch course report when any filter changes
  useEffect(() => {
    if (selectedWeek) {
      fetchCourseReport();
    }
  }, [
    selectedSchoolId,
    selectedCourseId,
    selectedTeacherId,
    selectedWeek,
  ]);

  // auto select school when user type = school
  const schoolAutoSelectedRef = useRef(false);
  useEffect(() => {
    if (
      schoolAutoSelectedRef.current ||
      !isSchoolManager(user) ||
      selectedSchoolId !== "all" ||
      schools.length === 0
    ) return;

    const first = schools.find(s => s.id !== "all");
    
    if (first) {
      schoolAutoSelectedRef.current = true;
      handleSchoolChange(first.id);
    }
  }, [schools, user, selectedSchoolId]);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4 flex-1">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 w-full sm:w-auto min-w-0">
                <Label
                  htmlFor="school-select"
                  className="whitespace-nowrap text-sm sm:text-base"
                >
                  {t("selectSchool")}:
                </Label>
                <Select
                  value={selectedSchoolId}
                  onValueChange={handleSchoolChange}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder={t("selectSchool")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allSchools")}</SelectItem>
                    {sortAlphabetGeneric(schools, schools => schools.name, true).map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 w-full sm:w-auto min-w-0">
                <Label
                  htmlFor="course-select"
                  className="whitespace-nowrap text-sm sm:text-base"
                >
                  Khóa học:
                </Label>
                <Select
                  value={selectedCourseId}
                  onValueChange={handleCourseChange}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Chọn khóa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    {sortByNumberAndAlphabetFromSecondGeneric(courses, courses => courses.name, true).map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name} - {course.object_title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 w-full sm:w-auto min-w-0">
                <Label
                  htmlFor="teacher-select"
                  className="whitespace-nowrap text-sm sm:text-base"
                >
                  Giáo viên:
                </Label>
                <Select
                  value={selectedTeacherId}
                  onValueChange={handleTeacherChange}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Chọn giáo viên" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    {sortAlphabetGeneric(teachers, teachers => teachers.name, true).map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 w-full sm:w-auto min-w-0">
                <Label
                  htmlFor="week-select"
                  className="whitespace-nowrap text-sm sm:text-base"
                >
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
            </div>
            <div className="w-full lg:w-auto flex justify-end lg:flex-shrink-0">
              <ExportData
                onExport={handleExportCourseReport}
                exporting={courseExporting}
                label={t("exportButton")}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm sm:text-base">Ấn vào từng dòng để xem chi tiết</p>
          {courseLoading ? (
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
                        <TableHead>{t("table.courseName")}</TableHead>
                        <TableHead>{t("table.className")}</TableHead>
                        <TableHead>{t("table.teachers")}</TableHead>
                        <TableHead>{t("table.totalHs")}</TableHead>
                        <TableHead>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">
                                {t("table.completedAllHomework")}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                Số học sinh active đã làm hết các bài được
                                giao
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TableHead>
                        <TableHead>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">
                                {t("table.doingHomework")}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                Số học sinh active có ít nhất 1 bài chưa làm
                                hoặc đang làm
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TableHead>
                        <TableHead>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">
                                {t("table.notStartedAnyHomework")}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Chưa làm bài nào</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableHead>
                        <TableHead>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">
                                {t("table.activeNotStartedAnyHomework")}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Đã đăng nhập nhưng chưa làm bài nào</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableHead>
                        <TableHead>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">
                                {t(
                                  "table.activeStudentsSelectedWeekCourse"
                                )}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Số HS có vào web trong tuần gần nhất</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableHead>
                        <TableHead>{t("table.totalHomeworks")}</TableHead>
                        <TableHead>
                          {t("table.assignedHomeworks")}
                        </TableHead>
                        <TableHead>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">
                                {t("table.completedHomeworks")}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                Tổng bài có từ 50% học sinh active hoàn
                                thành
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courseData.map((course, index) => (
                        <TableRow
                          key={course.course_id}
                          onClick={() => handleOpenCourseStudents(course)}
                          className="cursor-pointer hover:bg-gray-100"
                        >
                          <TableCell>
                            {(courseCurrentPage - 1) * coursePageSize +
                              index +
                              1}
                          </TableCell>
                          <TableCell className="font-medium">
                            {course.school_name}
                          </TableCell>
                          <TableCell>{course.course_name}</TableCell>
                          <TableCell>{course.object_title}</TableCell>
                          <TableCell>
                            {course.teacher_infos
                              .map((teacher) => teacher.name)
                              .join(", ")}
                          </TableCell>
                          <TableCell>{course.total_students}</TableCell>
                          <TableCell>
                            {course.students_completed_all_homeworks ===
                            "-1"
                              ? "N/A"
                              : course.students_completed_all_homeworks}
                          </TableCell>
                          <TableCell>
                            {course.students_doing_homeworks === "-1"
                              ? "N/A"
                              : course.students_doing_homeworks}
                          </TableCell>
                          <TableCell>
                            {course.students_not_started_any_homework ===
                            "-1"
                              ? "N/A"
                              : course.students_not_started_any_homework}
                          </TableCell>
                          <TableCell>
                            {course.student_active_not_started_any_homework ===
                            "-1"
                              ? "N/A"
                              : course.student_active_not_started_any_homework}
                          </TableCell>
                          <TableCell>
                            {course.active_students === "-1"
                              ? "N/A"
                              : course.active_students}
                          </TableCell>
                          <TableCell>{course.total_homeworks}</TableCell>
                          <TableCell>{course.assigned_homeworks}</TableCell>
                          <TableCell>
                            {
                              course.homework_over_50_percent_student_complete
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TooltipProvider>

              <ProfessionalPagination
                currentPage={courseCurrentPage}
                totalPages={courseTotalPages}
                totalCount={courseTotalCount}
                pageSize={coursePageSize}
                onPageChange={handleCoursePageChange}
                onPageSizeChange={handleCoursePageSizeChange}
                pageSizeOptions={[10, 20, 50]}
                itemName="khóa"
              />
            </>
          )}
        </CardContent>
      </Card>
      <Dialog
        open={studentsDialogOpen}
        onOpenChange={handleStudentsDialogChange}
      >
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Danh sách học sinh - {selectedCourseName}</DialogTitle>
          </DialogHeader>

          <Tabs
            value={dialogActiveTab}
            onValueChange={setDialogActiveTab}
            className="mt-2"
          >
            <TabsList className="grid w-full h-auto grid-cols-1 sm:grid-cols-2">
              <TabsTrigger value="students">Danh sách học sinh</TabsTrigger>
              <TabsTrigger value="homeworks">
                Danh sách bài luyện tập
              </TabsTrigger>
            </TabsList>
            <TabsContent value="students" className="mt-4">
              {loadingStudents ? (
                <div className="flex justify-center items-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải dữ
                  liệu...
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto">
                  {studentsData.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">
                      Không có dữ liệu học sinh
                    </p>
                  ) : (
                    <table className="w-full text-sm border-collapse border border-gray-300">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border px-2 py-1 text-center w-1/6">
                            Tên học sinh
                          </th>
                          <th className="border px-2 py-1 text-center w-1/6">
                            Trạng thái
                          </th>
                          <th className="border px-2 py-1 text-center">
                            Bài luyện tập
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentsData.map((student) => (
                          <tr key={student.id}>
                            <td className="border px-2 py-1 text-center">
                              {student.name}
                            </td>
                            <td className="border px-2 py-1 text-center">
                              {student.is_active ? (
                                <span className="text-green-600 font-semibold">
                                  Đã đăng nhập
                                </span>
                              ) : (
                                <span className="text-gray-500">
                                  Chưa đăng nhập
                                </span>
                              )}
                            </td>
                            <td className="border px-2 py-1 text-center">
                              {student.homeworks.map((hw) => {
                                let statusText = "";
                                let statusClass = "";

                                if (!hw.is_completed) {
                                  statusText = "Chưa hoàn thành";
                                  statusClass = "text-red-500";
                                } else if (hw.is_completed && hw.is_completed_late) {
                                  statusText = "Hoàn thành không đúng giờ";
                                  statusClass = "text-orange-500"; // màu cam để phân biệt
                                } else if (hw.is_completed && !hw.is_completed_late) {
                                  statusText = "Hoàn thành đúng giờ";
                                  statusClass = "text-green-600 font-medium";
                                }

                                return (
                                  <div key={hw.id}>
                                    {hw.name} - {hw.lesson_name} - {hw.chapter_name}{" "}
                                    <span className={statusClass}>({statusText})</span>
                                  </div>
                                );
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </TabsContent>
            <TabsContent value="homeworks" className="mt-4">
              {loadingHomeworks ? (
                <div className="flex justify-center items-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" /> Đang tải dữ
                  liệu...
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto">
                  {homeworksData.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">
                      Không có dữ liệu bài luyện tập
                    </p>
                  ) : (
                    <table className="w-full text-sm border-collapse border border-gray-300">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border px-2 py-1 text-center w-1/6">
                            Bài luyện tập
                          </th>
                          <th className="border px-2 py-1 text-center w-1/6">
                            Thời gian giao
                          </th>
                          <th className="border px-2 py-1 text-center w-1/6">
                            Giao trễ
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {homeworksData.map((hw) => (
                          <tr key={hw.id}>
                            <td className="border px-2 py-1 text-center">
                              {hw.name} - {hw.lesson_name} - {hw.chapter_name}
                            </td>
                            <td className="border px-2 py-1 text-center">
                              {formatTimestamp(hw.assigned_at)}
                            </td>
                            <td className="border px-2 py-1 text-center">
                              {hw.is_assigned_late ? (
                                <span className="text-red-500 font-semibold">
                                  Có
                                </span>
                              ) : (
                                <span className="text-green-600 font-semibold">
                                  Không
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}

