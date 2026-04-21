"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useTypedTranslations, useCurrentLocale } from "@/lib/i18n/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Calendar,
  CalendarClock,
  Edit,
  Eye,
  GraduationCap,
  ClipboardList,
  Clock,
  CheckCircle2,
  Loader2,
  Save,
  Share2,
  Upload,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { GetCourseList } from "@/lib/api/courses";
import { GetSubjectsList } from "@/lib/api/subjects";
import {
  GetAssessmentList,
  Assessment,
  GetAssessmentStudents,
  AssessmentStudentItem,
  SaveAssessmentScoresBulk,
  ImportAssessmentExcel,
  PublishAssessmentScore,
  GetPublishAssessmentScore,
  type FileInfo,
} from "@/lib/api/assessment";
import {
  GetStudyReportEvaluates,
  StudyReportEvaluateItem,
  PublishStudyReport,
} from "@/lib/api/study-report";
import { useToast } from "@/components/ui/use-toast";
import Loading from "@/app/loading";
import { useUpload } from "@/hooks/use-upload";
import { sortCoursesWithObjectTitle } from "@/lib/utils/course-sort-utils";
import { sortAlphabetGeneric, sortByNumberAndAlphabetFromSecondGeneric } from "@/lib/utils";

const ASSESSMENT_FILTERS_STORAGE_KEY = "assessment-tab-filters";

interface AssessmentFilters {
  selectedSubject: string;
  selectedCourse: string;
  selectedTypeAssessment: "final_exam" | "mini_test" | "all";
  selectedAssessment: string;
}

interface StudentScoreStateItem {
  subScores: Record<string, number | undefined>;
  fileUrls: string[];
  fileInfos: FileInfo[]; // chỉ gồm id, disk, path để gửi lên API save-score
}

type StudentScoresState = Record<string, StudentScoreStateItem>;

