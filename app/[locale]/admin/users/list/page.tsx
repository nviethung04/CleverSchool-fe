"use client";
import { useRouter } from "@/lib/i18n/routing";
import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@radix-ui/react-avatar";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { DeleteUser, GetUserListAdvanced } from "@/lib/api/users";
import { getListSchool, getListCourse } from "@/lib/api/dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, Search, Edit, Trash2, MoreHorizontal, FileText } from "lucide-react";

import { GetClassList } from "@/lib/api/classes";
import { LucideFilter } from "lucide-react";
import ExportData from "@/components/ui/export-data";
import ImportData from "@/components/ui/import-data";
import { exportUser, importUser } from "@/lib/api/export-import";
import { useQueryString } from "@/hooks/use-query-string";
import { sortAlphabetGeneric, sortByNumberAndAlphabetFromSecondGeneric } from "@/lib/utils";
import { useAuth } from "@/lib/context/auth-context";
import { HIDDEN_USER_LIST_TABS } from "@/config/hiddenModules";

const USER_LIST_TABS = ["students", "teachers", "admins", "schools"] as const;
const VISIBLE_USER_LIST_TABS = USER_LIST_TABS.filter(
  (tab) => !HIDDEN_USER_LIST_TABS.includes(tab)
);

const roleMap: { [key: string]: number } = {
  students: 3,
  teachers: 2,
  admins: 1,
  schools: 4,
};

