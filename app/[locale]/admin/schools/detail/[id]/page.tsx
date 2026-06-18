"use client";

import { useEffect, useState, useCallback, memo, type ReactNode } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { GetSchoolDetail } from "@/lib/api/schools";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Edit,
  Trash2,
  Plus,
  ArrowLeft,
  Eye,
} from "lucide-react";
import SchoolDialogModal from "../../modal";
import { UpdateSchool } from "@/lib/api/schools";
import { GetProvinceList } from "@/lib/api/provinces";
import ExportData from "@/components/ui/export-data";
import ImportData from "@/components/ui/import-data";
import { exportClass, importClass, exportUser } from "@/lib/api/export-import";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useDebounce from "@/hooks/use-debounce";

import { useToast } from "@/hooks/use-toast";
import Loading from "@/app/loading";

// Import API functions
import {
  GetUserListAdvanced,
  CreateUser,
  UpdateUser,
  DeleteUser,
} from "@/lib/api/users";
import {
  GetCourseList,
  CreateCourse,
  UpdateCourse,
  DeleteCourse,
} from "@/lib/api/courses";
import {
  GetClassList,
  CreateClass,
  UpdateClass,
  DeleteClass,
} from "@/lib/api/classes";
import { GetGrades, type GradeItem } from "@/lib/api/grade";

// Import modals
import StudentModal from "@/app/[locale]/admin/schools/components/StudentModal";
import TeacherModal from "@/app/[locale]/admin/schools/components/TeacherModal";
// import CourseModal from "@/app/[locale]/admin/schools/components/CourseModal";
import ClassModal from "@/app/[locale]/admin/schools/components/ClassModal";
import { PaginationCustom } from "@/components/ui/pagination-custom";

// Helper function to handle error safely
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "object" && error !== null && "response" in error) {
    const apiError = error as any;
    if (apiError.response?.data?.message) {
      return apiError.response.data.message;
    }
  }
  return String(error);
}

interface School {
  id: string;
  name: string;
  short_name: string;
  parent_school: string;
  type: string;
  ward_code: string; // Changed from district_code
  ward_name: string; // Changed from district_name
  province_name: string;
  province_code: string;
  address_en: string;
  address_vn: string;
  contact_mail: string;
  contact_name: string;
  contact_phone: string;
  programs_of_course: boolean;
  close_status: boolean;
  is_seamless_school: boolean;
  created_at: string;
  updated_at: string;
  status: boolean | string;
  logo?: string;
}

// Define interface for form data
interface SchoolFormData {
  id: string;
  name: string;
  short_name: string;
  parent_school: string;
  type: string;
  ward_code: string; // Changed from district_code
  ward_name: string; // Changed from district_name
  province_name: string;
  province_code: string;
  address_vn: string;
  address_en: string;
  contact_name: string;
  contact_phone: string;
  contact_mail: string;
  programs_of_course: boolean;
  close_status: boolean;
  is_seamless_school: boolean;
  created_at: string;
  updated_at: string;
  status: boolean;
  logo?: string;
}

// Helper function to check status
function isActiveStatus(status: string | boolean | undefined): boolean {
  if (typeof status === "boolean") {
    return status;
  }
  if (typeof status === "string") {
    return status === "true";
  }
  return false;
}

const DetailRow = memo(
  ({ label, value }: { label: string; value: string | ReactNode }) => (
    <div className="flex flex-col sm:flex-row sm:items-start mb-3">
      <div className="w-40 text-gray-600 font-medium shrink-0">{label}:</div>
      <div className="flex-1 break-words">{value}</div>
    </div>
  )
);

const CollapseCard = memo(
  ({
    title,
    children,
    defaultOpen = true,
  }: {
    title: string;
    children: ReactNode;
    defaultOpen?: boolean;
  }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const toggleOpen = useCallback(() => setIsOpen((prev) => !prev), []);

    return (
      <div className="mb-4 border rounded-lg shadow-sm">
        <div
          className="cursor-pointer px-4 py-3 bg-gray-100 hover:bg-gray-200 font-semibold flex justify-between items-center rounded-t-lg"
          onClick={toggleOpen}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") toggleOpen();
          }}
        >
          <span>{title}</span>
          <span>{isOpen ? "▲" : "▼"}</span>
        </div>
        {isOpen && (
          <div className="p-4 border-t border-gray-200">{children}</div>
        )}
      </div>
    );
  }
);

