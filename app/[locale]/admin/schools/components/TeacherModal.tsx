"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff } from 'lucide-react'
import { GetClassList } from "@/lib/api/classes"
import { GetCourseBySchool } from "@/lib/api/courses"
import { GetSubjectsList } from "@/lib/api/subjects"
import { CheckUsernameExists } from "@/lib/api/users"
import { debounce } from "lodash"
import { useTranslations } from "next-intl"
import { sortAlphabetGeneric, sortByNumberAndAlphabetFromSecondGeneric } from "@/lib/utils"

interface TeacherModalProps {
  show: boolean
  onClose: () => void
  onSubmit: () => void
  formData: any
  setFormData: (data: any) => void
  selectedTeacher: any
  schoolId: string
  schoolName?: string
  schoolProvinceCode?: string
  schoolDistrictCode?: string
}

export default function TeacherModal({
  show,
  onClose,
  onSubmit,
  formData,
  setFormData,
  selectedTeacher,
  schoolId,
  schoolName,
  schoolProvinceCode,
  schoolDistrictCode,
}: TeacherModalProps) {
  const t = useTranslations('teachers')
  const [classes, setClasses] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([])
  const [selectedCourses, setSelectedCourses] = useState<any[]>([])
  const [showPassword, setShowPassword] = useState(false)
  const [usersExists, setUsersExists] = useState(false)
  const [originalUsername, setOriginalUsername] = useState("")

  const debouncedCheckUsername = debounce(async (username: string) => {
    try {
      const result = await CheckUsernameExists(username)
      setUsersExists(result.data?.exits === true)
    } catch (error) {
      setUsersExists(false)
      console.error(t('saveTeacherError'), error)
    }
  }, 500)

  useEffect(() => {
    if (show) {
      fetchSubjects()
      if (schoolId) {
        fetchClasses()
        fetchCourses()
      }

      // Initialize data for editing
      if (selectedTeacher) {
        setOriginalUsername(selectedTeacher.username || "")
        if (selectedTeacher.user_info?.courses) {
          setSelectedCourses(selectedTeacher.user_info.courses)
        }
      } else {
        setOriginalUsername("")
        setSelectedCourses([])
      }
    }
  }, [show, schoolId, selectedTeacher])

  const fetchSubjects = async () => {
    try {
      const result = await GetSubjectsList()
      setSubjects(result.data.subjects || [])
    } catch (error) {
      console.error(t('saveTeacherError'), error)
    }
  }

  const fetchClasses = async () => {
    try {
      const response = await GetClassList(schoolId)
      setClasses(response.data?.classes || [])
    } catch (error) {
      console.error("Error fetching classes:", error)
      setClasses([])
    }
  }

  const fetchCourses = async () => {
    try {
      const response = await GetCourseBySchool(schoolId)
      setCourses(response.data?.courses || [])
    } catch (error) {
      console.error("Error fetching courses:", error)
      setCourses([])
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleUserInfoChange = (field: string, value: any) => {
    setFormData({
      ...formData,
      user_info: {
        ...formData.user_info,
        [field]: value,
      },
    })
  }

  const handleClassChange = (classId: string) => {
    const selectedClass = classes.find((c) => c.id.toString() === classId)
    if (selectedClass) {
      handleUserInfoChange("class", { id: selectedClass.id, name: selectedClass.name })
    }
  }

  const handleCourseToggle = (course: any) => {
    const isSelected = selectedCourses.some((c) => c.id === course.id)
    let newSelectedCourses

    if (isSelected) {
      newSelectedCourses = selectedCourses.filter((c) => c.id !== course.id)
    } else {
      newSelectedCourses = [...selectedCourses, { id: course.id, name: course.name }]
    }

    setSelectedCourses(newSelectedCourses)
    handleUserInfoChange("courses", newSelectedCourses)
  }

  const removeCourse = (courseId: number) => {
    const newSelectedCourses = selectedCourses.filter((c) => c.id !== courseId)
    setSelectedCourses(newSelectedCourses)
    handleUserInfoChange("courses", newSelectedCourses)
  }

  // Convert date for display (ISO to YYYY-MM-DD)
  const formatDateForInput = (isoDate: string) => {
    if (!isoDate) return ""
    try {
      const date = new Date(isoDate)
      if (isNaN(date.getTime()) || isoDate.startsWith("0001-01-01")) return ""
      return date.toISOString().split("T")[0]
    } catch {
      return ""
    }
  }

  // Convert date for API (YYYY-MM-DD to ISO)
  const formatDateForAPI = (dateString: string) => {
    if (!dateString) return ""
    try {
      return new Date(dateString).toISOString()
    } catch {
      return ""
    }
  }

  const handleSubmit = () => {
    // Prepare data for API
    const payload = {
      parent_id: 0,
      role_id: 2,
      username: formData.username || "",
      password: formData.password || "",
      name: formData.name || "",
      avatar: formData.avatar || "",
      address: formData.address || "",
      email: formData.email || "",
      phone_number: formData.phone_number || "",
      date_of_birth: formatDateForAPI(formData.date_of_birth || ""),
      status: formData.status === "active" || formData.status === true,
      user_info: {
        school: { id: Number.parseInt(schoolId) },
        class: formData.user_info?.class || { id: 0 },
        courses: selectedCourses || [],
        subjects: formData.user_info?.subjects || [],
        address: {
          id: 0,
          province_code: schoolProvinceCode || "", // Use prop
          district_code: schoolDistrictCode || "", // Use prop
          ward_code: "",
          province_name: "",
          district_name: "",
          ward_name: "",
          address: formData.address || "",
        },
        role: {
          id: 2,
          name: "teacher",
        },
        certificates: formData.certificate ? [{ name: formData.certificate }] : [],
        degrees: [],
        departments: [],
        positions: [],
      },
    }

    // Update formData with prepared payload
    setFormData(payload)
    onSubmit()
  }

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@gmail\.com$/.test(email)
  }

  const isValidPhoneNumber = (phone: string) => {
    return /^(0\d{9}|(\+84)\d{9})$/.test(phone)
  }

  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{selectedTeacher ? t('editTeacher') : t('addNewTeacher')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">{t('fullName')} *</Label>
              <Input
                id="name"
                required
                value={formData.name || ""}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder={t('fullName')}
              />
            </div>
            <div>
              <Label htmlFor="username">{t('username')} *</Label>
              <Input
                id="username"
                required
                value={formData.username || ""}
                onChange={(e) => handleInputChange("username", e.target.value)}
                onBlur={(e) => {
                  if (e.target.value !== originalUsername) {
                    if (e.target.value) {
                      debouncedCheckUsername(e.target.value)
                    } else {
                      setUsersExists(false)
                    }
                  } else {
                    setUsersExists(false)
                  }
                }}
                placeholder={t('username')}
              />
              {usersExists && <p className="text-red-500 text-sm mt-1">{t('accountExists')}</p>}
            </div>
          </div>

          {!selectedTeacher && (
            <div>
              <Label htmlFor="password">{t('password')} *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password || ""}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  placeholder={t('password')}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ""}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder={t('email')}
              />
              {formData.email && !isValidEmail(formData.email) && (
                <p className="text-red-500 text-sm mt-1">{t('invalidEmail')}</p>
              )}
            </div>
            <div>
              <Label htmlFor="phone_number">{t('phoneNumber')}</Label>
              <Input
                id="phone_number"
                value={formData.phone_number || ""}
                onChange={(e) => handleInputChange("phone_number", e.target.value)}
                placeholder={t('phoneNumber')}
              />
              {formData.phone_number && !isValidPhoneNumber(formData.phone_number) && (
                <p className="text-red-500 text-sm mt-1">{t('invalidPhoneNumber')}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="address">{t('address')}</Label>
            <Input
              id="address"
              value={formData.address || ""}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder={t('address')}
            />
          </div>

          <div>
            <Label htmlFor="date_of_birth">{t('dateOfBirth')}</Label>
            <Input
              id="date_of_birth"
              type="date"
              value={formatDateForInput(formData.date_of_birth || "")}
              onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
            />
          </div>

          {/* Teacher specific fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="subject">{t('teachingSubject')}</Label>
              <Select
                value={formData.user_info?.subjects?.[0]?.id?.toString() || ""}
                onValueChange={(value) => {
                  const selectedSubject = subjects.find((s) => s.id.toString() === value)
                  if (selectedSubject) {
                    handleUserInfoChange("subjects", [{ id: selectedSubject.id, name: selectedSubject.name }])
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectTeachingSubject')} />
                </SelectTrigger>
                <SelectContent>
                  {sortAlphabetGeneric(subjects, item => item.name, true).map((subject) => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="certificate">{t('certificate')}</Label>
              <Input
                id="certificate"
                value={formData.certificate || ""}
                onChange={(e) => handleInputChange("certificate", e.target.value)}
                placeholder={t('certificate')}
              />
            </div>
          </div>

          {/* School Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="class_id">{t('class')}</Label>
              <Select value={formData.user_info?.class?.id?.toString() || ""} onValueChange={handleClassChange}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectClass')} />
                </SelectTrigger>
                <SelectContent>
                  {sortByNumberAndAlphabetFromSecondGeneric(classes, item => item.name, true).map((classItem) => (
                    <SelectItem key={classItem.id} value={classItem.id.toString()}>
                      {classItem.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">{t('status')}</Label>
              <Select
                value={formData.status === true ? "active" : formData.status === false ? "inactive" : ""}
                onValueChange={(value) => handleInputChange("status", value === "active")}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectStatus')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t('statusActive')}</SelectItem>
                  <SelectItem value="inactive">{t('statusInactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Courses */}
          <div>
            <Label>{t('courses')}</Label>
            <div className="space-y-2">
              <Select
                onValueChange={(courseId) => {
                  const course = courses.find((c) => c.id.toString() === courseId)
                  if (course && !selectedCourses.some((c) => c.id === course.id)) {
                    handleCourseToggle(course)
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectCourseToAdd')} />
                </SelectTrigger>
                <SelectContent>
                  {sortByNumberAndAlphabetFromSecondGeneric(
                    courses.filter((course) => !selectedCourses.some((c) => c.id === course.id)), item => item.name, true)
                    .map((course) => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              {selectedCourses.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-sm text-gray-600">{t('selectedCourses')}:</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedCourses.map((course) => (
                      <div
                        key={course.id}
                        className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm"
                      >
                        <span>{course.name}</span>
                        <button
                          type="button"
                          onClick={() => removeCourse(course.id)}
                          className="text-blue-600 hover:text-blue-800 ml-1"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={usersExists}>
            {selectedTeacher ? "Cập nhật" : "Thêm mới"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
