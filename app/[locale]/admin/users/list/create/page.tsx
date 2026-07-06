"use client";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/i18n/routing";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { CreateUser, CheckUsernameExists } from "@/lib/api/users";
import { getListSchool } from "@/lib/api/dashboard";
import { GetSubjectsList } from "@/lib/api/subjects";
import { GetCourseList, GetCourseBySchool } from "@/lib/api/courses";
import { GetClassList } from "@/lib/api/classes";
import { debounce } from "lodash";
import { UserForm } from "../../components/user-form";
import { FormData, Province, Ward, Subject } from "../../types";
import { useQueryString } from "@/hooks/use-query-string";
import { HIDDEN_USER_LIST_TABS } from "@/config/hiddenModules";

export default function CreateUserPage() {
  const router = useRouter();
  const t = useTranslations("users");
  const searchParams = useSearchParams();
  const { setQueryParams } = useQueryString();
  const roleParam = searchParams.get("role");
  const returnTab = searchParams.get("returnTab");

  const [showPassword, setShowPassword] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [usersExits, setUsersExits] = useState(false);

  const getSelectedRoleFromParam = (roleId: string | null) => {
    if (roleId === "1") return "1"; // admin
    if (roleId === "2") return "2"; // teacher
    if (roleId === "3") return "3"; // student
    return "3"; // default to student
  };

  const [selectedRole, setSelectedRole] = useState<string>(
    getSelectedRoleFromParam(roleParam)
  );

  const [schools, setSchools] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [coursesBySchool, setCoursesBySchool] = useState<any[]>([]); // Khóa học theo trường
  const [classes, setClasses] = useState<any[]>([]);
  /** Teacher: classes per school id */
  const [classesBySchool, setClassesBySchool] = useState<Record<string, any[]>>({});
  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: "",
      username: "",
      password: "",
      code: "",
      identifier: "",
      email: "",
      phone_number: "",
      address: "",
      role_id: roleParam ? Number(roleParam) : 3,
      school: "",
      teacher_school_ids: [],
      teacher_school_class_ids: {},
      course: [],
      subject: "",
      type_teacher: 0, // Mặc định là 0 (không phải giáo viên)
      class_name: "",
      status: true,
      date_of_birth: "",
      avatar: "",
    },
  });

  const school = watch("school");
  const teacherSchoolIds = watch("teacher_school_ids") || [];

  const debouncedCheckUsername = debounce(async (username: string) => {
    try {
      const result = await CheckUsernameExists(username);
      setUsersExits(result.data?.exits === true);
    } catch (error) {
      setUsersExits(false);
      console.error("Lỗi khi kiểm tra tài khoản đã tồn tại:", error);
    }
  }, 500);

  useEffect(() => {
    fetchSchools();
    fetchCourses();
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (!HIDDEN_USER_LIST_TABS.includes("schools") || roleParam !== "4") return;
    const tab = returnTab && !HIDDEN_USER_LIST_TABS.includes(returnTab) ? returnTab : "students";
    router.replace(`/admin/users/list?tab=${tab}`);
  }, [roleParam, returnTab, router]);

  const handleRoleChange = (role: string) => {
    setQueryParams({ role });
  };

  useEffect(() => {
    if (!roleParam) return;
    const roleString = getSelectedRoleFromParam(roleParam);
    if (roleString !== selectedRole) {
      setSelectedRole(roleString);
      setValue("role_id", Number(roleParam));
    }
  }, [roleParam, selectedRole, setValue]);

  useEffect(() => {
    if (school) {
      Promise.all([fetchClasses(school), fetchCoursesBySchool(school)]);
      // Reset khóa học đã chọn khi đổi trường
      setValue("course", []);
    } else {
      setClasses([]);
      setCoursesBySchool([]);
      setValue("course", []);
    }
  }, [school, setValue]);

  // Teacher: fetch classes for each selected school
  useEffect(() => {
    if (selectedRole !== "2" || !Array.isArray(teacherSchoolIds) || teacherSchoolIds.length === 0) {
      if (selectedRole !== "2") setClassesBySchool({});
      return;
    }
    const fetchAll = async () => {
      const next: Record<string, any[]> = {};
      for (const schoolId of teacherSchoolIds) {
        try {
          const result = await GetClassList(schoolId);
          next[schoolId] = result.data?.classes || [];
        } catch {
          next[schoolId] = [];
        }
      }
      setClassesBySchool(next);
    };
    fetchAll();
  }, [selectedRole, teacherSchoolIds.join(",")]);

  const fetchSchools = async () => {
    try {
      const result = await getListSchool();
      setSchools(result.data.schools || []);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách trường:", error);
    }
  };

  const fetchCourses = async () => {
    try {
      const result = await GetCourseList();
      setCourses(result.data.courses || []);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách khóa học:", error);
    }
  };

  const fetchClasses = async (schoolCode: string) => {
    try {
      const result = await GetClassList(schoolCode);
      setClasses(result.data.classes || []);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách lớp học:", error);
    }
  };

  const fetchCoursesBySchool = async (schoolId: string) => {
    try {
      const result = await GetCourseBySchool(schoolId);
      setCoursesBySchool(result.data.courses || []);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách khóa học theo trường:", error);
      setCoursesBySchool([]);
    }
  };

  const fetchSubjects = async () => {
    try {
      const result = await GetSubjectsList();
      setSubjects(result.data.subjects);
    } catch (err) {
      console.error("Lỗi khi lấy danh sách môn học:", err);
    }
  };

  const handleSubmitUser = async (data: FormData) => {
    console.log("Submitting user data:", data);
    if (data.email && !isValidEmail(data.email)) {
      alert(t("invalidEmail"));
      return;
    }
    if (data.phone_number && !isValidPhoneNumber(data.phone_number)) {
      alert(t("invalidPhone"));
      return;
    }
    if (    
      selectedRole === "3" &&
      !data.username &&
      !data.code &&
      !data.identifier
    ) {
      alert(t("invalidInformation"));
      return;
    }
    try {
      setIsUploading(true);
      const payload = buildUserPayload(data, schools, classes, classesBySchool);
      const result = await CreateUser(payload);
      if (result.code === 201 || result.code === 200) {
        // Show success alert IMMEDIATELY
        alert(t("createSuccess"));

        // Navigate back after a short delay to ensure alert is shown
        setTimeout(() => {
          if (returnTab) {
            router.push(`/admin/users/list?tab=${returnTab}`);
          } else {
            router.push("/admin/users/list");
          }
        }, 500);
      }
    } catch (err) {
      console.error("Thêm người dùng thất bại", err);
      alert(t("createFailed")); // Fix: should show error message, not success
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidPhoneNumber = (phone: string) => {
    return /^(0\d{9}|(\+84)\d{9})$/.test(phone);
  };

  const buildPayloadWithUserInfo = (
    data: FormData,
    dateOfBirth: string | null,
    payloadSchools: { id: number; name: string }[],
    payloadClasses: { id: number; name: string; school: { id: number; name: string } }[]
  ) => ({
    parent_id: 0,
    role_id: Number(data.role_id),
    username: data.username,
    password: data.password,
    code: data.code,
    identifier: data.identifier,
    name: data.name,
    address: data.address || "",
    email: data.email || "",
    phone_number: data.phone_number || "",
    avatar: data.avatar || "",
    date_of_birth: dateOfBirth,
    status: data.status === "true" || data.status === true ? true : false,
    type_teacher: Number(data.role_id) === 2 ? data.type_teacher || 1 : 0,
    user_info: {
      school: payloadSchools[0] ? { id: payloadSchools[0].id } : { id: 0 },
      class: payloadClasses[0] ? { id: payloadClasses[0].id } : { id: 0 },
      courses: Array.isArray(data.course)
        ? data.course.map((courseId) => ({ id: Number(courseId) }))
        : data.course ? [{ id: Number(data.course) }] : [],
      subjects: data.subject ? [{ id: Number(data.subject) }] : [],
      address: {
        id: 0,
        province_code: "",
        ward_code: "",
        province_name: "",
        ward_name: "",
        address: data.address || "",
      },
      role: {
        id: Number(data.role_id),
        name:
          data.role_id === 1 ? "admin" : data.role_id === 2 ? "teacher" : "student",
      },
      certificates: [],
      degrees: [],
      departments: [],
      positions: [],
      schools: payloadSchools,
      classes: payloadClasses,
    },
  });

  const buildUserPayload = (
    data: FormData,
    schoolsList: any[] = [],
    classesList: any[] = [],
    teacherClassesBySchool: Record<string, any[]> = {}
  ) => {
    const dateOfBirth = data.date_of_birth
      ? new Date(data.date_of_birth).toISOString()
      : null;

    const isTeacher = Number(data.role_id) === 2;

    if (isTeacher && data.teacher_school_ids?.length) {
      const payloadSchools = data.teacher_school_ids.map((schoolId) => {
        const s = schoolsList.find(
          (x) => String(x.id) === String(schoolId) || x.id === Number(schoolId)
        );
        const name = s?.school_name ?? s?.name ?? "";
        return { id: Number(schoolId), name };
      });
      const payloadClasses: { id: number; name: string; school: { id: number; name: string } }[] = [];
      const classIdsBySchool = data.teacher_school_class_ids || {};
      for (const schoolId of data.teacher_school_ids) {
        const s = schoolsList.find(
          (x) => String(x.id) === String(schoolId) || x.id === Number(schoolId)
        );
        const schoolName = s?.school_name ?? s?.name ?? "";
        const classIds = classIdsBySchool[schoolId] || [];
        const schoolClasses = teacherClassesBySchool[schoolId] || [];
        for (const classId of classIds) {
          const cls = schoolClasses.find(
            (c: any) => String(c.id) === String(classId) || c.id === Number(classId)
          );
          payloadClasses.push({
            id: Number(classId),
            name: cls?.name ?? "",
            school: { id: Number(schoolId), name: schoolName },
          });
        }
      }
      return buildPayloadWithUserInfo(data, dateOfBirth, payloadSchools, payloadClasses);
    }

    const selectedSchool = data.school
      ? schoolsList.find(
          (s) => String(s.id) === String(data.school) || s.id === Number(data.school)
        )
      : null;
    const selectedClass = data.class_name
      ? classesList.find(
          (c) =>
            String(c.id) === String(data.class_name) ||
            c.id === Number(data.class_name)
        )
      : null;
    const schoolName = selectedSchool?.school_name ?? selectedSchool?.name ?? "";

    const payloadSchools =
      selectedSchool || data.school
        ? [{ id: Number(data.school), name: schoolName }]
        : [];

    const payloadClasses =
      selectedClass || data.class_name
        ? [
            {
              id: Number(data.class_name),
              name: selectedClass?.name ?? "",
              school: selectedSchool || data.school
                ? { id: Number(data.school), name: schoolName }
                : { id: 0, name: "" },
            },
          ]
        : [];

    return buildPayloadWithUserInfo(data, dateOfBirth, payloadSchools, payloadClasses);
  };
  const getRoleTitle = (roleId: string) => {
    switch (roleId) {
      case "1":
        return t("addAdminTitle");
      case "2":
        return t("addTeacherTitle");
      case "3":
        return t("addStudentTitle");
      default:
        return t("addUserTitle");
    }
  };

  const getRoleSubtitle = (roleId: string) => {
    switch (roleId) {
      case "1":
        return t("addAdminSubtitle");
      case "2":
        return t("addTeacherSubtitle");
      case "3":
        return t("addStudentSubtitle");
      default:
        return t("addUserSubtitle");
    }
  };

  const getSubmitButtonText = (roleId: string) => {
    switch (roleId) {
      case "1":
        return t("addAdminButton");
      case "2":
        return t("addTeacherButton");
      case "3":
        return t("addStudentButton");
      default:
        return t("addUserButton");
    }
  };

  return (
    <UserForm
      formData={{} as FormData}
      errors={errors}
      register={register}
      watch={watch}
      setValue={setValue}
      handleSubmit={handleSubmit}
      showPassword={showPassword}
      setShowPassword={setShowPassword}
      isUploading={isUploading}
      usersExits={usersExits}
      selectedRole={selectedRole}
      setSelectedRole={setSelectedRole}
      onRoleChange={handleRoleChange}
      schools={schools}
      courses={courses}
      coursesBySchool={coursesBySchool}
      classes={classes}
      classesBySchool={classesBySchool}
      subjects={subjects}
      debouncedCheckUsername={debouncedCheckUsername}
      setSchools={setSchools}
      setCourses={setCourses}
      setClasses={setClasses}
      onSubmit={handleSubmitUser}
      onCancel={handleCancel}
      title={getRoleTitle(selectedRole)}
      subtitle={getRoleSubtitle(selectedRole)}
      submitButtonText={getSubmitButtonText(selectedRole)}
      isEdit={false}
    />
  );
}