function formatDateTime(dateString: string, t: any) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return t("invalidDate");
  return date.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const OptimizedStudentRow = memo(
  ({
    student,
    index,
    onEdit,
    onDelete,
    t,
    page,
    pageSize,
    studentLoginStatus,
  }: {
    student: any;
    index: number;
    onEdit: (student: any) => void;
    onDelete: (id: string) => void;
    t: any;
    page: number;
    pageSize: number;
    studentLoginStatus: string;
  }) => {
    return (
      <TableRow key={student.id}>
        <TableCell className="font-medium">
          {(page - 1) * pageSize + index + 1}
        </TableCell>
        <TableCell className="text-center">{student.name}</TableCell>
        <TableCell className="text-center">{student.username}</TableCell>
        <TableCell className="text-center">{student.email}</TableCell>
        <TableCell className="text-center">{student.phone_number}</TableCell>
        <TableCell className="text-center">{student.address}</TableCell>
        <TableCell className="text-center">
          {student.user_info?.class?.name || t("noClasses")}
        </TableCell>
        <TableCell className="text-center">
          {student.user_info?.courses &&
          Array.isArray(student.user_info.courses) &&
          student.user_info.courses.length > 0
            ? student.user_info.courses
                .map((course: any) => course.name)
                .join(", ")
            : t("noCourses")}
        </TableCell>
        <TableCell className="text-center">
          <Badge variant={student.status ? "default" : "destructive"}>
            {student.status ? t("statusStudying") : t("statusNotStudying")}
          </Badge>
        </TableCell>
        <TableCell className="text-center">
          <Badge
            variant={
              student.is_used !== undefined
                ? student.is_used
                  ? "default"
                  : "secondary"
                : studentLoginStatus !== ""
                ? studentLoginStatus === "true"
                  ? "default"
                  : "secondary"
                : "outline"
            }
          >
            {student.is_used !== undefined
              ? student.is_used
                ? "Đã đăng nhập"
                : "Chưa đăng nhập"
              : studentLoginStatus !== ""
              ? studentLoginStatus === "true"
                ? "Đã đăng nhập"
                : "Chưa đăng nhập"
              : "Không xác định"}
          </Badge>
        </TableCell>
        <TableCell className="text-right">
          <div className="flex justify-center gap-2">
            <Button size="icon" variant="ghost" onClick={() => onEdit(student)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="text-red-500"
              onClick={() => onDelete(student.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.student.id === nextProps.student.id &&
      prevProps.student.updated_at === nextProps.student.updated_at &&
      prevProps.index === nextProps.index &&
      prevProps.page === nextProps.page &&
      prevProps.pageSize === nextProps.pageSize
    );
  }
);

const OptimizedTeacherRow = memo(
  ({
    teacher,
    index,
    onEdit,
    onDelete,
    t,
    page,
    pageSize,
  }: {
    teacher: any;
    index: number;
    onEdit: (teacher: any) => void;
    onDelete: (id: string) => void;
    t: any;
    page: number;
    pageSize: number;
  }) => {
    return (
      <TableRow key={teacher.id}>
        <TableCell className="font-medium">
          {(page - 1) * pageSize + index + 1}
        </TableCell>
        <TableCell className="text-center">{teacher.name}</TableCell>
        <TableCell className="text-center">{teacher.username}</TableCell>
        <TableCell className="text-center">{teacher.email}</TableCell>
        <TableCell className="text-center">{teacher.phone_number}</TableCell>
        <TableCell className="text-center">
          {teacher.user_info?.class?.name || t("noClasses")}
        </TableCell>
        <TableCell className="text-center">
          {teacher.user_info?.courses &&
          Array.isArray(teacher.user_info.courses) &&
          teacher.user_info.courses.length > 0
            ? teacher.user_info.courses
                .map((course: any) => course.name)
                .join(", ")
            : t("noCourses")}
        </TableCell>
        <TableCell className="text-center">
          <Badge variant={teacher.status ? "default" : "destructive"}>
            {teacher.status ? t("statusTeaching") : t("statusNotTeaching")}
          </Badge>
        </TableCell>
        <TableCell className="text-right">
          <div className="flex justify-center gap-2">
            <Button size="icon" variant="ghost" onClick={() => onEdit(teacher)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="text-red-500"
              onClick={() => onDelete(teacher.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.teacher.id === nextProps.teacher.id &&
      prevProps.teacher.updated_at === nextProps.teacher.updated_at &&
      prevProps.index === nextProps.index &&
      prevProps.page === nextProps.page &&
      prevProps.pageSize === nextProps.pageSize
    );
  }
);

function StudentTable({
  students,
  onDelete,
  onEdit,
  page,
  pageSize,
  t,
  studentLoginStatus,
}: {
  students: any[];
  onDelete: (id: string) => void;
  onEdit: (student: any) => void;
  page: number;
  pageSize: number;
  t: any;
  studentLoginStatus: string;
}) {
  const displayed = Array.isArray(students)
    ? students.filter(
        (u: any) => String(u?.role_id) === "3" || u?.role_name === "student"
      )
    : [];
  return (
    <div className="rounded-md border w-full overflow-x-auto mt-8">
      <Table className="w-full min-w-[900px]">
        <TableHeader>
          <TableRow>
            <TableHead>{t("orderNumber")}</TableHead>
            <TableHead className="text-center">{t("fullName")}</TableHead>
            <TableHead className="text-center">{t("username")}</TableHead>
            <TableHead className="text-center">{t("email")}</TableHead>
            <TableHead className="text-center">{t("phone")}</TableHead>
            <TableHead className="text-center">{t("address")}</TableHead>
            <TableHead className="text-center">{t("class")}</TableHead>
            <TableHead className="text-center">{t("course")}</TableHead>
            <TableHead className="text-center">{t("status")}</TableHead>
            <TableHead className="text-center">Trạng thái đăng nhập</TableHead>
            <TableHead className="text-center">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayed && displayed.length > 0 ? (
            displayed.map((student, idx) => (
              <OptimizedStudentRow
                key={student.id}
                student={student}
                index={idx}
                onEdit={onEdit}
                onDelete={onDelete}
                t={t}
                page={page}
                pageSize={pageSize}
                studentLoginStatus={studentLoginStatus}
              />
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={11} className="text-center">
                {t("noStudents")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function TeacherTable({
  teachers,
  onDelete,
  onEdit,
  page,
  pageSize,
  t,
}: {
  teachers: any[];
  onDelete: (id: string) => void;
  onEdit: (teacher: any) => void;
  page: number;
  pageSize: number;
  t: any;
}) {
  const displayed = Array.isArray(teachers)
    ? teachers.filter(
        (u: any) => String(u?.role_id) === "2" || u?.role_name === "teacher"
      )
    : [];
  return (
    <div className="rounded-md border w-full overflow-x-auto mt-8">
      <Table className="w-full min-w-[900px]">
        <TableHeader>
          <TableRow>
            <TableHead>{t("orderNumber")}</TableHead>
            <TableHead className="text-center">{t("fullName")}</TableHead>
            <TableHead className="text-center">{t("username")}</TableHead>
            <TableHead className="text-center">{t("email")}</TableHead>
            <TableHead className="text-center">{t("phone")}</TableHead>
            <TableHead className="text-center">{t("class")}</TableHead>
            <TableHead className="text-center">{t("course")}</TableHead>
            <TableHead className="text-center">{t("status")}</TableHead>
            <TableHead className="text-center">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayed && displayed.length > 0 ? (
            displayed.map((teacher, idx) => (
              <OptimizedTeacherRow
                key={teacher.id}
                teacher={teacher}
                index={idx}
                onEdit={onEdit}
                onDelete={onDelete}
                t={t}
                page={page}
                pageSize={pageSize}
              />
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={9} className="text-center">
                {t("noTeachers")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function CourseTable({
  courses,
  onDelete,
  onEdit,
  page,
  pageSize,
  t,
}: {
  courses: any[];
  onDelete: (id: string) => void;
  onEdit: (course: any) => void;
  page: number;
  pageSize: number;
  t: any;
}) {
  return (
    <div className="rounded-md border w-full overflow-x-auto mt-8">
      <Table className="w-full min-w-[900px]">
        <TableHeader>
          <TableRow>
            <TableHead className="text-center">{t("orderNumber")}</TableHead>
            <TableHead className="text-center">{t("courseName")}</TableHead>
            <TableHead className="text-center">{t("courseType")}</TableHead>
            <TableHead className="text-center">
              {t("courseDifficulty")}
            </TableHead>
            <TableHead className="text-center">{t("courseDuration")}</TableHead>
            <TableHead className="text-center">{t("studentCount")}</TableHead>
            <TableHead className="text-center">{t("courseTarget")}</TableHead>
            <TableHead className="text-center">{t("status")}</TableHead>
            <TableHead className="text-center">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courses && courses.length > 0 ? (
            courses.map((course, idx) => (
              <TableRow key={course.id}>
                <TableCell className="font-medium">
                  {(page - 1) * pageSize + idx + 1}
                </TableCell>
                <TableCell className="text-center">{course.name}</TableCell>
                <TableCell className="text-center">{course.type}</TableCell>
                <TableCell className="text-center">{course.level}</TableCell>
                <TableCell className="text-center">{course.duration}</TableCell>
                <TableCell className="text-center">
                  {course.student_count || 0}
                </TableCell>
                <TableCell className="text-center">{course.target}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={course.status ? "default" : "destructive"}>
                    {course.status ? t("active") : t("inactive")}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onEdit(course)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-red-500"
                      onClick={() => onDelete(course.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={9} className="text-center">
                {t("noCourses")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function ClassTable({
  classes,
  onDelete,
  onEdit,
  onViewStudents,
  page,
  pageSize,
  t,
}: {
  classes: any[];
  onDelete: (id: string) => void;
  onEdit: (classItem: any) => void;
  onViewStudents: (classItem: any) => void;
  page: number;
  pageSize: number;
  t: any;
}) {
  return (
    <div className="rounded-md border w-full overflow-x-auto mt-8">
      <Table className="w-full min-w-[900px]">
        <TableHeader>
          <TableRow>
            <TableHead>{t("orderNumber")}</TableHead>
            <TableHead>{t("className")}</TableHead>
            <TableHead>{t("classMainName")}</TableHead>
            <TableHead className="text-center">
              {t("grade")}
            </TableHead>
            <TableHead className="text-center">
              {t("studentCountcurrent")}{" "}
            </TableHead>
            <TableHead className="text-center">{t("teachers")}</TableHead>
            <TableHead className="text-center">{t("status")}</TableHead>
            <TableHead className="text-center">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {classes && classes.length > 0 ? (
            classes.map((classItem, idx) => (
              <TableRow key={classItem.id}>
                <TableCell className="font-medium">
                  {(page - 1) * pageSize + idx + 1}
                </TableCell>
                <TableCell>{classItem.name}</TableCell>
                <TableCell>{classItem.class_main_name}</TableCell>
                <TableCell className="text-center">
                  {classItem.grade.name_vn || t("noGrade")}
                </TableCell>
                <TableCell className="text-center">
                  {classItem.current_students || 0}
                </TableCell>
                <TableCell className="text-center">
                  {classItem.teacher_info?.name || t("noTeachers")}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={classItem.status ? "default" : "destructive"}>
                    {classItem.status ? t("active") : t("inactive")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onEdit(classItem)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-red-500"
                      onClick={() => onDelete(classItem.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onViewStudents(classItem)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={9} className="text-center">
                {t("noClasses")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default function SchoolDetailPage() {
  const t = useTranslations("schools");
  const uCommon = useTranslations("common");
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSchoolDialog, setShowSchoolDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Data states
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [grades, setGrades] = useState<GradeItem[]>([]);

  // Pagination states for each tab
  const [coursePagination, setCoursePagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    totalPages: 0,
  });

  const [classPagination, setClassPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    totalPages: 0,
  });

  const [studentPagination, setStudentPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    totalPages: 0,
  });

  const [teacherPagination, setTeacherPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    totalPages: 0,
  });

  // Filter states for Students and Teachers
  const [studentKeyword, setStudentKeyword] = useState("");
  const [studentStatus, setStudentStatus] = useState<string>("");
  const [studentLoginStatus, setStudentLoginStatus] = useState<string>(""); // Filter cho trạng thái đăng nhập
  const [teacherKeyword, setTeacherKeyword] = useState("");
  const [teacherStatus, setTeacherStatus] = useState<string>("");

  const debouncedStudentKeyword = useDebounce(studentKeyword, 400);
  const debouncedTeacherKeyword = useDebounce(teacherKeyword, 400);

  // Modal states
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);

  // Selected items for editing
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<any | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [selectedClass, setSelectedClass] = useState<any | null>(null);

  // Form data states with specific data types
  const [studentFormData, setStudentFormData] = useState<any>({});
  const [teacherFormData, setTeacherFormData] = useState<any>({});
  const [courseFormData, setCourseFormData] = useState<any>({});
  const [classFormData, setClassFormData] = useState<any>({});

  // Define formData with specific interface
  const [formData, setFormData] = useState<SchoolFormData>({
    id: "",
    name: "",
    short_name: "",
    parent_school: "",
    type: "",
    ward_code: "", // Changed from district_code
    ward_name: "", // Changed from district_name
    province_name: "",
    province_code: "",
    address_vn: "",
    address_en: "",
    contact_name: "",
    contact_phone: "",
    contact_mail: "",
    programs_of_course: false,
    close_status: false,
    is_seamless_school: false,
    created_at: "",
    updated_at: "",
    status: true,
  });

  const params = useParams();
  const schoolIdParam = params?.id;
  const schoolId = Array.isArray(schoolIdParam)
    ? schoolIdParam[0]
    : schoolIdParam;

  const [allWards, setAllWards] = useState<any[]>([]);
  const [allProvinces, setAllProvinces] = useState<any[]>([]);

  const fetchWards = useCallback(async () => {
    try {
      // Since we need wards for all provinces, we'll load them as needed
      // This is a placeholder - in practice you might want to load all wards
      // or load them per province as needed
      setAllWards([]);
    } catch (err) {
      setAllWards([]);
    }
  }, []);

  const fetchProvinces = useCallback(async () => {
    try {
      const res = await GetProvinceList();
      setAllProvinces(res.data.provinces);
    } catch (err) {
      setAllProvinces([]);
    }
  }, []);

  const getWardName = useCallback(
    (ward_code: string) => {
      return (
        allWards.find((w: any) => w.code === ward_code)?.name || t("noWardName")
      );
    },
    [allWards, t]
  );

  const getProvinceName = useCallback(
    (province_code: string) => {
      return (
        allProvinces.find((p: any) => p.code === province_code)?.name ||
        t("noProvinceName")
      );
    },
    [allProvinces, t]
  );

  // Fetch data functions with API pagination
  const fetchCourses = useCallback(
    async (page = 1, per_page = 10) => {
      if (!schoolId) return;
      try {
        const response = await GetCourseList({
          school_id: schoolId,
          page,
          per_page,
        });

        setCourses(response.data?.courses || []);
        setCoursePagination({
          page,
          per_page,
          total: response.data?.total_count || 0,
          totalPages: Math.ceil((response.data?.total_count || 0) / per_page),
        });
      } catch (error) {
        console.error("Error fetching courses:", error);
        setCourses([]);
        setCoursePagination((prev) => ({ ...prev, total: 0, totalPages: 0 }));
      }
    },
    [schoolId]
  );

  const fetchClasses = useCallback(
    async (page = 1, per_page = 10) => {
      if (!schoolId) return;
      try {
        const response = await GetClassList(schoolId, {
          page,
          per_page,
        });

        setClasses(response.data?.classes || []);
        setClassPagination({
          page,
          per_page,
          total: response.data?.total_count || 0,
          totalPages: Math.ceil((response.data?.total_count || 0) / per_page),
        });
      } catch (error) {
        console.error("Error fetching classes:", error);
        setClasses([]);
        setClassPagination((prev) => ({ ...prev, total: 0, totalPages: 0 }));
      }
    },
    [schoolId]
  );

  const fetchGrades = useCallback(async () => {
    try {
      const response = await GetGrades();
      setGrades(response.data?.grades || []);
    } catch (error) {
      console.error("Error fetching grades:", error);
      setGrades([]);
    }
  }, []);

  const fetchStudents = useCallback(
    async (page = 1, per_page = 10) => {
      if (!schoolId) return;
      try {
        const response = await GetUserListAdvanced({
          role_id: 3, // Students
          school_id: schoolId,
          page,
          per_page,
          ...(debouncedStudentKeyword
            ? { keyword: debouncedStudentKeyword }
            : {}),
          ...(studentStatus !== "" ? { status: studentStatus } : {}),
          ...(studentLoginStatus !== ""
            ? { is_used: studentLoginStatus === "true" }
            : {}),
        });

        setStudents(response.data?.users || []);
        setStudentPagination({
          page,
          per_page,
          total: response.data?.total_count || 0,
          totalPages: Math.ceil((response.data?.total_count || 0) / per_page),
        });
      } catch (error) {
        console.error("Error fetching students:", error);
        setStudents([]);
        setStudentPagination((prev) => ({ ...prev, total: 0, totalPages: 0 }));
      }
    },
    [schoolId, debouncedStudentKeyword, studentStatus, studentLoginStatus]
  );

  const fetchStudentsByClass = useCallback(async (classId: string) => {
    try {
      const response = await GetUserListAdvanced({
        role_id: 3, // Students
        class_id: classId,
      });
      return response.data?.users || [];
    } catch (error) {
      console.error(`Error fetching students for class ${classId}:`, error);
      return [];
    }
  }, []);

  const fetchTeachers = useCallback(
    async (page = 1, per_page = 10) => {
      if (!schoolId) return;
      try {
        const response = await GetUserListAdvanced({
          role_id: 2, // Teachers
          school_id: schoolId,
          page,
          per_page,
          ...(debouncedTeacherKeyword
            ? { keyword: debouncedTeacherKeyword }
            : {}),
          ...(teacherStatus !== "" ? { status: teacherStatus } : {}),
        });

        setTeachers(response.data?.users || []);
        setTeacherPagination({
          page,
          per_page,
          total: response.data?.total_count || 0,
          totalPages: Math.ceil((response.data?.total_count || 0) / per_page),
        });
      } catch (error) {
        console.error("Error fetching teachers:", error);
        setTeachers([]);
        setTeacherPagination((prev) => ({ ...prev, total: 0, totalPages: 0 }));
      }
    },
    [schoolId, debouncedTeacherKeyword, teacherStatus]
  );

  // Trigger refetch when filters change
  useEffect(() => {
    // reset to page 1 when filters update
    setStudentPagination((prev) => ({ ...prev, page: 1 }));
    fetchStudents(1, studentPagination.per_page);
  }, [debouncedStudentKeyword, studentStatus, studentLoginStatus]);

  useEffect(() => {
    setTeacherPagination((prev) => ({ ...prev, page: 1 }));
    fetchTeachers(1, teacherPagination.per_page);
  }, [debouncedTeacherKeyword, teacherStatus]);

  // Tab management - all data preloaded
  const [activeTab, setActiveTab] = useState("course");
  const [loadedTabs, setLoadedTabs] = useState(new Set<string>());

  // Simplified tab change handler since all data is preloaded
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  // Pagination handlers for each tab
  const handleCoursePageChange = useCallback(
    (page: number) => {
      setCoursePagination((prev) => ({ ...prev, page }));
      fetchCourses(page, coursePagination.per_page);
    },
    [fetchCourses, coursePagination.per_page]
  );

  const handleCoursePageSizeChange = useCallback(
    (per_page: number) => {
      setCoursePagination((prev) => ({ ...prev, per_page, page: 1 }));
      fetchCourses(1, per_page);
    },
    [fetchCourses]
  );

  const handleClassPageChange = useCallback(
    (page: number) => {
      setClassPagination((prev) => ({ ...prev, page }));
      fetchClasses(page, classPagination.per_page);
    },
    [fetchClasses, classPagination.per_page]
  );

  const handleClassPageSizeChange = useCallback(
    (per_page: number) => {
      setClassPagination((prev) => ({ ...prev, per_page, page: 1 }));
      fetchClasses(1, per_page);
    },
    [fetchClasses]
  );

  const handleStudentPageChange = useCallback(
    (page: number) => {
      setStudentPagination((prev) => ({ ...prev, page }));
      fetchStudents(page, studentPagination.per_page);
    },
    [fetchStudents, studentPagination.per_page]
  );

  const handleStudentPageSizeChange = useCallback(
    (per_page: number) => {
      setStudentPagination((prev) => ({ ...prev, per_page, page: 1 }));
      fetchStudents(1, per_page);
    },
    [fetchStudents]
  );

  const handleTeacherPageChange = useCallback(
    (page: number) => {
      setTeacherPagination((prev) => ({ ...prev, page }));
      fetchTeachers(page, teacherPagination.per_page);
    },
    [fetchTeachers, teacherPagination.per_page]
  );

  const handleTeacherPageSizeChange = useCallback(
    (per_page: number) => {
      setTeacherPagination((prev) => ({ ...prev, per_page, page: 1 }));
      fetchTeachers(1, per_page);
    },
    [fetchTeachers]
  );

  useEffect(() => {
    if (!schoolId) return;
    const fetchData = async () => {
      try {
        const data = await GetSchoolDetail(schoolId);
        setSchool(data);

        // Fetch all data initially with pagination
        await Promise.all([
          fetchCourses(1, coursePagination.per_page),
          fetchClasses(1, classPagination.per_page),
          fetchStudents(1, studentPagination.per_page),
          fetchTeachers(1, teacherPagination.per_page),
        ]);

        // Mark all tabs as loaded
        setLoadedTabs(new Set(["course", "class", "student", "teacher"]));
      } catch (error) {
        setError("Failed to fetch school details");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    schoolId,
    coursePagination.per_page,
    classPagination.per_page,
    studentPagination.per_page,
    teacherPagination.per_page,
  ]);

  useEffect(() => {
    fetchWards();
    fetchProvinces();
  }, [fetchWards, fetchProvinces]);

  useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);

  // Student CRUD operations
  const handleAddStudent = useCallback(
    (classContext?: { id: string; name: string }) => {
      if (!schoolId) {
        alert(t("schoolIdNotFound"));
        return;
      }
      setSelectedStudent(null);
      setStudentFormData({
        role_id: 3,
        role_name: "student",
        user_info: {
          school: { id: Number.parseInt(schoolId), name: school?.name },
          address: {
            province_code: school?.province_code || "",
            ward_code: school?.ward_code || "", // Changed from district_code
          },
          class: classContext
            ? { id: Number.parseInt(classContext.id), name: classContext.name }
            : undefined,
        },
      });
      setShowStudentModal(true);
    },
    [schoolId, school?.name, t]
  );

  const handleEditStudent = useCallback((student: any) => {
    setSelectedStudent(student);
    setStudentFormData(student);
    setShowStudentModal(true);
  }, []);

  const handleDeleteStudent = useCallback(
    async (studentId: string) => {
      if (confirm(t("deleteStudentConfirm"))) {
        try {
          await DeleteUser(studentId);
          alert(t("deleteStudentSuccess"));
          await fetchStudents(
            studentPagination.page,
            studentPagination.per_page
          );
        } catch (error) {
          alert(t("deleteStudentError"));
        }
      }
    },
    [t, fetchStudents, studentPagination.page, studentPagination.per_page]
  );

  const handleSubmitStudent = useCallback(async () => {
    try {
      // Validate required fields
      if (!studentFormData.name?.trim()) {
        alert(t("fullNameRequired"));
        return;
      }

      if (!studentFormData.username?.trim()) {
        alert(t("usernameRequired"));
        return;
      }

      if (!selectedStudent && !studentFormData.password?.trim()) {
        alert(t("passwordRequired"));
        return;
      }

      if (selectedStudent) {
        await UpdateUser(selectedStudent.id, studentFormData);
        alert(t("updateStudentSuccess"));
      } else {
        await CreateUser(studentFormData);
        alert(t("addStudentSuccess"));
      }
      setShowStudentModal(false);

      // Refresh students based on context
      await fetchStudents(studentPagination.page, studentPagination.per_page);
    } catch (error) {
      console.error("Error saving student:", error);
      const errorMessage =
        error instanceof Error ? error.message : t("saveStudentError");
      alert(errorMessage);
    }
  }, [
    selectedStudent,
    studentFormData,
    t,
    fetchStudents,
    studentPagination.page,
    studentPagination.per_page,
  ]);

  // Teacher CRUD operations
  const handleAddTeacher = () => {
    if (!schoolId) {
      alert(t("schoolIdNotFound"));
      return;
    }
    setSelectedTeacher(null);
    setTeacherFormData({
      role_id: 2,
      role_name: "teacher",
      user_info: {
        school: { id: Number.parseInt(schoolId), name: school?.name },
        address: {
          province_code: school?.province_code || "",
          ward_code: school?.ward_code || "", // Changed from district_code
        },
      },
    });
    setShowTeacherModal(true);
  };

  const handleEditTeacher = (teacher: any) => {
    setSelectedTeacher(teacher);
    setTeacherFormData(teacher);
    setShowTeacherModal(true);
  };

  const handleDeleteTeacher = async (teacherId: string) => {
    if (confirm(t("deleteTeacherConfirm"))) {
      try {
        await DeleteUser(teacherId);
        await fetchTeachers(teacherPagination.page, teacherPagination.per_page);
        alert(t("deleteTeacherSuccess"));
      } catch (error) {
        alert(t("deleteTeacherError"));
      }
    }
  };

  const handleSubmitTeacher = async () => {
    try {
      if (selectedTeacher) {
        await UpdateUser(selectedTeacher.id, teacherFormData);
        alert(t("updateTeacherSuccess"));
      } else {
        await CreateUser(teacherFormData);
        alert(t("addTeacherSuccess"));
      }
      setShowTeacherModal(false);
      await fetchTeachers(teacherPagination.page, teacherPagination.per_page);
    } catch (error) {
      alert(t("saveTeacherError"));
    }
  };

  // Course CRUD operations
  const handleAddCourse = () => {
    if (!schoolId) {
      alert(t("schoolIdNotFound"));
      return;
    }
    setSelectedCourse(null);
    setCourseFormData({
      schools: [{ id: Number.parseInt(schoolId), name: school?.name }],
      status: true,
    });
    setShowCourseModal(true);
  };

  const handleEditCourse = (course: any) => {
    setSelectedCourse(course);
    setCourseFormData(course);
    setShowCourseModal(true);
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (confirm(t("deleteCourseConfirm"))) {
      try {
        await DeleteCourse(courseId);
        await fetchCourses(coursePagination.page, coursePagination.per_page);
        alert(t("deleteCourseSuccess"));
      } catch (error) {
        alert(t("deleteCourseError"));
      }
    }
  };

  const handleSubmitCourse = async () => {
    try {
      if (selectedCourse) {
        await UpdateCourse(selectedCourse.id, courseFormData);
        alert(t("updateCourseSuccess"));
      } else {
        await CreateCourse(courseFormData);
        alert(t("addCourseSuccess"));
      }
      setShowCourseModal(false);
      await fetchCourses(coursePagination.page, coursePagination.per_page);
    } catch (error) {
      alert(t("saveCourseError"));
    }
  };

  const normalizeGradeIdValue = (value: any) => {
    if (value === undefined || value === null || value === "" || value === 0) {
      return undefined;
    }
    const numericValue = Number(value);
    if (!Number.isNaN(numericValue) && numericValue === 0) {
      return undefined;
    }
    return Number.isNaN(numericValue) ? value : numericValue;
  };

  // Class CRUD operations
  const handleAddClass = () => {
    if (!schoolId) {
      alert(t("schoolIdNotFound"));
      return;
    }
    setSelectedClass(null);
    setClassFormData({
      school_id: Number.parseInt(schoolId),
      status: true,
      grade_id: normalizeGradeIdValue(grades[0]?.id),
    });
    setShowClassModal(true);
  };

  const handleEditClass = (classItem: any) => {
    setSelectedClass(classItem);
    const gradeIdFromClass =
      classItem?.grade_id ??
      classItem?.gradeId ??
      classItem?.grade?.id ??
      classItem?.grade?.grade_id;
    setClassFormData({
      ...classItem,
      grade_id: normalizeGradeIdValue(gradeIdFromClass),
    });
    setShowClassModal(true);
  };

  const handleDeleteClass = async (classId: string) => {
    if (confirm(t("deleteClassConfirm"))) {
      try {
        await DeleteClass(classId);
        await fetchClasses(classPagination.page, classPagination.per_page);
        alert(t("deleteClassSuccess"));
      } catch (error) {
        alert(t("deleteClassError"));
      }
    }
  };

  const handleSubmitClass = async () => {
    try {
      if (selectedClass) {
        await UpdateClass(selectedClass.id, classFormData);
        alert(t("updateClassSuccess"));
      } else {
        await CreateClass(classFormData);
        alert(t("addClassSuccess"));
      }
      setShowClassModal(false);
      await fetchClasses(classPagination.page, classPagination.per_page);
    } catch (error) {
      alert(t("saveClassError"));
    }
  };

  // New: Handle viewing students for a specific class - navigate to dedicated page
  const handleViewClassStudents = useCallback(
    (classItem: any) => {
      router.push(`/admin/schools/detail/${schoolId}/class/${classItem.id}`);
    },
    [router, schoolId]
  );

  // Handle updating a class
  const handleUpdateClass = async (classData: any) => {
    try {
      await UpdateClass(classData.id, classData);
      alert(t("updateClassSuccess"));
      await fetchClasses();
    } catch (error) {
      console.error("Error updating class:", error);
      alert(t("saveClassError"));
    }
  };

  const openEditSchool = (school: any) => {
    console.log("Opening edit modal for school:", {
      school_data: school,
      province_code: school.province_code,
      ward_code: school.ward_code, // Changed from district_code
      province_name: school.province_name,
      ward_name: school.ward_name, // Changed from district_name
    });

    setSelectedSchool(school);

    const newFormData = {
      id: school.id || "",
      name: school.name || "",
      short_name: school.short_name || "",
      parent_school: school.parent_school || "",
      type: school.type || "",
      ward_code: school.ward_code || "", // Changed from district_code
      ward_name: school.ward_name || "", // Changed from district_name
      province_name: school.province_name || "",
      province_code: school.province_code || "",
      address_vn: school.address_vn || "",
      address_en: school.address_en || "",
      contact_name: school.contact_name || "",
      contact_phone: school.contact_phone || "",
      contact_mail: school.contact_mail || "",
      programs_of_course: school.programs_of_course || false,
      close_status: school.close_status || false,
      is_seamless_school: school.is_seamless_school || false,
      created_at: school.created_at || "",
      updated_at: school.updated_at || "",
      status:
        typeof school.status === "boolean"
          ? school.status
          : school.status === "true",
      logo: school.logo || "",
    };

    console.log("FormData being set:", {
      province_code: newFormData.province_code,
      ward_code: newFormData.ward_code, // Changed from district_code
      province_name: newFormData.province_name,
      ward_name: newFormData.ward_name, // Changed from district_name
    });

    setFormData(newFormData);
    setShowSchoolDialog(true);
  };

  // FIXED: Improve handleSubmitSchool to wait for API response with loading
  const handleSubmitSchool = async () => {
    try {
      setIsSubmitting(true);

      const cleanedData = {
        name: formData.name?.trim() || "",
        short_name: formData.short_name?.trim() || "",
        type: formData.type || "",
        ward_code: formData.ward_code || "", // Changed from district_code
        address_vn: formData.address_vn?.trim() || "",
        address_en: formData.address_en?.trim() || "",
        parent_school_id: formData.parent_school
          ? Number.parseInt(formData.parent_school) || 0
          : 0,
        contact_name: formData.contact_name?.trim() || "",
        contact_phone: formData.contact_phone?.trim() || "",
        contact_mail: formData.contact_mail?.trim() || "",
        status: formData.status,
        logo: formData.logo || "",
      };

      // Call API update and wait for response
      const result = await UpdateSchool(selectedSchool.id, cleanedData);

      // FIXED: Only show message and close dialog when successful response
      if (result && (result.code === 200 || result.message === "success")) {
        setShowSchoolDialog(false);

        // Refresh school data immediately
        try {
          if (schoolId) {
            const updatedSchoolData = await GetSchoolDetail(schoolId);
            setSchool(updatedSchoolData);
            alert("Cập nhật trường học thành công!");
          }
        } catch (err: any) {
          console.error("Error refreshing data:", err);
          alert(
            "Cập nhật thành công nhưng không thể tải lại dữ liệu. Vui lòng refresh trang."
          );
        }
      } else {
        throw new Error("API response không thành công");
      }
    } catch (err) {
      console.error("Lưu trường học thất bại", err);
      const errorMessage = `Cập nhật trường học thất bại! ${getErrorMessage(
        err
      )}`;
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = useCallback(() => router.back(), [router]);

  const renderBooleanBadge = useCallback(
    (value: boolean, trueText = "Yes", falseText = "No") => (
      <Badge variant={value ? "default" : "destructive"}>
        {value ? trueText : falseText}
      </Badge>
    ),
    []
  );

  const renderLink = useCallback(
    (href: string, text: string, isMailTo = false) => (
      <a
        href={isMailTo ? `mailto:${href}` : href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 underline break-all"
      >
        {text}
      </a>
    ),
    []
  );

  // Show loading when submitting
  if (isSubmitting) {
    return <Loading />;
  }

  if (loading)
    return (
      <div className="p-8 text-center text-lg text-gray-600">
        {t("loadingSchoolData")}
      </div>
    );
  if (error)
    return (
      <div className="p-8 text-center text-lg text-red-600">
        {t("error")}: {error}
      </div>
    );
  if (!school)
    return (
      <div className="p-8 text-center text-lg text-gray-500">
        {t("schoolInfoNotFound")}
      </div>
    );

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-8xl mx-auto">
        <Card className="shadow-lg">
          <CardContent className="p-6 sm:p-8">
            <>
              <div className="flex flex-col sm:flex-row justify-between items-start mb-8">
                {/* Header section on the left */}
                <div className="flex-1">
                  <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-1">
                    {school?.name}
                  </h2>
                  <p className="text-gray-600 text-md lg:text-lg">
                    {t("schoolDetailNumber")}
                    {school?.id}
                  </p>
                </div>

                {/* Logo on the right */}
                <div className="flex-shrink-0 ml-6">
                  <Avatar className="h-20 w-20 border-4 border-gray-200 shadow-lg">
                    <AvatarImage
                      src={school.logo || "/placeholder.svg"}
                      alt={school.name}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl font-bold">
                      {school.name ? school.name.charAt(0).toUpperCase() : "S"}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>

              <CollapseCard title={t("schoolInfoSection")}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  <div>
                    <DetailRow
                      label={t("schoolNameLabel")}
                      value={school.name}
                    />
                    <DetailRow
                      label={t("schoolShortNameLabel")}
                      value={school.short_name}
                    />
                    <DetailRow
                      label={t("schoolTypeLabel")}
                      value={school.type}
                    />
                    <DetailRow
                      label={t("parentSchoolLabel")}
                      value={school.parent_school || t("noParentSchoolLabel")}
                    />
                    <DetailRow
                      label={t("provinceCityLabel")}
                      value={
                        <div className="space-y-1">
                          <div>
                            {getProvinceName(school.province_code) ||
                              school.province_name ||
                              t("noProvinceName")}
                          </div>
                        </div>
                      }
                    />
                    <DetailRow
                      label={t("wardLabel")}
                      value={
                        <div className="space-y-1">
                          <div>{school.ward_name || t("noWardName")}</div>
                        </div>
                      }
                    />
                    <DetailRow
                      label={t("addressVNLabel")}
                      value={renderLink(school.address_vn, school.address_vn)}
                    />
                  </div>
                  <div>
                    <DetailRow
                      label={t("contactPersonLabel")}
                      value={school.contact_name}
                    />
                    <DetailRow
                      label={t("contactPhoneLabel")}
                      value={renderLink(
                        `tel:${school.contact_phone}`,
                        school.contact_phone
                      )}
                    />
                    <DetailRow
                      label={t("contactEmailLabel")}
                      value={renderLink(
                        school.contact_mail,
                        school.contact_mail,
                        true
                      )}
                    />
                    <DetailRow
                      label={t("statusActivityLabel")}
                      value={
                        <div className="whitespace-nowrap">
                          <Badge
                            variant={
                              isActiveStatus(school.status)
                                ? "default"
                                : "destructive"
                            }
                          >
                            {isActiveStatus(school.status)
                              ? t("active")
                              : t("inactive")}
                          </Badge>
                        </div>
                      }
                    />
                    <DetailRow
                      label={t("createdAtLabel")}
                      value={formatDateTime(school.created_at, t)}
                    />
                    <DetailRow
                      label={t("updatedAtLabel")}
                      value={formatDateTime(school.updated_at, t)}
                    />
                  </div>
                </div>
                <div className="w-full sm:w-auto flex flex-wrap gap-2 sm:gap-4 mt-6 pt-4 border-t display-flex sm:justify-end">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-blue-600 hover:to-blue-700 text-white border-0 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium"
                    onClick={() => openEditSchool(school)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {t("editSchool")}
                  </Button>
                  <Button variant="outline" className="w-full sm:w-auto" onClick={handleGoBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {t("backToList")}
                  </Button>
                </div>
              </CollapseCard>

              {/* Tabs for 4 tables */}
              <Tabs
                defaultValue="course"
                className="mt-8"
                onValueChange={handleTabChange}
              >
                <TabsList className="flex-col sm:flex-row w-full sm:w-auto h-auto">
                  <TabsTrigger value="course" className="w-full sm:w-auto justify-center">
                    {t("courses")} ({coursePagination.total})
                  </TabsTrigger>
                  <TabsTrigger value="class" className="w-full sm:w-auto justify-center">
                    {t("classes")} ({classPagination.total})
                  </TabsTrigger>
                  <TabsTrigger value="student" className="w-full sm:w-auto justify-center">
                    {t("students")} ({studentPagination.total})
                  </TabsTrigger>
                  <TabsTrigger value="teacher" className="w-full sm:w-auto justify-center">
                    {t("teachers")} ({teacherPagination.total})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="course">
                  <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                    <h3 className="text-lg font-semibold">{t("courseList")}</h3>
                    <Button onClick={handleAddCourse}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t("addCourse")}
                    </Button>
                  </div>
                  <CourseTable
                    courses={courses}
                    onDelete={handleDeleteCourse}
                    onEdit={handleEditCourse}
                    page={coursePagination.page}
                    pageSize={coursePagination.per_page}
                    t={t}
                  />
                  {coursePagination.totalPages > 1 && (
                    <PaginationCustom
                      currentPage={coursePagination.page}
                      totalPages={coursePagination.totalPages}
                      onPageChange={handleCoursePageChange}
                      totalItems={coursePagination.total}
                      pageSize={coursePagination.per_page}
                      onPageSizeChange={handleCoursePageSizeChange}
                      t={t}
                    />
                  )}
                </TabsContent>

                <TabsContent value="class">
                  <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                    <h3 className="text-lg font-semibold">{t("classList")}</h3>
                    <div className="flex gap-2 flex-wrap">
                      <ExportData
                        onExport={async () => {
                          try {
                            const response = await exportClass({
                              school_id: Number.parseInt(schoolId || "0"),
                            });

                            // Get URL from response and download file
                            if (response.data && response.data.url) {
                              const link = document.createElement("a");
                              link.href = response.data.url;
                              link.download = `classes_${schoolId}_${
                                new Date().toISOString().split("T")[0]
                              }.xlsx`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }
                          } catch (error) {
                            console.error("Export failed:", error);
                            alert("Export failed. Please try again.");
                          }
                        }}
                        label="Xuất dữ liệu"
                      />
                      <ImportData
                        onImport={async (file) => {
                          try {
                            const response = await importClass(file);
                            if (response.code === 200) {
                              alert(
                                response.data.message || "Import successful!"
                              );
                              // Refresh class list after successful import
                              await fetchClasses(
                                classPagination.page,
                                classPagination.per_page
                              );
                            } else {
                              alert(response.message || "Import failed");
                            }
                          } catch (error) {
                            console.error("Import failed:", error);
                            alert("Import failed. Please try again.");
                          }
                        }}
                        accept={".csv,.xlsx"}
                        label="Nhập dữ liệu"
                      />
                      <Button onClick={handleAddClass}>
                        <Plus className="h-4 w-4 mr-2" />
                        {t("addClass")}
                      </Button>
                    </div>
                  </div>
                  <ClassTable
                    classes={classes}
                    onDelete={handleDeleteClass}
                    onEdit={handleEditClass}
                    onViewStudents={handleViewClassStudents}
                    page={classPagination.page}
                    pageSize={classPagination.per_page}
                    t={t}
                  />
                  {classPagination.totalPages > 1 && (
                    <PaginationCustom
                      currentPage={classPagination.page}
                      totalPages={classPagination.totalPages}
                      onPageChange={handleClassPageChange}
                      totalItems={classPagination.total}
                      pageSize={classPagination.per_page}
                      onPageSizeChange={handleClassPageSizeChange}
                      t={t}
                    />
                  )}
                </TabsContent>

                <TabsContent value="student">
                  <div className="flex justify-between items-center mb-4 gap-2 flex-wrap">
                    <h3 className="text-lg font-semibold">
                      {t("studentList")}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Input
                        placeholder={uCommon("search")}
                        value={studentKeyword}
                        onChange={(e) => setStudentKeyword(e.target.value)}
                        className="w-48"
                      />
                      <Select
                        value={
                          studentStatus === "" ? "all" : String(studentStatus)
                        }
                        onValueChange={(val) => {
                          if (val === "all") setStudentStatus("");
                          else if (val === "true") setStudentStatus("true");
                          else if (val === "false") setStudentStatus("false");
                        }}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder={t("status")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            {t("allStatuses")}
                          </SelectItem>
                          <SelectItem value="true">{t("active")}</SelectItem>
                          <SelectItem value="false">{t("inactive")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={
                          studentLoginStatus === ""
                            ? "all"
                            : String(studentLoginStatus)
                        }
                        onValueChange={(val) => {
                          if (val === "all") setStudentLoginStatus("");
                          else if (val === "true")
                            setStudentLoginStatus("true");
                          else if (val === "false")
                            setStudentLoginStatus("false");
                        }}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Trạng thái đăng nhập" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả trạng thái</SelectItem>
                          <SelectItem value="true">Đã đăng nhập</SelectItem>
                          <SelectItem value="false">Chưa đăng nhập</SelectItem>
                        </SelectContent>
                      </Select>
                      <ExportData
                        onExport={async () => {
                          try {
                            const exportParams = {
                              role_id: 3, // Students
                              school_id: Number.parseInt(schoolId || "0"),
                              ...(debouncedStudentKeyword
                                ? { keyword: debouncedStudentKeyword }
                                : {}),
                              ...(studentStatus !== ""
                                ? { status: studentStatus }
                                : {}),
                              ...(studentLoginStatus !== ""
                                ? { is_used: studentLoginStatus === "true" }
                                : {}),
                            };

                            const response = await exportUser(exportParams);

                            // Get URL from response and download file
                            if (
                              response &&
                              response.data &&
                              response.data.url
                            ) {
                              const link = document.createElement("a");
                              link.href = response.data.url;
                              link.download = `students_${schoolId}_${
                                new Date().toISOString().split("T")[0]
                              }.xlsx`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            } else {
                              throw new Error(
                                "Không nhận được URL file từ server"
                              );
                            }
                          } catch (error) {
                            console.error("Export failed:", error);
                            toast({
                              title: "Lỗi xuất dữ liệu",
                              description:
                                "Không thể xuất file danh sách học sinh. Vui lòng thử lại.",
                              variant: "destructive",
                            });
                          }
                        }}
                        label="Xuất dữ liệu"
                      />
                      <Button onClick={() => handleAddStudent()}>
                        <Plus className="h-4 w-4 mr-2" />
                        {t("addStudent")}
                      </Button>
                    </div>
                  </div>
                  <StudentTable
                    students={students}
                    onDelete={handleDeleteStudent}
                    onEdit={handleEditStudent}
                    page={studentPagination.page}
                    pageSize={studentPagination.per_page}
                    t={t}
                    studentLoginStatus={studentLoginStatus}
                  />
                  {studentPagination.totalPages > 1 && (
                    <PaginationCustom
                      currentPage={studentPagination.page}
                      totalPages={studentPagination.totalPages}
                      onPageChange={handleStudentPageChange}
                      totalItems={studentPagination.total}
                      pageSize={studentPagination.per_page}
                      onPageSizeChange={handleStudentPageSizeChange}
                      t={t}
                    />
                  )}
                </TabsContent>

                <TabsContent value="teacher">
                  <div className="flex justify-between items-center mb-4 gap-2 flex-wrap">
                    <h3 className="text-lg font-semibold">
                      {t("teacherList")}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Input
                        placeholder={uCommon("search")}
                        value={teacherKeyword}
                        onChange={(e) => setTeacherKeyword(e.target.value)}
                        className="w-48"
                      />
                      <Select
                        value={
                          teacherStatus === "" ? "all" : String(teacherStatus)
                        }
                        onValueChange={(val) => {
                          if (val === "all") setTeacherStatus("");
                          else if (val === "true") setTeacherStatus("true");
                          else if (val === "false") setTeacherStatus("false");
                        }}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder={t("status")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            {t("allStatuses")}
                          </SelectItem>
                          <SelectItem value="true">{t("active")}</SelectItem>
                          <SelectItem value="false">{t("inactive")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={handleAddTeacher}>
                        <Plus className="h-4 w-4 mr-2" />
                        {t("addTeacher")}
                      </Button>
                    </div>
                  </div>
                  <TeacherTable
                    teachers={teachers}
                    onDelete={handleDeleteTeacher}
                    onEdit={handleEditTeacher}
                    page={teacherPagination.page}
                    pageSize={teacherPagination.per_page}
                    t={t}
                  />
                  {teacherPagination.totalPages > 1 && (
                    <PaginationCustom
                      currentPage={teacherPagination.page}
                      totalPages={teacherPagination.totalPages}
                      onPageChange={handleTeacherPageChange}
                      totalItems={teacherPagination.total}
                      pageSize={teacherPagination.per_page}
                      onPageSizeChange={handleTeacherPageSizeChange}
                      t={t}
                    />
                  )}
                </TabsContent>
              </Tabs>
            </>
          </CardContent>
        </Card>

        {/* Modals */}
        <SchoolDialogModal
          show={showSchoolDialog}
          onClose={() => setShowSchoolDialog(false)}
          onSubmit={handleSubmitSchool}
          formData={formData}
          setFormData={setFormData}
          selectedSchool={selectedSchool}
        />

        <StudentModal
          show={showStudentModal}
          onClose={() => setShowStudentModal(false)}
          onSubmit={handleSubmitStudent}
          formData={studentFormData}
          setFormData={setStudentFormData}
          selectedStudent={selectedStudent}
          schoolId={schoolId || ""}
          schoolName={school?.name}
        />

        <TeacherModal
          show={showTeacherModal}
          onClose={() => setShowTeacherModal(false)}
          onSubmit={handleSubmitTeacher}
          formData={teacherFormData}
          setFormData={setTeacherFormData}
          selectedTeacher={selectedTeacher}
          schoolId={schoolId || ""}
          schoolName={school?.name}
        />

        {/* <CourseModal
          show={showCourseModal}
          onClose={() => setShowCourseModal(false)}
          onSubmit={handleSubmitCourse}
          formData={courseFormData}
          setFormData={setCourseFormData}
          selectedCourse={selectedCourse}
          schoolId={schoolId || ""}
          schoolName={school?.name}
        /> */}

        <ClassModal
          show={showClassModal}
          onClose={() => setShowClassModal(false)}
          onSubmit={handleSubmitClass}
          formData={classFormData}
          setFormData={setClassFormData}
          selectedClass={selectedClass}
          schoolId={schoolId || ""}
          schoolName={school?.name}
          grades={grades}
        />
      </div>
    </div>
  );
}
