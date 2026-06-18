"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { Target, Calendar, Users, GraduationCap, BookOpen, ArrowLeft, ExternalLink, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  GetCourseDetail,
  UpdateCourse,
  GetCourseFamily,
  SyncAllFamilyCourses,
  GetUsersInCourse,
  unwrapApiPayload,
  parseCourseApiDate,
} from "@/lib/api/courses";
import { UpdateLesson } from "@/lib/api/lessons";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTypedTranslations } from "@/lib/i18n/client";
import type { Lesson } from "@/lib/api/lessons";
import type { Chapter } from "@/lib/api/chapters";
import { useAuth } from "@/lib/context/auth-context";
import { RoleBasedHeaderSidebar } from "@/components/layout/role-based-header-sidebar";
import { UploadMedia } from "@/lib/api/picture";
import StudentModal from "./components/StudentModal";
import TeacherModal from "./components/TeacherModal";
import ScheduleModal from "./components/ScheduleModal";
import { GetSchoolList } from "@/lib/api/schools";
import { GetProgramList } from "@/lib/api/programs";
import { GetSemestersList, Semester } from "@/lib/api/semesters";
import { Checkbox } from "@/components/ui/checkbox";
import { sortAlphabetGeneric, sortByNumberAndAlphabetFromSecondGeneric } from "@/lib/utils";

