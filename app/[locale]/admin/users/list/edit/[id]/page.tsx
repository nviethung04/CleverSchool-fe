"use client";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/i18n/routing";
import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  CheckUsernameExists,
  GetDetailUser,
  UpdateUser,
  ResetUserPassword,
} from "@/lib/api/users";
import { getListSchool } from "@/lib/api/dashboard";
import { GetSubjectsList } from "@/lib/api/subjects";
import { GetCourseList, GetCourseBySchool } from "@/lib/api/courses";
import { GetClassList } from "@/lib/api/classes";
import { debounce } from "lodash";
import { UserForm } from "../../../components/user-form";
import { FormData, Province, Ward, Subject } from "../../../types";
import { HIDDEN_USER_LIST_TABS } from "@/config/hiddenModules";

export default function EditUserPage() {
  const router = useRouter();
  const t = useTranslations("users");
  const params = useParams();
  const searchParams = useSearchParams();
  const userId = params.id as string;
  const returnTab = searchParams.get("returnTab");

  const [showPassword, setShowPassword] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resetPasswordResult, setResetPasswordResult] = useState<{
    show: boolean;
    password: string;
  }>({ show: false, password: "" });
  const [usersExits, setUsersExits] = useState(false);
  const [originalUsername, setOriginalUsername] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("3");

  const [schools, setSchools] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [coursesBySchool, setCoursesBySchool] = useState<any[]>([]); // Khóa học theo trường
  const [classes, setClasses] = useState<any[]>([]);
  const [classesBySchool, setClassesBySchool] = useState<Record<string, any[]>>({});
  const [subjects, setSubjects] = useState<Subject[]>([]);

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
      role_id: 3,
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

  const editRegister = (name: keyof FormData, options?: any) => {
    if (name === "password") {
      return register(name, { ...options, required: false });
    }
    return register(name, options);
  };

  const debouncedCheckUsername = debounce(async (username: string) => {
    if (username !== originalUsername) {
      try {
        const result = await CheckUsernameExists(username);
        setUsersExits(result.data?.exits === true);
      } catch (error) {
        setUsersExits(false);
        console.error("Lỗi khi kiểm tra tài khoản đã tồn tại:", error);
      }
    } else {
      setUsersExits(false);
    }
  }, 500);

  useEffect(() => {
    fetchSchools();
    fetchSubjects();
    fetchCourses();
    fetchUserDetail();
  }, []);

  useEffect(() => {
    if (school) {
      Promise.all([fetchClasses(school), fetchCoursesBySchool(school)]);
    } else {
      setClasses([]);
      setCoursesBySchool([]);
    }
  }, [school]);

  // Teacher: fetch classes when selected schools change
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

  const fetchUserDetail = async () => {
    try {
      setLoading(true);
      console.log("Fetching user with ID:", userId);
      const result = await GetDetailUser(userId);
      console.log("API Response:", result);
      const user = result.data;

      setOriginalUsername(user.username);
      const roleId = Number.parseInt(user.role_id);

      if (HIDDEN_USER_LIST_TABS.includes("schools") && roleId === 4) {
        const tab =
          returnTab && !HIDDEN_USER_LIST_TABS.includes(returnTab)
            ? returnTab
            : "students";
        router.replace(`/admin/users/list?tab=${tab}`);
        return;
      }

      const isTeacher = roleId === 2;

      // Teacher: map user_info.schools (unique) và user_info.classes theo trường
      let teacher_school_ids: string[] = [];
      let teacher_school_class_ids: Record<string, string[]> = {};
      if (isTeacher && user.user_info?.schools?.length) {
        teacher_school_ids = [
          ...new Set(
            user.user_info.schools.map((s: any) => String(s?.id ?? s))
          ),
        ] as string[];
        if (user.user_info?.classes?.length) {
          for (const cls of user.user_info.classes) {
            const schoolId = cls?.school?.id != null ? String(cls.school.id) : "";
            if (!schoolId) continue;
            if (!teacher_school_class_ids[schoolId])
              teacher_school_class_ids[schoolId] = [];
            if (cls?.id != null)
              teacher_school_class_ids[schoolId].push(String(cls.id));
          }
        }
      }

      // Transform user data to form data format
      const formData = {
        name: user.name || "",
        username: user.username || "",
        code: user.code || "",
        identifier: user.identifier || "",
        email: user.email || "",
        phone_number: user.phone_number || "",
        address: user.address || "",
        password: "",
        role_id: roleId,
        province_code: user.user_info?.address?.province_code || "",
        ward_code: user.user_info?.address?.ward_code || "",
        school: isTeacher ? "" : (user.user_info?.school?.id?.toString() || ""),
        teacher_school_ids,
        teacher_school_class_ids,
        course: user.user_info?.courses?.map((c: any) => c.id.toString()) || [],
        class_name: isTeacher ? "" : (user.user_info?.class?.id?.toString() || ""),
        subject: user.user_info?.subjects?.[0]?.id?.toString() || "",
        type_teacher:
          user.type_teacher || (isTeacher ? 1 : 0),
        status: user.status === true ? "true" : "false",
        date_of_birth: user.date_of_birth
          ? new Date(user.date_of_birth).toISOString().split("T")[0]
          : "",
        avatar: user.avatar || "",
      };

      // Set selected role trước để UI hiển thị đúng
      setSelectedRole(String(user.role_id));

      // Load dependent data: student/school => 1 trường; teacher => nhiều trường
      if (formData.school) {
        await Promise.all([fetchClasses(formData.school), fetchCoursesBySchool(formData.school)]);
      }
      if (isTeacher && teacher_school_ids.length > 0) {
        const nextClassesBySchool: Record<string, any[]> = {};
        await Promise.all(
          teacher_school_ids.map(async (schoolId) => {
            try {
              const result = await GetClassList(schoolId);
              nextClassesBySchool[schoolId] = result.data?.classes || [];
            } catch {
              nextClassesBySchool[schoolId] = [];
            }
          })
        );
        setClassesBySchool(nextClassesBySchool);
      }

      // Then set form values
      reset(formData);
      setValue("school", formData.school || "");
      setValue("teacher_school_ids", formData.teacher_school_ids || []);
      setValue("teacher_school_class_ids", formData.teacher_school_class_ids || {});
      setValue("course", formData.course || []);
      setValue("class_name", formData.class_name || "");
      setValue("subject", formData.subject || "");
      setValue("type_teacher", formData.type_teacher);
      setValue("date_of_birth", formData.date_of_birth || "");

      console.log("Set type_teacher value:", formData.type_teacher);
    } catch (error) {
      console.error("Lỗi khi lấy thông tin người dùng:", error);
      alert(t("loadUserFailed"));
      router.push("/admin/users/list");
    } finally {
      setLoading(false);
    }
  };

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
      const payload = buildUserPayload(data);
      const result = await UpdateUser(userId, payload);
      if (result.code === 200) {
        alert(t("updateSuccess"));
        // Navigate back with original tab
        if (returnTab) {
          router.push(`/admin/users/list?tab=${returnTab}`);
        } else {
          router.push("/admin/users/list");
        }
      }
    } catch (err) {
      console.error("Cập nhật người dùng thất bại", err);
      alert(t("updateFailed"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const handleResetPassword = async () => {
    try {
      // Lấy thông tin user hiện tại từ form
      const currentUserData = watch();
      const identifier = currentUserData.identifier || "";
      const code = currentUserData.code || "";
      const username = currentUserData.username || "";

      // Kiểm tra thông tin cần thiết cho mật khẩu mặc định
      let defaultPassword = "";
      if (identifier !== "") {
        defaultPassword = identifier;
      } else if (code !== "") {
        defaultPassword = code;
      } else {
        defaultPassword = username;
      }

      console.log("📋 Password priority check:", {
        identifier,
        code,
        username,
        defaultPassword
      });

      // Kiểm tra nếu không có thông tin nào để tạo mật khẩu
      if (!defaultPassword) {
        alert("Không thể reset mật khẩu: Thiếu thông tin identifier, code hoặc username");
        return;
      }

      const confirmMessage = `${t("confirmResetPassword")}\n\nMật khẩu mới sẽ là: ${defaultPassword}`;
      const confirmed = window.confirm(confirmMessage);
      if (!confirmed) return;

      setIsUploading(true);
      console.log("🔄 Resetting password for user ID:", userId);

      const result = await ResetUserPassword(userId);

      if (result.code === 200) {
        console.log("🔑 Password reset successful, using calculated default password:", defaultPassword);

        // Hiển thị modal với mật khẩu đã tính toán
        setResetPasswordResult({
          show: true,
          password: defaultPassword // Sử dụng mật khẩu đã tính toán thay vì từ response
        });
      } else {
        throw new Error(result.message || "Reset password failed");
      }
    } catch (error) {
      console.error("❌ Error resetting password:", error);
      alert(t("resetPasswordFailed"));
    } finally {
      setIsUploading(false);
    }
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
    ...(data.password && { password: data.password }),
    name: data.name,
    code: data.code,
    identifier: data.identifier,
    address: data.address || "",
    email: data.email || "",
    phone_number: data.phone_number || "",
    avatar: data.avatar || "",
    date_of_birth: dateOfBirth,
    status: data.status === "true" || data.status === true ? true : false,
    type_teacher: Number(data.role_id) === 2 ? data.type_teacher || 1 : 0,
    user_info: {
      school: payloadSchools[0] ? { id: payloadSchools[0].id } : { id: 0 },
      class: payloadClasses[0] ? { id: payloadClasses[0].id } : { id: 0, name: "" },
      courses: Array.isArray(data.course)
        ? data.course.map((courseId) => ({ id: Number(courseId) }))
        : data.course ? [{ id: Number(data.course) }] : [],
      subjects: data.subject ? [{ id: Number(data.subject) }] : [],
      type_teacher: Number(data.role_id) === 2 ? data.type_teacher || 1 : 0,
      address: {
        id: 0,
        province_code: "",
        ward_code: "",
        province_name: "",
        district_name: "",
        ward_name: "",
        address: data.address || "",
      },
      role: {
        id: Number(data.role_id),
        name:
          data.role_id === 1 ? "admin" : data.role_id === 2 ? "teacher" : data.role_id === 3 ? "student" : "school",
      },
      certificates: [],
      degrees: [],
      departments: [],
      positions: [],
      schools: payloadSchools,
      classes: payloadClasses,
    },
  });

  const buildUserPayload = (data: FormData) => {
    console.log("Building payload from form data:", data);

    const dateOfBirth = data.date_of_birth
      ? new Date(data.date_of_birth).toISOString()
      : null;

    const isTeacher = Number(data.role_id) === 2;

    if (isTeacher && data.teacher_school_ids?.length) {
      const payloadSchools = data.teacher_school_ids.map((schoolId) => {
        const s = schools.find(
          (x: any) => String(x.id) === String(schoolId) || x.id === Number(schoolId)
        );
        const name = (s as any)?.school_name ?? (s as any)?.name ?? "";
        return { id: Number(schoolId), name };
      });
      const payloadClasses: { id: number; name: string; school: { id: number; name: string } }[] = [];
      const classIdsBySchool = data.teacher_school_class_ids || {};
      for (const schoolId of data.teacher_school_ids) {
        const s = schools.find(
          (x: any) => String(x.id) === String(schoolId) || x.id === Number(schoolId)
        );
        const schoolName = (s as any)?.school_name ?? (s as any)?.name ?? "";
        const schoolClasses = classesBySchool[schoolId] || [];
        const classIds = classIdsBySchool[schoolId] || [];
        for (const classId of classIds) {
          const cls = schoolClasses.find(
            (c: any) => String(c.id) === String(classId) || c.id === Number(classId)
          );
          payloadClasses.push({
            id: Number(classId),
            name: (cls as any)?.name ?? "",
            school: { id: Number(schoolId), name: schoolName },
          });
        }
      }
      return buildPayloadWithUserInfo(data, dateOfBirth, payloadSchools, payloadClasses);
    }

    const selectedSchool = data.school
      ? schools.find((s: any) => String(s.id) === String(data.school) || s.id === Number(data.school))
      : null;
    const selectedClass = data.class_name
      ? classes.find(
          (c: any) =>
            String(c.id) === String(data.class_name) || c.id === Number(data.class_name)
        )
      : null;
    const schoolName = (selectedSchool as any)?.school_name ?? (selectedSchool as any)?.name ?? "";

    const payloadSchools =
      selectedSchool || data.school
        ? [{ id: Number(data.school), name: schoolName }]
        : [];

    const payloadClasses =
      selectedClass || data.class_name
        ? [
            {
              id: Number(data.class_name),
              name: (selectedClass as any)?.name ?? "",
              school:
                selectedSchool || data.school
                  ? { id: Number(data.school), name: schoolName }
                  : { id: 0, name: "" },
            },
          ]
        : [];

    return buildPayloadWithUserInfo(data, dateOfBirth, payloadSchools, payloadClasses);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t("loadingUserInfo")}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Modal hiển thị kết quả reset password */}
      {resetPasswordResult.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="text-center">
              <div className="text-green-600 text-4xl mb-4">✅</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Reset mật khẩu thành công!
              </h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Mật khẩu mới của học sinh:</p>
                <div className="bg-gray-100 p-3 rounded border">
                  <code className="text-lg font-mono text-blue-600 select-all">
                    {resetPasswordResult.password}
                  </code>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Nhấn vào mật khẩu để copy
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(resetPasswordResult.password);
                    alert("Đã copy mật khẩu!");
                  }}
                  className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                >
                  Copy mật khẩu
                </button>
                <button
                  onClick={() => setResetPasswordResult({ show: false, password: "" })}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <UserForm
        formData={{} as FormData}
        errors={errors}
        register={editRegister}
        watch={watch}
        setValue={setValue}
        handleSubmit={handleSubmit}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        isUploading={isUploading}
        usersExits={usersExits}
        selectedRole={selectedRole}
        setSelectedRole={setSelectedRole}
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
        title={t("editUserTitle")}
        subtitle={t("editUserSubtitle")}
        submitButtonText={t("updateUserButton")}
        isEdit={true}
        originalUsername={originalUsername}
        userId={userId}
        onResetPassword={handleResetPassword}
      />
    </>
  );
}