export function AssessmentTab() {
  const t = useTypedTranslations("assessmentTab");
  const currentLocale = useCurrentLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { uploadFile } = useUpload();

  // Lấy tab từ query param
  const currentTab = searchParams.get("tab") || "assessment";

  // Khôi phục filters từ localStorage khi mount
  const getStoredFilters = (): AssessmentFilters | null => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(ASSESSMENT_FILTERS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Migration: chuyển đổi từ key cũ sang key mới nếu cần
        if (parsed) {
          const migrated: AssessmentFilters = {
            selectedSubject: parsed.selectedSubject || "",
            selectedCourse: parsed.selectedCourse || "",
            // Chuyển đổi từ reportType sang selectedTypeAssessment
            selectedTypeAssessment:
              parsed.selectedTypeAssessment || parsed.reportType || "all",
            // Chuyển đổi từ reportValue sang selectedAssessment
            selectedAssessment:
              parsed.selectedAssessment || parsed.reportValue || "",
          };
          // Nếu có key cũ, lưu lại với key mới để migration
          if (parsed.reportType || parsed.reportValue) {
            localStorage.setItem(
              ASSESSMENT_FILTERS_STORAGE_KEY,
              JSON.stringify(migrated)
            );
          }
          return migrated;
        }
        return parsed;
      }
    } catch (error) {
      console.error("Error reading filters from localStorage:", error);
    }
    return null;
  };

  // Lưu filters vào localStorage
  const saveFiltersToStorage = (filters: AssessmentFilters) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        ASSESSMENT_FILTERS_STORAGE_KEY,
        JSON.stringify(filters)
      );
    } catch (error) {
      console.error("Error saving filters to localStorage:", error);
    }
  };

  // Xóa filters khỏi localStorage
  const clearFiltersFromStorage = () => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(ASSESSMENT_FILTERS_STORAGE_KEY);
    } catch (error) {
      console.error("Error clearing filters from localStorage:", error);
    }
  };

  const storedFilters = getStoredFilters();

  // Filter states - khôi phục từ localStorage nếu có
  const [selectedSubject, setSelectedSubject] = useState<string>(
    storedFilters?.selectedSubject || ""
  );
  const [selectedCourse, setSelectedCourse] = useState<string>(
    storedFilters?.selectedCourse || ""
  );
  const [selectedTypeAssessment, setSelectedTypeAssessment] = useState<
    "final_exam" | "mini_test" | "all"
  >(storedFilters?.selectedTypeAssessment || "all");
  const [selectedAssessment, setSelectedAssessment] = useState<string>(
    storedFilters?.selectedAssessment || ""
  );

  // Flag để biết đã khôi phục từ localStorage chưa (tránh auto-select ghi đè)
  const [hasRestoredFromStorage, setHasRestoredFromStorage] = useState(
    !!storedFilters
  );

  // Ref để đánh dấu đang điều hướng đến trang assess-student (không xóa key)
  const isNavigatingToAssessStudent = useRef(false);

  // Data states
  const [subjects, setSubjects] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [evaluatedItems, setEvaluatedItems] = useState<
    StudyReportEvaluateItem[]
  >([]);
  const [unevaluatedItems, setUnevaluatedItems] = useState<
    StudyReportEvaluateItem[]
  >([]);
  const [assessmentStudents, setAssessmentStudents] = useState<
    AssessmentStudentItem[]
  >([]);
  const [studentScores, setStudentScores] = useState<StudentScoresState>({});
  const [loading, setLoading] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingAssessmentStudents, setLoadingAssessmentStudents] =
    useState(false);
  const [savingScores, setSavingScores] = useState(false);
  const [isPublished, setIsPublished] = useState<boolean>(false);
  const [publishing, setPublishing] = useState(false);
  const [isPublishedAssessment, setIsPublishedAssessment] =
    useState<boolean>(false);
  const [publishingAssessment, setPublishingAssessment] = useState(false);
  const [importingExcel, setImportingExcel] = useState(false);

  // Ref cho file input Excel
  const excelFileInputRef = useRef<HTMLInputElement>(null);

  // Score range filter states
  const [minScore, setMinScore] = useState<string>("");
  const [maxScore, setMaxScore] = useState<string>("");

  // Student name filter state
  const [studentNameFilter, setStudentNameFilter] = useState<string>("");

  // Sort order state: "asc" | "desc" | ""
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | "">("");

  // Fetch subjects on mount
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoadingSubjects(true);
        const response = await GetSubjectsList();
        if (response?.data?.subjects) {
          const subjectsList = response.data.subjects;
          setSubjects(subjectsList);
          // Auto-select first subject nếu chưa có giá trị từ localStorage
          if (
            subjectsList.length > 0 &&
            !hasRestoredFromStorage &&
            !selectedSubject
          ) {
            setSelectedSubject(String(subjectsList[0].id));
          }
        }
      } catch (error) {
        console.error("Error fetching subjects:", error);
        toast({
          title: t("errors.error"),
          description: t("errors.failedToLoadSubjects"),
          variant: "destructive",
        });
      } finally {
        setLoadingSubjects(false);
      }
    };

    fetchSubjects();
  }, [toast, hasRestoredFromStorage, selectedSubject]);

  // Fetch courses when subject changes
  useEffect(() => {
    const fetchCourses = async () => {
      if (!selectedSubject) {
        setCourses([]);
        setSelectedCourse("");
        setAssessments([]);
        setSelectedAssessment("");
        return;
      }

      try {
        setLoadingCourses(true);
        const params: Record<string, any> = {
          subject_id: selectedSubject,
        };

        const response = await GetCourseList(params);
        if (
          response &&
          ((response.code === 200 && response.data?.courses) ||
            (response.data?.courses && Array.isArray(response.data.courses)))
        ) {
          const coursesList = response.data.courses;
          setCourses(coursesList);

          // Ưu tiên khôi phục khóa học từ localStorage (nếu có và hợp lệ)
          if (coursesList.length > 0) {
            let targetCourseId: string | null = null;

            if (hasRestoredFromStorage && storedFilters?.selectedCourse) {
              const existsInList = coursesList.some((course: any) => {
                const id = String(course?.id || course?.course_id);
                return id === storedFilters.selectedCourse;
              });
              if (existsInList) {
                targetCourseId = storedFilters.selectedCourse;
              }
            }

            // Nếu không có trong localStorage hoặc không tồn tại trong danh sách, chọn khóa học đầu tiên
            if (!targetCourseId) {
              const firstCourse = coursesList[0];
              const courseId = String(
                firstCourse?.id || firstCourse?.course_id
              );
              if (courseId) {
                targetCourseId = courseId;
              }
            }

            setSelectedCourse(targetCourseId || "");
          } else {
            setSelectedCourse("");
          }
        } else {
          setCourses([]);
          setSelectedCourse("");
          setAssessments([]);
          setSelectedAssessment("");
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
        toast({
          title: t("errors.error"),
          description: t("errors.failedToLoadCourses"),
          variant: "destructive",
        });
        setCourses([]);
        setSelectedCourse("");
        setAssessments([]);
        setSelectedAssessment("");
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchCourses();
  }, [selectedSubject, toast, hasRestoredFromStorage]);

  // Fetch assessments when course / subject / type changes
  useEffect(() => {
    const fetchAssessments = async () => {
      if (!selectedCourse) {
        setAssessments([]);
        setSelectedAssessment("");
        return;
      }

      // Reset selectedAssessment trước khi fetch assessments mới
      setSelectedAssessment("");

      try {
        const filters: any = {
          course_id: selectedCourse,
          limit: 1000,
        };

        if (selectedSubject) {
          filters.subject_id = selectedSubject;
        }

        if (selectedTypeAssessment && selectedTypeAssessment !== "all") {
          filters.type = selectedTypeAssessment;
        }

        const result = await GetAssessmentList(filters);
        const list = result.assessment || [];
        setAssessments(list);

        // Tự động chọn assessment đầu tiên nếu có
        if (list.length > 0) {
          setSelectedAssessment(String(list[0].id));
        } else {
          setSelectedAssessment("");
        }
      } catch (error) {
        console.error("Error fetching assessments:", error);
        toast({
          title: t("errors.error"),
          description: t("errors.failedToLoadAssessments"),
          variant: "destructive",
        });
        setAssessments([]);
        setSelectedAssessment("");
      }
    };

    fetchAssessments();
  }, [selectedCourse, selectedSubject, selectedTypeAssessment, toast]);

  // Fetch evaluated and unevaluated items
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedCourse) {
        setEvaluatedItems([]);
        setUnevaluatedItems([]);
        setAssessmentStudents([]);
        setStudentScores({});
        return;
      }

      // Nếu không có selectedAssessment, không gọi API
      // Logic đơn giản: có id thì truyền vào, không có thì không gọi API
      if (!selectedAssessment || selectedAssessment.trim() === "") {
        setEvaluatedItems([]);
        setUnevaluatedItems([]);
        setAssessmentStudents([]);
        setStudentScores({});
        return;
      }

      try {
        setLoading(true);

        // Fetch evaluated items (is_completed = true)
        const evaluatedResponse = await GetStudyReportEvaluates(
          selectedCourse,
          {
            assessment_id: selectedAssessment,
            is_completed: true,
          }
        );

        // Fetch unevaluated items (is_completed = false)
        const unevaluatedResponse = await GetStudyReportEvaluates(
          selectedCourse,
          {
            assessment_id: selectedAssessment,
            is_completed: false,
          }
        );

        if (evaluatedResponse?.code === 200 && evaluatedResponse?.data?.items) {
          setEvaluatedItems(evaluatedResponse.data.items);
          // Cập nhật trạng thái publish từ response
          if (evaluatedResponse.data.publish !== undefined) {
            setIsPublished(evaluatedResponse.data.publish);
          }
        } else {
          setEvaluatedItems([]);
        }

        if (
          unevaluatedResponse?.code === 200 &&
          unevaluatedResponse?.data?.items
        ) {
          setUnevaluatedItems(unevaluatedResponse.data.items);
        } else {
          setUnevaluatedItems([]);
        }
      } catch (error: any) {
        console.error("Error fetching study report evaluates:", error);
        toast({
          title: t("errors.error"),
          description:
            error?.response?.data?.message ||
            error?.message ||
            t("errors.failedToLoadData"),
          variant: "destructive",
        });
        setEvaluatedItems([]);
        setUnevaluatedItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCourse, selectedAssessment, toast]);

  // Fetch assessment students for score table
  useEffect(() => {
    const fetchAssessmentStudents = async () => {
      if (!selectedCourse || !selectedAssessment) {
        setAssessmentStudents([]);
        setStudentScores({});
        setIsPublishedAssessment(false);
        return;
      }

      try {
        setLoadingAssessmentStudents(true);
        const response = await GetAssessmentStudents({
          course_id: selectedCourse,
          assessment_id: selectedAssessment,
          page: 1,
          limit: 1000,
          get_score: true,
        });

        const students = response?.data?.students || [];
        setAssessmentStudents(students);

        const initialScores: StudentScoresState = {};

        students.forEach((student) => {
          const subScores: Record<string, number | undefined> = {};

          student.assessment?.criteria?.forEach((criteria) => {
            // Kiểm tra xem criteria có subcriteria không
            const hasSubcriteria =
              criteria.subcriteria && criteria.subcriteria.length > 0;

            if (!hasSubcriteria) {
              // Nếu không có subcriteria, lưu điểm trực tiếp từ criteria.score
              if (typeof criteria.score === "number" && criteria.score !== -1) {
                subScores[`criteria_${criteria.id}`] = criteria.score;
              }
            } else {
              // Nếu có subcriteria, lưu điểm từ các subcriteria
              criteria.subcriteria?.forEach((sub) => {
                // Chỉ set giá trị khi có score hợp lệ (không phải -1), không set mặc định 0
                if (typeof sub.score === "number" && sub.score !== -1) {
                  subScores[sub.id] = sub.score;
                }
                // Nếu score là -1 hoặc không có giá trị, không set key → sẽ trả về undefined khi get (hiển thị rỗng)
              });
            }
          });

          // Chuẩn hóa file_infos từ response
          const fileInfos: FileInfo[] = [];
          if (student.file_infos && Array.isArray(student.file_infos)) {
            student.file_infos.forEach((fileInfo: any) => {
              if (fileInfo.id && fileInfo.path) {
                fileInfos.push({
                  id: Number(fileInfo.id),
                  disk: fileInfo.disk || "public",
                  path: String(fileInfo.path),
                });
              }
            });
          }

          initialScores[student.student_id] = {
            subScores,
            fileUrls: student.files || [],
            fileInfos: fileInfos, // Lấy từ student.file_infos thay vì mảng rỗng
          };
        });

        setStudentScores(initialScores);

        // Fetch trạng thái publish
        try {
          const publishResponse = await GetPublishAssessmentScore({
            course_id: selectedCourse,
            assessment_id: selectedAssessment,
          });
          if (
            publishResponse?.code === 200 &&
            publishResponse?.data?.publish !== undefined
          ) {
            setIsPublishedAssessment(publishResponse.data.publish);
          }
        } catch (publishError) {
          console.error("Error fetching publish status:", publishError);
          // Không hiển thị toast để tránh làm phiền user nếu API này fail
        }
      } catch (error: any) {
        console.error("Error fetching assessment students:", error);
        toast({
          title: t("errors.error"),
          description:
            error?.response?.data?.message ||
            error?.message ||
            t("errors.failedToLoadAssessmentStudents"),
          variant: "destructive",
        });
        setAssessmentStudents([]);
        setStudentScores({});
      } finally {
        setLoadingAssessmentStudents(false);
      }
    };

    fetchAssessmentStudents();
  }, [selectedCourse, selectedAssessment, toast]);

  // Tự động lưu filters vào localStorage mỗi khi các filter thay đổi
  // Bỏ qua lần đầu tiên khi đang khôi phục từ localStorage
  useEffect(() => {
    // Chỉ lưu sau khi đã khôi phục xong (tránh lưu giá trị rỗng ban đầu)
    if (hasRestoredFromStorage) {
      saveFiltersToStorage({
        selectedSubject,
        selectedCourse,
        selectedTypeAssessment,
        selectedAssessment,
      });
    } else {
      // Đánh dấu đã khôi phục xong sau lần render đầu tiên
      setHasRestoredFromStorage(true);
    }
  }, [
    selectedSubject,
    selectedCourse,
    selectedTypeAssessment,
    selectedAssessment,
    hasRestoredFromStorage,
  ]);

  // Xóa filters khi component unmount (chuyển trang)
  // Ngoại trừ khi điều hướng đến trang assess-student
  useEffect(() => {
    return () => {
      // Cleanup: chỉ xóa key khi không điều hướng đến trang assess-student
      if (!isNavigatingToAssessStudent.current) {
        clearFiltersFromStorage();
      }
      // Reset flag sau khi cleanup
      isNavigatingToAssessStudent.current = false;
    };
  }, []);

  // Tính toán danh sách các cột động từ star_skills và check_skills
  const dynamicColumns = useMemo(() => {
    const starSkillsMap = new Map<string, { id: string; name_vn: string }>();
    const checkSkillsMap = new Map<string, { id: string; name_vn: string }>();

    // Thu thập tất cả star_skills và check_skills từ tất cả items
    evaluatedItems.forEach((item) => {
      item.star_skills?.forEach((skill) => {
        if (skill.id && skill.name_vn) {
          starSkillsMap.set(skill.id, {
            id: skill.id,
            name_vn: skill.name_vn,
          });
        }
      });

      item.check_skills?.forEach((skill) => {
        if (skill.id && skill.name_vn) {
          checkSkillsMap.set(skill.id, {
            id: skill.id,
            name_vn: skill.name_vn,
          });
        }
      });
    });

    return {
      starSkills: Array.from(starSkillsMap.values()),
      checkSkills: Array.from(checkSkillsMap.values()),
    };
  }, [evaluatedItems]);

  // Sắp xếp courses theo tên (chữ cái đầu -> số đầu tiên)
  const sortedCourses = useMemo(() => {
    if (!courses || courses.length === 0) return [];
    return sortCoursesWithObjectTitle(courses);
  }, [courses]);

  // Mảng màu cho các criteria (mỗi criteria một màu khác nhau)
  const criteriaColors = [
    "text-blue-700",
    "text-emerald-700",
    "text-purple-700",
    "text-orange-700",
    "text-pink-700",
    "text-indigo-700",
    "text-teal-700",
    "text-red-700",
    "text-yellow-700",
    "text-cyan-700",
  ];

  // Kiểm tra xem bài kiểm tra có bảng điểm không
  const hasScoreTable = useMemo(() => {
    const firstStudent = assessmentStudents[0];
    if (!firstStudent) return true; // Mặc định hiển thị nếu chưa có dữ liệu
    const criteriaGroupId = firstStudent.assessment?.assessment_criteria_group_id;
    // Kiểm tra cả string "0" và number 0
    return String(criteriaGroupId) !== "0";
  }, [assessmentStudents]);

  // Cột động cho bảng điểm bài kiểm tra (criteria & subcriteria)
  const scoreColumns = useMemo(() => {
    const firstStudent = assessmentStudents[0];
    if (!firstStudent) {
      return { criteria: [] as any[], subcriteria: [] as any[] };
    }

    const criteria =
      firstStudent.assessment?.criteria?.map((c, index) => ({
        id: c.id,
        name: c.name,
        max_score: c.max_score,
        colorClass: criteriaColors[index % criteriaColors.length], // Gán màu cho criteria
        subcriteria:
          c.subcriteria?.map((s) => ({
            id: s.id,
            name: s.name,
            max_score: s.max_score,
          })) || [],
      })) || [];

    const subcriteria = criteria.flatMap((c) =>
      c.subcriteria.map((s: any) => ({
        ...s,
        criteriaId: c.id,
        colorClass: c.colorClass, // Subcriteria dùng cùng màu với criteria
      }))
    );

    return { criteria, subcriteria };
  }, [assessmentStudents]);

  const getStudentSubScore = (
    studentId: string,
    subcriteriaId: string,
    defaultValue: number
  ) => {
    const state = studentScores[studentId];
    if (!state) return undefined; // Trả về undefined khi state chưa tồn tại
    const value = state.subScores[subcriteriaId];
    // Cho phép trả về undefined để input có thể hiển thị rỗng
    // Nếu score là -1, null, hoặc undefined thì trả về undefined (hiển thị rỗng)
    if (value === undefined || value === null || value === -1) return undefined;
    return typeof value === "number" ? value : undefined;
  };

  const getStudentCriterionScoreDirect = (
    studentId: string,
    criteriaId: string
  ) => {
    const state = studentScores[studentId];
    if (!state) return undefined;
    const value = state.subScores[`criteria_${criteriaId}`];
    if (value === undefined || value === null || value === -1) return undefined;
    return typeof value === "number" ? value : undefined;
  };

  const getStudentCriterionScore = (
    student: AssessmentStudentItem,
    criteriaId: string
  ) => {
    const criteria = student.assessment.criteria.find(
      (c) => c.id === criteriaId
    );
    if (!criteria) return 0;

    // Kiểm tra xem criteria này có subcriteria không
    const hasSubcriteria =
      criteria.subcriteria && criteria.subcriteria.length > 0;

    // Nếu không có subcriteria, lấy điểm trực tiếp từ criteria
    if (!hasSubcriteria) {
      const directScore = getStudentCriterionScoreDirect(
        student.student_id,
        criteriaId
      );
      return directScore ?? 0;
    }

    // Nếu có subcriteria, tính tổng từ các subcriteria (logic cũ)
    return (
      criteria.subcriteria?.reduce((sum, sub) => {
        const score = getStudentSubScore(
          student.student_id,
          sub.id,
          typeof sub.score === "number" ? sub.score : 0
        );
        return sum + (score ?? 0);
      }, 0) || 0
    );
  };

  const getStudentTotalScore = (student: AssessmentStudentItem) => {
    return (
      student.assessment.criteria?.reduce((sum, c) => {
        return sum + getStudentCriterionScore(student, c.id);
      }, 0) || 0
    );
  };

  // Lọc và sắp xếp học sinh
  const filteredAssessmentStudents = useMemo(() => {
    let filtered = [...assessmentStudents];

    // Lọc theo tên học sinh
    if (studentNameFilter.trim()) {
      const searchTerm = studentNameFilter.trim().toLowerCase();
      filtered = filtered.filter((student) =>
        student.student_name?.toLowerCase().includes(searchTerm)
      );
    }

    // Lọc theo khoảng điểm
    if (minScore || maxScore) {
      const minNum = minScore ? Number(minScore) : NaN;
      const maxNum = maxScore ? Number(maxScore) : NaN;

      // Xác định min và max hợp lệ
      const min = minScore && !isNaN(minNum) && minNum >= 0 ? minNum : 0;
      const max = maxScore && !isNaN(maxNum) && maxNum >= 0 ? maxNum : Infinity;

      // Nếu cả hai giá trị đều không hợp lệ, không lọc theo điểm
      if (!(minScore && isNaN(minNum) && maxScore && isNaN(maxNum))) {
        filtered = filtered.filter((student) => {
          const totalScore = getStudentTotalScore(student);
          return totalScore >= min && totalScore <= max;
        });
      }
    }

    // Sắp xếp theo tổng điểm
    if (sortOrder) {
      filtered.sort((a, b) => {
        const scoreA = getStudentTotalScore(a);
        const scoreB = getStudentTotalScore(b);
        return sortOrder === "asc" ? scoreA - scoreB : scoreB - scoreA;
      });
    }

    return filtered;
  }, [
    assessmentStudents,
    studentNameFilter,
    minScore,
    maxScore,
    sortOrder,
    studentScores,
  ]);

  // Tính tỉ lệ học sinh trong khoảng điểm (chỉ tính theo khoảng điểm, không tính bộ lọc tên)
  const scoreRangePercentage = useMemo(() => {
    if (assessmentStudents.length === 0) return 0;
    if (!minScore && !maxScore) return 100;

    const minNum = minScore ? Number(minScore) : NaN;
    const maxNum = maxScore ? Number(maxScore) : NaN;

    const min = minScore && !isNaN(minNum) && minNum >= 0 ? minNum : 0;
    const max = maxScore && !isNaN(maxNum) && maxNum >= 0 ? maxNum : Infinity;

    if (minScore && isNaN(minNum) && maxScore && isNaN(maxNum)) {
      return 100;
    }

    const filteredByScore = assessmentStudents.filter((student) => {
      const totalScore = getStudentTotalScore(student);
      return totalScore >= min && totalScore <= max;
    });

    return Math.round(
      (filteredByScore.length / assessmentStudents.length) * 100
    );
  }, [assessmentStudents, minScore, maxScore, studentScores]);

  // Kiểm tra xem tất cả các điểm của học sinh có đều >= 0 không
  const isStudentAllScoresFilled = (student: AssessmentStudentItem) => {
    // Nếu có subcriteria, kiểm tra tất cả các subcriteria
    if (scoreColumns.subcriteria.length > 0) {
      for (const sub of scoreColumns.subcriteria) {
        const score = getStudentSubScore(student.student_id, sub.id, 0);
        // Nếu có ít nhất 1 giá trị rỗng (undefined/null/-1) thì trả về false
        if (score === undefined || score === null || score < 0) {
          return false;
        }
      }
      return true;
    }

    // Nếu không có subcriteria (chỉ có criteria), kiểm tra tất cả các criteria
    for (const c of scoreColumns.criteria) {
      const score = getStudentCriterionScoreDirect(student.student_id, c.id);
      if (score === undefined || score === null || score < 0) {
        return false;
      }
    }
    return true;
  };

  const handleSubcriteriaScoreChange = (
    studentId: string,
    subcriteriaId: string,
    maxScore: number,
    value: string
  ) => {
    // Xử lý trường hợp người dùng xóa hết - cho phép giá trị rỗng
    if (value === "" || value === null || value === undefined) {
      setStudentScores((prev) => {
        const current = prev[studentId] || {
          subScores: {},
          fileUrls: [],
          fileInfos: [],
        };
        const newSubScores = { ...current.subScores };
        // Xóa key để cho phép hiển thị rỗng
        delete newSubScores[subcriteriaId];
        return {
          ...prev,
          [studentId]: {
            ...current,
            subScores: newSubScores,
          },
        };
      });
      return;
    }

    const numeric = Number(value);
    if (Number.isNaN(numeric)) return;

    let clamped = numeric;
    if (clamped < 0) clamped = 0;
    if (clamped > maxScore) clamped = maxScore;

    setStudentScores((prev) => {
      const current = prev[studentId] || {
        subScores: {},
        fileUrls: [],
        fileInfos: [],
      };
      return {
        ...prev,
        [studentId]: {
          ...current,
          subScores: {
            ...current.subScores,
            [subcriteriaId]: clamped,
          },
        },
      };
    });
  };

  const handleCriterionScoreChange = (
    studentId: string,
    criteriaId: string,
    maxScore: number,
    value: string
  ) => {
    const key = `criteria_${criteriaId}`;

    // Xử lý trường hợp người dùng xóa hết - cho phép giá trị rỗng
    if (value === "" || value === null || value === undefined) {
      setStudentScores((prev) => {
        const current = prev[studentId] || {
          subScores: {},
          fileUrls: [],
          fileInfos: [],
        };
        const newSubScores = { ...current.subScores };
        // Xóa key để cho phép hiển thị rỗng
        delete newSubScores[key];
        return {
          ...prev,
          [studentId]: {
            ...current,
            subScores: newSubScores,
          },
        };
      });
      return;
    }

    const numeric = Number(value);
    if (Number.isNaN(numeric)) return;

    let clamped = numeric;
    if (clamped < 0) clamped = 0;
    if (clamped > maxScore) clamped = maxScore;

    setStudentScores((prev) => {
      const current = prev[studentId] || {
        subScores: {},
        fileUrls: [],
        fileInfos: [],
      };
      return {
        ...prev,
        [studentId]: {
          ...current,
          subScores: {
            ...current.subScores,
            [key]: clamped,
          },
        },
      };
    });
  };

  const handleUploadFiles = async (
    student: AssessmentStudentItem,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    try {
      const uploadedUrls: string[] = [];
      const uploadedInfos: any[] = [];

      for (const file of files) {
        const uploadResponse = await uploadFile(file, "assessment-files");
        if (!uploadResponse) {
          throw new Error("Upload failed");
        }

        if ((uploadResponse as any).error) {
          throw new Error((uploadResponse as any).error);
        }

        const fileUrl =
          (uploadResponse as any).url ||
          (uploadResponse as any).data?.url ||
          "";

        if (fileUrl) {
          uploadedUrls.push(fileUrl);
        }

        const fileInfo =
          (uploadResponse as any).data?.file_info ||
          (uploadResponse as any).file_info;

        // Chuẩn hóa về đúng 3 field: id, disk, path
        // Chỉ cần path là đủ, id có thể là 0
        if (fileInfo && fileInfo.path) {
          const normalized: FileInfo = {
            id: fileInfo.id !== undefined ? Number(fileInfo.id) : 0,
            disk: fileInfo.disk || "public",
            path: String(fileInfo.path),
          };
          uploadedInfos.push(normalized);
        }
      }

      setStudentScores((prev) => {
        const current = prev[student.student_id] || {
          subScores: {},
          fileUrls: [],
          fileInfos: [],
        };
        return {
          ...prev,
          [student.student_id]: {
            ...current,
            fileUrls: [...(current.fileUrls || []), ...uploadedUrls],
            fileInfos: [...(current.fileInfos || []), ...uploadedInfos],
          },
        };
      });

      toast({
        title: t("success.title"),
        description: t("success.uploadSuccess"),
      });
    } catch (error: any) {
      console.error("Error uploading assessment files:", error);
      toast({
        title: t("errors.error"),
        description: error?.message || t("errors.uploadFailed"),
        variant: "destructive",
      });
    } finally {
      // reset input value để có thể chọn lại cùng file nếu cần
      event.target.value = "";
    }
  };

  const handleSaveScores = async () => {
    try {
      setSavingScores(true);

      // Tìm assessment tương ứng để lấy lesson_id
      const selectedAssessmentData = assessments.find(
        (a) => String(a.id) === selectedAssessment
      );
      const lessonId = selectedAssessmentData?.lesson_id
        ? Number(selectedAssessmentData.lesson_id)
        : 0;

      const payload = {
        assessment_id: Number(selectedAssessment),
        course_id: Number(selectedCourse),
        lesson_id: lessonId,
        students: assessmentStudents.map((student) => {
          const state = studentScores[student.student_id] || {
            subScores: {},
            fileUrls: [],
            fileInfos: [],
          };

          const criteria =
            student.assessment.criteria?.map((c) => {
              // Kiểm tra xem criteria này có subcriteria không
              const hasSubcriteria = c.subcriteria && c.subcriteria.length > 0;

              if (!hasSubcriteria) {
                // Nếu không có subcriteria, lấy điểm trực tiếp từ criteria
                const criteriaScoreDirect = getStudentCriterionScoreDirect(
                  student.student_id,
                  c.id
                );
                const criteriaScore =
                  criteriaScoreDirect !== undefined &&
                    criteriaScoreDirect !== null
                    ? criteriaScoreDirect
                    : -1;

                return {
                  criteria_id: Number(c.id),
                  score: criteriaScore !== -1 ? criteriaScore : -1,
                  subcriteria: [], // Gửi mảng rỗng khi không có subcriteria
                };
              }

              // Nếu có subcriteria, xử lý như trước
              const subcriteria =
                c.subcriteria?.map((sub) => {
                  const score = getStudentSubScore(
                    student.student_id,
                    sub.id,
                    typeof sub.score === "number" ? sub.score : 0
                  );
                  return {
                    subcriteria_id: Number(sub.id),
                    // Gửi -1 nếu score rỗng/undefined, chỉ gửi số khi có giá trị thực sự
                    score: score !== undefined && score !== null ? score : -1,
                  };
                }) || [];

              // Tính tổng điểm criteria (bỏ qua các subcriteria có score -1 hoặc null)
              const criteriaScore = subcriteria.reduce(
                (sum, s) =>
                  sum +
                  (s.score !== null && s.score !== undefined && s.score !== -1
                    ? s.score
                    : 0),
                0
              );

              return {
                criteria_id: Number(c.id),
                score: criteriaScore,
                subcriteria,
              };
            }) || [];

          return {
            user_id: Number(student.student_id),
            file_infos: state.fileInfos || [],
            criteria,
          };
        }),
      };

      const response = await SaveAssessmentScoresBulk(payload as any);

      // Kiểm tra response code
      const responseCode = response?.code;
      if (responseCode === 200) {
        toast({
          title: t("success.title"),
          description: t("success.saveSuccess"),
        });
      } else {
        toast({
          title: t("errors.error"),
          description: t("errors.saveFailed"),
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: t("errors.error"),
        description: t("errors.cannotSaveScores"),
        variant: "destructive",
      });
    } finally {
      setSavingScores(false);
    }
  };

  const handleImportExcel = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Kiểm tra định dạng file
    const validExtensions = [".xlsx", ".xls"];
    const fileExtension = file.name
      .toLowerCase()
      .substring(file.name.lastIndexOf("."));
    if (!validExtensions.includes(fileExtension)) {
      toast({
        title: t("errors.error"),
        description: "Vui lòng chọn file Excel (.xlsx hoặc .xls)",
        variant: "destructive",
      });
      // Reset input
      if (excelFileInputRef.current) {
        excelFileInputRef.current.value = "";
      }
      return;
    }

    if (!selectedCourse || !selectedAssessment) {
      toast({
        title: t("errors.missingInfo"),
        description: t("errors.pleaseSelectCourseAndAssessment"),
        variant: "destructive",
      });
      // Reset input
      if (excelFileInputRef.current) {
        excelFileInputRef.current.value = "";
      }
      return;
    }

    try {
      setImportingExcel(true);
      const response = await ImportAssessmentExcel(file);

      // Kiểm tra response code
      const responseCode = response?.code;
      if (responseCode === 200) {
        toast({
          title: t("success.title"),
          description:
            response?.message || "Import điểm và đánh giá thành công",
        });

        // Fetch lại danh sách học sinh sau khi import thành công
        const studentsResponse = await GetAssessmentStudents({
          course_id: selectedCourse,
          assessment_id: selectedAssessment,
          page: 1,
          limit: 1000,
          get_score: true,
        });

        const students = studentsResponse?.data?.students || [];
        setAssessmentStudents(students);

        // Cập nhật lại studentScores từ response
        const updatedScores: StudentScoresState = {};
        students.forEach((student) => {
          const subScores: Record<string, number | undefined> = {};

          student.assessment?.criteria?.forEach((criteria) => {
            const hasSubcriteria =
              criteria.subcriteria && criteria.subcriteria.length > 0;

            if (!hasSubcriteria) {
              if (typeof criteria.score === "number" && criteria.score !== -1) {
                subScores[`criteria_${criteria.id}`] = criteria.score;
              }
            } else {
              criteria.subcriteria?.forEach((sub) => {
                if (typeof sub.score === "number" && sub.score !== -1) {
                  subScores[sub.id] = sub.score;
                }
              });
            }
          });

          const fileInfos: FileInfo[] = [];
          if (student.file_infos && Array.isArray(student.file_infos)) {
            student.file_infos.forEach((fileInfo: any) => {
              if (fileInfo.id && fileInfo.path) {
                fileInfos.push({
                  id: Number(fileInfo.id),
                  disk: fileInfo.disk || "public",
                  path: String(fileInfo.path),
                });
              }
            });
          }

          updatedScores[student.student_id] = {
            subScores,
            fileUrls: student.files || [],
            fileInfos: fileInfos,
          };
        });

        setStudentScores(updatedScores);
      } else {
        toast({
          title: t("errors.error"),
          description: response?.message || "Import điểm và đánh giá thất bại",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error importing assessment excel:", error);
      toast({
        title: t("errors.error"),
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể import file Excel",
        variant: "destructive",
      });
    } finally {
      setImportingExcel(false);
      // Reset input
      if (excelFileInputRef.current) {
        excelFileInputRef.current.value = "";
      }
    }
  };

  if (loadingSubjects) {
    return <Loading />;
  }

  const handleEvaluate = (item: StudyReportEvaluateItem) => {
    if (!selectedAssessment) {
      toast({
        title: t("errors.missingInfo"),
        description: t("errors.pleaseSelectAssessment"),
        variant: "destructive",
      });
      return;
    }

    // Đánh dấu đang điều hướng đến trang assess-student (không xóa key)
    isNavigatingToAssessStudent.current = true;

    // Lưu filters vào localStorage trước khi điều hướng
    saveFiltersToStorage({
      selectedSubject,
      selectedCourse,
      selectedTypeAssessment,
      selectedAssessment,
    });

    // Điều hướng sang trang đánh giá học sinh, truyền kèm assessment_id, course_id, tab và report_id
    router.push(
      `/${currentLocale}/teacher/reports/assess-student/${item.student_id
      }?assessmentId=${selectedAssessment}&courseId=${selectedCourse}&tab=${currentTab}&reportId=${item.report_id || "0"
      }`
    );
  };

  const handleRemoveFile = (studentId: string, fileIndex: number) => {
    if (!confirm(t("common.confirmDelete"))) return;
    setStudentScores((prev) => {
      const current = prev[studentId];
      if (!current) return prev;

      const newFileUrls = [...(current.fileUrls || [])];
      const newFileInfos = [...(current.fileInfos || [])];

      newFileUrls.splice(fileIndex, 1);
      newFileInfos.splice(fileIndex, 1);

      return {
        ...prev,
        [studentId]: {
          ...current,
          fileUrls: newFileUrls,
          fileInfos: newFileInfos,
        },
      };
    });
  };

  const handlePublishStudyReport = async () => {
    if (!selectedCourse || !selectedAssessment) {
      toast({
        title: t("errors.missingInfo"),
        description: t("errors.pleaseSelectCourseAndAssessment"),
        variant: "destructive",
      });
      return;
    }

    try {
      setPublishing(true);
      const publishValue = !isPublished; // Nếu chưa publish => true, nếu đã publish => false

      await PublishStudyReport({
        course_id: Number(selectedCourse),
        assessment_id: Number(selectedAssessment),
        publish: publishValue,
      });

      // Fetch lại data để cập nhật trạng thái từ server
      const evaluatedResponse = await GetStudyReportEvaluates(selectedCourse, {
        assessment_id: selectedAssessment,
        is_completed: true,
      });

      if (evaluatedResponse?.code === 200 && evaluatedResponse?.data?.items) {
        setEvaluatedItems(evaluatedResponse.data.items);
        // Cập nhật trạng thái publish từ response
        if (evaluatedResponse.data.publish !== undefined) {
          setIsPublished(evaluatedResponse.data.publish);
        }
      }

      toast({
        title: t("success.title"),
        description: publishValue
          ? "Đã xuất bản cho học sinh"
          : "Đã hủy xuất bản",
      });
    } catch (error: any) {
      console.error("Error publishing study report:", error);
      toast({
        title: t("errors.error"),
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể xuất bản báo cáo",
        variant: "destructive",
      });
    } finally {
      setPublishing(false);
    }
  };

  const handlePublishAssessmentScore = async () => {
    if (!selectedCourse || !selectedAssessment) {
      toast({
        title: t("errors.missingInfo"),
        description: t("errors.pleaseSelectCourseAndAssessment"),
        variant: "destructive",
      });
      return;
    }

    try {
      setPublishingAssessment(true);
      const publishValue = !isPublishedAssessment; // Nếu chưa publish => true, nếu đã publish => false

      await PublishAssessmentScore({
        course_id: Number(selectedCourse),
        assessment_id: Number(selectedAssessment),
        publish: publishValue,
      });

      // Fetch lại trạng thái publish từ server
      const publishResponse = await GetPublishAssessmentScore({
        course_id: selectedCourse,
        assessment_id: selectedAssessment,
      });
      if (
        publishResponse?.code === 200 &&
        publishResponse?.data?.publish !== undefined
      ) {
        setIsPublishedAssessment(publishResponse.data.publish);
      }

      toast({
        title: t("success.title"),
        description: publishValue
          ? "Đã xuất bản cho học sinh"
          : "Đã hủy xuất bản",
      });
    } catch (error: any) {
      console.error("Error publishing assessment score:", error);
      toast({
        title: t("errors.error"),
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể xuất bản điểm",
        variant: "destructive",
      });
    } finally {
      setPublishingAssessment(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="bg-white rounded-2xl border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Subject Filter */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-emerald-600" />
                {t("filters.subject")}
              </label>
              <Select
                value={selectedSubject}
                onValueChange={setSelectedSubject}
                disabled={loadingSubjects}
              >
                <SelectTrigger className="h-11 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-200 bg-gray-50 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <SelectValue placeholder={t("filters.selectSubject")}>
                    {(() => {
                      const subject = subjects.find(
                        (s) => String(s?.id) === selectedSubject
                      );
                      return subject?.name || t("filters.selectSubject");
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-200">
                  {sortAlphabetGeneric(subjects, item => item.name, true).map((subject) => (
                    <SelectItem
                      key={subject.id}
                      value={String(subject.id)}
                      className="rounded-lg"
                    >
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Course Filter */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-emerald-600" />
                {t("filters.course")}
              </label>
              <Select
                value={selectedCourse}
                onValueChange={(value) => {
                  // Khi đổi khóa học, reset luôn assessment được chọn để tránh dùng lại assessment của khóa cũ
                  setSelectedCourse(value);
                  setSelectedAssessment("");
                }}
                disabled={!selectedSubject || loadingCourses}
              >
                <SelectTrigger className="h-11 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-200 bg-gray-50 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <SelectValue placeholder={t("filters.selectCourse")}>
                    {(() => {
                      const course = sortedCourses.find(
                        (c) => String(c?.id) === selectedCourse
                      );

                      if (!course) return t("filters.selectCourse");

                      return course.object_title
                        ? `${course.name} (${course.object_title})`
                        : course.name;
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-200">
                  {sortedCourses.length === 0 ? (
                    <SelectItem
                      value="no-courses"
                      disabled
                      className="rounded-lg text-gray-400"
                    >
                      {loadingCourses
                        ? t("filters.loading")
                        : !selectedSubject
                          ? t("filters.pleaseSelectSubject")
                          : t("filters.noCourses")}
                    </SelectItem>
                  ) : (
                    sortByNumberAndAlphabetFromSecondGeneric(sortedCourses, item => item.name, true).map((course) => {
                      const courseId = course?.id;
                      const courseName = course?.name;
                      return (
                        <SelectItem
                          key={courseId}
                          value={String(courseId)}
                          className="rounded-lg"
                        >
                          {course.object_title
                            ? `${courseName} (${course.object_title})`
                            : courseName}
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Report Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-600" />
                {t("filters.type")}
              </label>
              <Select
                value={selectedTypeAssessment}
                onValueChange={(value) => {
                  // Reset selectedAssessment ngay khi type thay đổi
                  setSelectedAssessment("");
                  setSelectedTypeAssessment(
                    value as "mini_test" | "final_exam" | "all"
                  );
                }}
              >
                <SelectTrigger className="h-11 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-200 bg-gray-50 hover:bg-white transition-colors">
                  <SelectValue placeholder={t("filters.allTypes")} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-200">
                  <SelectItem value="all" className="rounded-lg">
                    {t("filters.all")}
                  </SelectItem>
                  <SelectItem value="mini_test" className="rounded-lg">
                    {t("filters.month")}
                  </SelectItem>
                  <SelectItem value="final_exam" className="rounded-lg">
                    {t("filters.term")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Assessment Filter */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-emerald-600" />
                {t("filters.assessment")}
              </label>
              <Select
                value={selectedAssessment}
                onValueChange={setSelectedAssessment}
                disabled={!selectedCourse || assessments.length === 0}
              >
                <SelectTrigger className="h-11 rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-200 bg-gray-50 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  <SelectValue placeholder={t("filters.selectAssessment")}>
                    {(() => {
                      const assessment = assessments.find(
                        (a) => String(a.id) === selectedAssessment
                      );
                      return assessment?.name || t("filters.selectAssessment");
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-200">
                  {assessments.length === 0 ? (
                    <SelectItem
                      value="no-assessments"
                      disabled
                      className="rounded-lg text-gray-400"
                    >
                      {!selectedCourse
                        ? t("filters.pleaseSelectCourse")
                        : t("filters.noAssessments")}
                    </SelectItem>
                  ) : (
                    assessments.map((assessment) => (
                      <SelectItem
                        key={assessment.id}
                        value={String(assessment.id)}
                        className="rounded-lg"
                      >
                        {assessment.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="space-y-6">
          <Loading />
        </div>
      )}

      {/* Tables */}
      {!loading && (
        <div className="space-y-6">
          {/* Assessment Scores Table */}
          <Card>
            <CardHeader className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-emerald-600" />
                  {t("scoresTable.title", { count: assessmentStudents.length })}
                </CardTitle>

              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="file"
                  ref={excelFileInputRef}
                  accept=".xlsx,.xls"
                  onChange={handleImportExcel}
                  className="hidden"
                  disabled={importingExcel}
                />

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => excelFileInputRef.current?.click()}
                  disabled={
                    importingExcel ||
                    !selectedCourse ||
                    !selectedAssessment ||
                    assessmentStudents.length === 0
                  }
                  className="whitespace-normal text-center leading-tight"
                >
                  {importingExcel ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang import...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Nhập điểm & đánh giá bằng file excel
                    </>
                  )}
                </Button>

                {/* Các nút CHỈ hiển thị khi có bảng điểm */}
                {hasScoreTable && (
                  <>
                    <Button
                      size="sm"
                      onClick={handlePublishAssessmentScore}
                      disabled={
                        publishingAssessment ||
                        !selectedCourse ||
                        !selectedAssessment ||
                        assessmentStudents.length === 0
                      }
                      variant={isPublishedAssessment ? "default" : "outline"}
                    >
                      {publishingAssessment ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <Share2 className="mr-2 h-4 w-4" />
                          {isPublishedAssessment ? "Hủy xuất bản" : "Xuất bản cho học sinh"}
                        </>
                      )}
                    </Button>

                    <Button
                      size="sm"
                      onClick={handleSaveScores}
                      disabled={
                        savingScores ||
                        !selectedCourse ||
                        !selectedAssessment ||
                        assessmentStudents.length === 0
                      }
                    >
                      {savingScores ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("scoresTable.saving")}
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          {t("scoresTable.saveScores")}
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
              </div>

              {/* Filters */}
              {hasScoreTable && (
                <div className="flex items-center gap-3 flex-wrap">
                {/* Student Name Filter */}
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                    Tên học sinh:
                  </label>
                  <Input
                    type="text"
                    placeholder="Tìm kiếm..."
                    value={studentNameFilter}
                    onChange={(e) => setStudentNameFilter(e.target.value)}
                    className="w-40 h-9 text-sm"
                  />
                </div>

                {/* Score Range Filter */}
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                    Khoảng điểm:
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Từ điểm"
                      value={minScore}
                      onChange={(e) => setMinScore(e.target.value)}
                      className="w-28 h-9 text-sm"
                      min={0}
                    />
                    <span className="text-gray-500">-</span>
                    <Input
                      type="number"
                      placeholder="Đến điểm"
                      value={maxScore}
                      onChange={(e) => setMaxScore(e.target.value)}
                      className="w-28 h-9 text-sm"
                      min={0}
                    />
                  </div>
                </div>

                {/* Sort Order */}
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                    Sắp xếp:
                  </label>
                  <Select
                    value={sortOrder || "none"}
                    onValueChange={(value) => {
                      if (value === "none") {
                        setSortOrder("");
                      } else {
                        setSortOrder(value as "asc" | "desc");
                      }
                    }}
                  >
                    <SelectTrigger className="w-36 h-9 text-sm">
                      <SelectValue placeholder="Mặc định" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Mặc định</SelectItem>
                      <SelectItem value="desc">Cao → Thấp</SelectItem>
                      <SelectItem value="asc">Thấp → Cao</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Statistics */}
                {(minScore || maxScore || studentNameFilter) && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">
                      <strong>{filteredAssessmentStudents.length}</strong> /{" "}
                      {assessmentStudents.length}
                    </span>
                    {minScore || maxScore ? (
                      <span className="text-emerald-600 font-semibold">
                        ({scoreRangePercentage}%)
                      </span>
                    ) : null}
                  </div>
                )}
              </div>
              )}
            </CardHeader>
            <CardContent>
              {loadingAssessmentStudents ? (
                <Loading />
              ) : !hasScoreTable ? (
                <div className="text-center py-8 text-gray-500">
                  Bài kiểm tra này không có bảng điểm
                </div>
              ) : assessmentStudents.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-gray-100">
                  <Table className="text-sm">
                    <TableHeader>
                      <TableRow className="border-gray-100 bg-gray-50">
                        <TableHead className="text-sm font-bold text-gray-700 bg-gray-50 rounded-l-xl px-3 sticky left-0 z-10">
                          {t("scoresTable.no")}
                        </TableHead>
                        <TableHead className="text-sm font-bold text-gray-700 bg-gray-50 min-w-[150px] px-3 sticky left-[60px] z-10">
                          {t("scoresTable.studentName")}
                        </TableHead>
                        <TableHead className="text-sm font-bold text-gray-700 bg-gray-50 text-center px-3 min-w-[80px]">
                          {t("scoresTable.status")}
                        </TableHead>
                        <TableHead className="text-sm font-bold text-gray-700 bg-gray-50 text-center px-3 min-w-[100px]">
                          {t("scoresTable.totalScore")}
                        </TableHead>
                        {scoreColumns.subcriteria.length === 0 ? (
                          // Nếu không có subcriteria, hiển thị criteria với max_score
                          scoreColumns.criteria.map((c) => (
                            <TableHead
                              key={`criteria-${c.id}`}
                              className={`text-sm font-bold ${c.colorClass} bg-gray-50 text-center px-6 min-w-[160px]`}
                            >
                              <div className="flex flex-col">
                                <span className={`font-bold ${c.colorClass}`}>
                                  {c.name}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {t("scoresTable.maxScore", {
                                    score: c.max_score,
                                  })}
                                </span>
                              </div>
                            </TableHead>
                          ))
                        ) : (
                          // Nếu có subcriteria, hiển thị criteria và subcriteria như cũ
                          <>
                            {scoreColumns.criteria.map((c) => (
                              <TableHead
                                key={`criteria-${c.id}`}
                                className={`text-sm font-bold ${c.colorClass} bg-gray-50 text-center px-3 min-w-[160px]`}
                              >
                                {c.name}
                              </TableHead>
                            ))}
                            {scoreColumns.subcriteria.map((s) => (
                              <TableHead
                                key={`sub-${s.id}`}
                                className="text-sm font-bold bg-gray-50 text-center px-3 min-w-[120px]"
                              >
                                <div className="flex flex-col">
                                  <span className={`font-bold ${s.colorClass}`}>
                                    {s.name}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {t("scoresTable.maxScore", {
                                      score: s.max_score,
                                    })}
                                  </span>
                                </div>
                              </TableHead>
                            ))}
                          </>
                        )}
                        {assessmentStudents[0]?.assessment?.has_file && (
                          <TableHead className="text-sm font-bold text-gray-700 bg-gray-50 text-center px-3 rounded-r-xl min-w-[180px]">
                            {t("scoresTable.submission")}
                          </TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAssessmentStudents.length > 0 ? (
                        filteredAssessmentStudents.map((student, index) => {
                          const state = studentScores[student.student_id];
                          const fileUrls = state?.fileUrls || [];

                          return (
                            <TableRow
                              key={student.student_id}
                              className="border-gray-100 hover:bg-gray-50 transition-colors"
                            >
                              <TableCell className="px-3 py-3 sticky left-0 bg-white z-10">
                                {index + 1}
                              </TableCell>
                              <TableCell className="px-3 py-3 font-semibold text-gray-900 sticky left-[60px] bg-white z-10">
                                {student.student_name}
                              </TableCell>
                              <TableCell className="px-3 py-3 text-center">
                                {isStudentAllScoresFilled(student) && (
                                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto" />
                                )}
                              </TableCell>
                              <TableCell className="px-3 py-3 text-center">
                                <Badge
                                  variant="outline"
                                  className="font-semibold"
                                >
                                  {getStudentTotalScore(student)}
                                </Badge>
                              </TableCell>
                              {scoreColumns.subcriteria.length === 0 ? (
                                // Nếu không có subcriteria, hiển thị input để nhập điểm cho criteria
                                scoreColumns.criteria.map((c) => (
                                  <TableCell
                                    key={`criteria-input-${c.id}`}
                                    className="px-3 py-3 text-center"
                                  >
                                    <Input
                                      type="number"
                                      className="w-20 h-9 text-sm mx-auto"
                                      min={0}
                                      max={c.max_score}
                                      value={
                                        getStudentCriterionScoreDirect(
                                          student.student_id,
                                          c.id
                                        ) ?? ""
                                      }
                                      onChange={(e) =>
                                        handleCriterionScoreChange(
                                          student.student_id,
                                          c.id,
                                          c.max_score,
                                          e.target.value
                                        )
                                      }
                                    />
                                  </TableCell>
                                ))
                              ) : (
                                // Nếu có subcriteria, hiển thị điểm tổng của criteria và input cho subcriteria
                                <>
                                  {scoreColumns.criteria.map((c) => (
                                    <TableCell
                                      key={`criteria-score-${c.id}`}
                                      className="px-3 py-3 text-center"
                                    >
                                      <Badge
                                        variant="outline"
                                        className="font-semibold mx-auto"
                                      >
                                        {getStudentCriterionScore(
                                          student,
                                          c.id
                                        )}
                                      </Badge>
                                    </TableCell>
                                  ))}
                                  {scoreColumns.subcriteria.map((s) => (
                                    <TableCell
                                      key={`sub-score-${s.id}`}
                                      className="px-3 py-3 text-center"
                                    >
                                      <Input
                                        type="number"
                                        className="w-20 h-9 text-sm mx-auto"
                                        min={0}
                                        max={s.max_score}
                                        value={
                                          getStudentSubScore(
                                            student.student_id,
                                            s.id,
                                            0
                                          ) ?? ""
                                        }
                                        onChange={(e) =>
                                          handleSubcriteriaScoreChange(
                                            student.student_id,
                                            s.id,
                                            s.max_score,
                                            e.target.value
                                          )
                                        }
                                      />
                                    </TableCell>
                                  ))}
                                </>
                              )}
                              {student.assessment?.has_file && (
                                <TableCell className="px-3 py-3">
                                  <div className="space-y-2">
                                    {fileUrls.length > 0 && (
                                      <div className="flex flex-wrap gap-2">
                                        {fileUrls.map((url, idx) => (
                                          <div
                                            key={idx}
                                            className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1"
                                          >
                                            <a
                                              href={url}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="text-xs text-emerald-600 underline"
                                            >
                                              {t("scoresTable.image", {
                                                index: idx + 1,
                                              })}
                                            </a>

                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleRemoveFile(
                                                  student.student_id,
                                                  idx
                                                )
                                              }
                                              className="text-gray-400 hover:text-red-500 text-xs font-bold"
                                              title={t("common.delete")}
                                            >
                                              ✕
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    <Input
                                      type="file"
                                      accept="image/*,video/*,audio/*,application/pdf"
                                      multiple
                                      onChange={(e) =>
                                        handleUploadFiles(student, e)
                                      }
                                      className="text-xs"
                                    />
                                  </div>
                                </TableCell>
                              )}
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={100}
                            className="text-center py-8 text-gray-500"
                          >
                            Không có học sinh nào trong khoảng điểm này
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {t("scoresTable.noData")}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Unevaluated Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                {t("unevaluatedTable.title", {
                  count: unevaluatedItems.length,
                })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {unevaluatedItems.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-gray-100">
                  <Table className="text-sm">
                    <TableHeader>
                      <TableRow className="border-gray-100 bg-gray-50">
                        <TableHead className="text-sm font-bold text-gray-700 bg-gray-50 rounded-l-xl px-6 text-center">
                          {t("unevaluatedTable.no")}
                        </TableHead>
                        <TableHead className="text-sm font-bold text-gray-700 bg-gray-50 px-6 text-center">
                          {t("unevaluatedTable.studentName")}
                        </TableHead>
                        <TableHead className="text-sm font-bold text-gray-700 bg-gray-50 px-6 text-center">
                          {t("unevaluatedTable.course")}
                        </TableHead>
                        <TableHead className="text-sm font-bold text-gray-700 bg-gray-50 px-6 text-center">
                          {t("unevaluatedTable.generalComment")}
                        </TableHead>
                        <TableHead className="text-sm font-bold text-gray-700 bg-gray-50 text-center px-6 rounded-r-xl">
                          {t("unevaluatedTable.action")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unevaluatedItems.map((item, index) => (
                        <TableRow
                          key={`${item.student_id}-${item.report_id}`}
                          className="border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <TableCell className="px-6 py-3 text-center">
                            {index + 1}
                          </TableCell>
                          <TableCell className="px-6 py-3 font-semibold text-gray-900 text-center">
                            {item.student_name}
                          </TableCell>
                          <TableCell className="px-6 py-3 text-gray-700 text-center">
                            {item.course_name}
                          </TableCell>
                          <TableCell className="px-6 py-3">
                            {item.has_general_comment ? (
                              <div className="flex justify-center">
                                <p
                                  className="max-w-xs text-sm text-gray-600 truncate text-center"
                                  title={item.general_comment}
                                >
                                  {item.general_comment}
                                </p>
                              </div>
                            ) : (
                              <div className="flex justify-center">
                                <Badge variant="secondary">
                                  {t("unevaluatedTable.noComment")}
                                </Badge>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="px-6 py-3">
                            <div className="flex justify-center">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEvaluate(item)}
                                className="flex items-center gap-2"
                              >
                                <Edit className="h-4 w-4" />
                                {t("unevaluatedTable.evaluate")}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {t("unevaluatedTable.noData")}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Evaluated Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                {t("evaluatedTable.title", { count: evaluatedItems.length })}
              </CardTitle>
              <Button
                size="sm"
                onClick={handlePublishStudyReport}
                disabled={
                  publishing ||
                  !selectedCourse ||
                  !selectedAssessment ||
                  evaluatedItems.length === 0
                }
                variant={isPublished ? "default" : "outline"}
              >
                {publishing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Share2 className="mr-2 h-4 w-4" />
                    {isPublished ? "Hủy xuất bản" : "Xuất bản cho học sinh"}
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              {evaluatedItems.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-gray-100">
                  <Table className="text-sm">
                    <TableHeader>
                      <TableRow className="border-gray-100 bg-gray-50">
                        <TableHead className="text-sm font-bold text-gray-700 bg-gray-50 rounded-l-xl px-6 sticky left-0 z-10 text-center">
                          {t("evaluatedTable.no")}
                        </TableHead>
                        <TableHead className="text-sm font-bold text-gray-700 bg-gray-50 min-w-[150px] px-6 sticky left-[60px] z-10 text-center">
                          {t("evaluatedTable.studentName")}
                        </TableHead>
                        {/* Các cột động cho star_skills */}
                        {dynamicColumns.starSkills.map((skill) => (
                          <TableHead
                            key={`star-${skill.id}`}
                            className="text-sm font-bold text-gray-700 bg-gray-50 px-6 min-w-[120px] text-center"
                          >
                            {skill.name_vn}
                          </TableHead>
                        ))}
                        {/* Các cột động cho check_skills */}
                        {dynamicColumns.checkSkills.map((skill) => (
                          <TableHead
                            key={`check-${skill.id}`}
                            className="text-sm font-bold text-gray-700 bg-gray-50 text-center px-6 min-w-[150px]"
                          >
                            {skill.name_vn}
                          </TableHead>
                        ))}
                        <TableHead className="text-sm font-bold text-gray-700 bg-gray-50 px-6 min-w-[200px] text-center">
                          {t("evaluatedTable.generalComment")}
                        </TableHead>
                        <TableHead className="text-sm font-bold text-gray-700 bg-gray-50 text-center px-6 rounded-r-xl">
                          {t("evaluatedTable.action")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {evaluatedItems.map((item, index) => {
                        // Tạo map để dễ dàng truy cập skill theo id
                        const starSkillsMap = new Map(
                          item.star_skills?.map((skill) => [skill.id, skill]) ||
                          []
                        );
                        const checkSkillsMap = new Map(
                          item.check_skills?.map((skill) => [
                            skill.id,
                            skill,
                          ]) || []
                        );

                        return (
                          <TableRow
                            key={`${item.student_id}-${item.report_id}`}
                            className="border-gray-100 hover:bg-gray-50 transition-colors"
                          >
                            <TableCell className="px-6 py-3 sticky left-0 bg-white z-10 text-center">
                              {index + 1}
                            </TableCell>
                            <TableCell className="px-6 py-3 font-semibold text-gray-900 sticky left-[60px] bg-white z-10 text-center">
                              {item.student_name}
                            </TableCell>
                            {/* Các cột động cho star_skills */}
                            {dynamicColumns.starSkills.map((skill) => {
                              const starSkill = starSkillsMap.get(skill.id);
                              return (
                                <TableCell
                                  key={`star-${skill.id}`}
                                  className="px-6 py-3 text-center"
                                >
                                  {starSkill?.average_star !== undefined &&
                                    starSkill?.average_star !== null ? (
                                    <Badge
                                      variant="outline"
                                      className="font-semibold"
                                    >
                                      {Number(starSkill.average_star).toFixed(
                                        2
                                      )}
                                    </Badge>
                                  ) : (
                                    <span className="text-gray-400 text-sm">
                                      -
                                    </span>
                                  )}
                                </TableCell>
                              );
                            })}
                            {/* Các cột động cho check_skills */}
                            {dynamicColumns.checkSkills.map((skill) => {
                              const checkSkill = checkSkillsMap.get(skill.id);
                              const checkedTypes =
                                checkSkill?.types
                                  ?.filter((type) => type.is_check)
                                  .map((type) => type.name_vn) || [];
                              return (
                                <TableCell
                                  key={`check-${skill.id}`}
                                  className="px-6 py-3 text-center"
                                >
                                  {checkedTypes.length > 0 ? (
                                    <div className="flex flex-wrap gap-1 justify-center">
                                      {checkedTypes.map((typeName, idx) => (
                                        <Badge
                                          key={idx}
                                          variant="secondary"
                                          className="text-xs"
                                        >
                                          {typeName}
                                        </Badge>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 text-sm">
                                      -
                                    </span>
                                  )}
                                </TableCell>
                              );
                            })}
                            <TableCell className="px-6 py-3">
                              {item.has_general_comment ? (
                                <div className="flex justify-center">
                                  <p
                                    className="max-w-xs text-sm text-gray-600 truncate text-center"
                                    title={item.general_comment}
                                  >
                                    {item.general_comment}
                                  </p>
                                </div>
                              ) : (
                                <div className="flex justify-center">
                                  <Badge variant="secondary">
                                    {t("unevaluatedTable.noComment")}
                                  </Badge>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="px-6 py-3 text-center">
                              <div className="flex justify-center">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEvaluate(item)}
                                  className="flex items-center gap-2"
                                >
                                  <Eye className="h-4 w-4" />
                                  {t("evaluatedTable.viewComment")}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {t("evaluatedTable.noData")}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