function EditCourseContent({
  chapterLessonSelect,
  setChapterLessonSelect,
  onAddLessonToChapter,
  popuploading,
  setPopuploading,
  popuploadingText,
  setPopuploadingText,
  refreshTrigger,
}: {
  chapterLessonSelect: { idx: string; show: boolean };
  setChapterLessonSelect: (value: { idx: string; show: boolean }) => void;
  onAddLessonToChapter: (
    lesson: Lesson,
    onSuccess?: () => void
  ) => Promise<void>;
  popuploading: boolean;
  setPopuploading: (loading: boolean) => void;
  popuploadingText: string;
  setPopuploadingText: (text: string) => void;
  refreshTrigger: number;
}) {
  const { user } = useAuth();

  const params = useParams();

  const courseIdParam = params.id;
  const courseId = Array.isArray(courseIdParam)
    ? courseIdParam[0]
    : courseIdParam;

  const locale = params.locale as string;

  // Translation hook must be called at top level
  const t = useTypedTranslations("teacherCourses");

  // State
  const [form, setForm] = useState({
    name: "",
    object_title: "",
    target: "",
    description: "",
    cover: "",
    coverType: "upload",
    duration: 1 as number | "",
    start_date: null as Date | null,
    end_date: null as Date | null,
    skills: [] as string[],
    chapters: [] as Chapter[],
    students: [] as {
      id: string;
      name: string;
      email: string;
      school?: string;
      class?: string;
    }[],
    teachers: [] as {
      id: string;
      name: string;
      email: string;
      school?: string;
    }[],
    semesters: [] as {
      id: number;
      name: string;
      description: string;
      start_date: string;
      end_date: string;
    }[],
  });
  const [courseData, setCourseData] = useState<any>(null); // Lưu toàn bộ object course từ API
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studentFilter, setStudentFilter] = useState<{
    school: string;
    class: string;
    name: string;
  }>({ school: "", class: "", name: "" });
  const [isFormChanged, setIsFormChanged] = useState(false);
  const initialFormRef = useRef<any>(null);
  const router = useRouter();
  const [teacherFilter, setTeacherFilter] = useState<{
    school: string;
    name: string;
  }>({ school: "", name: "" });
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const initialStudentsRef = useRef<any[]>([]);
  const initialTeachersRef = useRef<any[]>([]);
  const [isUserListChanged, setIsUserListChanged] = useState(false);
  const [isStudentListChanged, setIsStudentListChanged] = useState(false);
  const [isTeacherListChanged, setIsTeacherListChanged] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [isSavingCourse, setIsSavingCourse] = useState(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState<{
    [key: string]: boolean;
  }>({});
  const [showClampButton, setShowClampButton] = useState<{
    [key: string]: boolean;
  }>({});
  const [deleteChapterConfirm, setDeleteChapterConfirm] = useState<{
    show: boolean;
    chapterId: string;
    chapterTitle: string;
  }>({
    show: false,
    chapterId: "",
    chapterTitle: "",
  });
  const [shouldClampDescription, setShouldClampDescription] = useState<{
    [key: string]: boolean;
  }>({});

  // Danh sách trường (fetch 1 lần khi cần)
  const [schoolList, setSchoolList] = useState<any[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [selectedSchoolName, setSelectedSchoolName] = useState<string>("");

  //Danh sách chương trình (fetch 1 lần khi cần)
  const [programList, setProgramList] = useState<any[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  const [selectedProgramName, setSelectedProgramName] = useState<string>("");

  //Danh sách kỳ học (fetch 1 lần khi cần)
  const [semesterList, setSemesterList] = useState<Semester[]>([]);
  const [selectedSemesterIds, setSelectedSemesterIds] = useState<string[]>([]);
  const [isSemesterDropdownOpen, setIsSemesterDropdownOpen] = useState(false);

  // Dialog đồng bộ khóa học cùng chương trình
  const [showSyncFamilyDialog, setShowSyncFamilyDialog] = useState(false);
  const [familyData, setFamilyData] = useState<{
    parent: any;
    children: any[];
  } | null>(null);
  const [loadingFamilyData, setLoadingFamilyData] = useState(false);
  const [isLoadingCourse, setIsLoadingCourse] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{
    completed_courses: number;
    total_courses: number;
    current_message: string;
  } | null>(null);

  // Fetch school list ngay khi có courseData (và chỉ fetch 1 lần)
  useEffect(() => {
    if (courseData && schoolList.length === 0) {
      (async () => {
        try {
          const res = await GetSchoolList({ page: 1 });
          setSchoolList(res?.data?.schools || []);
        } catch {
          setSchoolList([]);
        }
      })();
    }
  }, [courseData]);

  useEffect(() => {
    (async () => {
      try {
        const res = await GetProgramList({ page: 1 });
        setProgramList(res?.data?.programs || []);
      } catch {
        setProgramList([]);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await GetSemestersList();
        setSemesterList(res?.data?.semesters || []);
      } catch {
        setSemesterList([]);
      }
    })();
  }, []);
  // Fetch course detail khi component mount hoặc courseId thay đổi
  useEffect(() => {
    let cancelled = false;

    const mapStudents = (users: any[]) =>
      (Array.isArray(users) ? users : []).map((u) => ({
        id: String(u.id),
        name: u.name || u.username || "",
        email: u.email || "",
        school:
          typeof u.user_info?.school === "object"
            ? u.user_info?.school?.name || ""
            : u.user_info?.school || "",
        class:
          typeof u.user_info?.class === "object"
            ? u.user_info?.class?.name || ""
            : u.user_info?.class || "",
      }));

    const mapTeachers = (users: any[]) =>
      (Array.isArray(users) ? users : []).map((u) => ({
        id: String(u.id),
        name: u.name || u.username || "",
        email: u.email || "",
        school:
          typeof u.user_info?.school === "object"
            ? u.user_info?.school?.name || ""
            : u.user_info?.school || "",
      }));

    const applyCourseToForm = (
      course: any,
      students: typeof form.students,
      teachers: typeof form.teachers
    ) => {
      const semesters = (course.semesters || []).map((s: any) => ({
        id: Number(s.id),
        name: s.name || "",
        description: s.description || "",
        start_date: s.start_date || "",
        end_date: s.end_date || "",
      }));

      setForm((f) => ({
        ...f,
        name: course.name || "",
        object_title: course.object_title || "",
        description: course.description || "",
        target: course.target || course.goal || course.objective || "",
        cover: course.image || "",
        coverType: course.cover ? "upload" : course.image ? "link" : f.coverType,
        duration: course.duration ?? 1,
        start_date: parseCourseApiDate(course.start_date),
        end_date: parseCourseApiDate(course.end_date),
        chapters: course.chapters || [],
        students,
        teachers,
        semesters,
        skills: course.skills || f.skills,
      }));

      if (semesters.length > 0) {
        setSelectedSemesterIds(semesters.map((s) => String(s.id)));
      }
    };

    (async () => {
      if (typeof window !== "undefined") {
        const cached = sessionStorage.getItem("courseEdit");
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (
              parsed &&
              parsed.id?.toString() ===
                window.location.pathname.split("/").at(-2)
            ) {
              setForm((f) => ({
                ...f,
                name: parsed.name || "",
                object_title: parsed.object_title || "",
                target: parsed.target || parsed.goal || parsed.objective || "",
                description: parsed.description || "",
                cover: parsed.image || parsed.cover || "",
                coverType:
                  parsed.coverType || (parsed.image ? "link" : "upload"),
                duration: parsed.weeks || parsed.duration || 1,
                skills: parsed.skills || [],
                chapters: parsed.chapters || [],
                students: parsed.students || [],
                start_date: parsed.start_date
                  ? parseCourseApiDate(parsed.start_date)
                  : null,
              }));
            }
          } catch {
            // ignore invalid cache
          }
        }
      }

      if (!courseId) {
        setIsLoadingCourse(false);
        return;
      }

      setIsLoadingCourse(true);
      setLoadError(null);

      try {
        const response = await GetCourseDetail(courseId);
        if (response?.code && Number(response.code) !== 200) {
          throw new Error(response.message || "Không thể tải khóa học");
        }

        const course = unwrapApiPayload(response);
        if (!course) {
          throw new Error("Không có dữ liệu khóa học");
        }

        if (cancelled) return;

        setCourseData(course);
        applyCourseToForm(course, [], []);

        let students: typeof form.students = [];
        let teachers: typeof form.teachers = [];

        try {
          const [studentsRes, teachersRes] = await Promise.all([
            GetUsersInCourse(3, Number(courseId)),
            GetUsersInCourse(2, Number(courseId)),
          ]);
          const studentsPayload = unwrapApiPayload<{ users?: any[] }>(
            studentsRes
          );
          const teachersPayload = unwrapApiPayload<{ users?: any[] }>(
            teachersRes
          );
          students = mapStudents(studentsPayload?.users || []);
          teachers = mapTeachers(teachersPayload?.users || []);
        } catch (userErr) {
          console.error("Error fetching users in course:", userErr);
        }

        if (cancelled) return;

        initialStudentsRef.current = students;
        initialTeachersRef.current = teachers;
        applyCourseToForm(course, students, teachers);
      } catch (err) {
        console.error("Error fetching course detail:", err);
        if (!cancelled) {
          setLoadError(
            err instanceof Error
              ? err.message
              : "Không thể tải dữ liệu khóa học"
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingCourse(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [courseId]);

  // useEffect để refresh dữ liệu khi có lesson được thêm thành công
  useEffect(() => {
    if (refreshTrigger > 0) {
      (async () => {
        try {
          console.log(
            "Refreshing course detail after lesson addition... refreshTrigger:",
            refreshTrigger
          );
          if (!courseId) return;
          const detail = await GetCourseDetail(courseId);
          const course = unwrapApiPayload(detail);
          if (!course) return;
          setForm((f) => ({
            ...f,
            ...course,
            chapters: course.chapters || [],
          }));
          console.log("Form refreshed successfully");
        } catch (err) {
          console.error("Error refreshing course detail:", err);
        }
      })();
    }
  }, [refreshTrigger, courseId]);

  // Theo dõi thay đổi form thông tin cơ bản
  useEffect(() => {
    // Lưu initial form khi load lần đầu từ API (chỉ lưu 1 lần duy nhất sau khi có dữ liệu từ API)
    if (!initialFormRef.current && form.name) {
      initialFormRef.current = {
        name: form.name,
        object_title: form.object_title,
        target: form.target,
        description: form.description,
        cover: form.cover,
        coverType: form.coverType,
        duration: form.duration,
        start_date: form.start_date,
        end_date: form.end_date,
        schoolId: selectedSchoolId, // Lưu thêm trường trường hiện tại
        programId:
          selectedProgramId ||
          (courseData?.program_id ? String(courseData.program_id) : ""),
      };
    }
    // So sánh form hiện tại với initialFormRef (chỉ cần khác là enable)
    if (initialFormRef.current) {
      const currentStartDate = form.start_date
        ? format(form.start_date, "yyyy-MM-dd")
        : null;
      const initialStartDate = initialFormRef.current.start_date
        ? format(initialFormRef.current.start_date, "yyyy-MM-dd")
        : null;
      const currentEndDate = form.end_date
        ? format(form.end_date, "yyyy-MM-dd")
        : null;
      const initialEndDate = initialFormRef.current.end_date
        ? format(initialFormRef.current.end_date, "yyyy-MM-dd")
        : null;

      const changed =
        form.name !== initialFormRef.current.name ||
        form.object_title !== initialFormRef.current.object_title ||
        form.target !== initialFormRef.current.target ||
        form.description !== initialFormRef.current.description ||
        form.cover !== initialFormRef.current.cover ||
        form.coverType !== initialFormRef.current.coverType ||
        form.duration !== initialFormRef.current.duration ||
        currentStartDate !== initialStartDate ||
        currentEndDate !== initialEndDate ||
        selectedSchoolId !== initialFormRef.current.schoolId ||
        selectedProgramId !== initialFormRef.current.programId;

      setIsFormChanged(changed);
    }
  }, [
    form.name,
    form.object_title,
    form.target,
    form.description,
    form.cover,
    form.coverType,
    form.duration,
    form.start_date,
    form.end_date,
    selectedSchoolId,
    selectedProgramId,
  ]);

  // Khi load lại detail từ API, reset initialFormRef đúng chuẩn (chỉ khi dữ liệu API đổi)
  useEffect(() => {
    if (form.name && form.target && form.description) {
      initialFormRef.current = {
        name: form.name,
        object_title: form.object_title,
        target: form.target,
        description: form.description,
        cover: form.cover,
        coverType: form.coverType,
        duration: form.duration,
        start_date: form.start_date,
        end_date: form.end_date,
      };
      setIsFormChanged(false);
    }
  }, [courseId]);

  // Theo dõi thay đổi danh sách học sinh/giáo viên để enable/disable nút lưu
  useEffect(() => {
    function getIdList(arr: any[]) {
      return (arr || [])
        .map((u) => String(u.id))
        .sort()
        .join(",");
    }
    setIsStudentListChanged(
      getIdList(form.students) !== getIdList(initialStudentsRef.current)
    );
    setIsTeacherListChanged(
      getIdList(form.teachers) !== getIdList(initialTeachersRef.current)
    );
  }, [
    form.students.length,
    form.teachers.length,
    form.students,
    form.teachers,
  ]);

  // Tự động tính toán end_date khi start_date hoặc duration thay đổi
  useEffect(() => {
    if (
      form.start_date &&
      typeof form.duration === "number" &&
      form.duration > 0
    ) {
      const endDate = new Date(form.start_date);
      endDate.setDate(endDate.getDate() + form.duration * 7); // Thêm số tuần * 7 ngày

      // Chỉ cập nhật nếu end_date thực sự khác
      const newEndDateStr = format(endDate, "yyyy-MM-dd");
      const currentEndDateStr = form.end_date
        ? format(form.end_date, "yyyy-MM-dd")
        : null;

      if (newEndDateStr !== currentEndDateStr) {
        setForm((f) => ({ ...f, end_date: endDate }));
      }
    } else {
      if (form.end_date !== null) {
        setForm((f) => ({ ...f, end_date: null }));
      }
    }
  }, [form.start_date, form.duration]);

  // Xóa lesson khỏi chương
  const handleRemoveLessonFromChapter = async (
    chapterId: string,
    lessonIdx: number
  ) => {
    console.log("Xóa lesson khỏi chương:", { chapterId, lessonIdx });
    // Tìm chương và lesson cần xóa
    const chapter = form.chapters.find(
      (ch: Chapter) => String(ch.id) === String(chapterId)
    );
    if (!chapter || !chapter.lessons || chapter.lessons.length <= lessonIdx)
      return;
    const lessonItem = chapter.lessons[lessonIdx];

    setPopuploadingText("Đang xóa bài học khỏi chương...");
    setPopuploading(true);
    try {
      // Chỉ truyền lên trường chapter để tránh mất dữ liệu bài học
      await UpdateLesson(lessonItem.id, { chapter: { id: 0, title: "" } });
      // Lấy lại chi tiết khóa học mới nhất
      if (!courseId) return;
      const detail = await GetCourseDetail(courseId);
      const course = unwrapApiPayload(detail);
      if (!course) return;
      setForm((f) => ({
        ...f,
        ...course,
        chapters: course.chapters || [],
      }));
    } catch (err) {
      console.error("Xóa lesson khỏi chương thất bại", err);
    } finally {
      setPopuploading(false);
    }
  };
  // Thêm học sinh từ modal
  const handleAddStudents = (selected: any[]) => {
    setForm((f) => ({
      ...f,
      students: selected.map((s) => ({
        id: String(s.id),
        name: s.name || s.username || "",
        email: s.email || "",
        school: s.school
          ? typeof s.school === "string"
            ? s.school
            : ""
          : typeof s.user_info?.school === "object"
          ? s.user_info?.school?.name || ""
          : s.user_info?.school || "",
        class: s.class
          ? typeof s.class === "string"
            ? s.class
            : ""
          : typeof s.user_info?.class === "object"
          ? s.user_info?.class?.name || ""
          : s.user_info?.class || "",
      })),
    }));
    setShowStudentModal(false);
  };
  // Thêm giáo viên từ modal
  const handleAddTeachers = (selected: any[]) => {
    setForm((f) => ({
      ...f,
      teachers: selected.map((t) => ({
        id: String(t.id),
        name: t.name || t.username || "",
        email: t.email || "",
        school: t.school
          ? typeof t.school === "string"
            ? t.school
            : ""
          : typeof t.user_info?.school === "object"
          ? t.user_info?.school?.name || ""
          : t.user_info?.school || "",
      })),
    }));
    setShowTeacherModal(false);
  };

  useEffect(() => {
    // Lấy dữ liệu từ sessionStorage nếu có
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem("courseEdit");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (
            parsed &&
            parsed.id?.toString() === window.location.pathname.split("/").at(-2)
          ) {
            setForm((f) => ({
              ...f,
              name: parsed.name || "",
              object_title: parsed.object_title || "",
              target: parsed.target || parsed.goal || parsed.objective || "",
              description: parsed.description || "",
              cover: parsed.image || parsed.cover || "",
              coverType: parsed.coverType || (parsed.image ? "link" : "upload"),
              duration: parsed.weeks || parsed.duration || 1,
              skills: parsed.skills || [],
              chapters: parsed.chapters || [],
              students: parsed.students || [],
            }));
          }
        } catch {}
      }
    }
    // TODO: Có thể gọi API để lấy dữ liệu mới nhất nếu cần
  }, []);

  // Handler: mở modal chọn giáo viên, reset filter và state
  const handleOpenTeacherModal = async () => {
    setTeacherFilter({ school: "", name: "" }); // Đảm bảo luôn là string
    setShowTeacherModal(true);
  };

  // Handler: mở modal chọn học sinh, reset filter và state
  const handleOpenStudentModal = async () => {
    setStudentFilter({ school: "", class: "", name: "" }); // Đảm bảo luôn là string
    setShowStudentModal(true);
  };

  // Render helpers
  function renderLesson(lessonItem: any, lidx: number, chapter: Chapter) {
    let lesson: Lesson | undefined;

    // Ưu tiên sử dụng dữ liệu từ course detail (đã đầy đủ thông tin)
    if (
      typeof lessonItem === "object" &&
      lessonItem !== null &&
      lessonItem.title
    ) {
      lesson = lessonItem;
    } else {
      // Fallback: hiển thị thông tin cơ bản nếu chỉ có ID
      lesson = {
        id: lessonItem,
        title: `Bài học #${lessonItem}`,
        description: "",
        status: false,
        chapter: { id: chapter.id, title: chapter.title },
        dependencies: [],
        tags: [],
        skill: [],
        topics: [],
        exams: [],
        homeworks: [],
        author: { id: "", name: "", username: "", email: "", phone_number: "" },
        assessment: []
      };
    }

    if (!lesson) {
      return (
        <div
          key={lessonItem}
          className="flex items-center justify-between bg-red-50 border border-red-100 rounded-xl px-4 py-3"
        >
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-red-700">
              Bài {lidx + 1}: #{lessonItem}
            </div>
            <div className="text-xs text-red-500 mt-1">
              Không tìm thấy thông tin bài học
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              handleRemoveLessonFromChapter(String(chapter.id), lidx)
            }
            className="text-red-500 hover:bg-red-100 rounded-lg p-2"
          >
            ×
          </Button>
        </div>
      );
    }

    return (
      <div
        key={lesson.id}
        className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 hover:bg-blue-100 transition-colors"
      >
        <div
          className="flex-1 min-w-0 cursor-pointer hover:underline"
          title="Xem chi tiết bài học"
          onClick={() =>
            window.open(
              `/${locale}/manage/lessons/${lesson.id}?course_id=${courseId}`,
              "_blank"
            )
          }
        >
          <div className="font-semibold text-blue-700">
            Bài {lidx + 1}: {lesson.title}
          </div>
          {lesson.description && (
            <div className="text-xs text-blue-600 mt-1 line-clamp-2">
              {lesson.description}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Hàm lưu thay đổi khóa học
  const handleSaveCourse = async () => {
    setIsSavingCourse(true);
    try {
      let finalCoverUrl = form.cover;
      if (selectedImageFile && form.coverType === "upload") {
        const uploadResult = await UploadMedia(
          selectedImageFile,
          "courses/covers"
        );
        if (uploadResult && uploadResult.data && uploadResult.data.url) {
          finalCoverUrl = uploadResult.data.url;
        } else {
          throw new Error("Upload ảnh thất bại - không nhận được URL");
        }
      }
      if (!courseData) throw new Error("Không tìm thấy dữ liệu khóa học gốc");
      if (!courseId) throw new Error("Không tìm thấy ID khóa học");
      if (form.duration === "")
        throw new Error("Vui lòng nhập thời gian học hợp lệ");
      const updatedCourse = { ...courseData };
      updatedCourse.name = form.name || "";
      updatedCourse.object_title = form.object_title || "";
      updatedCourse.description = form.description || "";
      updatedCourse.target = form.target || "";
      updatedCourse.image = finalCoverUrl || "";
      updatedCourse.duration = String(form.duration || "");
      updatedCourse.start_date = form.start_date
        ? format(form.start_date, "yyyy-MM-dd")
        : null;
      updatedCourse.end_date = form.end_date
        ? format(form.end_date, "dd/MM/yyyy", { locale: vi })
        : null;
      // Thêm trường school là object nếu đã chọn
      if (selectedSchoolId && selectedSchoolName) {
        updatedCourse.school = {
          id: Number(selectedSchoolId),
          name: selectedSchoolName,
        };
      }
      if (selectedProgramId) {
        updatedCourse.program_id = Number(selectedProgramId);
        delete updatedCourse.program;
      }
      // Cập nhật semesters
      updatedCourse.semesters = form.semesters || [];

      await UpdateCourse(courseId, updatedCourse);
      setSelectedImageFile(null);
      router.push(`/${locale}/manage/courses/${courseId}`);
    } catch (err) {
      console.error("Lỗi cập nhật course:", err);
      alert(
        `Lỗi: ${err instanceof Error ? err.message : "Không thể lưu thay đổi"}`
      );
    } finally {
      setIsSavingCourse(false);
    }
  };

  // Đồng bộ trường đã chọn khi cả courseData và schoolList đã có dữ liệu
  useEffect(() => {
    if (courseData && schoolList.length > 0) {
      // Ưu tiên lấy từ courseData.school (object), fallback sang courseData.school_id
      let schoolId = "";
      let schoolName = "";
      if (courseData.school && typeof courseData.school === "object") {
        schoolId = String(courseData.school.id);
        schoolName = courseData.school.name || "";
      } else if (courseData.school_id) {
        schoolId = String(courseData.school_id);
        const found = schoolList.find((s) => String(s.id) === schoolId);
        schoolName = found ? found.name : "";
      }
      if (schoolId) {
        setSelectedSchoolId(schoolId);
        setSelectedSchoolName(schoolName);
      }
    }
  }, [courseData, schoolList]);

  //đồng bộ program đã chọn khi cả courseData và programList đã có dữ liệu
  useEffect(() => {
    if (courseData && programList.length > 0) {
      // Ưu tiên lấy từ courseData.program (object), fallback sang courseData.program_id
      let programId = "";
      let programName = "";
      if (courseData.program && typeof courseData.program === "object") {
        programId = String(courseData.program.id);
        programName = courseData.program.name || "";
      } else if (courseData.program_id) {
        programId = String(courseData.program_id);
        const found = programList.find((s) => String(s.id) === programId);
        programName = found ? found.name : "";
      }
      if (programId) {
        setSelectedProgramId(programId);
        setSelectedProgramName(programName);
      }
    }
  }, [courseData, programList]);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-semester-dropdown]")) {
        setIsSemesterDropdownOpen(false);
      }
    };
    if (isSemesterDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSemesterDropdownOpen]);

  // Conditional rendering instead of early return
  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-6">
        {!courseId ? (
          <div className="text-center">Loading...</div>
        ) : isLoadingCourse ? (
          <div className="text-center py-16 text-gray-500">
            Đang tải dữ liệu khóa học...
          </div>
        ) : loadError ? (
          <div className="text-center py-16">
            <p className="text-red-600 mb-4">{loadError}</p>
            <Button variant="outline" onClick={() => router.back()}>
              Quay lại
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-8">
              {window.history.length > 1 && <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900 mt-8 xl:mt-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t("backButton")}
              </Button>}
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {t("editCourse")}
              </h1>
              <p className="text-gray-600">{t("editCourseSubtitle")}</p>
            </div>

            {/* Frame: Thông tin cơ bản - Full width */}
            <div className="bg-white border-0 shadow-sm rounded-2xl p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {t("basicInfo")}
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Cột trái: Tên, mục tiêu, thời gian, ngày */}
                <div className="space-y-6">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-2">
                      {t("courseName")} <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={form.name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name: e.target.value }))
                      }
                      placeholder={t("enterCourseName")}
                      className="border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-2">
                      {t("courseTitle")} <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={form.object_title}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, object_title: e.target.value }))
                      }
                      placeholder={t("enterCourseTitle")}
                      className="border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-2">
                      {t("courseTarget")}
                    </label>
                    <Input
                      value={form.target}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, target: e.target.value }))
                      }
                      placeholder={t("enterTarget")}
                      className="border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-2 mt-4">
                      Chương trình
                    </label>
                    <select
                      className="w-full border rounded-xl px-4 py-2 bg-white"
                      value={
                        selectedProgramId ||
                        (courseData?.program_id
                          ? String(courseData.program_id)
                          : "")
                      }
                      onChange={(e) => {
                        setSelectedProgramId(e.target.value);
                      }}
                    >
                      <option value="">-- Chọn chương trình --</option>
                      {sortByNumberAndAlphabetFromSecondGeneric(programList, item => item.name, true).map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-2 mt-4">
                      Kỳ học
                    </label>
                    <div className="relative" data-semester-dropdown>
                      <button
                        type="button"
                        onClick={() =>
                          setIsSemesterDropdownOpen(!isSemesterDropdownOpen)
                        }
                        className="w-full border rounded-xl px-4 py-3 bg-white text-left flex items-center justify-between hover:border-emerald-300 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-200 transition-colors"
                      >
                        <span
                          className={
                            selectedSemesterIds.length === 0
                              ? "text-gray-400"
                              : "text-gray-900"
                          }
                        >
                          {selectedSemesterIds.length === 0
                            ? "-- Chọn kỳ học --"
                            : selectedSemesterIds.length === 1
                            ? semesterList.find(
                                (s: Semester) => s.id === selectedSemesterIds[0]
                              )?.name || "Đã chọn"
                            : `Đã chọn ${selectedSemesterIds.length} kỳ học`}
                        </span>
                        <svg
                          className={`w-4 h-4 text-gray-400 transition-transform ${
                            isSemesterDropdownOpen ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                      {isSemesterDropdownOpen && (
                        <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                          <div className="p-2 space-y-2">
                            {semesterList.length === 0 ? (
                              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                                Không có kỳ học nào
                              </div>
                            ) : (
                              semesterList.map((semester: Semester) => {
                                const isSelected = selectedSemesterIds.includes(
                                  semester.id
                                );
                                return (
                                  <label
                                    key={semester.id}
                                    className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                                  >
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          const newIds = [
                                            ...selectedSemesterIds,
                                            semester.id,
                                          ];
                                          setSelectedSemesterIds(newIds);
                                          setForm((prev) => ({
                                            ...prev,
                                            semesters: semesterList
                                              .filter((s: Semester) =>
                                                newIds.includes(s.id)
                                              )
                                              .map((s: Semester) => ({
                                                id: Number(s.id),
                                                name: s.name,
                                                description: s.description,
                                                start_date: s.start_date,
                                                end_date: s.end_date,
                                              })),
                                          }));
                                        } else {
                                          const newIds =
                                            selectedSemesterIds.filter(
                                              (id: string) => id !== semester.id
                                            );
                                          setSelectedSemesterIds(newIds);
                                          setForm((prev) => ({
                                            ...prev,
                                            semesters: semesterList
                                              .filter((s: Semester) =>
                                                newIds.includes(s.id)
                                              )
                                              .map((s: Semester) => ({
                                                id: Number(s.id),
                                                name: s.name,
                                                description: s.description,
                                                start_date: s.start_date,
                                                end_date: s.end_date,
                                              })),
                                          }));
                                        }
                                      }}
                                    />
                                    <div className="flex-1">
                                      <div className="text-sm font-medium text-gray-900">
                                        {semester.name}
                                      </div>
                                      {semester.description && (
                                        <div className="text-xs text-gray-500 mt-0.5">
                                          {semester.description}
                                        </div>
                                      )}
                                    </div>
                                  </label>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    {selectedSemesterIds.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedSemesterIds.map((semesterId: string) => {
                          const semester = semesterList.find(
                            (s: Semester) => s.id === semesterId
                          );
                          if (!semester) return null;
                          return (
                            <div
                              key={semesterId}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm border border-emerald-200"
                            >
                              <span>{semester.name}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const newIds = selectedSemesterIds.filter(
                                    (id: string) => id !== semesterId
                                  );
                                  setSelectedSemesterIds(newIds);
                                  setForm((prev) => ({
                                    ...prev,
                                    semesters: semesterList
                                      .filter((s: Semester) =>
                                        newIds.includes(s.id)
                                      )
                                      .map((s: Semester) => ({
                                        id: Number(s.id),
                                        name: s.name,
                                        description: s.description,
                                        start_date: s.start_date,
                                        end_date: s.end_date,
                                      })),
                                  }));
                                }}
                                className="hover:text-emerald-900 focus:outline-none"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="gap-4">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-2">
                        {t("durationWeeks")}
                      </label>
                      <Input
                        type="number"
                        min={1}
                        value={
                          form.duration === ""
                            ? ""
                            : String(form.duration).replace(/^0+/, "")
                        }
                        onChange={(e) => {
                          let val = e.target.value.replace(/^0+/, "");
                          if (val === "" || isNaN(Number(val))) {
                            setForm((f) => ({ ...f, duration: "" }));
                          } else {
                            setForm((f) => ({ ...f, duration: Number(val) }));
                          }
                        }}
                        className="border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500"
                      />
                      {form.duration === "" && (
                        <div className="text-red-500 text-sm mt-1">
                          Thời gian học không được để trống
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dropdown chọn trường */}
                  <div>
                    <label className="block font-semibold text-gray-700 mb-2 mt-4">
                      Trường
                    </label>
                    <select
                      className="w-full border rounded-xl px-4 py-2 bg-white"
                      value={
                        selectedSchoolId ||
                        (courseData?.school?.id
                          ? String(courseData.school.id)
                          : "")
                      }
                      onChange={(e) => {
                        setSelectedSchoolId(e.target.value);
                        const found = schoolList.find(
                          (s) => String(s.id) === e.target.value
                        );
                        setSelectedSchoolName(found ? found.name : "");
                      }}
                    >
                      <option value="">-- Chọn trường --</option>
                      {sortAlphabetGeneric(schoolList, item => item.name, true).map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Cột phải: Mô tả, ảnh cover, nút lưu */}
                <div className="space-y-6">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-2">
                      Mô tả chi tiết
                    </label>
                    <Textarea
                      value={form.description}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, description: e.target.value }))
                      }
                      placeholder="Nhập mô tả chi tiết cho khóa học"
                      className="border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500 min-h-[120px]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-2">
                      Ảnh cover
                    </label>
                    <div className="flex gap-2 mb-3">
                      <Button
                        variant={
                          form.coverType === "upload" ? "default" : "outline"
                        }
                        onClick={() => {
                          setForm((f) => ({ ...f, coverType: "upload" }));
                          if (form.coverType !== "upload") {
                            setSelectedImageFile(null);
                          }
                        }}
                        className="rounded-xl"
                      >
                        Upload
                      </Button>
                      <Button
                        variant={
                          form.coverType === "link" ? "default" : "outline"
                        }
                        onClick={() => {
                          setForm((f) => ({ ...f, coverType: "link" }));
                          setSelectedImageFile(null);
                        }}
                        className="rounded-xl"
                      >
                        Link
                      </Button>
                    </div>
                    {form.coverType === "upload" ? (
                      <Input
                        type="file"
                        accept="image/*"
                        className="border-gray-200 rounded-xl"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setSelectedImageFile(file);
                            setForm((f) => ({
                              ...f,
                              cover: URL.createObjectURL(file),
                            }));
                          }
                        }}
                      />
                    ) : (
                      <Input
                        value={form.cover}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, cover: e.target.value }))
                        }
                        placeholder="Dán link ảnh..."
                        className="border-gray-200 rounded-xl focus:border-blue-500 focus:ring-blue-500"
                      />
                    )}
                    {form.cover && (
                      <div className="mt-3">
                        <Image
                          src={form.cover}
                          alt="Ảnh bìa khóa học"
                          width={200}
                          height={120}
                          className="rounded-xl object-cover border w-full max-w-[200px] h-auto shadow-sm"
                        />
                      </div>
                    )}
                  </div>
                  <div className="pt-4">
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-sm transition-all hover:shadow-md"
                      // disabled={!isFormChanged || isSavingCourse}
                      onClick={handleSaveCourse}
                    >
                      {isSavingCourse ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            {/* Tabs: Nội dung khóa học */}
            <div className="bg-white border-0 shadow-sm rounded-2xl p-6">
              <Tabs defaultValue="chapters" className="w-full">
                <TabsList className="max-sm:flex max-sm:flex-col grid w-full h-auto grid-cols-3 bg-gray-100 rounded-xl p-1 mb-6">
                  <TabsTrigger
                    value="chapters"
                    className="flex items-center gap-2 rounded-lg w-full"
                  >
                    <BookOpen className="h-4 w-4" />
                    Chương & Bài học
                  </TabsTrigger>
                  <TabsTrigger
                    value="teachers"
                    className="flex items-center gap-2 rounded-lg w-full"
                  >
                    <GraduationCap className="h-4 w-4" />
                    Giáo viên
                  </TabsTrigger>
                  <TabsTrigger
                    value="students"
                    className="flex items-center gap-2 rounded-lg w-full"
                  >
                    <Users className="h-4 w-4" />
                    Học sinh
                  </TabsTrigger>
                </TabsList>

                {/* Tab: Chương và Bài học */}
                <TabsContent value="chapters">
                  <div className="space-y-6">
                    <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                      <Info className="h-5 w-5 shrink-0 mt-0.5" />
                      <div className="space-y-2">
                        <p>
                          Chương và bài học thuộc <strong>chương trình</strong> gắn với khóa học này.
                          Màn sửa khóa học chỉ <strong>xem</strong> nội dung và cài <strong>Schedule</strong> (lịch tuần).
                        </p>
                        {(selectedProgramId || courseData?.program_id) && (
                          <Link
                            href={`/${locale}/manage/programs/${selectedProgramId || courseData.program_id}/edit`}
                            className="inline-flex items-center gap-1.5 font-semibold text-blue-700 hover:text-blue-900 hover:underline"
                          >
                            Sửa chương &amp; bài học tại Chương trình
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mb-6 flex-wrap">
                      <Button
                        variant="outline"
                        onClick={() => setShowScheduleModal(true)}
                        className="border-gray-200 rounded-xl px-6 hover:bg-gray-50"
                      >
                        <Target className="h-4 w-4 mr-2" /> Schedule
                      </Button>
                      <div>
                        <Button
                          type="button"
                          onClick={async () => {
                            if (!courseData?.id) return;
                            setShowSyncFamilyDialog(true);
                            setSyncProgress(null);
                            setLoadingFamilyData(true);
                            try {
                              const res = await GetCourseFamily(courseData.id);
                              const data = res?.data || res;
                              setFamilyData({
                                parent: data?.parent || null,
                                children: data?.children || [],
                              });
                            } catch (error) {
                              console.error(
                                "Error loading family data:",
                                error
                              );
                              setFamilyData(null);
                            } finally {
                              setLoadingFamilyData(false);
                            }
                          }}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 max-sm:whitespace-normal max-sm:h-auto"
                        >
                          Đồng bộ lịch học cho các khóa học cùng chương trình
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {form.chapters.map((chapter: Chapter, idx: number) => (
                        <div
                          key={chapter.id}
                          className="border border-gray-200 rounded-2xl p-6 bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3 flex-wrap">
                              <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1 text-sm font-medium">
                                Chương {idx + 1}
                              </Badge>
                              <h3 className="text-lg font-bold text-gray-900">
                                {chapter.title}
                              </h3>
                            </div>
                          </div>
                          {chapter.description && (
                            <div className="mb-4">
                              <p
                                id={`desc-chapter-${chapter.id}`}
                                ref={(el) => {
                                  if (el) {
                                    // Đo số dòng thực tế khi render lần đầu (không clamp)
                                    if (
                                      typeof window !== "undefined" &&
                                      shouldClampDescription[chapter.id] ===
                                        undefined
                                    ) {
                                      // Tạm thời bỏ clamp để đo
                                      el.classList.remove("line-clamp-3");
                                      const lineHeight = parseFloat(
                                        getComputedStyle(el).lineHeight
                                      );
                                      const height = el.offsetHeight;
                                      const lines = Math.round(
                                        height / lineHeight
                                      );
                                      setShouldClampDescription((prev) => ({
                                        ...prev,
                                        [chapter.id]: lines > 3,
                                      }));
                                    }
                                  }
                                }}
                                className={
                                  `text-gray-600 text-sm leading-relaxed whitespace-pre-line ` +
                                  (expandedDescriptions[chapter.id] ||
                                  !shouldClampDescription[chapter.id]
                                    ? ""
                                    : "line-clamp-3")
                                }
                                style={{
                                  cursor: shouldClampDescription[chapter.id]
                                    ? "pointer"
                                    : "default",
                                }}
                              >
                                {chapter.description}
                              </p>
                              {shouldClampDescription[chapter.id] && (
                                <button
                                  className="text-blue-600 hover:underline text-xs mt-1 focus:outline-none"
                                  type="button"
                                  onClick={() =>
                                    setExpandedDescriptions((prev) => ({
                                      ...prev,
                                      [chapter.id]: !prev[chapter.id],
                                    }))
                                  }
                                >
                                  {expandedDescriptions[chapter.id]
                                    ? "Thu gọn"
                                    : "Xem thêm"}
                                </button>
                              )}
                            </div>
                          )}
                          {/* Danh sách bài học trong chương */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {(chapter.lessons || [])
                              .slice()
                              .map((lessonItem: any, lidx: number) =>
                                renderLesson(lessonItem, lidx, chapter)
                              )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Tab: Giáo viên */}
                <TabsContent value="teachers">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        Danh sách giáo viên
                      </h3>
                      <Button
                        onClick={handleOpenTeacherModal}
                        className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-6"
                      >
                        Chọn giáo viên
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {(form.teachers || []).map((teacher, idx) => (
                        <div
                          key={teacher.id}
                          className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl bg-white hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-700 font-semibold text-sm">
                              {teacher.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900">
                              {teacher.name}
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              {teacher.email}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {teacher.school
                                ? typeof teacher.school === "string"
                                  ? teacher.school
                                  : (teacher.school as any)?.name || "N/A"
                                : "N/A"}
                            </div>
                          </div>
                        </div>
                      ))}
                      {(!form.teachers || form.teachers.length === 0) && (
                        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                          <div className="text-gray-400 text-lg mb-2">
                            Chưa có giáo viên nào
                          </div>
                          <div className="text-gray-500 text-sm">
                            Chọn giáo viên để tham gia khóa học
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Tab: Học sinh */}
                <TabsContent value="students">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        Danh sách học sinh
                      </h3>
                      <Button
                        onClick={handleOpenStudentModal}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6"
                      >
                        Chọn học sinh
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {form.students.map((student, idx) => (
                        <div
                          key={student.id}
                          className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl bg-white hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-700 font-semibold text-sm">
                              {student.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900">
                              {student.name}
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              {student.email}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {typeof student.school === "string"
                                ? student.school
                                : (student.school as any)?.name || "N/A"}
                              {student.class &&
                                (typeof student.class === "string"
                                  ? ` - ${student.class}`
                                  : ` - ${(student.class as any)?.name || ""}`)}
                            </div>
                          </div>
                        </div>
                      ))}
                      {form.students.length === 0 && (
                        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                          <div className="text-gray-400 text-lg mb-2">
                            Chưa có học sinh nào
                          </div>
                          <div className="text-gray-500 text-sm">
                            Chọn học sinh để tham gia khóa học
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Modals */}
            <StudentModal
              open={showStudentModal}
              students={[]} // Không sử dụng anymore
              selected={form.students}
              filter={studentFilter}
              onFilter={setStudentFilter}
              onSelect={handleAddStudents}
              onClose={() => setShowStudentModal(false)}
              courseId={courseId}
            />
            <TeacherModal
              open={showTeacherModal}
              teachers={[]} // Không sử dụng anymore
              selected={form.teachers || []}
              filter={teacherFilter}
              onFilter={setTeacherFilter}
              onSelect={handleAddTeachers}
              onClose={() => setShowTeacherModal(false)}
              courseId={courseId}
            />
            <ScheduleModal
              open={showScheduleModal}
              chapters={form.chapters}
              duration={
                typeof form.duration === "number" ? form.duration : undefined
              }
              courseId={courseId}
              onClose={() => setShowScheduleModal(false)}
            />

            {/* Dialog đồng bộ khóa học cùng chương trình */}
            <Dialog
              open={showSyncFamilyDialog}
              onOpenChange={(open) => {
                setShowSyncFamilyDialog(open);
                if (!open) {
                  setSyncProgress(null);
                }
              }}
            >
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Đồng bộ khóa học cùng nhóm trong chương trình</DialogTitle>
                  <DialogDescription>
                    Xem và đồng bộ lịch học cho tất cả khóa học cùng nhóm trong chương
                    trình
                  </DialogDescription>
                </DialogHeader>

                {loadingFamilyData ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-gray-500">Đang tải dữ liệu...</div>
                  </div>
                ) : familyData ? (
                  <div className="space-y-6">
                    {/* Khóa học mẫu (Parent) */}
                    {familyData.parent && (
                      <div
                        className="
                          border rounded-lg p-4 bg-blue-50
                          cursor-pointer
                          hover:bg-blue-100
                          transition
                        "
                        onClick={() =>
                          window.open(
                            `/${locale}/manage/courses/${familyData.parent.id}`,
                            "_blank"
                          )
                        }
                      >
                        <h3 className="font-semibold text-blue-900 mb-3">
                          Khóa học mẫu
                        </h3>

                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium">Tên khóa học: </span>
                            <span>
                              {familyData.parent.name}
                              {familyData.parent.object_title
                                ? ` - ${familyData.parent.object_title}`
                                : ""}
                            </span>
                          </div>

                          <div>
                            <span className="font-medium">Trường: </span>
                            <span>
                              {familyData.parent.school_name || "N/A"}
                            </span>
                          </div>
                        </div>

                        {/* Nút Xem chi tiết */}
                        <div className="mt-4 text-right">
                          <button
                            className="
                              inline-flex items-center
                              text-sm font-medium
                              text-blue-700
                              hover:text-blue-900
                              underline
                            "
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(
                                `/${locale}/manage/courses/${familyData.parent.id}`,
                                "_blank"
                              );
                            }}
                          >
                            Xem chi tiết
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Danh sách khóa học liên quan (Children) */}
                    {familyData.children && familyData.children.length > 0 ? (
                      <div className="border rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">
                          Khóa học liên quan ({familyData.children.length})
                        </h3>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {familyData.children.map((child: any) => (
                            <div
                              key={child.id}
                              className="border rounded-lg p-3 bg-gray-50"
                            >
                              <div className="space-y-1 text-sm">
                                <div>
                                  <span className="font-medium">
                                    Tên khóa học:{" "}
                                  </span>
                                  <span>
                                    {child.name}
                                    {child.object_title
                                      ? ` - ${child.object_title}`
                                      : ""}
                                  </span>
                                </div>
                                <div>
                                  <span className="font-medium">Trường: </span>
                                  <span>{child.school_name || "N/A"}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        Không có khóa học liên quan
                      </div>
                    )}

                    {/* Hiển thị tiến trình đồng bộ */}
                    {syncProgress && (
                      <div className="border rounded-lg p-4 bg-blue-50">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">
                              Tiến trình đồng bộ
                            </span>
                            <span className="text-sm font-semibold text-blue-700">
                              {syncProgress.completed_courses}/{syncProgress.total_courses} khóa học
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                              style={{
                                width: `${
                                  (syncProgress.completed_courses /
                                    syncProgress.total_courses) *
                                  100
                                }%`,
                              }}
                            ></div>
                          </div>
                          {syncProgress.current_message && (
                            <div className="text-sm text-gray-600">
                              {syncProgress.current_message}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Nút Đồng bộ */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (!syncing) {
                            setShowSyncFamilyDialog(false);
                            setSyncProgress(null);
                          }
                        }}
                        disabled={syncing}
                      >
                        Đóng
                      </Button>
                      <Button
                        onClick={async () => {
                          if (!courseData?.id) return;
                          setSyncing(true);
                          setSyncProgress(null);
                          try {
                            await SyncAllFamilyCourses(
                              courseData.id,
                              (progressData) => {
                                setSyncProgress({
                                  completed_courses: progressData.completed_courses,
                                  total_courses: progressData.total_courses,
                                  current_message: progressData.message,
                                });
                              },
                              (doneData) => {
                                setSyncProgress({
                                  completed_courses: doneData.synced_count,
                                  total_courses: doneData.synced_count,
                                  current_message: `Đồng bộ thành công ${doneData.synced_count} khóa học`,
                                });
                                setTimeout(() => {
                                  alert("Đồng bộ thành công!");
                                  setShowSyncFamilyDialog(false);
                                  setSyncProgress(null);
                                }, 1000);
                              },
                              (error) => {
                                console.error("Error syncing:", error);
                                alert("Đồng bộ thất bại. Vui lòng thử lại.");
                                setSyncProgress(null);
                              }
                            );
                          } catch (error) {
                            console.error("Error syncing:", error);
                            alert("Đồng bộ thất bại. Vui lòng thử lại.");
                            setSyncProgress(null);
                          } finally {
                            setSyncing(false);
                          }
                        }}
                        disabled={syncing}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {syncing ? "Đang đồng bộ..." : "Đồng bộ"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Không có dữ liệu
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  );
}

export default function EditCoursePage() {
  const [chapterLessonSelect, setChapterLessonSelect] = useState<{
    idx: string;
    show: boolean;
  }>({ idx: "", show: false });

  const [popuploading, setPopuploading] = useState(false);

  const [popuploadingText, setPopuploadingText] = useState(
    "Đang thêm bài học vào chương..."
  );

  const [refreshTrigger, setRefreshTrigger] = useState(0); // Trigger để component con refresh

  const params = useParams();

  const courseIdParam = params.id;
  const courseId = Array.isArray(courseIdParam)
    ? courseIdParam[0]
    : courseIdParam;

  // Add extra safety check to ensure we always render
  if (!courseId) {
  }

  return (
    <>
      <RoleBasedHeaderSidebar>
        <EditCourseContent
          chapterLessonSelect={chapterLessonSelect}
          setChapterLessonSelect={setChapterLessonSelect}
          onAddLessonToChapter={async () => {}}
          popuploading={popuploading}
          setPopuploading={setPopuploading}
          popuploadingText={popuploadingText}
          setPopuploadingText={setPopuploadingText}
          refreshTrigger={refreshTrigger}
        />
      </RoleBasedHeaderSidebar>
      {/* Overlay loading */}
      {popuploading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl px-8 py-6 flex flex-col items-center">
            <span className="text-lg font-semibold mb-4 text-gray-900">
              {popuploadingText}
            </span>
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
        </div>
      )}
    </>
  );
}
