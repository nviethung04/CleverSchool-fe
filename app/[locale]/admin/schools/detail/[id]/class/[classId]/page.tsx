"use client";

import { useEffect, useState, useCallback, memo, type ReactNode } from "react";
import { useTranslations } from "next-intl"; // Keep only this import for translations
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus, ArrowLeft } from "lucide-react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  GetUserListAdvanced,
  CreateUser,
  UpdateUser,
  DeleteUser,
  AddStudentsToClass,
} from "@/lib/api/users"; // Import student CRUD
import { GetSchoolDetail } from "@/lib/api/schools"; // To get school name for student modal context
import { GetClassList, UpdateClass, DeleteClass } from "@/lib/api/classes"; // Class CRUD
import ClassModal from "@/app/[locale]/admin/schools/components/ClassModal";
import StudentModal from "@/app/[locale]/admin/schools/components/StudentModal"; // Import StudentModal
import AddStudentModal from "@/app/[locale]/admin/schools/components/AddStudentModal"; // Import AddStudentModal

// Helper function để xử lý error safely
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

const DetailRow = memo(
  ({ label, value }: { label: string; value: string | ReactNode }) => (
    <div className="flex items-start justify-between py-2 border-b border-gray-100 last:border-b-0">
      <div className="text-sm font-medium text-gray-600 min-w-[120px]">
        {label}:
      </div>
      <div className="text-sm text-gray-900 text-right flex-1 ml-4">
        {value}
      </div>
    </div>
  )
);

const OptimizedStudentRow = memo(
  ({
    student,
    index,
    onEdit,
    onDelete,
    t,
  }: {
    student: any;
    index: number;
    onEdit: (student: any) => void;
    onDelete: (id: string) => void;
    t: any;
  }) => {
    return (
      <TableRow key={student.id}>
        <TableCell className="font-medium">{index + 1}</TableCell>
        <TableCell className="text-center">{student.name}</TableCell>
        <TableCell className="text-center">{student.username}</TableCell>
        <TableCell className="text-center">{student.email}</TableCell>
        <TableCell className="text-center">{student.phone_number}</TableCell>
        <TableCell className="text-center">{student.address}</TableCell>
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
      prevProps.student.updated_at === nextProps.student.updated_at
    );
  }
);