function userToFormData(user: any, role_id: number) {
  const formatDateForInput = (isoDate: string) => {
    if (!isoDate || isoDate === "0001-01-01") return "";
    try {
      const date = new Date(isoDate);
      return date.toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  console.log("User data for type_teacher:", {
    role_id,
    type_teacher_from_user: user.type_teacher,
    type_teacher_from_user_info: user.user_info?.type_teacher,
    user_info: user.user_info,
  });

  let typeTeacher = 0;
  if (role_id === 2) {
    typeTeacher = user.type_teacher || user.user_info?.type_teacher || 1;
  }

  return {
    name: user.name || "",
    username: user.username || "",
    code: user.code || "",
    identifier: user.identifier || "",
    email: user.email || "",
    phone_number: user.phone_number || "",
    address: user.address || "",
    password: "",
    role_id,
    province_code: user.user_info?.address?.province_code || "",
    district_code: user.user_info?.address?.district_code || "",
    school: user.user_info?.school?.id
      ? user.user_info.school.id.toString()
      : "",
    course:
      user.user_info?.courses?.length > 0
        ? user.user_info.courses.map((course: any) => course.id.toString())
        : [],
    class_name: user.user_info?.class?.id
      ? user.user_info.class.id.toString()
      : "",
    subject:
      Array.isArray(user.user_info?.subjects) && user.user_info.subjects[0]?.id
        ? user.user_info.subjects[0].id.toString()
        : "",
    type_teacher: typeTeacher,
    status: typeof user.status === "boolean" ? user.status : true,
    // certificate: user.user_info?.certificates?.[0]?.name || "",
    date_of_birth: formatDateForInput(user.date_of_birth),
    avatar: user.avatar || "",
  };
}
