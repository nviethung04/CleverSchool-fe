"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { UserFormProps } from "../types";
import { useTranslations } from "next-intl";
import { sortAlphabetGeneric, sortByNumberAndAlphabetFromSecondGeneric } from "@/lib/utils";

export function UserForm({
  formData,
  errors,
  register,
  watch,
  setValue,
  handleSubmit,

  showPassword,
  setShowPassword,
  isUploading,
  usersExits,
  selectedRole,
  setSelectedRole,

  provinces,
  wards,
  schools,
  courses,
  coursesBySchool,
  classes,
  classesBySchool = {},
  subjects,

  debouncedCheckUsername,
  setWards,
  setSchools,
  setCourses,
  setClasses,

  onSubmit,
  onCancel,

  title,
  subtitle,
  submitButtonText,

  isEdit = false,
  originalUsername,
  userId,
  onResetPassword,
}: UserFormProps) {
  const t = useTranslations("users");
  const school = watch("school");
  const teacherType = watch("type_teacher");
  const selectedCourses = watch("course") || [];
  const teacherSchoolIds = watch("teacher_school_ids") || [];
  const teacherSchoolClassIds = watch("teacher_school_class_ids") || {};
  const [isSchoolPopoverOpen, setIsSchoolPopoverOpen] = useState(false);
  const [isTeacherSchoolsPopoverOpen, setIsTeacherSchoolsPopoverOpen] = useState(false);

  // Xử lý chọn/bỏ chọn khóa học
  const handleCourseToggle = (courseId: string) => {
    let currentCourses = Array.isArray(selectedCourses)
      ? selectedCourses
      : selectedCourses
      ? [selectedCourses]
      : [];

    if (currentCourses.includes(courseId)) {
      // Bỏ chọn khóa học
      currentCourses = currentCourses.filter((id) => id !== courseId);
    } else {
      // Chọn thêm khóa học
      currentCourses = [...currentCourses, courseId];
    }

    setValue("course", currentCourses);
  };

  // Teacher: chọn/bỏ chọn trường
  const handleTeacherSchoolToggle = (schoolId: string) => {
    const current = Array.isArray(teacherSchoolIds) ? [...teacherSchoolIds] : [];
    const next = current.includes(schoolId)
      ? current.filter((id) => id !== schoolId)
      : [...current, schoolId];
    setValue("teacher_school_ids", next);
    if (!next.includes(schoolId)) {
      const nextClassIds = { ...teacherSchoolClassIds };
      delete nextClassIds[schoolId];
      setValue("teacher_school_class_ids", nextClassIds);
    }
  };

  // Teacher: chọn/bỏ chọn lớp theo trường
  const handleTeacherClassToggle = (schoolId: string, classId: string) => {
    const current = teacherSchoolClassIds[schoolId] || [];
    const next = current.includes(classId)
      ? current.filter((id: string) => id !== classId)
      : [...current, classId];
    setValue("teacher_school_class_ids", {
      ...teacherSchoolClassIds,
      [schoolId]: next,
    });
  };

  return (
    <div className="space-y-6 max-h-[calc(100vh-2rem)] overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-wrap mt-3 sm:mt-0">
          {window.history.length > 1 && <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("backButton")}
          </Button>}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </div>

      <Card>
        {!isEdit && (
          <CardHeader>
            <div className="flex gap-2 sm:gap-4 mt-2 flex-wrap">
              <Button
                type="button"
                variant={selectedRole === "3" ? "default" : "outline"}
                onClick={() => {
                  setSelectedRole("3");
                  setValue("role_id", 3);
                  setValue("type_teacher", 0);
                  setValue("teacher_school_ids", []);
                  setValue("teacher_school_class_ids", {});
                }}
              >
                {t("student")}
              </Button>
              <Button
                type="button"
                variant={selectedRole === "2" ? "default" : "outline"}
                onClick={() => {
                  setSelectedRole("2");
                  setValue("role_id", 2);
                  setValue("type_teacher", 1); // Mặc định là giáo viên Việt Nam
                  setValue("teacher_school_ids", []);
                  setValue("teacher_school_class_ids", {});
                }}
              >
                {t("teacher")}
              </Button>
              <Button
                type="button"
                variant={selectedRole === "1" ? "default" : "outline"}
                onClick={() => {
                  setSelectedRole("1");
                  setValue("role_id", 1);
                  setValue("type_teacher", 0);
                }}
              >
                {t("admin")}
              </Button>
            </div>
          </CardHeader>
        )}
        <CardContent>
          {isEdit && (
            <div className="my-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-gray-800 mb-1">
                {t("userInfo")}
              </div>
              <div className="text-blue-600 font-medium">
                {selectedRole === "1" && t("admin")}
                {selectedRole === "2" && t("teacher")}
                {selectedRole === "3" && t("student")}
              </div>
            </div>
          )}
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <input type="hidden" {...register("avatar")} />

            <div className="flex gap-4">
              <div className="flex-1 flex flex-col space-y-1">
                <label>
                  {t("fullName")} <span className="text-red-500">*</span>
                </label>
                <Input
                  {...register("name", { required: t("fullNameRequired") })}
                  placeholder={t("fullName")}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div className="flex-1 flex flex-col space-y-1">
                <label>{t("username")}</label>
                <Input
                  {...register("username")}
                  onBlur={(e) => {
                    if (e.target.value) {
                      if (!isEdit || e.target.value !== originalUsername) {
                        debouncedCheckUsername(e.target.value);
                      }
                    }
                  }}
                  placeholder={t("username")}
                  autoComplete="new-password"
                />
                {usersExits && (
                  <p className="text-red-500 text-sm mt-1">
                    {t("accountExists")}
                  </p>
                )}
                {errors.username && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.username.message}
                  </p>
                )}
              </div>
            </div>

            {!isEdit && (
              <div className="flex flex-col space-y-1">
                <label>
                  {t("password")}
                  <span className="text-red-500">*</span>
                </label>
                <div className="password-input-container">
                  <Input
                    type={showPassword ? "text" : "password"}
                    {...register("password", {
                      required: t("passwordRequired"),
                    })}
                    placeholder={t("password")}
                    autoComplete="new-password"
                    style={{
                      paddingRight: "2.5rem",
                    }}
                  />
                  <span
                    className="password-toggle-button"
                    onClick={() => setShowPassword(!showPassword)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setShowPassword(!showPassword);
                      }
                    }}
                  >
                    {showPassword ? (
                      <EyeOff className="password-icon" />
                    ) : (
                      <Eye className="password-icon" />
                    )}
                  </span>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>
            )}

            {selectedRole !== "1" && (
              <div className="flex gap-4">
                {selectedRole === "3" && (
                  <div className="flex-1 flex flex-col space-y-1">
                    <label>{t("detailCode")}</label>
                    <Input
                      {...register("code")}
                      placeholder={t("detailCode")}
                    />
                  </div>
                )}

                <div className="flex-1 flex flex-col space-y-1">
                  <label>{t("detailIdentifier")}</label>
                  <Input
                    {...register("identifier")}
                    placeholder={t("detailIdentifier")}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <div className="flex-1 flex flex-col space-y-1">
                <label>Email</label>
                <Input {...register("email")} placeholder="Email" />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div className="flex-1 flex flex-col space-y-1">
                <label>{t("phoneNumber")}</label>
                <Input
                  {...register("phone_number")}
                  placeholder={t("phoneNumber")}
                />
                {errors.phone_number && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.phone_number.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 flex flex-col space-y-1">
                  <label>{t("detailAddress")}</label>
                  <Input
                    {...register("address")}
                    placeholder={t("detailAddress")}
                  />
                  {errors.address && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.address.message}
                    </p>
                  )}
                </div>
                <div className="flex-1 flex flex-col space-y-1">
                  <label>{t("dateOfBirth")}</label>
                  <Input
                    type="date"
                    {...register("date_of_birth")}
                    placeholder={t("dateOfBirth")}
                  />
                  {errors.date_of_birth && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.date_of_birth.message}
                    </p>
                  )}
                </div>
              </div>

            <div className="flex flex-col space-y-1">
              <label>{t("status")}</label>
              <Select
                value={watch("status") ? "active" : "inactive"}
                onValueChange={(value) =>
                  setValue("status", value === "active")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t("statusActive")}</SelectItem>
                  <SelectItem value="inactive">
                    {t("statusInactive")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedRole === "2" && (
              <>
                <div className="flex gap-4">
                  <div className="flex-1 flex flex-col space-y-1">
                    <label>{t("subject")}</label>
                    <Select
                      value={watch("subject")}
                      onValueChange={(value) => setValue("subject", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectSubject")} />
                      </SelectTrigger>
                      <SelectContent>
                        {sortAlphabetGeneric(subjects, item => item.name, true).map((subject) => (
                          <SelectItem
                            key={subject.id}
                            value={subject.id.toString()}
                          >
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 flex flex-col space-y-1">
                    <label>{t("teacherType")}</label>
                    <Select
                      value={
                        teacherType
                          ? teacherType.toString()
                          : selectedRole === "2"
                          ? "1"
                          : ""
                      }
                      onValueChange={(value) =>
                        setValue("type_teacher", parseInt(value))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectTeacherType")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">
                          {t("vietnameseTeacher")}
                        </SelectItem>
                        <SelectItem value="2">{t("foreignTeacher")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Teacher: chọn nhiều trường */}
                <div className="flex flex-col space-y-2">
                  <label className="font-medium">{t("schoolField")}</label>
                  <p className="text-sm text-muted-foreground">
                    Chọn các trường mà giáo viên sẽ giảng dạy
                  </p>
                  <Popover
                    open={isTeacherSchoolsPopoverOpen}
                    onOpenChange={setIsTeacherSchoolsPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <div
                        className="w-full min-h-10 border rounded-md px-3 py-2 text-sm flex items-center justify-between cursor-pointer hover:bg-accent/30"
                        role="button"
                      >
                        <span className="truncate text-muted-foreground">
                          {teacherSchoolIds.length === 0
                            ? "Chọn trường..."
                            : `Đã chọn ${teacherSchoolIds.length} trường`}
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
                            {sortAlphabetGeneric(schools, (item: any) => item.school_name ?? item.name, true).map((schoolItem: any) => {
                              const sid = schoolItem.id?.toString() ?? "";
                              const isSelected = teacherSchoolIds.includes(sid);
                              return (
                                <CommandItem
                                  key={schoolItem.id}
                                  value={schoolItem.school_name ?? schoolItem.name ?? ""}
                                  onSelect={() => handleTeacherSchoolToggle(sid)}
                                >
                                  <Checkbox
                                    checked={isSelected}
                                    className="mr-2 rounded-none border-2"
                                  />
                                  {schoolItem.school_name ?? schoolItem.name}
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Teacher: với mỗi trường đã chọn, chọn nhiều lớp */}
                {teacherSchoolIds.length > 0 && (
                  <div className="flex flex-col space-y-3">
                    <label className="font-medium">{t("class")}</label>
                    <p className="text-sm text-muted-foreground">
                      Chọn các lớp tương ứng với từng trường
                    </p>
                    <div className="space-y-4">
                      {teacherSchoolIds.map((schoolId: string) => {
                        const schoolItem = schools.find(
                          (s: any) => String(s.id) === String(schoolId)
                        );
                        const schoolName = (schoolItem as any)?.school_name ?? (schoolItem as any)?.name ?? `Trường ${schoolId}`;
                        const schoolClasses = classesBySchool[schoolId] || [];
                        const selectedClassIds = teacherSchoolClassIds[schoolId] || [];
                        return (
                          <div
                            key={schoolId}
                            className="border rounded-lg p-3 space-y-2"
                          >
                            <div className="font-medium text-sm text-gray-700">
                              {schoolName}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {sortByNumberAndAlphabetFromSecondGeneric(schoolClasses, (item: any) => item.name, true).map((cls: any) => {
                                const cid = cls.id?.toString() ?? "";
                                const isSelected = selectedClassIds.includes(cid);
                                return (
                                  <div
                                    key={cls.id}
                                    className="flex items-center space-x-2"
                                  >
                                    <Checkbox
                                      id={`teacher-class-${schoolId}-${cls.id}`}
                                      checked={isSelected}
                                      onCheckedChange={() =>
                                        handleTeacherClassToggle(schoolId, cid)
                                      }
                                      className="rounded-none border-2"
                                    />
                                    <label
                                      htmlFor={`teacher-class-${schoolId}-${cls.id}`}
                                      className="text-sm cursor-pointer flex-1"
                                    >
                                      {cls.name}
                                    </label>
                                  </div>
                                );
                              })}
                            </div>
                            {schoolClasses.length === 0 && (
                              <p className="text-sm text-muted-foreground">
                                Không có lớp nào
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
            {/* Input ẩn để giữ dữ liệu khóa học cho backend */}
            {selectedRole === "3" && (
              <input type="hidden" {...register("course")} />
            )}
            {selectedRole === "3" && (
              <>
                <div className="flex flex-col space-y-1">
                  <label>{t("schoolField")}</label>
                  <Popover
                    open={isSchoolPopoverOpen}
                    onOpenChange={setIsSchoolPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <div
                        className="w-full h-10 border rounded-md px-3 text-sm flex items-center justify-between cursor-pointer hover:bg-accent/30"
                        role="button"
                      >
                        <span className="truncate">
                          {(school &&
                            schools.find((s: any) => s.id.toString() === school)
                              ?.school_name) ||
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
                            {sortAlphabetGeneric(schools, item => item.school_name, true).map((schoolItem: any) => (
                              <CommandItem
                                key={schoolItem.id}
                                value={schoolItem.school_name}
                                onSelect={() => {
                                  setValue("school", schoolItem.id.toString());
                                  setValue("class_name", "");
                                  setValue("course", []); // Reset khóa học đã chọn
                                  setClasses([]);
                                  setIsSchoolPopoverOpen(false);
                                }}
                              >
                                {schoolItem.school_name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                {school && (
                  <div className="flex-1 flex flex-col space-y-1">
                    <label>{t("class")}</label>
                    <Select
                      value={watch("class_name")}
                      onValueChange={(value) => setValue("class_name", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectClass")} />
                      </SelectTrigger>
                      <SelectContent>
                        {sortByNumberAndAlphabetFromSecondGeneric(classes, item => item.name, true).map((cls: any) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Section chọn khóa học cho học sinh khi đã chọn trường */}
                {school &&
                  coursesBySchool &&
                  coursesBySchool.length > 0 && (
                    <div className="flex flex-col space-y-3">
                      <label className="font-medium">Khóa học</label>
                      <div className="text-sm text-gray-600 mb-2">
                        Chọn các khóa học mà học sinh sẽ tham gia:
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border rounded-lg p-3">
                        {sortByNumberAndAlphabetFromSecondGeneric(coursesBySchool, item => item.name, true).map((course: any) => {
                            const courseId = course.id.toString();
                            const isSelected = Array.isArray(selectedCourses)
                              ? selectedCourses.includes(courseId)
                              : selectedCourses === courseId;

                            return (
                              <div
                                key={course.id}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  id={`course-${course.id}`}
                                  checked={isSelected}
                                  onCheckedChange={() =>
                                    handleCourseToggle(courseId)
                                  }
                                  className="rounded-none border-2"
                                />
                                <label
                                  htmlFor={`course-${course.id}`}
                                  className="text-sm cursor-pointer flex-1"
                                >
                                  {course.object_title
                                    ? `${course.name} (${course.object_title})`
                                    : course.name}
                                </label>
                              </div>
                            );
                          })}
                      </div>
                      {Array.isArray(selectedCourses) &&
                        selectedCourses.length > 0 && (
                          <div className="text-sm text-blue-600">
                            Đã chọn {selectedCourses.length} khóa học
                          </div>
                        )}
                    </div>
                  )}
              </>
            )}
            <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-between sm:items-center">
              {/* Button Reset Password - chỉ hiển thị khi edit và là học sinh */}
              <div className="w-full sm:w-auto">
                {isEdit && selectedRole === "3" && onResetPassword && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={onResetPassword}
                    disabled={isUploading}
                    className="w-full sm:w-auto"
                  >
                    {t("resetPasswordButton")}
                  </Button>
                )}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:gap-4 w-full sm:w-auto">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full sm:w-auto order-2 sm:order-1"
                  onClick={onCancel}
                >
                  {t("cancel")}
                </Button>
                
                <Button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white w-full sm:w-auto order-1 sm:order-2" // Mobile: Nằm trên cùng (ưu tiên)
                  disabled={isUploading}
                >
                  {isUploading ? t("saving") : submitButtonText}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
