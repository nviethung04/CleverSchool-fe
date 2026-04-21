"use client";
import { useTranslations } from "next-intl"
import { useRouter } from "@/lib/i18n/routing"
import { useEffect, useState, useCallback, ReactNode, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { GetDetailUser, DeleteUser, UpdateUser, CheckUsernameExists } from "@/lib/api/users";
import { GetSubjectsList } from "@/lib/api/subjects"
import { GetClassList } from "@/lib/api/classes"
import { GetProvince } from "@/lib/api/province"
import { GetWardList } from "@/lib/api/wards"
import { GetSchoolList } from "@/lib/api/schools";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"

const DetailRow = ({ label, value, className }: { label: string; value: ReactNode; className?: string }) => (
  <div className="flex flex-col sm:flex-row sm:items-start mb-3">
    <div className="w-40 text-gray-600 font-medium shrink-0">{label}:</div>
    <div className={`flex-1 ${className || 'break-words'}`}>{value}</div>
  </div>
);

/** Sắp xếp tên lớp theo phần sau " - ": ưu tiên số (1, 2, 3...), rồi phần còn lại (1A4, 1Bb, 2Aa). */
function sortClassesByName(classes: any[]): any[] {
  const getSortKey = (name: string): [number, string] => {
    const suffix = (name || "").includes(" - ") ? (name || "").split(" - ")[1]?.trim() ?? name : name;
    const match = suffix.match(/^(\d+)(.*)$/);
    const num = match ? parseInt(match[1], 10) : 0;
    const rest = (match ? match[2] : suffix) ?? "";
    return [num, rest];
  };
  return [...classes].sort((a, b) => {
    const [numA, restA] = getSortKey(a?.name ?? "");
    const [numB, restB] = getSortKey(b?.name ?? "");
    if (numA !== numB) return numA - numB;
    return String(restA).localeCompare(String(restB), undefined, { sensitivity: "base" });
  });
}

export default function UserDetailPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const returnTab = searchParams.get("returnTab");
  const router = useRouter();
  const t = useTranslations("users");
  const [isUploading, setIsUploading] = useState(false)
  const [user, setUser] = useState<any>(null);
  const [usersExits, setUsersExits] = useState(false);
  const [originalUsername, setOriginalUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false)
  const [validationErrors, setValidationErrors] = useState({
    name: false,
    username: false,
    phone_number: false,
    school: false
  });
  const [provinces, setProvinces] = useState([])
  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);
  const [wards, setWards] = useState([])
  const [schools, setSchools] = useState([])
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([])
  const [selectedProvinceCode, setSelectedProvinceCode] = useState("")
  const [selectedWardCode, setSelectedWardCode] = useState("")
  const [selectedSchool, setSelectedSchool] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    code: "",
    identifier: "",
    email: "",
    phone_number: "",
    address: "",
    avatar: "",
    role_id: "3", // Default to student
    province_code: "",
    ward_code: "",
    school: "",
    teacher_school_ids: [] as string[],
    teacher_school_class_ids: {} as Record<string, string[]>,
    course: [] as string[],
    subject: "",
    class_name: "",
    certificate: "",
    status: true,
    type_teacher: 0, // Mặc định là 0 (không phải giáo viên)
  })

  useEffect(() => {
    if (showAddUserDialog) {
      fetchProvinces()
    }
  }, [showAddUserDialog])

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const result = await GetSubjectsList();
        setSubjects(result.data.subjects);
      } catch (err) {
      }
    };
    fetchSubjects();
  }, []);

  const checkUsernameExists = useCallback(async (username: string) => {
    try {
      console.log("Kiểm tra tài khoản:", username);
      const result = await CheckUsernameExists(username);
      setUsersExits(result.data?.exits === true);
      console.log("Kết quả kiểm tra tài khoản:", result.data);
    } catch (error) {
      setUsersExits(false);
      console.error("Lỗi khi kiểm tra tài khoản đã tồn tại:", error);
    }
  }, []);

  const validateField = useCallback((fieldName: string, value: string) => {
    let hasError = false;

    switch (fieldName) {
      case 'name':
      case 'username':
      case 'phone_number':
        hasError = !value.trim();
        break;
      case 'school':
        hasError = formData.role_id === "4" && !value.trim();
        break;
      default:
        break;
    }

    setValidationErrors(prev => ({
      ...prev,
      [fieldName]: hasError
    }));

    return !hasError;
  }, [formData.role_id]);

  const validateAllRequiredFields = useMemo(() => {
    // Check validation without triggering side effects
    const nameValid = formData.name.trim() !== '';
    const usernameValid = formData.username.trim() !== '';
    const phoneValid = formData.phone_number.trim() !== '';
    const schoolValid = formData.role_id !== "4" || formData.school.trim() !== '';

    return nameValid && usernameValid && phoneValid && schoolValid && !usersExits;
  }, [formData.name, formData.username, formData.phone_number, formData.school, formData.role_id, usersExits]);

  const fetchProvinces = useCallback(async () => {
    try {
      const result = await GetProvince()
      setProvinces(result.data.provinces || [])
    } catch (error) {
      console.error("Lỗi khi lấy danh sách tỉnh:", error)
    }
  }, []);

  const fetchWards = useCallback(async (provinceCode: string) => {
    try {
      const result = await GetWardList(provinceCode)
      setWards(result.data.wards || [])
    } catch (error) {
      console.error("Lỗi khi lấy danh sách phường/xã:", error)
    }
  }, []);

  const fetchSchools = useCallback(async (wardCode: string) => {
    try {
      const result = await GetSchoolList({ ward_code: wardCode })
      setSchools(result.data.schools || [])
    } catch (error) {
      console.error("Lỗi khi lấy danh sách trường:", error)
    }
  }, []);

  const fetchClasses = useCallback(async (schoolCode: string) => {
    try {
      const result = await GetClassList(schoolCode)
      setClasses(result.data.classes || [])
    } catch (error) {
      console.error("Lỗi khi lấy danh sách khóa học:", error)
    }
  }, []);

  const handleDeleteUser = async (userId: string) => {
    if (!confirm(t('confirmDelete'))) return
    try {
      await DeleteUser(userId)
      await new Promise(resolve => setTimeout(resolve, 500))
      if (returnTab) {
        router.push(`/admin/users/list?tab=${returnTab}`)
      } else {
        router.push("/admin/users/list")
      }
    } catch (err) {
      console.error("Xóa người dùng thất bại", err)
    }
  }

  const handleUpdateUser = async () => {
    // Validate required fields
    if (!formData.name.trim()) {
      alert(t('fullNameRequired') || 'Tên là bắt buộc');
      return;
    }
    if (!formData.username.trim()) {
      alert(t('usernameRequired') || 'Tên đăng nhập là bắt buộc');
      return;
    }
    if (!formData.phone_number.trim()) {
      alert(t('phoneNumberRequired') || 'Số điện thoại là bắt buộc');
      return;
    }

    // Validate school field for role_id = 4 (schools)
    if (formData.role_id === "4" && !formData.school.trim()) {
      alert(t('schoolRequired') || 'Trường học là bắt buộc');
      return;
    }

    // Check if username exists (excluding current user)
    if (usersExits) {
      alert(t('accountExists') || 'Tài khoản đã tồn tại');
      return;
    }

    if (formData.email && !isValidEmail(formData.email)) {
      alert(t('invalidEmail'));
      return;
    }
    if (formData.phone_number && !isValidPhoneNumber(formData.phone_number)) {
      alert(t('invalidPhone'));
      return;
    }
    try {
      setIsUploading(true);
      const payload = buildUserPayload(formData, user);
      await UpdateUser(user.id, payload)
      alert(t('updateSuccess'));
      setShowAddUserDialog(false)

      const result = await GetDetailUser(user.id);
      setUser(result.data);
    } catch (err) {
      console.error("Cập nhật người dùng thất bại", err)
      alert(t('updateFailed'));
    } finally {
      setIsUploading(false);
    }
  }

  const onEdit = async (user: any) => {
    const formData = userToFormData(user);
    console.log("Form data to edit:", formData);
    setFormData(formData);
    setOriginalUsername(formData.username);
    setShowAddUserDialog(true);

    setSelectedProvinceCode(formData.province_code);
    await fetchWards(formData.province_code);
    setSelectedWardCode(formData.ward_code);
    await fetchSchools(formData.ward_code);
    setSelectedSchool(formData.school);
    await fetchClasses(formData.school)
  };

  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      try {
        const result = await GetDetailUser(id as string);
        setUser(result.data);
      } catch (err) {
        setUser(null);
      }
      setLoading(false);
    }
    fetchUser();
  }, [id]);

  console.log("User data:", user);

  const renderStatusBadge = (status: boolean) => (
    <Badge variant={status ? "default" : "destructive"}>
      {status ? t('statusActive') : t('statusInactive')}
    </Badge>
  );

  if (loading) return <div className="p-8 text-center text-lg text-gray-600">{t('loadingUserData')}</div>;
  if (!user) return <div className="p-8 text-center text-lg text-gray-500">{t('userNotFound')}</div>;

  return (
    <div className="min-h-screen py-4 sm:py-8 px-2 sm:px-6 lg:px-8">
      <div className="max-w-full mx-auto">
        <Card className="shadow-lg rounded-xl border-0">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl border-b border-blue-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                <div className="relative">
                  <img
                    src={user.avatar || "/avatar-kid.png"}
                    alt="Avatar"
                    className="w-16 h-16 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-xl sm:text-2xl font-bold text-gray-800">{user.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs sm:text-sm bg-blue-100 text-blue-800 border-blue-300">
                      {user.user_info?.role?.name || ""}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                <Button variant="outline" onClick={() => router.back()} className="w-full sm:w-auto text-sm">
                  {t('backButton')}
                </Button>
                {/* <Button variant="default" onClick={() => onEdit(user)} className="w-full sm:w-auto text-sm bg-blue-500 hover:bg-blue-600">
                  {t('updateButton')}
                </Button> */}
                <Button variant="destructive" onClick={() => handleDeleteUser(user.id)} className="w-full sm:w-auto text-sm">
                  {t('deleteUserButton')}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  {t('basicInfo')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                  <DetailRow label={t('fullName')} value={user.name} />
                  <DetailRow label={t('username')} value={user.username} />
                  <DetailRow label="Email" value={user.email || ""} className="break-all" />
                  <DetailRow label={t('phoneNumber')} value={user.phone_number || ""} />
                  <DetailRow label={t('status')} value={renderStatusBadge(user.status)} />
                  <DetailRow label={t('detailAddress')} value={user.address || ""} />
                  <DetailRow label={t('role')} value={user.user_info?.role?.name || ""} />
                  {user.code && (
                    <DetailRow label={t("code")} value={user.code} />
                  )}

                  {user.identifier && (
                    <DetailRow label={t("identifier")} value={user.identifier} />
                  )}
                </div>
              </div>

              {(String(user.role_id) === "1" || String(user.role_id) === "2") && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                      </svg>
                    </div>
                    {t('workInfo')}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    {(String(user.role_id) === "2" || user.role_id === 2) && (
                      <>
                        <DetailRow label={t('subject')} value={user.user_info?.subjects?.[0]?.name || ""} />
                        <DetailRow
                          label={t('teacherType')}
                          value={
                            user.type_teacher === 1 ? "Giáo viên Việt Nam" :
                              user.type_teacher === 2 ? "Giáo viên nước ngoài" : ""
                          }
                        />
                      </>
                    )}
                    <DetailRow
                      label={t('position')}
                      value={
                        user.user_info?.positions?.length
                          ? user.user_info.positions.map((pos: any) => pos.name).join(", ")
                          : t('noPosition')
                      }
                    />
                    <DetailRow
                      label={t('department')}
                      value={
                        user.user_info?.departments?.length
                          ? user.user_info.departments.map((dep: any) => dep.name).join(", ")
                          : t('noDepartment')
                      }
                    />
                  </div>
                </div>
              )}

              {/* Thông tin chi tiết về trường học, lớp học và khóa học của giáo viên */}
              {(String(user.role_id) === "2" || user.role_id === 2) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    {t('teacherClassesAndCourses')}
                  </h3>

                  <div className="space-y-6">
                    {/* Danh sách trường (user_info.schools) */}
                    {user.user_info?.schools && user.user_info.schools.length > 0 && (
                      <div>
                        <h4 className="text-md font-medium text-gray-700 mb-2">{t('schoolField')}</h4>
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex flex-wrap gap-2">
                            {(() => {
                              const uniqueSchools = Array.from(
                                new Map(
                                  (user.user_info.schools as any[]).map((s: any) => [String(s?.id), s])
                                ).values()
                              );
                              return uniqueSchools.map((s: any) => (
                                <Badge key={s?.id} variant="secondary" className="text-sm py-1 px-2">
                                  {s?.name ?? s?.school_name ?? ""}
                                </Badge>
                              ));
                            })()}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Danh sách lớp theo trường (user_info.classes) */}
                    {user.user_info?.classes && user.user_info.classes.length > 0 && (
                      <div>
                        <h4 className="text-md font-medium text-gray-700 mb-2">{t('class')}</h4>
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {sortClassesByName(user.user_info.classes as any[]).map((cls: any, idx: number) => (
                              <div key={cls?.id ?? idx} className="bg-white rounded-lg p-3 border border-gray-200">
                                <span className="font-medium text-gray-800 block">{cls?.name ?? ""}</span>
                                {cls?.school?.name && (
                                  <span className="text-sm text-gray-600">({cls.school.name})</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Fallback: hiển thị school/class đơn nếu không có schools/classes */}
                    {(!user.user_info?.schools || user.user_info.schools.length === 0) &&
                     (!user.user_info?.classes || user.user_info.classes.length === 0) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                        {user.user_info?.school && (
                          <DetailRow label={t('schoolField')} value={user.user_info.school.name} />
                        )}
                        {user.user_info?.class && (
                          <DetailRow label={t('class')} value={user.user_info.class.name} />
                        )}
                      </div>
                    )}

                    {/* Danh sách khóa học */}
                    {user.user_info?.courses && user.user_info.courses.length > 0 && (
                      <div>
                        <h4 className="text-md font-medium text-gray-700 mb-3">Khóa học ({user.user_info.courses.length})</h4>
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="space-y-3">
                            {user.user_info.courses.map((course: any, idx: number) => (
                              <div key={idx} className="bg-white rounded-lg p-3 border border-gray-200">
                                <div className="font-medium text-gray-800">{course.name}</div>
                                {course.object_title && (
                                  <div className="text-sm text-gray-600 mt-1">{course.object_title}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Thông báo khi không có dữ liệu */}
                    {(!user.user_info?.schools || user.user_info.schools.length === 0) &&
                     (!user.user_info?.school && !user.user_info?.class) &&
                     (!user.user_info?.classes || user.user_info.classes.length === 0) &&
                     (!user.user_info?.courses || user.user_info.courses.length === 0) && (
                      <div className="text-center py-8 text-gray-600">
                        <p>{t('noTeacherCourses')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {String(user.role_id) === "3" && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    {t('studyInfo')}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    <DetailRow label={t('class')} value={user.user_info?.class?.name || ""} />
                    <DetailRow label={t('course')} value={user.user_info?.courses?.map((c: any) => c.name).join(", ") || ""} />
                  </div>
                </div>
              )}

              {String(user.role_id) === "4" && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 bg-indigo-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2-2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" />
                      </svg>
                    </div>
                    {t('school')}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    <DetailRow label={t('school')} value={user.user_info?.school?.name || ""} />
                    <DetailRow label={t('province')} value={user.user_info?.address?.province_name || ""} />
                    <DetailRow label={t('district')} value={user.user_info?.address?.district_name || ""} />
                  </div>
                </div>
              )}

              {(String(user.role_id) === "3" || String(user.role_id) === "2") && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <div className="w-6 h-6 bg-orange-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    {t('addressInfo')}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    <DetailRow label={t('province')} value={user.user_info?.address?.province_name || ""} />
                    <DetailRow label={t('ward')} value={user.user_info?.address?.ward_name || ""} />
                  </div>
                </div>
              )}
            </div>

            {/* Chứng chỉ và Bằng cấp */}
            {(user.user_info?.certificates?.length > 0 || user.user_info?.degrees?.length > 0) && (
              <div className="space-y-6">
                {/* Chứng chỉ */}
                {user.user_info?.certificates?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <div className="w-6 h-6 bg-yellow-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                      </div>
                      {t('certificates')}
                    </h3>
                    <div className="bg-gray-50 rounded-xl p-4 overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-blue-100 hover:bg-blue-100">
                            <TableHead className="font-semibold text-blue-800 text-sm">{t('certificateName')}</TableHead>
                            <TableHead className="font-semibold text-blue-800 text-sm">{t('issuedBy')}</TableHead>
                            <TableHead className="font-semibold text-blue-800 text-sm">{t('issuedDate')}</TableHead>
                            <TableHead className="font-semibold text-blue-800 text-sm">{t('status')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {user.user_info.certificates.map((c: any, idx: number) => (
                            <TableRow key={idx} className="hover:bg-white">
                              <TableCell className="font-medium text-sm">{c.name}</TableCell>
                              <TableCell className="text-sm">{c.issued_by}</TableCell>
                              <TableCell className="text-sm">{c.issued_date?.slice(0, 10)}</TableCell>
                              <TableCell className="text-sm">
                                <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                                  {c.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {/* Bằng cấp */}
                {user.user_info?.degrees?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <div className="w-6 h-6 bg-red-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                        </svg>
                      </div>
                      {t('degrees')}
                    </h3>
                    <div className="bg-gray-50 rounded-xl p-4 overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-blue-100 hover:bg-blue-100">
                            <TableHead className="font-semibold text-blue-800 text-sm">{t('degreeName')}</TableHead>
                            <TableHead className="font-semibold text-blue-800 text-sm">{t('major')}</TableHead>
                            <TableHead className="font-semibold text-blue-800 text-sm">{t('institution')}</TableHead>
                            <TableHead className="font-semibold text-blue-800 text-sm">{t('graduationYear')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {user.user_info.degrees.map((d: any, idx: number) => (
                            <TableRow key={idx} className="hover:bg-white">
                              <TableCell className="font-medium text-sm">{d.name}</TableCell>
                              <TableCell className="text-sm">{d.major}</TableCell>
                              <TableCell className="text-sm">{d.institution}</TableCell>
                              <TableCell className="text-sm">{d.graduation_year}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showAddUserDialog} onOpenChange={(open) => {
        setShowAddUserDialog(open)
        setOriginalUsername(formData.username)
        if (!open) {
          // Reset validation errors when dialog closes
          setValidationErrors({
            name: false,
            username: false,
            phone_number: false,
            school: false
          });
        }
      }}>
        <DialogContent className="w-[95vw] sm:w-[800px] max-w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-xl font-bold">{t('updateUserDialog')}</DialogTitle>
            <div className="flex items-center max-sm:justify-center space-x-4 mt-2">
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                {formData.role_id === "1"
                  ? "Admin"
                  : formData.role_id === "2"
                    ? "Giáo viên"
                    : formData.role_id === "3"
                      ? "Học sinh"
                      : formData.role_id === "4"
                        ? "Trường học"
                        : "Học sinh"}
              </Badge>
            </div>
            <DialogDescription className="text-gray-600">
              {t('updateUserDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <form className="space-y-4" onSubmit={(e) => {
              e.preventDefault();

              // Validate required fields before submission
              if (!formData.name.trim()) {
                alert(t('fullNameRequired') || 'Tên là bắt buộc');
                return;
              }
              if (!formData.username.trim()) {
                alert(t('usernameRequired') || 'Tên đăng nhập là bắt buộc');
                return;
              }
              if (!formData.phone_number.trim()) {
                alert(t('phoneNumberRequired') || 'Số điện thoại là bắt buộc');
                return;
              }

              // Validate school field for role_id = 4 (schools)
              if (formData.role_id === "4" && !formData.school.trim()) {
                alert(t('schoolRequired') || 'Trường học là bắt buộc');
                return;
              }

              // Check if username exists (excluding current user)
              if (usersExits) {
                alert(t('accountExists') || 'Tài khoản đã tồn tại');
                return;
              }

              handleUpdateUser();
            }}>
              <input type="hidden" value={formData.avatar || ""} readOnly />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium text-gray-700">{t('fullName')} <span className="text-red-500">*</span></label>
                  <Input
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      validateField('name', e.target.value);
                    }}
                    onBlur={(e) => validateField('name', e.target.value)}
                    placeholder="Tên người dùng"
                    required
                    className={`text-sm ${validationErrors.name ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                  {validationErrors.name && (
                    <p className="text-red-500 text-xs mt-1">{t('fullNameRequired') || 'Tên là bắt buộc'}</p>
                  )}
                </div>
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium text-gray-700">{t('username')} <span className="text-red-500">*</span></label>
                  <Input
                    value={formData.username}
                    onChange={(e) => {
                      setFormData({ ...formData, username: e.target.value });
                      setUsersExits(false);
                      validateField('username', e.target.value);
                    }}
                    onBlur={async (e) => {
                      validateField('username', e.target.value);
                      if (e.target.value !== originalUsername) {
                        if (e.target.value) {
                          await checkUsernameExists(e.target.value);
                        } else {
                          setUsersExits(false);
                        }
                      } else {
                        setUsersExits(false);
                      }
                    }}
                    placeholder="Tài khoản"
                    required
                    className={`text-sm ${validationErrors.username || usersExits ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                  {validationErrors.username && (
                    <p className="text-red-500 text-xs mt-1">{t('usernameRequired') || 'Tên đăng nhập là bắt buộc'}</p>
                  )}
                  {usersExits && (
                    <p className="text-red-500 text-xs mt-1">{t('accountExists')}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <Input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="Email" className="text-sm" />
                </div>
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium text-gray-700">{t('phoneNumber')} <span className="text-red-500">*</span></label>
                  <Input
                    value={formData.phone_number}
                    onChange={(e) => {
                      setFormData({ ...formData, phone_number: e.target.value });
                      validateField('phone_number', e.target.value);
                    }}
                    onBlur={(e) => validateField('phone_number', e.target.value)}
                    placeholder="Số điện thoại"
                    className={`text-sm ${validationErrors.phone_number ? 'border-red-500 focus:border-red-500' : ''}`}
                  />
                  {validationErrors.phone_number && (
                    <p className="text-red-500 text-xs mt-1">{t('phoneNumberRequired') || 'Số điện thoại là bắt buộc'}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium text-gray-700">{t('status')}</label>
                <Select
                  value={formData.status ? "active" : "inactive"}
                  onValueChange={value => setFormData({ ...formData, status: value === "active" })}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="selectStatus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t('active')}</SelectItem>
                    <SelectItem value="inactive">{t('inactive')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(formData.role_id === "2" || formData.role_id === "3" || formData.role_id === "4") && (
                <div className="space-y-4 pt-4 border-t">
                  {formData.role_id === "2" && (
                    <>
                      <div className="flex flex-col space-y-2">
                        <label className="text-sm font-medium text-gray-700">{t('selectSubject')}</label>
                        <Select
                          value={formData.subject}
                          onValueChange={(value) => setFormData({ ...formData, subject: value })}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder={t('selectSubject')} />
                          </SelectTrigger>
                          <SelectContent>
                            {subjects.map((subject) => (
                              <SelectItem key={subject.id} value={subject.id.toString()}>
                                {subject.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex flex-col space-y-2">
                        <label className="text-sm font-medium text-gray-700">{t('teacherType')}</label>
                        <Select
                          value={formData.type_teacher ? formData.type_teacher.toString() : (formData.role_id === "2" ? "1" : "")}
                          onValueChange={(value) => setFormData({ ...formData, type_teacher: parseInt(value) })}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder={t('selectTeacherType')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Giáo viên Việt Nam</SelectItem>
                            <SelectItem value="2">Giáo viên nước ngoài</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                  {formData.role_id === "3" && (
                    <input
                      type="hidden"
                      value={Array.isArray(formData.course) ? formData.course.join(',') : ''}
                      readOnly
                    />
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-2">
                      <label className="text-sm font-medium text-gray-700">{t('selectProvince')}</label>
                      <Select
                        value={formData.province_code}
                        onValueChange={(value) => {
                          setSelectedProvinceCode(value);
                          setFormData({
                            ...formData,
                            province_code: value,
                            ward_code: "",
                            school: "",
                            class_name: "",
                          });
                          setSelectedWardCode("");
                          setSelectedSchool("");
                          setWards([]);
                          setSchools([]);
                          fetchWards(value);
                        }}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder={t('selectProvince')} />
                        </SelectTrigger>
                        <SelectContent>
                          {provinces.map((prov: any) => (
                            <SelectItem key={prov.code} value={prov.code}>
                              {prov.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedProvinceCode && (
                      <div className="flex flex-col space-y-2">
                        <label className="text-sm font-medium text-gray-700">{t('selectWard')}</label>
                        <Select
                          value={formData.ward_code}
                          onValueChange={(value) => {
                            setSelectedWardCode(value);
                            setFormData({
                              ...formData,
                              ward_code: value,
                              school: "",
                              class_name: "",
                            });
                            setSelectedSchool("");
                            setSchools([]);
                            setClasses([]);
                            fetchSchools(value);
                          }}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder={t('selectWard')} />
                          </SelectTrigger>
                          <SelectContent>
                            {wards.map((ward: any) => (
                              <SelectItem key={ward.code} value={ward.code}>
                                {ward.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {selectedWardCode && (
                    <div className="flex flex-col space-y-2">
                      <label className="text-sm font-medium text-gray-700">{t('selectSchool')} {formData.role_id === "4" && <span className="text-red-500">*</span>}</label>
                      <Select
                        value={formData.school?.toString() || ""}
                        onValueChange={async (value) => {
                          setSelectedSchool(value);
                          setFormData({
                            ...formData,
                            school: value,
                            class_name: "",
                          });
                          validateField('school', value);
                          setClasses([]);
                          await fetchClasses(value);
                        }}
                      >
                        <SelectTrigger className={`text-sm ${validationErrors.school ? 'border-red-500 focus:border-red-500' : ''}`}>
                          <SelectValue placeholder={t('selectSchool')} />
                        </SelectTrigger>
                        <SelectContent>
                          {schools.map((school: any) => (
                            <SelectItem key={school.id} value={school.id}>
                              {school.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {validationErrors.school && formData.role_id === "4" && (
                        <p className="text-red-500 text-xs mt-1">{t('schoolRequired') || 'Trường học là bắt buộc'}</p>
                      )}
                    </div>
                  )}

                  {selectedSchool && formData.role_id !== "4" && (
                    <div className="flex flex-col space-y-2">
                      <label className="text-sm font-medium text-gray-700">{t('selectClass')}</label>
                      <Select
                        value={formData.class_name?.toString() || ""}
                        onValueChange={(value) => setFormData({ ...formData, class_name: value })}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder={t('selectClass')} />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map((cls: any) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              <DialogFooter className="pt-4 border-t flex-col sm:flex-row gap-2">
                <Button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isUploading || !validateAllRequiredFields}
                >
                  {isUploading ? t('updating') : t('updateUserButton')}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddUserDialog(false)} className="w-full sm:w-auto">
                  {t('cancel')}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function buildUserPayload(formData: any, currentUser?: any) {
  console.log("Building payload from form data (detail page):", formData);

  const typeTeacherValue = Number(formData.role_id) === 2 ? (formData.type_teacher || 1) : 0;
  const isTeacher = Number(formData.role_id) === 2;

  const getSchoolName = (id: number | string) => {
    const list = currentUser?.user_info?.schools as any[] | undefined;
    if (!list?.length) return "";
    const s = list.find((x: any) => String(x?.id) === String(id));
    return s?.name ?? s?.school_name ?? "";
  };
  const getClassName = (id: number | string, schoolId?: number | string) => {
    const list = currentUser?.user_info?.classes as any[] | undefined;
    if (!list?.length) return "";
    const c = list.find((x: any) => String(x?.id) === String(id));
    return c?.name ?? "";
  };

  let payloadSchools: { id: number; name: string }[] = [];
  let payloadClasses: { id: number; name: string; school: { id: number; name: string } }[] = [];

  if (isTeacher && Array.isArray(formData.teacher_school_ids) && formData.teacher_school_ids.length > 0) {
    payloadSchools = formData.teacher_school_ids.map((schoolId: string) => ({
      id: Number(schoolId),
      name: getSchoolName(schoolId),
    }));
    const classIdsBySchool = formData.teacher_school_class_ids || {};
    for (const schoolId of formData.teacher_school_ids) {
      const schoolName = getSchoolName(schoolId);
      const classIds = classIdsBySchool[schoolId] || [];
      for (const classId of classIds) {
        payloadClasses.push({
          id: Number(classId),
          name: getClassName(classId),
          school: { id: Number(schoolId), name: schoolName },
        });
      }
    }
  } else {
    if (formData.school) {
      payloadSchools = [{ id: Number(formData.school), name: getSchoolName(formData.school) }];
    }
    if (formData.class_name) {
      const schoolId = formData.school || 0;
      payloadClasses = [{
        id: Number(formData.class_name),
        name: getClassName(formData.class_name),
        school: { id: Number(schoolId), name: getSchoolName(schoolId) },
      }];
    }
  }

  const payload = {
    parent_id: 0,
    role_id: Number(formData.role_id),
    type_teacher: typeTeacherValue,
    username: formData.username || "",
    ...(formData.password && { password: formData.password }),
    name: formData.name || "",
    code: formData.code || "",
    identifier: formData.identifier || "",
    address: formData.address || "",
    email: formData.email || "",
    phone_number: formData.phone_number || "",
    avatar: formData.avatar || "",
    status: formData.status,
    user_info: {
      school: payloadSchools[0] ? { id: payloadSchools[0].id } : { id: 0 },
      class: payloadClasses[0] ? { id: payloadClasses[0].id } : { id: 0 },
      courses: Array.isArray(formData.course)
        ? formData.course.map((courseId: string) => ({ id: Number(courseId) }))
        : formData.course ? [{ id: Number(formData.course) }] : [],
      subjects: formData.subject ? [{ id: Number(formData.subject) }] : [],
      type_teacher: typeTeacherValue,
      address: {
        id: 0,
        province_code: formData.province_code || "",
        ward_code: formData.ward_code || "",
        province_name: "",
        district_name: "",
        ward_name: "",
        address: formData.address || "",
      },
      role: {
        id: Number(formData.role_id),
        name:
          Number(formData.role_id) === 1 ? "admin"
            : Number(formData.role_id) === 2 ? "teacher"
              : formData.role_id === 3 ? "student"
                : formData.role_id === 4 ? "school" : "student",
      },
      certificates: [],
      degrees: [],
      departments: [],
      positions: [],
      schools: payloadSchools,
      classes: payloadClasses,
    },
  };

  console.log("Final payload built:", payload);
  return payload;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhoneNumber(phone: string) {
  return /^(0\d{9}|(\+84)\d{9})$/.test(phone);
}

function userToFormData(user: any) {
  const roleId = user.role_id ? Number(user.role_id) : 3;
  const isTeacher = roleId === 2;

  let teacher_school_ids: string[] = [];
  let teacher_school_class_ids: Record<string, string[]> = {};
  if (isTeacher && user.user_info?.schools?.length) {
    teacher_school_ids = [...new Set((user.user_info.schools as any[]).map((s: any) => String(s?.id ?? s)))] as string[];
    if (user.user_info?.classes?.length) {
      for (const cls of user.user_info.classes as any[]) {
        const schoolId = cls?.school?.id != null ? String(cls.school.id) : "";
        if (!schoolId) continue;
        if (!teacher_school_class_ids[schoolId]) teacher_school_class_ids[schoolId] = [];
        if (cls?.id != null) teacher_school_class_ids[schoolId].push(String(cls.id));
      }
    }
  }

  return {
    name: user.name || "",
    username: user.username || "",
    email: user.email || "",
    code: user.code || "",
    identifier: user.identifier || "",
    phone_number: user.phone_number || "",
    address: user.address || "",
    avatar: user.avatar || "",
    password: "",
    role_id: user.role_id ? String(user.role_id) : "3",
    province_code: user.user_info?.address?.province_code || "",
    ward_code: user.user_info?.address?.ward_code || "",
    school: isTeacher ? "" : (user.user_info?.school?.id ? user.user_info.school.id.toString() : ""),
    teacher_school_ids,
    teacher_school_class_ids,
    course: user.user_info?.courses?.length > 0
      ? user.user_info.courses.map((course: any) => course.id.toString())
      : [],
    class_name: isTeacher ? "" : (user.user_info?.class?.id ? user.user_info.class.id.toString() : ""),
    subject: Array.isArray(user.user_info?.subjects) && user.user_info.subjects[0]?.id
      ? user.user_info.subjects[0].id.toString()
      : "",
    certificate: user.user_info?.certificates?.[0]?.name || "",
    status: typeof user.status === "boolean" ? user.status : true,
    type_teacher: user.type_teacher || user.user_info?.type_teacher || 0,
  };
}