export default function UserListPage() {
  const { user } = useAuth()
  const { setQueryParams, getValueFromQueryString, clearManyQueryString, searchParamsUrl } = useQueryString()
  const t = useTranslations("admin");
  const u = useTranslations("users");
  const s = useTranslations("schools");
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
    const [users, setUsers] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [allSchools, setAllSchools] = useState<
    {
      id: string;
      school_name: string;
      school_short_name: string;
      ward_name: string;
      province_name: string;
    }[]>([]);
  const [selectedTypeSchool, setSelectedTypeSchool] = useState("all");
  const [selectedTypeCourse, setSelectedTypeCourse] = useState("all");
  const [selectedTypeClass, setSelectedTypeClass] = useState("");
  const [selectedTypeKeyword, setSelectedTypeKeyword] = useState("");
  const [selectedTypeProvince, setSelectedTypeProvince] = useState("");
  const [selectedTypeWard, setSelectedTypeWard] = useState("");
  const [selectedTypeStatus, setSelectedTypeStatus] = useState("");
  const [filterSchoolList, setFilterSchoolList] = useState<any[]>([]);
  const [filterCourseList, setFilterCourseList] = useState<any[]>([]);
  const [filterClassList, setFilterClassList] = useState<any[]>([]);
  const [isSchoolPopoverOpenDesktop, setIsSchoolPopoverOpenDesktop] =
    useState(false);
  const [isSchoolPopoverOpenMobile, setIsSchoolPopoverOpenMobile] =
    useState(false);
  const [isTabChanging, setIsTabChanging] = useState(false);
  const isTabClickedRef = useRef(false);

  const getInitialTab = () => {
    const tabFromUrl = getValueFromQueryString("tab");
    if (
      tabFromUrl &&
      VISIBLE_USER_LIST_TABS.includes(tabFromUrl)
    ) {
      return tabFromUrl;
    }
    return "students";
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  useEffect(() => {
    if (HIDDEN_USER_LIST_TABS.includes(activeTab)) {
      setActiveTab("students");
      setQueryParams({ tab: "students" });
    }
  }, [activeTab, setQueryParams]);

  useEffect(() => {
    fetchAllSchools();
    fetchCourseList();
  }, []);

  const handleClearFilters = () => {
    // Reset tất cả filters
    setSelectedTypeProvince("");
    setSelectedTypeWard("");
    setSelectedTypeStatus("");
    setSelectedTypeSchool("all");
    setFilterSchoolList(allSchools);
    setSelectedTypeCourse("all");
    setSelectedTypeClass("");
    setFilterClassList([]);
    setSelectedTypeKeyword("");
    setCurrentPage(1);
  };

  const fetchAllSchools = async () => {
    try {
      const result = await getListSchool();
      setAllSchools(result.data.schools || []);
      setFilterSchoolList(result.data.schools || []);
    } catch (error) {
      setAllSchools([]);
      setFilterSchoolList([]);
    }
  };

  const fetchCourseList = async () => {
    try {
      const result = await getListCourse();
      setFilterCourseList(result.data.courses || []);
    } catch (error) {
      setFilterCourseList([]);
    }
  };

  const fetchFilteredUsers = async (
    extraParams = {},
    page: number = 1,
    perPage: number = itemsPerPage
  ) => {
    const role_id = roleMap[activeTab];

    const baseParams: any = {
      role_id,
      page,
      per_page: perPage,
      ...extraParams,
    };

    // Add keyword and status if not overridden by extraParams
    if (!("keyword" in extraParams) && selectedTypeKeyword) {
      baseParams.keyword = selectedTypeKeyword;
    }
    if (
      !("status" in extraParams) &&
      selectedTypeStatus &&
      selectedTypeStatus !== "all"
    ) {
      baseParams.status = selectedTypeStatus === "true";
    }

    // Smart filtering for location hierarchy - only if not overridden by extraParams
    if (role_id === 3 || role_id === 2 || role_id === 4) {
      // Priority: School > Ward > Province (most specific to least specific)
      if (
        !("school_id" in extraParams) &&
        !("ward_code" in extraParams) &&
        !("province_code" in extraParams)
      ) {
        if (selectedTypeSchool && selectedTypeSchool !== "all") {
          baseParams.school_id = selectedTypeSchool;
        } else if (selectedTypeWard && selectedTypeWard !== "all") {
          baseParams.ward_code = selectedTypeWard;
        } else if (selectedTypeProvince && selectedTypeProvince !== "all") {
          baseParams.province_code = selectedTypeProvince;
        }
      }
    }

    // Add course and class filters for students
    if (role_id === 3) {
      if (
        !("course_id" in extraParams) &&
        selectedTypeCourse &&
        selectedTypeCourse !== "all"
      ) {
        baseParams.course_id = selectedTypeCourse;
      }
      if (
        !("class_id" in extraParams) &&
        selectedTypeClass &&
        selectedTypeClass !== "all"
      ) {
        baseParams.class_id = selectedTypeClass;
      }
    }

    // Build final params based on role
    let params: any = { role_id, page, per_page: perPage };
    if (role_id === 3) {
      // Students: include all filters
      params = { ...baseParams };
    } else if (role_id === 2) {
      // Teachers: specific filters only
      const keys = [
        "role_id",
        "province_code",
        "ward_code",
        "school_id",
        "keyword",
        "status",
        "page",
        "per_page",
      ];
      for (const key of keys) {
        if (key in baseParams && baseParams[key] !== "") {
          params[key] = baseParams[key];
        }
      }
    } else if (role_id === 4) {
      // Schools: specific filters only
      const keys = [
        "role_id",
        "province_code",
        "ward_code",
        "school_id",
        "keyword",
        "status",
        "page",
        "per_page",
      ];
      for (const key of keys) {
        if (key in baseParams && baseParams[key] !== "") {
          params[key] = baseParams[key];
        }
      }
    } else if (role_id === 1) {
      // Admins: minimal filters
      const keys = ["role_id", "status", "keyword", "page", "per_page"];
      for (const key of keys) {
        if (key in baseParams && baseParams[key] !== "") {
          params[key] = baseParams[key];
        }
      }
    }

    try {
      setLoading(true);
      const res = await GetUserListAdvanced(params);

      const users = res.data?.users || res.users || [];

      // Sử dụng total_count từ API response
      const totalCount = parseInt(res.data?.total_count || "0");
      const total = totalCount;
      const totalPages = Math.ceil(total / perPage);

      setUsers(users);
      setTotalUsers(total);
      setTotalPages(totalPages);
    } catch (error) {
      setUsers([]);
      setTotalUsers(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm(u("confirmDelete"))) return;
    try {
      await DeleteUser(userId);
      await new Promise((resolve) => setTimeout(resolve, 500));
      await fetchFilteredUsers({}, currentPage);
    } catch (err) {
      // 
    }
  };

  const handleSelectTypeStatus = async (status: string) => {
    setSelectedTypeStatus(status);
    setQueryParams({status})
    setCurrentPage(1);
  };

  const handleSelectTypeKeyword = (keyword: string) => {
    setSelectedTypeKeyword(keyword);
    setCurrentPage(1);
  };

  const handleSelectTypeSchool = async (schoolId: string) => {
    setSelectedTypeSchool(schoolId);
    setSelectedTypeClass("");
    setQueryParams({schoolId, classId: ""})
    setCurrentPage(1);

    if (schoolId === "all" || schoolId === "") {
      // When selecting "All schools", get all courses and clear class list
      try {
        const courseRes = await getListCourse();
        setFilterCourseList(courseRes.data.courses || []);
      } catch (error) {
        setFilterCourseList([]);
      }
      setFilterClassList([]);
      return;
    }

    const selectedSchool = allSchools.find((s) => s.id === schoolId);
    if (selectedSchool) {
      // Since we removed province/ward filtering, show all schools
      setFilterSchoolList(allSchools);

      // Get all courses (not filtered by school)
      try {
        const courseRes = await getListCourse();
        setFilterCourseList(courseRes.data.courses || []);
      } catch (error) {
        setFilterCourseList([]);
      }

      // Get classes for the selected school
      try {
        const classRes = await GetClassList(schoolId);
        setFilterClassList(classRes.data.classes || []);
      } catch (error) {
        setFilterClassList([]);
      }
    }
  };

  const handleSelectTypeCourse = async (courseId: string) => {
    setSelectedTypeCourse(courseId);
    setQueryParams({courseId})
    setCurrentPage(1);
  };

  const handleSelectTypeClass = async (classId: string) => {
    setSelectedTypeClass(classId);
    setQueryParams({classId})
    setCurrentPage(1);
  };

  const handlePageChange = async (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) {
      return;
    }
    setCurrentPage(newPage);
  };

  useEffect(() => {
    if (getValueFromQueryString('courseId')) {
      setSelectedTypeCourse(getValueFromQueryString('courseId') as string);
    }
    if (getValueFromQueryString('classId')) {
      setSelectedTypeClass(getValueFromQueryString('classId') as string);
    }
    if (getValueFromQueryString('schoolId')) {
      setSelectedTypeSchool(getValueFromQueryString('schoolId') as string);
    }
    const tabFromUrl = getValueFromQueryString("tab");
    if (
      tabFromUrl &&
      tabFromUrl !== activeTab &&
      VISIBLE_USER_LIST_TABS.includes(tabFromUrl)
    ) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParamsUrl])

  useEffect(() => {
    if (isTabClickedRef.current) {
      handleClearFilters()
      clearManyQueryString(["schoolId", "courseId", "classId", "status"])
      isTabClickedRef.current = false;
      return;
    }

    (async () => {
      await fetchFilteredUsers(
        {
          school_id: getValueFromQueryString('schoolId') || '',
          course_id: getValueFromQueryString('courseId') || '',
          class_id: getValueFromQueryString('classId') || '',
          status: getValueFromQueryString('status') || ''
        },
        currentPage
      )
    })()
  }, [activeTab, searchParamsUrl, currentPage, selectedTypeKeyword])

  // auto select school when user type = school
  const schoolAutoSelectedRef = useRef(false);
  useEffect(() => {
    if (
      schoolAutoSelectedRef.current ||
      user?.sub_type !== "school" ||
      selectedTypeSchool !== "all" ||
      filterSchoolList.length === 0
    ) return;

    const first = filterSchoolList.find(s => s.value !== "all-school");
    if (first) {
      schoolAutoSelectedRef.current = true;
      handleSelectTypeSchool(first.id.toString());
    }
  }, [filterSchoolList, user?.sub_type, selectedTypeSchool]);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="w-full sm:w-auto ml-8 sm:ml-0">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {t("listUsers")}
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            {t("manageUsersDescription")}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto flex-wrap">
          {/* Button Xuất PDF - hiện khi đã chọn trường */}
          {selectedTypeSchool && selectedTypeSchool !== "all" && (
            <div className="flex gap-2">
              {/* Xuất PDF tất cả lớp trong trường */}
              <Button
                className="bg-orange-600 hover:bg-orange-700 text-white w-full sm:w-auto flex-shrink-0"
                onClick={async () => {
                  try {
                    const { exportAllClassesPDF } = await import('@/lib/utils/pdfExport');
                    const result = await exportAllClassesPDF({
                      school_id: selectedTypeSchool,
                      role_id: 3,
                      school_name: allSchools.find(s => s.id === selectedTypeSchool)?.school_name || 'school',
                    });
                  } catch (error: any) {
                    alert(error.message || "Có lỗi xảy ra khi tạo PDF. Vui lòng thử lại!");
                  }
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Tải danh sách học sinh</span>
                <span className="sm:hidden">ZIP</span>
              </Button>
            </div>
          )}
          <ExportData
            onExport={async () => {
              try {
                const role_id = roleMap[activeTab];
                const params: any = { role_id };

                // Chỉ thêm các tham số có giá trị hợp lệ
                if (selectedTypeSchool && selectedTypeSchool !== "all") {
                  params.school_id = parseInt(selectedTypeSchool);
                }
                if (selectedTypeClass && selectedTypeClass !== "all") {
                  params.class_id = parseInt(selectedTypeClass);
                }
                if (selectedTypeCourse && selectedTypeCourse !== "all") {
                  params.course_id = parseInt(selectedTypeCourse);
                }
                if (selectedTypeKeyword && selectedTypeKeyword.trim()) {
                  params.keyword = selectedTypeKeyword.trim();
                }
                // begin_at và end_at để trống, không truyền nếu không cần

                const response = await exportUser(params);

                // Lấy URL từ response và download file
                if (response.data && response.data.url) {
                  const link = document.createElement("a");
                  link.href = response.data.url;
                  link.download = `users_${activeTab}_${new Date().toISOString().split("T")[0]
                    }.xlsx`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }
              } catch (error) {
                alert("Export failed. Please try again.");
              }
            }}
            label="Xuất dữ liệu"
          />
          <ImportData
            onImport={async (file) => {
              try {
                const response = await importUser(file);
                if (response.code === 200) {
                  alert(response.data.message || "Import successful!");
                  // Refresh danh sách user sau khi import thành công
                  await fetchFilteredUsers({}, 1);
                } else {
                  alert(response.message || "Import failed");
                }
              } catch (error) {
                alert("Import failed. Please try again.");
              }
            }}
            accept={".csv,.xlsx"}
            label="Nhập dữ liệu"
          />
          <Button
            className="bg-blue-500 hover:bg-blue-600 w-full sm:w-auto flex-shrink-0"
            onClick={() => {
              const role_id = roleMap[activeTab];
              router.push(
                `/admin/users/list/create?role=${role_id}&returnTab=${activeTab}`
              );
            }}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">{t("addUser")}</span>
            <span className="sm:hidden">{u("addUserShort")}</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="block md:hidden">
            {/* <h2 className="text-lg font-semibold">Bộ lọc</h2> */}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            className="w-full"
            onValueChange={async (value) => {
              setIsTabChanging(true);
              setQueryParams({tab: value})
              isTabClickedRef.current = true;
              setCurrentPage(1);
              setTimeout(() => setIsTabChanging(false), 300);
            }}
          >
            <TabsList
              className="grid w-full mb-4"
              style={{
                gridTemplateColumns: `repeat(${VISIBLE_USER_LIST_TABS.length}, minmax(0, 1fr))`,
              }}
            >
              <TabsTrigger value="students" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">{t("studentRole")}</span>
                <span className="sm:hidden">{u("studentShort")}</span>
              </TabsTrigger>
              <TabsTrigger value="teachers" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">{t("teacherRole")}</span>
                <span className="sm:hidden">{u("teacherShort")}</span>
              </TabsTrigger>
              <TabsTrigger value="admins" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">{t("adminRole")}</span>
                <span className="sm:hidden">{u("adminShort")}</span>
              </TabsTrigger>
              {!HIDDEN_USER_LIST_TABS.includes("schools") && (
                <TabsTrigger value="schools" className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">{t("schoolRole")}</span>
                  <span className="sm:hidden">{u("schoolShort")}</span>
                </TabsTrigger>
              )}
            </TabsList>

            <div className="mt-6 flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  value={selectedTypeKeyword}
                  onChange={(e) => handleSelectTypeKeyword(e.target.value)}
                  placeholder={`${u("findUser")} ${activeTab === "students"
                    ? t("studentRole")
                    : activeTab === "teachers"
                      ? t("teacherRole")
                      : activeTab === "admins"
                        ? t("adminRole")
                        : t("schoolRole")
                    }...`}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="mb-6">
              <div className="hidden lg:flex flex-wrap gap-4 items-end">
                <Select
                  value={selectedTypeStatus}
                  onValueChange={handleSelectTypeStatus}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder={s("status")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{u("statusAll")}</SelectItem>
                    <SelectItem value="true">{u("statusActive")}</SelectItem>
                    <SelectItem value="false">{u("statusInactive")}</SelectItem>
                  </SelectContent>
                </Select>

                {(activeTab === "students" ||
                  activeTab === "teachers" ||
                  activeTab === "schools") && (
                    <>
                      {/* School filter - independent for all tabs */}

                      <Popover
                        open={isSchoolPopoverOpenDesktop}
                        onOpenChange={setIsSchoolPopoverOpenDesktop}
                      >
                        <PopoverTrigger asChild>
                          <div
                            className="w-40 h-10 border rounded-md px-3 text-sm flex items-center justify-between cursor-pointer hover:bg-accent/30"
                            role="button"
                          >
                            <span className="truncate">
                              {selectedTypeSchool === "all"
                                ? s("allSchools")
                                : (selectedTypeSchool &&
                                  (allSchools.find(
                                    (s) =>
                                      s.id.toString() === selectedTypeSchool
                                  )?.school_name ||
                                    filterSchoolList.find(
                                      (s) =>
                                        s.id.toString() === selectedTypeSchool
                                    )?.school_name)) ||
                                ""}
                            </span>
                            <span className="ml-2 text-muted-foreground">▾</span>
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-72">
                          <Command>
                            <CommandInput placeholder="Tìm trường..." />
                            <CommandEmpty>Không tìm thấy trường</CommandEmpty>
                            <CommandList>
                              <CommandGroup>
                                <CommandItem
                                  value="all"
                                  onSelect={() => {
                                    handleSelectTypeSchool("all");
                                    setIsSchoolPopoverOpenDesktop(false);
                                  }}
                                >
                                  {s("allSchools")}
                                </CommandItem>
                                {sortAlphabetGeneric(filterSchoolList, item => item.school_name, true).map((school: any) => (
                                  <CommandItem
                                    key={school.id}
                                    value={school.school_name}
                                    onSelect={() => {
                                      handleSelectTypeSchool(
                                        school.id.toString()
                                      );
                                      setIsSchoolPopoverOpenDesktop(false);
                                    }}
                                  >
                                    {school.school_name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </>
                  )}

                {activeTab === "students" && (
                  <>
                    <Select
                      value={selectedTypeCourse}
                      onValueChange={handleSelectTypeCourse}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{u("courseAll")}</SelectItem>
                        {sortByNumberAndAlphabetFromSecondGeneric(filterCourseList, (item: any) => item.name, true).map((course: any) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={selectedTypeClass}
                      onValueChange={handleSelectTypeClass}
                      disabled={!selectedTypeSchool}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder={s("classes")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{u("classAll")}</SelectItem>
                        {sortByNumberAndAlphabetFromSecondGeneric(filterClassList, item => item.name, true).map((meeting: any) => (
                          <SelectItem key={meeting.id} value={meeting.id}>
                            {meeting.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}

                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => {
                      handleClearFilters()
                      clearManyQueryString(["schoolId", "courseId", "classId", "status"])
                    }
                  }
                >
                  <LucideFilter className="h-4 w-4" />
                  {s("clearFilters")}
                </Button>
              </div>

              <div className="lg:hidden">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4">
                  <Select
                    value={selectedTypeStatus}
                    onValueChange={handleSelectTypeStatus}
                  >
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder={s("status")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{u("statusAll")}</SelectItem>
                      <SelectItem value="true">{u("statusActive")}</SelectItem>
                      <SelectItem value="false">
                        {u("statusInactive")}
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    className="w-full sm:w-auto flex items-center gap-2"
                    onClick={() => {
                        handleClearFilters()
                        clearManyQueryString(["schoolId", "courseId", "classId", "status"])
                      }
                    }
                  >
                    <LucideFilter className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {s("clearFilters")}
                    </span>
                    <span className="sm:hidden">Reset</span>
                  </Button>
                </div>

                {(activeTab === "students" ||
                  activeTab === "teachers" ||
                  activeTab === "schools") && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 mb-4">
                      {/* School filter - independent for all tabs */}

                      <Popover
                        open={isSchoolPopoverOpenMobile}
                        onOpenChange={setIsSchoolPopoverOpenMobile}
                      >
                        <PopoverTrigger asChild>
                          <div
                            className="w-full h-10 border rounded-md px-3 text-sm flex items-center justify-between cursor-pointer hover:bg-accent/30"
                            role="button"
                          >
                            <span className="truncate">
                              {selectedTypeSchool === "all"
                                ? s("allSchools")
                                : (selectedTypeSchool &&
                                  (allSchools.find(
                                    (s) =>
                                      s.id.toString() === selectedTypeSchool
                                  )?.school_name ||
                                    filterSchoolList.find(
                                      (s) =>
                                        s.id.toString() === selectedTypeSchool
                                    )?.school_name)) ||
                                ""}
                            </span>
                            <span className="ml-2 text-muted-foreground">▾</span>
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-72">
                          <Command>
                            <CommandInput placeholder="Tìm trường..." />
                            <CommandEmpty>Không tìm thấy trường</CommandEmpty>
                            <CommandList>
                              <CommandGroup>
                                <CommandItem
                                  value="all"
                                  onSelect={() => {
                                    handleSelectTypeSchool("all");
                                    setIsSchoolPopoverOpenMobile(false);
                                  }}
                                >
                                  {s("allSchools")}
                                </CommandItem>
                                {filterSchoolList.map((school: any) => (
                                  <CommandItem
                                    key={school.id}
                                    value={school.school_name}
                                    onSelect={() => {
                                      handleSelectTypeSchool(
                                        school.id.toString()
                                      );
                                      setIsSchoolPopoverOpenMobile(false);
                                    }}
                                  >
                                    {school.school_name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}

                {activeTab === "students" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                    <Select
                      value={selectedTypeCourse}
                      onValueChange={handleSelectTypeCourse}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{u("courseAll")}</SelectItem>
                        {filterCourseList.map((course: any) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={selectedTypeClass}
                      onValueChange={handleSelectTypeClass}
                      disabled={!selectedTypeSchool}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={s("classes")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{u("classAll")}</SelectItem>
                        {filterClassList.map((meeting: any) => (
                          <SelectItem key={meeting.id} value={meeting.id}>
                            {meeting.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            <TabsContent value="students">
              {isTabChanging || loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">
                    {u("loadingUsers")}
                  </span>
                </div>
              ) : (
                <UserTable
                  users={users}
                  userType="student"
                  onDelete={handleDeleteUser}
                  currentPage={currentPage}
                  itemsPerPage={itemsPerPage}
                  onEdit={(user) => {
                    router.push(
                      `/admin/users/list/edit/${user.id}?returnTab=${activeTab}`
                    );
                  }}
                  u={u}
                  activeTab={activeTab}
                />
              )}
            </TabsContent>

            <TabsContent value="teachers">
              {isTabChanging || loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">
                    {u("loadingUsers")}
                  </span>
                </div>
              ) : (
                <UserTable
                  users={users}
                  userType="teacher"
                  onDelete={handleDeleteUser}
                  currentPage={currentPage}
                  itemsPerPage={itemsPerPage}
                  onEdit={(user) => {
                    router.push(
                      `/admin/users/list/edit/${user.id}?returnTab=${activeTab}`
                    );
                  }}
                  u={u}
                  activeTab={activeTab}
                />
              )}
            </TabsContent>

            <TabsContent value="admins">
              {isTabChanging || loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">
                    {u("loadingUsers")}
                  </span>
                </div>
              ) : (
                <UserTable
                  users={users}
                  userType="admin"
                  onDelete={handleDeleteUser}
                  currentPage={currentPage}
                  itemsPerPage={itemsPerPage}
                  onEdit={(user) => {
                    router.push(
                      `/admin/users/list/edit/${user.id}?returnTab=${activeTab}`
                    );
                  }}
                  u={u}
                  activeTab={activeTab}
                />
              )}
            </TabsContent>

            {!HIDDEN_USER_LIST_TABS.includes("schools") && (
            <TabsContent value="schools">
              {isTabChanging || loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">
                    {u("loadingUsers")}
                  </span>
                </div>
              ) : (
                <UserTable
                  users={users}
                  userType="school"
                  onDelete={handleDeleteUser}
                  currentPage={currentPage}
                  itemsPerPage={itemsPerPage}
                  onEdit={(user) => {
                    router.push(
                      `/admin/users/list/edit/${user.id}?returnTab=${activeTab}`
                    );
                  }}
                  u={u}
                  activeTab={activeTab}
                />
              )}
            </TabsContent>
            )}
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col xl:flex-row items-center justify-between gap-4 pt-4">
          <div className="flex flex-col xl:flex-row items-center gap-4 order-2 xl:order-1">
            <div className="text-sm text-gray-500">
              {loading ? (
                <span>Đang tải...</span>
              ) : (
                u("pagination.displayRange", {
                  start:
                    totalUsers > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0,
                  end: Math.min(currentPage * itemsPerPage, totalUsers),
                  total: totalUsers,
                })
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span>Hiển thị:</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={async (value) => {
                  const newItemsPerPage = Number(value);
                  setItemsPerPage(newItemsPerPage);
                  setCurrentPage(1);

                  // Gọi API ngay với per_page mới và smart filtering
                  try {
                    setLoading(true);
                    const role_id = roleMap[activeTab];
                    const params: any = {
                      role_id,
                      page: 1,
                      per_page: newItemsPerPage,
                    };

                    // Add keyword and status filters
                    if (selectedTypeKeyword)
                      params.keyword = selectedTypeKeyword;
                    if (
                      selectedTypeStatus === "true" ||
                      selectedTypeStatus === "false"
                    )
                      params.status = selectedTypeStatus;

                    // Smart filtering for location hierarchy
                    if (role_id === 3 || role_id === 2 || role_id === 4) {
                      // Priority: School > Ward > Province (most specific to least specific)
                      if (selectedTypeSchool && selectedTypeSchool !== "all") {
                        params.school_id = selectedTypeSchool;
                      } else if (
                        selectedTypeWard &&
                        selectedTypeWard !== "all"
                      ) {
                        params.ward_code = selectedTypeWard;
                      } else if (
                        selectedTypeProvince &&
                        selectedTypeProvince !== "all"
                      ) {
                        params.province_code = selectedTypeProvince;
                      }
                    }

                    // Add course and class filters for students
                    if (role_id === 3) {
                      if (selectedTypeCourse && selectedTypeCourse !== "all")
                        params.course_id = selectedTypeCourse;
                      if (selectedTypeClass && selectedTypeClass !== "all")
                        params.class_id = selectedTypeClass;
                    }

                    const res = await GetUserListAdvanced(params);

                    const users = res.data?.users || res.users || [];

                    // Sử dụng total_count từ API response
                    const totalCount = parseInt(res.data?.total_count || "0");
                    const total = totalCount;
                    const totalPages = Math.ceil(total / newItemsPerPage);

                    setUsers(users);
                    setTotalUsers(total);
                    setTotalPages(totalPages);
                  } catch (error) {
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                <SelectTrigger className="w-16 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span>/ trang</span>
            </div>
          </div>
          <div className="flex items-center gap-2 order-1 sm:order-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1 || loading}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              <span className="hidden sm:inline">{u("previous")}</span>
              <span className="sm:hidden">‹</span>
            </Button>

            <div className="hidden sm:flex items-center gap-2">
              {(() => {
                const maxPagesToShow = 7;
                const halfRange = Math.floor(maxPagesToShow / 2);

                // Luôn hiển thị ít nhất một nút trang nếu có dữ liệu
                if (totalPages <= 1) {
                  return (
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-blue-500/10"
                      disabled={true}
                    >
                      1
                    </Button>
                  );
                }

                if (totalPages <= maxPagesToShow) {
                  // Hiển thị tất cả trang nếu ít hơn hoặc bằng maxPagesToShow
                  return [...Array(totalPages)].map((_, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className={
                        currentPage === index + 1 ? "bg-blue-500/10" : ""
                      }
                      onClick={() => handlePageChange(index + 1)}
                      disabled={loading}
                    >
                      {index + 1}
                    </Button>
                  ));
                } else {
                  // Hiển thị với ellipsis khi có quá nhiều trang
                  const pages = [];
                  let startPage = Math.max(1, currentPage - halfRange);
                  let endPage = Math.min(totalPages, currentPage + halfRange);

                  // Điều chỉnh để luôn hiển thị đủ maxPagesToShow trang
                  if (endPage - startPage + 1 < maxPagesToShow) {
                    if (startPage === 1) {
                      endPage = Math.min(
                        totalPages,
                        startPage + maxPagesToShow - 1
                      );
                    } else {
                      startPage = Math.max(1, endPage - maxPagesToShow + 1);
                    }
                  }

                  // Trang đầu
                  if (startPage > 1) {
                    pages.push(
                      <Button
                        key={1}
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(1)}
                        disabled={loading}
                      >
                        1
                      </Button>
                    );
                    if (startPage > 2) {
                      pages.push(
                        <span key="ellipsis1" className="px-2">
                          ...
                        </span>
                      );
                    }
                  }

                  // Các trang ở giữa
                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        className={currentPage === i ? "bg-blue-500/10" : ""}
                        onClick={() => handlePageChange(i)}
                        disabled={loading}
                      >
                        {i}
                      </Button>
                    );
                  }

                  // Trang cuối
                  if (endPage < totalPages) {
                    if (endPage < totalPages - 1) {
                      pages.push(
                        <span key="ellipsis2" className="px-2">
                          ...
                        </span>
                      );
                    }
                    pages.push(
                      <Button
                        key={totalPages}
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(totalPages)}
                        disabled={loading}
                      >
                        {totalPages}
                      </Button>
                    );
                  }

                  return pages;
                }
              })()}
            </div>

            <div className="sm:hidden flex items-center gap-2">
              <span className="text-sm font-medium px-2">
                {currentPage} / {totalPages}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages || loading}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              <span className="hidden sm:inline">{u("next")}</span>
              <span className="sm:hidden">›</span>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

function UserTable({
  users,
  onDelete,
  onEdit,
  userType,
  currentPage,
  itemsPerPage,
  u,
  activeTab,
}: {
  onDelete: (userId: string) => void;
  onEdit: (user: any) => void;
  users: any[];
  userType: "student" | "teacher" | "admin" | "school";
  currentPage: number;
  itemsPerPage: number;
  u: (key: string) => string;
  activeTab: string;
}) {
  const router = useRouter();
  const handleViewDetail = (userId: string) => {
    router.push(`/admin/users/detail/${userId}?returnTab=${activeTab}`);
  };

  return (
    <>
      <div className="hidden lg:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-2 py-3 text-center w-16">STT</TableHead>
              <TableHead className="px-2 py-3 text-center">
                {u("userName")}
              </TableHead>
              {/* <TableHead className="text-center">Email</TableHead> */}
              {userType === "student" && (
                <>
                  <TableHead className="text-center">{u("code")}</TableHead>
                  <TableHead className="text-center">{u("identifier")}</TableHead>
                  <TableHead className="text-center">
                    {u("schoolField")}
                  </TableHead>
                  <TableHead className="text-center">{u("class")}</TableHead>
                  <TableHead className="text-center">{u("course")}</TableHead>
                </>
              )}
              {userType === "teacher" && (
                <>
                  <TableHead className="text-center">{u("identifier")}</TableHead>
                  <TableHead className="text-center">
                    {u("schoolField")}
                  </TableHead>
                  <TableHead className="text-center">{u("subject")}</TableHead>
                </>
              )}
              {userType === "admin" && (
                <>
                  <TableHead className="text-center">{u("role")}</TableHead>
                  <TableHead className="text-center">
                    {u("phoneNumber")}
                  </TableHead>
                </>
              )}
              {userType === "school" && (
                <>
                  <TableHead className="text-center">{u("ward")}</TableHead>
                  <TableHead className="text-center">
                    {u("schoolField")}
                  </TableHead>
                  <TableHead className="text-center">
                    {u("phoneNumber")}
                  </TableHead>
                </>
              )}
              <TableHead className="text-center w-24">{u("status")}</TableHead>
              <TableHead className="text-center w-32">{u("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={
                    userType === "student"
                      ? 8
                      : userType === "teacher"
                        ? 7
                        : userType === "school"
                          ? 7
                          : 6
                  }
                  className="text-center py-8"
                >
                  {u("noUsers")}
                </TableCell>
              </TableRow>
            ) : (
              users.map((user, idx) => (
                <TableRow
                  key={
                    user.id &&
                      user.id !== undefined &&
                      user.id !== null &&
                      user.id !== ""
                      ? `user-${user.id}-${idx}`
                      : `temp-${idx}`
                  }
                >
                  <TableCell className="font-medium text-center">
                    {(currentPage - 1) * itemsPerPage + idx + 1}
                  </TableCell>
                  <TableCell className="font-medium text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={user.avatar || "/avatar-kid.png"}
                          alt={user.name}
                          className="rounded-full object-cover w-full h-full"
                        />
                        <AvatarFallback>
                          {user.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.username}</p>
                    </div>
                  </TableCell>
                  {/* <TableCell className="text-center">
                    {user.email || ""}
                  </TableCell> */}
                  {userType === "student" && (
                    <>
                      <TableCell className="text-center">
                        {user.code || ""}
                      </TableCell>
                      <TableCell className="text-center">
                        {user.identifier || ""}
                      </TableCell>
                      <TableCell className="text-center">
                        {user.user_info?.school?.name || ""}
                      </TableCell>
                      <TableCell className="text-center">
                        {user.user_info?.class?.name || ""}
                      </TableCell>
                      <TableCell className="text-center">
                        {user.user_info?.courses?.length > 0 ? (
                          <div>
                            {user.user_info.courses[0].name}
                            {user.user_info.courses.length > 1 && (
                              <span className="text-xs text-gray-500 ml-1">
                                (+{user.user_info.courses.length - 1})
                              </span>
                            )}
                          </div>
                        ) : (
                          ""
                        )}
                      </TableCell>
                    </>
                  )}
                  {userType === "teacher" && (
                    <>
                      <TableCell className="text-center">
                        {user.identifier || ""}
                      </TableCell>
                      <TableCell className="text-center">
                        {user.user_info?.school?.name || ""}
                      </TableCell>
                      <TableCell className="text-center">
                        {user.user_info?.subjects?.[0]?.name || ""}
                      </TableCell>
                    </>
                  )}
                  {userType === "admin" && (
                    <>
                      <TableCell className="text-center">{userType}</TableCell>
                      <TableCell className="text-center">
                        {user.phone_number}
                      </TableCell>
                    </>
                  )}
                  {userType === "school" && (
                    <>
                      <TableCell className="text-center">
                        {user.user_info?.address?.ward_name || ""}
                      </TableCell>
                      <TableCell className="text-center">
                        {user.user_info?.school?.name || ""}
                      </TableCell>
                      <TableCell className="text-center">
                        {user.phone_number}
                      </TableCell>
                    </>
                  )}
                  <TableCell className="text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${user.status
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                        }`}
                    >
                      {user.status ? "active" : "inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center gap-2 justify-center">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleViewDetail(user.id)}
                        title={u("viewDetail")}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onEdit(user)}
                        title={u("edit")}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-500"
                        onClick={() => onDelete(user.id)}
                        title={u("delete")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="hidden md:block lg:hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">{u("userName")}</TableHead>
              <TableHead className="text-center">Email</TableHead>
              {(userType === "student" ||
                userType === "teacher" ||
                userType === "school") && (
                  <TableHead className="text-center">
                    {u("school")}/{u("class")}
                  </TableHead>
                )}
              <TableHead className="text-center">{u("status")}</TableHead>
              <TableHead className="text-center">{u("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={userType === "admin" ? 4 : 5}
                  className="text-center py-8"
                >
                  {u("noUsers")}
                </TableCell>
              </TableRow>
            ) : (
              users.map((user, idx) => (
                <TableRow key={`tablet-${user.id || idx}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage
                          src={user.avatar || "/avatar-kid.png"}
                          alt={user.name}
                        />
                        <AvatarFallback>
                          {user.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {user.name}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">
                          {user.username}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-sm truncate">
                    {user.email || ""}
                  </TableCell>
                  {(userType === "student" ||
                    userType === "teacher" ||
                    userType === "school") && (
                      <TableCell className="text-center">
                        <div className="text-sm">
                          <div className="truncate">
                            {user.user_info?.school?.name || ""}
                          </div>
                          {userType === "student" && (
                            <div className="text-xs text-gray-500 truncate">
                              {user.user_info?.class?.name || ""}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    )}
                  <TableCell className="text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${user.status
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                        }`}
                    >
                      {user.status ? "Hoạt động" : "Không hoạt động"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center gap-1 justify-center">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleViewDetail(user.id)}
                        className="h-7 w-7"
                      >
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => onEdit(user)}
                        className="h-7 w-7"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-500 h-7 w-7"
                        onClick={() => onDelete(user.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="md:hidden space-y-4">
        {users.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">{u("noUsers")}</p>
          </div>
        ) : (
          users.map((user, idx) => (
            <div
              key={`mobile-${user.id || idx}`}
              className="bg-white border rounded-lg p-4 shadow-sm"
            >
              <div className="flex items-start gap-3 mb-3">
                <Avatar className="h-12 w-12 flex-shrink-0">
                  <AvatarImage
                    src={user.avatar || "/avatar-kid.png"}
                    alt={user.name}
                  />
                  <AvatarFallback>
                    {user.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-900 truncate">
                        {user.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500 truncate">
                        {user.username}
                      </p>
                      {user.email && (
                        <p className="text-xs sm:text-sm text-gray-600 truncate">
                          {user.email}
                        </p>
                      )}
                    </div>
                    <span
                      className={`hidden sm:inline-block px-2 py-1 rounded-full text-xs flex-shrink-0 ${user.status
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                        }`}
                    >
                      {user.status ? u("statusActive") : u("statusInactive")}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="sm:hidden -mt-1 mb-3">
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs ${user.status
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                    }`}
                >
                  {user.status ? u("statusActive") : u("statusInactive")}
                </span>
              </div>

              <div className="space-y-2 mb-4 text-sm">
                {userType === "student" && (
                  <>
                    {user.user_info?.address?.ward_name && (
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                        <span className="text-gray-500">{u("ward")}:</span>
                        <span className="text-gray-900 truncate sm:ml-2">
                          {user.user_info.address.ward_name}
                        </span>
                      </div>
                    )}
                    {user.user_info?.school?.name && (
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                        <span className="text-gray-500">{u("school")}:</span>
                        <span className="text-gray-900 truncate sm:ml-2">
                          {user.user_info.school.name}
                        </span>
                      </div>
                    )}
                    {user.user_info?.class?.name && (
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                        <span className="text-gray-500">{u("class")}:</span>
                        <span className="text-gray-900 truncate sm:ml-2">
                          {user.user_info.class.name}
                        </span>
                      </div>
                    )}
                    {user.user_info?.courses?.length > 0 && (
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                        <span className="text-gray-500">{u("course")}:</span>
                        <span className="text-gray-900 truncate sm:ml-2">
                          {user.user_info.courses[0].name}
                          {user.user_info.courses.length > 1 && (
                            <span className="text-xs text-gray-500 ml-1">
                              (+{user.user_info.courses.length - 1})
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </>
                )}
                {userType === "teacher" && (
                  <>
                    {user.user_info?.address?.ward_name && (
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                        <span className="text-gray-500">{u("ward")}:</span>
                        <span className="text-gray-900 truncate sm:ml-2">
                          {user.user_info.address.ward_name}
                        </span>
                      </div>
                    )}
                    {user.user_info?.school?.name && (
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                        <span className="text-gray-500">{u("school")}:</span>
                        <span className="text-gray-900 truncate sm:ml-2">
                          {user.user_info.school.name}
                        </span>
                      </div>
                    )}
                    {user.user_info?.subjects?.[0]?.name && (
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                        <span className="text-gray-500">{u("subject")}:</span>
                        <span className="text-gray-900 truncate sm:ml-2">
                          {user.user_info.subjects[0].name}
                        </span>
                      </div>
                    )}
                  </>
                )}
                {userType === "school" && (
                  <>
                    {user.user_info?.address?.ward_name && (
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                        <span className="text-gray-500">{u("ward")}:</span>
                        <span className="text-gray-900 truncate sm:ml-2">
                          {user.user_info.address.ward_name}
                        </span>
                      </div>
                    )}
                    {user.user_info?.school?.name && (
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                        <span className="text-gray-500">{u("school")}:</span>
                        <span className="text-gray-900 truncate sm:ml-2">
                          {user.user_info.school.name}
                        </span>
                      </div>
                    )}
                    {user.phone_number && (
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                        <span className="text-gray-500">
                          {u("phoneNumber")}:
                        </span>
                        <span className="text-gray-900">
                          {user.phone_number}
                        </span>
                      </div>
                    )}
                  </>
                )}
                {userType === "admin" && user.phone_number && (
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                    <span className="text-gray-500">{u("phoneNumber")}:</span>
                    <span className="text-gray-900">{user.phone_number}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:flex-1"
                  onClick={() => handleViewDetail(user.id)}
                >
                  {u("viewDetail")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:flex-1"
                  onClick={() => onEdit(user)}
                >
                  {u("edit")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:flex-1 text-red-600 hover:text-red-700"
                  onClick={() => onDelete(user.id)}
                >
                  {u("delete")}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