function StudentTable({
  students,
  onDelete,
  onEdit,
  t,
}: {
  students: any[];
  onDelete: (id: string) => void;
  onEdit: (student: any) => void;
  t: any;
}) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="w-full min-w-[900px]">
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold text-gray-900">
                {t("orderNumber")}
              </TableHead>
              <TableHead className="text-center font-semibold text-gray-900">
                {t("fullName")}
              </TableHead>
              <TableHead className="text-center font-semibold text-gray-900">
                {t("username")}
              </TableHead>
              <TableHead className="text-center font-semibold text-gray-900">
                {t("email")}
              </TableHead>
              <TableHead className="text-center font-semibold text-gray-900">
                {t("phone")}
              </TableHead>
              <TableHead className="text-center font-semibold text-gray-900">
                {t("address")}
              </TableHead>
              <TableHead className="text-center font-semibold text-gray-900">
                {t("course")}
              </TableHead>
              <TableHead className="text-center font-semibold text-gray-900">
                {t("status")}
              </TableHead>
              <TableHead className="text-center font-semibold text-gray-900">
                {t("actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students && students.length > 0 ? (
              students.map((student, idx) => (
                <OptimizedStudentRow
                  key={student.id}
                  student={student}
                  index={idx}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  t={t}
                />
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-8 text-gray-500"
                >
                  {t("noStudents")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default function ClassDetailPage() {
  const t = useTranslations("schools"); // Using schools translation for all keys

  const params = useParams();
  const router = useRouter();
  const schoolId = Array.isArray(params.id)
    ? params.id[0]
    : (params.id as string);
  const classId = Array.isArray(params.classId)
    ? params.classId[0]
    : (params.classId as string);

  const [classItem, setClassItem] = useState<any>(null);
  const [studentsInClass, setStudentsInClass] = useState<any[]>([]);
  const [schoolName, setSchoolName] = useState<string | undefined>(undefined);

  // Class Modal states
  const [showClassModal, setShowClassModal] = useState(false);
  const [classFormData, setClassFormData] = useState({
    name: "",
    description: "",
    max_students: "",
    teacher_info: {
      name: "",
      phone: "",
      email: "",
    },
    status: true,
    school_id: "",
  });
  const [isLoading, setIsLoading] = useState(false); // For class delete/save loading
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingClass, setLoadingClass] = useState(true);

  // Student Modal states
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [studentFormData, setStudentFormData] = useState<any>({});

  // Add Student Modal states
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);

  // Fetch school name for student modal context
  const fetchSchoolName = useCallback(async () => {
    if (!schoolId) return;
    try {
      const schoolData = await GetSchoolDetail(schoolId);
      setSchoolName(schoolData?.name);
    } catch (error) {
      console.error("Error fetching school name:", error);
      setSchoolName(undefined);
    }
  }, [schoolId]);

  // Fetch class details
  const fetchClassDetails = useCallback(async () => {
    if (!classId || !schoolId) return;
    setLoadingClass(true);
    try {
      // Fetch all classes for the school and find the specific class
      const classResponse = await GetClassList(schoolId);
      const foundClass = classResponse.data?.classes?.find(
        (c: any) => c.id.toString() === classId.toString()
      );
      if (foundClass) {
        setClassItem(foundClass);
        // Initialize classFormData for editing
        setClassFormData({
          name: foundClass.name || "",
          description: foundClass.description || "",
          max_students: foundClass.max_students || "",
          teacher_info: {
            name: foundClass.teacher_info?.name || "",
            phone: foundClass.teacher_info?.phone || "",
            email: foundClass.teacher_info?.email || "",
          },
          status: foundClass.status || true,
          school_id: schoolId,
        });
      } else {
        throw new Error("Class not found");
      }
    } catch (error) {
      console.error("Error fetching class details:", error);
      setClassItem(null);
    } finally {
      setLoadingClass(false);
    }
  }, [classId, schoolId]);

  // Fetch students for the current class
  const fetchStudentsByClass = useCallback(async () => {
    if (!classId) return;
    setLoadingStudents(true);
    try {
      const response = await GetUserListAdvanced({
        role_id: 3, // Students
        class_id: classId,
      });
      if (response && response.data && Array.isArray(response.data.users)) {
        setStudentsInClass(response.data.users);
      } else {
        console.warn("Invalid response format for students:", response);
        setStudentsInClass([]);
      }
    } catch (error) {
      console.error(`Error fetching students for class ${classId}:`, error);
      setStudentsInClass([]);
    } finally {
      setLoadingStudents(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchSchoolName();
    fetchClassDetails();
    fetchStudentsByClass();
  }, [fetchSchoolName, fetchClassDetails, fetchStudentsByClass]);

  // Student CRUD operations (adapted from SchoolDetailPage)
  const handleAddStudent = () => {
    if (!schoolId || !classId) {
      alert(t("schoolIdNotFound")); // Using t from schools namespace
      return;
    }
    setSelectedStudent(null);
    setStudentFormData({
      role_id: 3,
      role_name: "student",
      user_info: {
        school: { id: Number.parseInt(schoolId), name: schoolName },
        address: {
          // These might need to be fetched from school details if not available
          province_code: "",
          district_code: "",
        },
        class: { id: Number.parseInt(classId), name: classItem?.name },
      },
    });
    setShowStudentModal(true);
  };

  const handleEditStudent = (student: any) => {
    setSelectedStudent(student);
    setStudentFormData(student);
    setShowStudentModal(true);
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (confirm(t("deleteStudentConfirm"))) {
      // Using t from schools namespace
      try {
        await DeleteUser(studentId);
        alert(t("deleteStudentSuccess")); // Using t from schools namespace
        await fetchStudentsByClass(); // Refresh students in this class
      } catch (error) {
        alert(t("deleteStudentError")); // Using t from schools namespace
      }
    }
  };

  const handleSubmitStudent = async () => {
    try {
      // Validate required fields
      if (!studentFormData.name?.trim()) {
        alert(t("fullNameRequired")); // Using t from schools namespace
        return;
      }

      if (!studentFormData.username?.trim()) {
        alert(t("usernameRequired")); // Using t from schools namespace
        return;
      }

      if (!selectedStudent && !studentFormData.password?.trim()) {
        alert(t("passwordRequired")); // Using t from schools namespace
        return;
      }

      if (selectedStudent) {
        await UpdateUser(selectedStudent.id, studentFormData);
        alert(t("updateStudentSuccess")); // Using t from schools namespace
      } else {
        await CreateUser(studentFormData);
        alert(t("addStudentSuccess")); // Using t from schools namespace
      }
      setShowStudentModal(false);
      await fetchStudentsByClass(); // Refresh students in this class
    } catch (error) {
      console.error("Error saving student:", error);
      const errorMessage =
        error instanceof Error ? error.message : t("saveStudentError"); // Using t from schools namespace
      alert(errorMessage);
    }
  };

  // Handle adding students from list
  const handleAddStudentsFromList = async (selectedStudents: any[]) => {
    try {
      // Use the new API to add students to class
      const studentIds = selectedStudents.map((student) =>
        parseInt(student.id)
      );
      await AddStudentsToClass({
        class_id: parseInt(classId),
        student_ids: studentIds,
      });

      // Don't show alert here since the modal already shows toast
      await fetchStudentsByClass(); // Refresh students in this class
    } catch (error) {
      console.error("Error adding students to class:", error);
      // Don't show alert here since the modal already shows toast
    }
  };

  // Class CRUD operations (adapted from ClassDetailModal)
  const handleEditClass = () => {
    if (classItem) {
      setClassFormData({
        name: classItem.name || "",
        description: classItem.description || "",
        max_students: classItem.max_students || "",
        teacher_info: {
          name: classItem.teacher_info?.name || "",
          phone: classItem.teacher_info?.phone || "",
          email: classItem.teacher_info?.email || "",
        },
        status: classItem.status || true,
        school_id: schoolId,
      });
    }
    setShowClassModal(true);
  };

  const handleSaveClass = async () => {
    if (!classItem) return;

    setIsLoading(true);
    try {
      const updatedClassData = {
        ...classFormData,
        id: classItem.id,
      };
      await UpdateClass(classItem.id, updatedClassData);
      alert(t("updateClassSuccess")); // Using t from schools namespace
      setShowClassModal(false);
      await fetchClassDetails(); // Refresh class details on this page
    } catch (error) {
      console.error("Error updating class:", error);
      alert(t("saveClassError")); // Using t from schools namespace
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClass = async () => {
    if (!classItem) return;

    if (confirm(t("confirmDeleteClass"))) {
      // Using t from schools namespace
      setIsLoading(true);
      try {
        await DeleteClass(classItem.id);
        alert(t("deleteClassSuccess")); // Using t from schools namespace
        router.push(`/admin/schools/detail/${schoolId}`); // Navigate back to school detail page
      } catch (error) {
        console.error("Error deleting class:", error);
        alert(t("deleteClassError")); // Using t from schools namespace
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleGoBack = () => {
    router.push(`/admin/schools/detail/${schoolId}`);
  };

  if (loadingClass) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">{t("loadingClass")}</div>
      </div>
    );
  }

  if (!classItem) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">{t("classNotFound")}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-8xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <Button
              variant="outline"
              onClick={handleGoBack}
              className="shrink-0 bg-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("backToSchool")}
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t("classDetailTitle")} {classItem.name}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {classItem.description || t("noDescription")}
              </p>
            </div>
          </div>
        </div>

        {/* Class Information Section */}
        <div className="mb-8 bg-white border rounded-lg shadow-sm">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 rounded-t-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {t("classInfoSection")}
              </h2>
              <p className="text-sm text-gray-600">
                {t("classInfoDescription")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Button
                onClick={handleEditClass}
                variant="outline"
                size="sm"
                className="bg-white"
              >
                <Edit className="h-4 w-4 mr-2" />
                {t("editClass")}
              </Button>
              <Button
                onClick={handleDeleteClass}
                variant="destructive"
                size="sm"
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isLoading ? t("deleting") : t("deleteClass")}
              </Button>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">
                    {t("basicInfo")}
                  </h3>
                  <DetailRow
                    label={t("classNameLabel")}
                    value={classItem.name}
                  />
                  <DetailRow
                    label={t("studentCountmax")}
                    value={classItem.max_students || 0}
                  />
                  <DetailRow
                    label={t("studentCountcurrent")}
                    value={classItem.current_students || 0}
                  />
                  <DetailRow
                    label={t("statusActivityLabel")}
                    value={
                      <Badge
                        variant={classItem.status ? "default" : "destructive"}
                      >
                        {classItem.status ? t("active") : t("inactive")}
                      </Badge>
                    }
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">
                    {t("teacherInfo")}
                  </h3>
                  <DetailRow
                    label={t("teachers")}
                    value={classItem.teacher_info?.name || t("noTeachers")}
                  />
                  <DetailRow
                    label={t("phone")}
                    value={classItem.teacher_info?.phone || t("notUpdated")}
                  />
                  <DetailRow
                    label={t("email")}
                    value={classItem.teacher_info?.email || t("notUpdated")}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Students Section */}
        <div className="bg-white border rounded-lg shadow-sm">
          <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200 rounded-t-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-l font-bold text-gray-600">
                {t("totalStudents")} {studentsInClass.length}
              </h2>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={handleAddStudent} className="shrink-0">
                <Plus className="h-4 w-4 mr-2" />
                {t("addStudent")}
              </Button>
              <Button
                onClick={() => setShowAddStudentModal(true)}
                className="bg-orange-600 hover:bg-orange-700 whitespace-pre-line h-auto py-2.5"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("selectStudentsFromList")}
              </Button>
            </div>
          </div>
          <div className="p-6">
            {loadingStudents ? (
              <div className="text-center py-8">{t("loadingStudents")}</div>
            ) : (
              <StudentTable
                students={studentsInClass}
                onDelete={handleDeleteStudent}
                onEdit={handleEditStudent}
                t={t} // Pass the 'schools' translation object
              />
            )}
          </div>
        </div>

        {/* Class Edit Modal */}
        <ClassModal
          show={showClassModal}
          onClose={() => {
            if (!isLoading) {
              setShowClassModal(false);
            }
          }}
          onSubmit={handleSaveClass}
          formData={classFormData}
          setFormData={setClassFormData}
          selectedClass={classItem}
          schoolId={schoolId}
          isLoading={isLoading}
        />

        {/* Student Add/Edit Modal */}
        <StudentModal
          show={showStudentModal}
          onClose={() => setShowStudentModal(false)}
          onSubmit={handleSubmitStudent}
          formData={studentFormData}
          setFormData={setStudentFormData}
          selectedStudent={selectedStudent}
          schoolId={schoolId}
          schoolName={schoolName}
          classId={classItem?.id}
          className={classItem?.name}
        />

        {/* Add Students from List Modal */}
        <AddStudentModal
          show={showAddStudentModal}
          onClose={() => setShowAddStudentModal(false)}
          onConfirm={handleAddStudentsFromList}
          schoolId={schoolId}
          classId={classId}
          existingStudentIds={studentsInClass.map((student) => student.id)}
        />
      </div>
    </div>
  );
}
