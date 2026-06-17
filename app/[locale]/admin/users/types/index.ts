export interface FormData {
  name: string
  username: string
  password: string
  code?: string
  identifier?: string
  email: string
  phone_number: string
  address: string
  role_id: number
  province_code?: string
  ward_code?: string
  school: string
  /** Teacher: multiple school ids */
  teacher_school_ids?: string[]
  /** Teacher: map schoolId -> selected class ids */
  teacher_school_class_ids?: Record<string, string[]>
  course: string | string[]
  subject: string
  type_teacher?: number
  class_name: string
  status: boolean | string
  certificate?: string
  date_of_birth: string
  avatar?: string
}

export interface Province {
  code: string
  name: string
}

export interface Ward {
  code: string
  name: string
  province_code: string
}

export interface School {
  id: string
  school_name: string
  school_short_name: string
  ward_name: string
  province_name: string
}

export interface Course {
  id: string
  name: string
}

export interface Class {
  id: string
  name: string
}

export interface Subject {
  id: number
  name: string
}

export interface UserFormProps {
  formData: FormData
  errors: any
  register: any
  watch: any
  setValue: any
  handleSubmit: any

  showPassword: boolean
  setShowPassword: (show: boolean) => void
  isUploading: boolean
  usersExits: boolean
  selectedRole: string
  setSelectedRole: (role: string) => void
  /** Sync role tab to URL (create page only) */
  onRoleChange?: (role: string) => void

  provinces?: Province[]
  wards?: Ward[]
  schools: School[]
  courses: Course[]
  coursesBySchool: Course[] // Khóa học theo trường cụ thể
  classes: Class[]
  /** Teacher: classes per school id (schoolId -> classes[]) */
  classesBySchool?: Record<string, any[]>
  subjects: Subject[]

  debouncedCheckUsername: (username: string) => void
  setWards?: (wards: Ward[]) => void
  setSchools: (schools: any[]) => void
  setCourses: (courses: any[]) => void
  setClasses: (classes: any[]) => void

  onSubmit: (data: FormData) => void
  onCancel: () => void

  title: string
  subtitle: string
  submitButtonText: string

  isEdit?: boolean
  originalUsername?: string
  userId?: string
  onResetPassword?: () => void
}