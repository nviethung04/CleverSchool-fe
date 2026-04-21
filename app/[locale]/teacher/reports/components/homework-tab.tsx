"use client";

import { useMemo, useState, useEffect } from "react";
import { useTypedTranslations, useCurrentLocale } from "@/lib/i18n/client";
import {
  Users,
  Download,
  ClipboardList,
  BookOpen,
  FolderOpen,
  GraduationCap,
  CalendarDays,
  Calendar,
  CalendarRange,
  CalendarClock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ProfessionalPagination from "@/components/ui/professional-pagination";

import {
  getTeacherAllHomework,
  exportTeacherAllHomework,
  exportTeacherDetailHomework,
  getListLesson,
  getListHomework,
  getListChapter,
  getTeacherListHomeworks,
} from "@/lib/api/dashboard";
import { sortByNumberAndAlphabetFromSecondGeneric } from "@/lib/utils";

interface HomeworkTabProps {
  courses: any[];
}

// Interface cho response của API
interface HomeworkStudentData {
  student_id: string;
  student_name: string;
  total_homework?: string;
  total_assigned_homeworks?: string;
  in_progress_homework?: string;
  completed_homework?: string;
  not_started_homework?: string;
  average_ratio: string;
  completed_homework_ratio: number;
  total_questions?: string;
  questions_completed?: string;
}

interface StudentHomeworkItem {
  homework_id: string;
  homework_name: string;
  total_questions: string;
  questions_completed: string;
  status: string;
  submitted_at: string;
  lesson_id: string;
  lesson_name: string;
  assigned_at: string;
  assign_late: boolean;
}

export function HomeworkTab({ courses }: HomeworkTabProps) {
  const t = useTypedTranslations("homeworkTab");
  const currentLocale = useCurrentLocale();

  // Helper function để tính toán start_date và end_date từ các bộ lọc
  const calculateDateRange = () => {
    let startDateTimestampOld = 0;
    let endDateTimestampOld = 0;

    if (startDate) {
      startDateTimestampOld = new Date(startDate).getTime();
    } else if (month && month !== "all") {
      // Nếu không có startDate nhưng có chọn tháng cụ thể, sử dụng đầu tháng đó
      startDateTimestampOld = new Date(
        `${year}-${month.padStart(2, "0")}-01`
      ).getTime();
    } else {
      // Nếu không có startDate và không chọn tháng cụ thể, sử dụng đầu năm
      startDateTimestampOld = new Date(`${year}-01-01`).getTime();
    }

    if (endDate) {
      endDateTimestampOld = new Date(endDate).getTime();
    } else if (month && month !== "all") {
      // Nếu không có endDate nhưng có chọn tháng cụ thể, sử dụng cuối tháng đó
      const lastDayOfMonth = new Date(
        parseInt(year),
        parseInt(month),
        0
      ).getDate();
      endDateTimestampOld = new Date(
        `${year}-${month.padStart(2, "0")}-${lastDayOfMonth}`
      ).getTime();
    } else {
      // Nếu không có endDate và không chọn tháng cụ thể, sử dụng cuối năm
      endDateTimestampOld = new Date(`${year}-12-31`).getTime();
    }

    const startDateTimestamp = Math.floor(startDateTimestampOld / 1000);
    const endDateTimestamp = Math.floor(endDateTimestampOld / 1000);

    return { startDateTimestamp, endDateTimestamp };
  };

  // Filter states
  const now = new Date();
  const [year, setYear] = useState<string>(now.getFullYear().toString());
  const [month, setMonth] = useState<string>((now.getMonth() + 1).toString());
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedChapter, setSelectedChapter] = useState("all");
  const [selectedLesson, setSelectedLesson] = useState<string[]>([]);
  const [selectedSpecificAssignment, setSelectedSpecificAssignment] = useState<
    string[]
  >([]);
  const [orderBy, setOrderBy] = useState<
    "completed_homework" | "average_score"
  >("completed_homework");
  const [chapters, setChapters] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [homeworks, setHomeworks] = useState<any[]>([]);

  // Determine if showing specific assignment view
  const isSpecificAssignmentView = selectedSpecificAssignment.length > 0;
  // Determine if showing single assignment view (table hiển thị chi tiết theo bài)
  const isSingleAssignmentView = selectedSpecificAssignment.length === 1;

  // Get filtered homeworks based on selected lesson
  const getFilteredHomeworks = () => {
    // Since we're now using API with lesson_id parameter,
    // homeworks array already contains the filtered data
    return homeworks;
  };

  const filteredHomeworks = getFilteredHomeworks();

  const extractExerciseNumber = (name?: string) => {
    if (!name) return Number.MAX_SAFE_INTEGER;
    const match = name.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER;
  };

  const extractLessonInfo = (lessonTitle?: string) => {
    const normalized = (lessonTitle || "").trim();
    const match = normalized.match(/^(.*?)(\d+)\s*$/);

    if (match) {
      return {
        base: match[1].trim().toLowerCase(),
        order: parseInt(match[2], 10),
      };
    }

    return {
      base: normalized.toLowerCase(),
      order: Number.MAX_SAFE_INTEGER,
    };
  };

  const sortedHomeworkOptions = useMemo(() => {
    return [...filteredHomeworks].sort((a, b) => {
      const lessonInfoA = extractLessonInfo(
        (a.lesson_title || a.lesson_name || "").toString()
      );
      const lessonInfoB = extractLessonInfo(
        (b.lesson_title || b.lesson_name || "").toString()
      );

      const baseCompare = lessonInfoA.base.localeCompare(
        lessonInfoB.base,
        undefined,
        {
          sensitivity: "base",
        }
      );
      if (baseCompare !== 0) return baseCompare;

      const lessonOrderCompare = lessonInfoA.order - lessonInfoB.order;
      if (lessonOrderCompare !== 0) return lessonOrderCompare;

      const exerciseCompare =
        extractExerciseNumber(a.name) - extractExerciseNumber(b.name);
      if (exerciseCompare !== 0) return exerciseCompare;

      return (a.name || "").localeCompare(b.name || "", undefined, {
        sensitivity: "base",
        numeric: true,
      });
    });
  }, [filteredHomeworks]);

  const monthNames = useMemo(() => {
    try {
      const formatter = new Intl.DateTimeFormat(currentLocale, {
        month: "long",
      });
      return Array.from({ length: 12 }, (_, i) =>
        formatter.format(new Date(2020, i, 1))
      );
    } catch {
      return Array.from({ length: 12 }, (_, i) => `${i + 1}`);
    }
  }, [currentLocale]);

  // Auto-select first course when none selected
  useEffect(() => {
    if (Array.isArray(courses) && courses.length > 0) {
      const firstId =
        (courses[0] as any)?.id ??
        (courses[0] as any)?.value ??
        (courses[0] as any)?.course_id;
      if (firstId && (!selectedCourse || selectedCourse === "all")) {
        setSelectedCourse(String(firstId));
      }
    }
  }, [courses, selectedCourse]);

  // Reset các bộ lọc chủ đề/bài học/bài luyện tập khi đổi khóa học
  useEffect(() => {
    setSelectedChapter("all");
    setLessons([]);
    setSelectedLesson([]);
    setSelectedSpecificAssignment([]);
    setHomeworks([]);
  }, [selectedCourse]);

  // Fetch chapters when course changes
  useEffect(() => {
    const fetchChapters = async () => {
      if (!selectedCourse) {
        setChapters([]);
        setSelectedChapter("all");
        setLessons([]);
        setSelectedLesson([]);
        setSelectedSpecificAssignment([]);
        return;
      }

      try {
        const response = await getListChapter({
          course_id: selectedCourse,
        });
        if (response.data?.chapters) {
          setChapters(response.data.chapters);
        }
      } catch (error) {
        console.error("Error fetching chapters:", error);
        setChapters([]);
      }
    };

    fetchChapters();
  }, [selectedCourse]);

  // Fetch lessons when course or chapter changes
  useEffect(() => {
    const fetchLessons = async () => {
      if (!selectedCourse) {
        setLessons([]);
        setSelectedLesson([]);
        setSelectedSpecificAssignment([]);
        return;
      }

      try {
        const params: any = {
          course_id: selectedCourse,
        };

        if (selectedChapter && selectedChapter !== "all") {
          params.chapter_id = selectedChapter;
        }

        const response = await getListLesson(params);
        if (response.data?.lessons) {
          setLessons(response.data.lessons);
        }
      } catch (error) {
        console.error("Error fetching lessons:", error);
        setLessons([]);
      }
    };

    fetchLessons();
  }, [selectedCourse, selectedChapter]);

  // Fetch homeworks when course, chapter or lesson changes
  useEffect(() => {
    const fetchHomeworks = async () => {
      if (!selectedCourse && selectedLesson.length === 0) {
        setHomeworks([]);
        return;
      }

      try {
        const params: any = {};
        const { startDateTimestamp, endDateTimestamp } = calculateDateRange();

        // Luôn truyền course_id nếu có
        if (selectedCourse) {
          params.course_id = selectedCourse;
        }

        // Nếu chọn chủ đề cụ thể (không phải "tất cả") => truyền chapter_id
        if (selectedChapter && selectedChapter !== "all") {
          params.chapter_id = selectedChapter;
        }

        // Nếu chọn bài học cụ thể => truyền lesson_ids
        if (selectedLesson.length > 0) {
          params.lesson_ids = selectedLesson.join(",");
        }

        // Thêm start_date và end_date
        params.start_date = startDateTimestamp;
        params.end_date = endDateTimestamp;

        const response = await getListHomework(params);
        if (response.data?.homeworks) {
          setHomeworks(response.data.homeworks);
        }
      } catch (error) {
        console.error("Error fetching homeworks:", error);
      }
    };

    fetchHomeworks();
  }, [
    selectedCourse,
    selectedChapter,
    selectedLesson,
    startDate,
    endDate,
    year,
    month,
  ]);

  // Reset lesson and specific assignment when chapter changes
  useEffect(() => {
    setSelectedLesson([]);
    setSelectedSpecificAssignment([]);
  }, [selectedChapter]);

  // Reset specific assignment when lesson changes
  useEffect(() => {
    setSelectedSpecificAssignment([]);
  }, [selectedLesson]);

  // Reset specific assignment when there are no homeworks
  useEffect(() => {
    if (
      filteredHomeworks.length === 0 &&
      selectedSpecificAssignment.length > 0
    ) {
      setSelectedSpecificAssignment([]);
    }
  }, [filteredHomeworks.length, selectedSpecificAssignment]);

  const [studentData, setStudentData] = useState<HomeworkStudentData[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // State cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalStudents, setTotalStudents] = useState(0);

  // State cho modal chi tiết bài tập theo học sinh
  const [selectedStudent, setSelectedStudent] =
    useState<HomeworkStudentData | null>(null);
  const [studentHomeworkModalOpen, setStudentHomeworkModalOpen] =
    useState(false);
  const [studentHomeworkData, setStudentHomeworkData] = useState<
    StudentHomeworkItem[]
  >([]);
  const [studentHomeworkLoading, setStudentHomeworkLoading] = useState(false);
  const [studentHomeworkError, setStudentHomeworkError] = useState<
    string | null
  >(null);
  const [studentHomeworkTotal, setStudentHomeworkTotal] = useState(0);
  const [studentHomeworkPage, setStudentHomeworkPage] = useState(1);
  const [studentHomeworkPageSize, setStudentHomeworkPageSize] = useState(10);

  // Auto-select first course when none selected
  useEffect(() => {
    if (Array.isArray(courses) && courses.length > 0) {
      const firstId =
        (courses[0] as any)?.id ??
        (courses[0] as any)?.value ??
        (courses[0] as any)?.course_id;
      if (firstId && (!selectedCourse || selectedCourse === "all")) {
        setSelectedCourse(String(firstId));
      }
    }
  }, [courses, selectedCourse, setSelectedCourse]);

  const handleStudentRowClick = (student: HomeworkStudentData) => {
    if (selectedSpecificAssignment.length === 1) return;
    setSelectedStudent(student);
    setStudentHomeworkModalOpen(true);
  };

  const handleStudentModalOpenChange = (open: boolean) => {
    setStudentHomeworkModalOpen(open);
    if (!open) {
      setSelectedStudent(null);
      setStudentHomeworkData([]);
      setStudentHomeworkError(null);
      setStudentHomeworkTotal(0);
      setStudentHomeworkPage(1);
      setStudentHomeworkPageSize(10);
    }
  };

  const formatSubmittedAt = (submittedAt: string) => {
    if (!submittedAt || submittedAt === "0") {
      return t("details.notSubmittedLabel");
    }

    try {
      const date = new Date(Number(submittedAt) * 1000);
      return new Intl.DateTimeFormat(currentLocale, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
    } catch {
      return submittedAt;
    }
  };

  const getHomeworkStatusDisplay = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      completed: {
        label: t("details.completedLabel"),
        className: "bg-green-100 text-green-700",
      },
      in_progress: {
        label: t("details.inProgressLabel"),
        className: "bg-blue-100 text-blue-700",
      },
      not_started: {
        label: t("details.notStartedLabel"),
        className: "bg-gray-100 text-gray-700",
      },
    };

    return (
      statusMap[status] ?? {
        label: status,
        className: "bg-gray-100 text-gray-700",
      }
    );
  };

  useEffect(() => {
    const fetchStudentHomeworks = async () => {
      if (
        !studentHomeworkModalOpen ||
        !selectedStudent ||
        !selectedCourse ||
        isSingleAssignmentView
      ) {
        return;
      }

      setStudentHomeworkLoading(true);
      setStudentHomeworkError(null);

      try {
        const { startDateTimestamp, endDateTimestamp } = calculateDateRange();
        const params: any = {
          course_id: selectedCourse,
          start_date: startDateTimestamp,
          end_date: endDateTimestamp,
          student_id: selectedStudent.student_id,
          page: studentHomeworkPage,
          limit: studentHomeworkPageSize,
          order_by: orderBy,
        };

        if (selectedLesson.length > 0) {
          params.lesson_ids = selectedLesson.join(",");
        }
        if (selectedChapter && selectedChapter !== "all") {
          params.chapter_id = selectedChapter;
        }
        if (isSpecificAssignmentView && selectedSpecificAssignment.length > 0) {
          params.homework_ids = selectedSpecificAssignment.join(",");
        }

        const response = await getTeacherListHomeworks(params);

        if (response.data?.homeworks) {
          setStudentHomeworkData(response.data.homeworks);
          if (response.data.total) {
            setStudentHomeworkTotal(parseInt(response.data.total));
          } else {
            setStudentHomeworkTotal(response.data.homeworks.length);
          }
        } else {
          setStudentHomeworkData([]);
          setStudentHomeworkTotal(0);
        }
      } catch (error) {
        console.error("Error fetching student homeworks:", error);
        setStudentHomeworkError(t("details.fetchHomeworkError"));
        setStudentHomeworkData([]);
        setStudentHomeworkTotal(0);
      } finally {
        setStudentHomeworkLoading(false);
      }
    };

    fetchStudentHomeworks();
  }, [
    studentHomeworkModalOpen,
    selectedStudent,
    selectedCourse,
    selectedChapter,
    selectedLesson,
    selectedSpecificAssignment,
    isSpecificAssignmentView,
    isSingleAssignmentView,
    orderBy,
    startDate,
    endDate,
    year,
    month,
    studentHomeworkPage,
    studentHomeworkPageSize,
    t,
  ]);

  useEffect(() => {
    if (studentHomeworkModalOpen) {
      setStudentHomeworkPage(1);
    }
  }, [
    selectedStudent,
    selectedCourse,
    selectedChapter,
    selectedLesson,
    selectedSpecificAssignment,
    orderBy,
    startDate,
    endDate,
    year,
    month,
    studentHomeworkModalOpen,
  ]);

  // Reset về trang đầu khi thay đổi filter (KHÔNG phải khi thay đổi trang)
  useEffect(() => {
    setCurrentPage(1);
  }, [
    selectedCourse,
    selectedChapter,
    selectedLesson,
    selectedSpecificAssignment,
    isSpecificAssignmentView,
    filteredHomeworks,
    startDate,
    endDate,
    year,
    month,
  ]);

  // Fetch student data khi course, homework, hoặc trang thay đổi
  useEffect(() => {
    const fetchStudentData = async () => {
      // Logic mới: chỉ cần 1 trong 2 param (course hoặc lesson)
      // Nếu cả 2 đều được chọn, lesson sẽ được ưu tiên
      const hasCourseOrLesson = selectedCourse || selectedLesson.length > 0;
      if (!hasCourseOrLesson) {
        setStudentData([]);
        setTotalStudents(0);
        return;
      }

      setLoading(true);
      try {
        // Tính toán start_date và end_date từ các bộ lọc
        const { startDateTimestamp, endDateTimestamp } = calculateDateRange();

        // API yêu cầu course_id là bắt buộc
        if (!selectedCourse) {
          setStudentData([]);
          setTotalStudents(0);
          return;
        }

        if (isSpecificAssignmentView) {
          // Check if selected assignments exist in filtered homeworks
          const assignmentExists = selectedSpecificAssignment.every(
            (hwId: string) =>
              filteredHomeworks.some((hw: any) => hw.id === hwId)
          );
          if (!assignmentExists) {
            setStudentData([]);
            setTotalStudents(0);
            return;
          }
        }

        const params: any = {
          course_id: selectedCourse,
          start_date: startDateTimestamp,
          end_date: endDateTimestamp,
          page: currentPage,
          limit: pageSize,
          order_by: orderBy,
        };

        if (selectedLesson.length > 0) {
          params.lesson_ids = selectedLesson.join(",");
        }
        if (selectedChapter && selectedChapter !== "all") {
          params.chapter_id = selectedChapter;
        }
        if (isSpecificAssignmentView && selectedSpecificAssignment.length > 0) {
          params.homework_ids = selectedSpecificAssignment.join(",");
        }

        const response = await getTeacherAllHomework(params);

        if (response.data?.students) {
          setStudentData(response.data.students);

          // Cập nhật tổng số học sinh từ response
          if (response.data.total) {
            // Ưu tiên field 'total' vì API trả về field này
            setTotalStudents(parseInt(response.data.total));
          } else if (response.data.total_students) {
            // Fallback: thử dùng field 'total_students'
            setTotalStudents(parseInt(response.data.total_students));
          } else {
            // Fallback: nếu không có thông tin tổng, chỉ hiển thị trang hiện tại
            setTotalStudents(response.data.students.length);
          }
        } else {
          setStudentData([]);
          setTotalStudents(0);
        }
      } catch (error) {
        console.error("Error fetching student data:", error);
        setStudentData([]);
        setTotalStudents(0);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [
    selectedCourse,
    selectedChapter,
    selectedLesson,
    selectedSpecificAssignment,
    isSpecificAssignmentView,
    filteredHomeworks,
    currentPage,
    pageSize,
    startDate,
    endDate,
    year,
    month,
    orderBy,
  ]);

  // Helper function để tạo tên file
  const generateFileName = (isDetail: boolean = false) => {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");

    // Helper function để sanitize tên file (loại bỏ ký tự đặc biệt)
    const sanitizeFileName = (name: string) => {
      return name
        .replace(/[<>:"/\\|?*]/g, "") // Loại bỏ ký tự không hợp lệ
        .replace(/\s+/g, "-") // Thay khoảng trắng bằng dấu gạch ngang
        .trim();
    };

    // Lấy tên khóa học
    const course = courses.find((c) => c.id === selectedCourse);
    const courseName = course ? sanitizeFileName(course.name || "") : "";

    // Lấy tên chủ đề (nếu có cụ thể)
    let chapterName = "";
    if (selectedChapter && selectedChapter !== "all") {
      const chapter = chapters.find((c) => c.id === selectedChapter);
      chapterName = chapter
        ? sanitizeFileName(chapter.title || chapter.name || "")
        : "";
    }

    // Lấy tên bài học (nếu có cụ thể)
    let lessonNames: string[] = [];
    if (selectedLesson.length > 0) {
      lessonNames = selectedLesson
        .map((lessonId) => {
          const lesson = lessons.find((l) => l.id === lessonId);
          return lesson ? sanitizeFileName(lesson.title || "") : "";
        })
        .filter((name) => name !== "");
    }

    // Lấy tên bài luyện tập (nếu có cụ thể)
    let homeworkNames: string[] = [];
    if (isDetail && isSingleAssignmentView) {
      // Trường hợp export detail (1 bài tập)
      const homework = filteredHomeworks.find(
        (hw) => hw.id === selectedSpecificAssignment[0]
      );
      if (homework) {
        homeworkNames = [sanitizeFileName(homework.name || "")];
      }
    } else if (
      isSpecificAssignmentView &&
      selectedSpecificAssignment.length > 0
    ) {
      // Trường hợp export all (nhiều bài tập)
      homeworkNames = selectedSpecificAssignment
        .map((hwId) => {
          const homework = filteredHomeworks.find((hw) => hw.id === hwId);
          return homework ? sanitizeFileName(homework.name || "") : "";
        })
        .filter((name) => name !== "");
    }

    // Tạo tên file
    const fileNameParts: string[] = ["homework-report"];

    if (courseName) {
      fileNameParts.push(courseName);
    }
    if (chapterName) {
      fileNameParts.push(chapterName);
    }
    if (lessonNames.length > 0) {
      // Nếu có nhiều bài học, chỉ lấy tên đầu tiên và thêm số lượng
      if (lessonNames.length === 1) {
        fileNameParts.push(lessonNames[0]);
      } else {
        fileNameParts.push(
          `${lessonNames[0]}-va-${lessonNames.length - 1}-bai-hoc-khac`
        );
      }
    }
    if (homeworkNames.length > 0) {
      // Nếu có nhiều bài luyện tập, chỉ lấy tên đầu tiên và thêm số lượng
      if (homeworkNames.length === 1) {
        fileNameParts.push(homeworkNames[0]);
      } else {
        fileNameParts.push(
          `${homeworkNames[0]}-va-${homeworkNames.length - 1}-bai-khac`
        );
      }
    }

    fileNameParts.push(timestamp);

    return `${fileNameParts.join("-")}.xlsx`;
  };

  // Handle export cho getTeacherAllHomework
  const handleExport = async () => {
    if (!selectedCourse) {
      return;
    }

    setExporting(true);
    try {
      const { startDateTimestamp, endDateTimestamp } = calculateDateRange();

      const params: any = {
        course_id: selectedCourse,
        start_date: startDateTimestamp,
        end_date: endDateTimestamp,
        order_by: orderBy,
      };

      if (selectedLesson.length > 0) {
        params.lesson_ids = selectedLesson.join(",");
      }
      if (selectedChapter && selectedChapter !== "all") {
        params.chapter_id = selectedChapter;
      }

      if (isSpecificAssignmentView && selectedSpecificAssignment.length > 0) {
        const homeworkIdsString = selectedSpecificAssignment.join(",");
        params.homework_ids = homeworkIdsString;
      }

      const blob = await exportTeacherAllHomework(params);

      // Tạo URL từ blob và download
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;

      const fileName = generateFileName(false);
      link.setAttribute("download", fileName);

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting homework data:", error);
    } finally {
      setExporting(false);
    }
  };

  // Handle export chi tiết cho từng bài tập
  const handleExportDetail = async () => {
    if (!selectedCourse || !isSingleAssignmentView) {
      return;
    }

    setExporting(true);
    try {
      const { startDateTimestamp, endDateTimestamp } = calculateDateRange();

      const blob = await exportTeacherDetailHomework({
        course_id: selectedCourse,
        homework_id: selectedSpecificAssignment[0],
        start_date: startDateTimestamp,
        end_date: endDateTimestamp,
        page: currentPage,
        limit: pageSize,
      });

      // Tạo URL từ blob và download
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;

      const fileName = generateFileName(true);
      link.setAttribute("download", fileName);

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting homework detail data:", error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Homework Filters */}
      <Card className="bg-white rounded-2xl border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Năm */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-emerald-600" />
                {t("filters.year")}
              </label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="h-11 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-200 bg-gray-50 hover:bg-white transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Tháng */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-600" />
                {t("filters.month")}
              </label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="h-11 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-200 bg-gray-50 hover:bg-white transition-colors">
                  <SelectValue placeholder={t("selectMonthPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("all")}</SelectItem>
                  {monthNames.map((name, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Thời gian từ - đến */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <CalendarRange className="h-4 w-4 text-emerald-600" />
                {t("filters.fromDate")}
              </label>
              <input
                type="date"
                className="mt-1 w-full h-11 rounded-xl border border-gray-200 px-3 focus:border-emerald-500 focus:ring-emerald-200 bg-gray-50 hover:bg-white"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-emerald-600" />
                {t("filters.toDate")}
              </label>
              <input
                type="date"
                className="mt-1 w-full h-11 rounded-xl border border-gray-200 px-3 focus:border-emerald-500 focus:ring-emerald-200 bg-gray-50 hover:bg-white"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-emerald-600" />
                {t("filters.course")}
              </label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger className="h-11 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-200 bg-gray-50 hover:bg-white transition-colors">
                  <SelectValue placeholder={t("filters.selectCourse")}>
                    {(() => {
                      const course = courses.find((c) => c.id === selectedCourse);
                      return course
                        ? course.object_title
                          ? `${course.name} (${course.object_title})`
                          : course.name
                        : t("filters.selectCourse");
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-200">
                  {courses.map((course) => (
                    <SelectItem
                      key={course.id}
                      value={course.id}
                      className="rounded-lg"
                    >
                      {course.object_title
                        ? `${course.name} (${course.object_title})`
                        : course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-emerald-600" />
                {t("filters.chapter")}
              </label>
              <Select
                value={selectedChapter}
                onValueChange={setSelectedChapter}
                disabled={!selectedCourse}
              >
                <SelectTrigger className="h-11 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-200 bg-gray-50 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <SelectValue placeholder={t("filters.selectChapter")}>
                    {selectedChapter === "all"
                      ? t("filters.allChapters")
                      : (() => {
                        const chapter = chapters.find(
                          (chapter) => chapter.id === selectedChapter
                        );
                        return chapter
                          ? chapter.title || chapter.name
                          : t("filters.selectChapter");
                      })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-200">
                  <SelectItem value="all" className="rounded-lg">
                    {t("filters.allChapters")}
                  </SelectItem>
                  {!selectedCourse ? (
                    <SelectItem
                      value="no-selection"
                      disabled
                      className="rounded-lg text-gray-400"
                    >
                      {t("filters.pleaseSelectCourse")}
                    </SelectItem>
                  ) : chapters.length === 0 ? (
                    <SelectItem
                      value="no-chapters"
                      disabled
                      className="rounded-lg text-gray-400"
                    >
                      {t("filters.noChaptersAvailable")}
                    </SelectItem>
                  ) : (
                    chapters.map((chapter) => (
                      <SelectItem
                        key={chapter.id}
                        value={chapter.id}
                        className="rounded-lg"
                      >
                        {chapter.title || chapter.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-emerald-600" />
                {t("filters.lesson")}
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-11 w-full justify-start rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-200 bg-gray-50 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left font-normal"
                    disabled={!selectedCourse}
                  >
                    {selectedLesson.length === 0
                      ? !selectedCourse
                        ? t("filters.pleaseSelectCourse")
                        : lessons.length === 0
                          ? t("filters.noLessonsAvailable")
                          : t("filters.allLessons")
                      : selectedLesson.length === 1
                        ? lessons.find(
                          (lesson) => lesson.id === selectedLesson[0]
                        )?.title || t("filters.selectLesson")
                        : `${selectedLesson.length} ${t("filters.selected")}`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[400px] p-0 rounded-xl border-gray-200"
                  align="start"
                >
                  <div className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                        <Checkbox
                          id="select-all-lessons"
                          checked={selectedLesson.length === 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              // Chọn "Tất cả" = không chọn bài nào cụ thể
                              setSelectedLesson([]);
                            }
                          }}
                        />
                        <label
                          htmlFor="select-all-lessons"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                        >
                          {t("filters.allLessons")}
                        </label>
                      </div>
                      <div className="border-t border-gray-200 my-2"></div>
                      {!selectedCourse ? (
                        <div className="p-2 text-sm text-gray-400 text-center">
                          {t("filters.pleaseSelectCourse")}
                        </div>
                      ) : lessons.length === 0 ? (
                        <div className="p-2 text-sm text-gray-400 text-center">
                          {t("filters.noLessonsAvailable")}
                        </div>
                      ) : (
                        <div className="max-h-[300px] overflow-y-auto space-y-1">
                          {lessons.map((lesson) => (
                            <div
                              key={lesson.id}
                              className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                            >
                              <Checkbox
                                id={`lesson-${lesson.id}`}
                                checked={selectedLesson.includes(lesson.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedLesson([
                                      ...selectedLesson,
                                      lesson.id,
                                    ]);
                                  } else {
                                    setSelectedLesson(
                                      selectedLesson.filter(
                                        (id) => id !== lesson.id
                                      )
                                    );
                                  }
                                }}
                              />
                              <label
                                htmlFor={`lesson-${lesson.id}`}
                                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                              >
                                {lesson.title}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-emerald-600" />
                {t("filters.specificHomework")}
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-11 w-full justify-start rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-200 bg-gray-50 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left font-normal"
                    disabled={
                      (!selectedCourse && selectedLesson.length === 0) ||
                      filteredHomeworks.length === 0
                    }
                  >
                    {selectedSpecificAssignment.length === 0
                      ? !selectedCourse && selectedLesson.length === 0
                        ? t("filters.pleaseSelectCourse")
                        : filteredHomeworks.length === 0
                          ? t("filters.noHomeworkAvailable")
                          : t("filters.allHomework")
                      : selectedSpecificAssignment.length === 1
                        ? sortedHomeworkOptions.find(
                          (homework) =>
                            homework.id === selectedSpecificAssignment[0]
                        )?.name || t("filters.selectSpecificHomework")
                        : `${selectedSpecificAssignment.length} ${t(
                          "filters.selected"
                        )}`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[400px] p-0 rounded-xl border-gray-200"
                  align="start"
                >
                  <div className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                        <Checkbox
                          id="select-all"
                          checked={selectedSpecificAssignment.length === 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              // Chọn "Tất cả" = không chọn bài nào cụ thể = không truyền homework_ids
                              setSelectedSpecificAssignment([]);
                            }
                            // Khi bỏ chọn "Tất cả", giữ nguyên trạng thái hiện tại
                            // (selectedSpecificAssignment.length === 0 sẽ tự động bỏ chọn checkbox)
                          }}
                        />
                        <label
                          htmlFor="select-all"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                        >
                          {t("filters.allHomework")}
                        </label>
                      </div>
                      <div className="border-t border-gray-200 my-2"></div>
                      {!selectedCourse && selectedLesson.length === 0 ? (
                        <div className="p-2 text-sm text-gray-400 text-center">
                          {t("filters.pleaseSelectCourse")}
                        </div>
                      ) : filteredHomeworks.length === 0 ? (
                        <div className="p-2 text-sm text-gray-400 text-center">
                          {t("filters.noHomeworkAvailable")}
                        </div>
                      ) : (
                        <div className="max-h-[300px] overflow-y-auto space-y-1">
                          {sortByNumberAndAlphabetFromSecondGeneric(sortedHomeworkOptions, item => item.name, true).map((homework) => (
                            <div
                              key={homework.id}
                              className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                            >
                              <Checkbox
                                id={`homework-${homework.id}`}
                                checked={selectedSpecificAssignment.includes(
                                  homework.id
                                )}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedSpecificAssignment([
                                      ...selectedSpecificAssignment,
                                      homework.id,
                                    ]);
                                  } else {
                                    setSelectedSpecificAssignment(
                                      selectedSpecificAssignment.filter(
                                        (id) => id !== homework.id
                                      )
                                    );
                                  }
                                }}
                              />
                              <label
                                htmlFor={`homework-${homework.id}`}
                                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                              >
                                {homework.name} - {homework.lesson_title}
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Homework Details */}
      <Card className="bg-white rounded-2xl border-0 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {t("details.title")}
                </CardTitle>
                <p className="text-gray-500 text-sm mt-1">
                  {t("details.subtitle")}
                </p>
              </div>
            </div>

            {/* Sắp xếp và Xuất báo cáo */}
            <div className="flex items-center gap-3 flex-wrap my-5 md:m-0">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-emerald-600" />
                {t("details.orderBy")}
              </label>
              <Select
                value={orderBy}
                onValueChange={(value) =>
                  setOrderBy(value as "completed_homework" | "average_score")
                }
              >
                <SelectTrigger className="w-48 h-10 rounded-lg border-gray-200 focus:border-emerald-500 focus:ring-emerald-200 bg-gray-50 hover:bg-white transition-colors">
                  <SelectValue placeholder="Chọn cách sắp xếp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed_homework">
                    {t("details.completedHomework")}
                  </SelectItem>
                  <SelectItem value="average_score">
                    {t("details.averageScore")}
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={handleExport}
                disabled={exporting || !selectedCourse}
                className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {exporting ? t("details.exporting") : t("details.export")}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <Table className="text-sm">
                <TableHeader>
                  <TableRow className="border-gray-100 bg-gray-50">
                    <TableHead className="text-sm font-bold text-gray-700 bg-gray-50 rounded-l-xl px-6">
                      {t("details.student")}
                    </TableHead>
                    {isSingleAssignmentView ? (
                      <>
                        <TableHead className="text-sm font-bold text-gray-700 bg-gray-50 text-center px-6">
                          {t("overview.totalQuestionsLabel")}
                        </TableHead>
                        <TableHead className="text-sm font-bold text-gray-700 bg-gray-50 text-center px-6">
                          {t("overview.questionsCompletedLabel")}
                        </TableHead>
                        <TableHead className="text-sm font-bold text-gray-700 bg-gray-50 text-center px-6 rounded-r-xl">
                          {t("details.completionRate")}
                        </TableHead>
                        <TableHead className="text-sm font-bold text-gray-700 bg-gray-50 text-center px-6 rounded-r-xl">
                          {t("details.ratio")}
                        </TableHead>
                      </>
                    ) : (
                      <>
                        <TableHead className="text-sm font-bold text-gray-700 bg-gray-50 text-center px-6">
                          {t("details.totalHomeworkLabel")}
                        </TableHead>
                        <TableHead className="text-sm font-bold text-gray-700 bg-gray-50 text-center px-6">
                          {t("details.totalAssignedHomeworkLabel")}
                        </TableHead>
                        <TableHead className="text-sm font-bold text-gray-700 bg-gray-50 text-center px-6">
                          {t("details.completedLabel")}
                        </TableHead>
                        <TableHead className="text-sm font-bold text-gray-700 bg-gray-50 text-center px-6">
                          {t("details.inProgressLabel")}
                        </TableHead>
                        <TableHead className="text-sm font-bold text-gray-700 bg-gray-50 text-center px-6">
                          {t("details.notStartedLabel")}
                        </TableHead>
                        <TableHead className="text-sm font-bold text-gray-700 bg-gray-50 text-center px-6 rounded-r-xl">
                          {t("details.completionRate")}
                        </TableHead>
                        <TableHead className="text-sm font-bold text-gray-700 bg-gray-50 text-center px-6 rounded-r-xl">
                          {t("details.averageRatio")}
                        </TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentData.length > 0 ? (
                    studentData.map((student) => {
                      if (isSingleAssignmentView) {
                        // Hiển thị cho bài tập cụ thể
                        const completionRate =
                          student.total_questions && student.questions_completed
                            ? Math.round(
                              (parseInt(student.questions_completed) /
                                parseInt(student.total_questions)) *
                              100
                            )
                            : 0;

                        return (
                          <TableRow
                            key={student.student_id}
                            className="border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            <TableCell className="px-6 py-3 font-semibold text-gray-900">
                              {student.student_name}
                            </TableCell>
                            <TableCell className="px-6 py-3 text-center tabular-nums">
                              {student.total_questions}
                            </TableCell>
                            <TableCell className="px-6 py-3 text-center tabular-nums text-green-600 font-medium">
                              {student.questions_completed}
                            </TableCell>
                            <TableCell className="px-6 py-3 text-center">
                              <Badge
                                className={`${completionRate >= 80
                                    ? "bg-green-100 text-green-700"
                                    : completionRate >= 60
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-red-100 text-red-700"
                                  } rounded-full px-3 py-1 font-bold`}
                              >
                                {completionRate}%
                              </Badge>
                            </TableCell>
                            <TableCell className="px-6 py-3 text-center tabular-nums text-green-600 font-medium">
                              <Badge
                                className={`${Math.round(
                                  parseFloat(student.average_ratio)
                                ) >= 80
                                    ? "bg-green-100 text-green-700"
                                    : Math.round(
                                      parseFloat(student.average_ratio)
                                    ) >= 60
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-red-100 text-red-700"
                                  } rounded-full px-3 py-1 font-bold`}
                              >
                                {Math.round(parseFloat(student.average_ratio))}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      } else {
                        // Hiển thị cho tất cả bài tập
                        const completionRate =
                          student.total_assigned_homeworks &&
                            student.completed_homework
                            ? Math.round(
                              (parseInt(student.completed_homework) /
                                parseInt(student.total_assigned_homeworks)) *
                              100
                            )
                            : 0;

                        return (
                          <TableRow
                            key={student.student_id}
                            onClick={() => handleStudentRowClick(student)}
                            className="border-gray-100 hover:bg-gray-50 transition-colors"
                          >
                            <TableCell className="px-6 py-3 font-semibold text-gray-900">
                              {student.student_name}
                            </TableCell>
                            <TableCell className="px-6 py-3 text-center tabular-nums">
                              {student.total_homework}
                            </TableCell>
                            <TableCell className="px-6 py-3 text-center tabular-nums">
                              {student.total_assigned_homeworks}
                            </TableCell>
                            <TableCell className="px-6 py-3 text-center tabular-nums text-green-600 font-medium">
                              {student.completed_homework}
                            </TableCell>
                            <TableCell className="px-6 py-3 text-center tabular-nums text-blue-600 font-medium">
                              {student.in_progress_homework}
                            </TableCell>
                            <TableCell className="px-6 py-3 text-center tabular-nums text-gray-600 font-medium">
                              {student.not_started_homework}
                            </TableCell>
                            <TableCell className="px-6 py-3 text-center">
                              <Badge
                                className={`${completionRate >= 80
                                    ? "bg-green-100 text-green-700"
                                    : completionRate >= 50
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-red-100 text-red-700"
                                  } rounded-full px-3 py-1 font-bold`}
                              >
                                {completionRate}%
                              </Badge>
                            </TableCell>
                            <TableCell className="px-6 py-3 text-center">
                              <Badge
                                className={`${Math.round(
                                  parseFloat(student.average_ratio)
                                ) >= 80
                                    ? "bg-green-100 text-green-700"
                                    : Math.round(
                                      parseFloat(student.average_ratio)
                                    ) >= 60
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-red-100 text-red-700"
                                  } rounded-full px-3 py-1 font-bold`}
                              >
                                {Math.round(parseFloat(student.average_ratio))}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      }
                    })
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={isSingleAssignmentView ? 4 : 8}
                        className="text-center text-gray-500 py-8"
                      >
                        {!selectedCourse && selectedLesson.length === 0
                          ? t("details.selectCourseFirst")
                          : filteredHomeworks.length === 0
                            ? t("details.noData")
                            : t("details.noData")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Professional Pagination */}
      {studentData.length > 0 && (
        <ProfessionalPagination
          currentPage={currentPage}
          totalPages={Math.ceil(totalStudents / pageSize)}
          totalCount={totalStudents}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1); // Reset về trang đầu khi thay đổi page size
          }}
          pageSizeOptions={[5, 10, 20, 50]}
          showPageSizeSelector={true}
          showPaginationInfo={true}
          itemName={t("pagination.students")}
        />
      )}

      <Dialog
        open={studentHomeworkModalOpen}
        onOpenChange={handleStudentModalOpenChange}
      >
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {t("details.studentHomeworkModalTitle", {
                student: selectedStudent?.student_name ?? "",
              })}
            </DialogTitle>
            <p className="text-sm text-gray-500">
              {t("details.totalAssignedHomeworkLabel")}: {studentHomeworkTotal}
            </p>
          </DialogHeader>
          {studentHomeworkLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, index) => (
                <div
                  key={index}
                  className="h-4 bg-gray-200 rounded animate-pulse"
                />
              ))}
            </div>
          ) : studentHomeworkError ? (
            <div className="text-red-500 text-sm">{studentHomeworkError}</div>
          ) : studentHomeworkData.length === 0 ? (
            <div className="text-center text-gray-500 py-6">
              {t("details.noData")}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <Table className="text-sm">
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="px-4 py-3 font-semibold text-gray-700">
                      {t("details.homeworkNameLabel")}
                    </TableHead>
                    <TableHead className="px-4 py-3 font-semibold text-gray-700">
                      {t("details.lessonLabel")}
                    </TableHead>
                    <TableHead className="px-4 py-3 font-semibold text-gray-700 text-center">
                      {t("overview.totalQuestionsLabel")}
                    </TableHead>
                    <TableHead className="px-4 py-3 font-semibold text-gray-700 text-center">
                      {t("overview.questionsCompletedLabel")}
                    </TableHead>
                    <TableHead className="px-4 py-3 font-semibold text-gray-700 text-center">
                      {t("details.statusLabel")}
                    </TableHead>
                    <TableHead className="px-4 py-3 font-semibold text-gray-700 text-center">
                      {t("details.submittedAtLabel")}
                    </TableHead>
                    <TableHead className="px-4 py-3 font-semibold text-gray-700 text-center">
                      {t("details.assignLabel")}
                    </TableHead>
                    <TableHead className="px-4 py-3 font-semibold text-gray-700 text-center">
                      {t("details.assignedAtLabel")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentHomeworkData.map((item) => {
                    const statusInfo = getHomeworkStatusDisplay(item.status);
                    return (
                      <TableRow
                        key={item.homework_id}
                        className="hover:bg-gray-50"
                      >
                        <TableCell className="px-4 py-3 font-semibold text-gray-900">
                          {item.homework_name}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-gray-700">
                          {item.lesson_name}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center tabular-nums">
                          {item.total_questions}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center tabular-nums text-green-600">
                          {item.questions_completed}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          <Badge
                            className={`${statusInfo.className} rounded-full px-3 py-1`}
                          >
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center text-gray-600">
                          {formatSubmittedAt(item.submitted_at)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          <Badge
                            className={`rounded-full px-3 py-1 ${item.assign_late ? "bg-red-500 text-white" : "bg-green-500 text-white"
                              }`}
                          >
                            {item.assign_late
                              ? t("details.assignLate")
                              : t("details.assignOnTime")
                            }
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center text-gray-600">
                          {item.assigned_at ? formatSubmittedAt(item.assigned_at) : ""}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          {studentHomeworkData.length > 0 && (
            <div className="mt-1">
              <ProfessionalPagination
                currentPage={studentHomeworkPage}
                totalPages={Math.ceil(
                  studentHomeworkTotal / studentHomeworkPageSize
                )}
                totalCount={studentHomeworkTotal}
                pageSize={studentHomeworkPageSize}
                onPageChange={setStudentHomeworkPage}
                onPageSizeChange={(size) => {
                  setStudentHomeworkPageSize(size);
                  setStudentHomeworkPage(1);
                }}
                pageSizeOptions={[5, 10, 20, 50]}
                showPageSizeSelector={true}
                showPaginationInfo={true}
                itemName={t("pagination.homeworks")}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
