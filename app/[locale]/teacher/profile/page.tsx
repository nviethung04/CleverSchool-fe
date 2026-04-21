"use client"

import type React from "react"

import { useEffect, useState, useCallback } from "react"
import { useTranslations } from "next-intl"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  User,
  Award,
  Settings,
  Mail,
  Bell,
  Plus,
  Eye,
  GraduationCap,
  EyeOff,
  Trash2,
  Pencil,
  FileText,
  Download,
} from "lucide-react"
import { GetUserLogin, UpdateUserLogin, ChangePassword } from "@/lib/api/users"
import {
  DeleteCertificate,
  DeleteDegree,
  UpdateCertificates,
  UpdateDegrees,
  AddCertificate,
  AddDegree,
} from "@/lib/api/certificates"
import { TeacherDashboardHeader } from "@/components/teacher-dashboard-header"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { UploadMedia, UploadFile } from "@/lib/api/picture"
import ImageCropper from "@/components/ui/image-cropper"

export default function TeacherProfilePage() {
  const t = useTranslations("profile")
  const tPassword = useTranslations("password")

  const [originalUser, setOriginalUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("info")
  const [isEditModalOpen, setEditModalOpen] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [changingPassword, setChangingPassword] = useState(false)

  const [user, setUser] = useState<any>({
    name: null,
    role: null,
    avatar: null,
    username: null,
    email: null,
    phone_number: null,
    address: null,
    status: null,
    user_info: {
      school: {
        name: null,
      },
      class: {
        name: null,
      },
      courses: [],
      certificates: [],
      degrees: [],
    },
  })

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isAvatarLoading, setIsAvatarLoading] = useState(false)

  // Avatar cropper states
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null)
  const [cropperOpen, setCropperOpen] = useState(false)

  const { toast } = useToast()

  // Modal states for viewing details
  const [viewCertificateModal, setViewCertificateModal] = useState<{ open: boolean; data: any }>({
    open: false,
    data: null,
  })
  const [viewDegreeModal, setViewDegreeModal] = useState<{ open: boolean; data: any }>({ open: false, data: null })

  // Modal states for adding new items
  const [addCertificateModal, setAddCertificateModal] = useState(false)
  const [addDegreeModal, setAddDegreeModal] = useState(false)
  const [addingCertificate, setAddingCertificate] = useState(false)
  const [addingDegree, setAddingDegree] = useState(false)
  const [uploadingCertificateFile, setUploadingCertificateFile] = useState(false)
  const [uploadingDegreeFile, setUploadingDegreeFile] = useState(false)
  const [uploadingEditCertificateFile, setUploadingEditCertificateFile] = useState(false)
  const [uploadingEditDegreeFile, setUploadingEditDegreeFile] = useState(false)

  // Modal states for deleting items
  const [deleteCertificateModal, setDeleteCertificateModal] = useState<{ open: boolean; data: any; index: number }>({
    open: false,
    data: null,
    index: -1,
  })
  const [deleteDegreeModal, setDeleteDegreeModal] = useState<{ open: boolean; data: any; index: number }>({
    open: false,
    data: null,
    index: -1,
  })
  const [deletingCertificate, setDeletingCertificate] = useState(false)
  const [deletingDegree, setDeletingDegree] = useState(false)

  // Modal states for editing items
  const [editCertificateModal, setEditCertificateModal] = useState<{ open: boolean; data: any }>({
    open: false,
    data: null,
  })
  const [editDegreeModal, setEditDegreeModal] = useState<{ open: boolean; data: any }>({
    open: false,
    data: null,
  })
  const [editingCertificate, setEditingCertificate] = useState(false)
  const [editingDegree, setEditingDegree] = useState(false)

  // Form states for editing items
  const [editCertificateForm, setEditCertificateForm] = useState({
    name: "",
    issued_by: "",
    issued_date: "",
    expiry_date: "",
    certificate_code: "",
    status: "true",
    description: "",
    file_url: "",
  })

  const [editDegreeForm, setEditDegreeForm] = useState({
    name: "",
    major: "",
    institution: "",
    graduation_year: new Date().getFullYear(),
    degree_code: "",
    degree_level: "",
    received_date: "",
    note: "",
    file_url: "",
    status: "true",
  })

  // Form states for new items
  const [newCertificate, setNewCertificate] = useState({
    name: "",
    issued_by: "",
    issued_date: "",
    expiry_date: "",
    certificate_code: "",
    status: "true",
    description: "",
    file_url: "",
  })

  const [newDegree, setNewDegree] = useState({
    name: "",
    major: "",
    institution: "",
    graduation_year: new Date().getFullYear(),
    degree_code: "",
    degree_level: "",
    received_date: "",
    note: "",
    file_url: "",
    status: "true",
  })

  // State cho hiển thị/ẩn mật khẩu
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [wrongOldPassword, setWrongOldPassword] = useState(false)

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await GetUserLogin()

      if (res && res.data) {
        setUser(res.data)
        setOriginalUser(JSON.parse(JSON.stringify(res.data)))
      } else {
        setError(t("loadError"))
      }
    } catch (error: any) {
      setError(error.message || t("updateErrorMessage"))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    fetchUserData()
  }, [fetchUserData])

  const formatDate = (dateString: string) => {
    if (!dateString) return t("notSpecified")
    try {
      return new Date(dateString).toLocaleDateString("vi-VN")
    } catch {
      return dateString
    }
  }

  const getRoleName = () => {
    if (user?.role_name === "teacher") return t("teacher")
    if (user?.role_name === "admin") return t("admin")
    return user?.role_name || t("notSpecified")
  }

  const validateEmail = (email: string) => {
    if (!email) return true
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhoneNumber = (phoneNumber: string) => {
    if (!phoneNumber) return true
    const phoneRegex = /^\+?[0-9]{10,15}$/
    return phoneRegex.test(phoneNumber)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (user.email && !validateEmail(user.email)) {
      toast({
        title: "Lỗi",
        description: t("invalidEmail"),
        variant: "destructive",
      })
      return
    }

    if (user.phone_number && !validatePhoneNumber(user.phone_number)) {
      toast({
        title: "Lỗi",
        description: t("invalidPhone"),
        variant: "destructive",
      })
      return
    }

    try {
      setUpdating(true)
      const response = await UpdateUserLogin(user)

      if (response && response.data) {
        setUser(response.data)
        setOriginalUser(JSON.parse(JSON.stringify(response.data)))
      }

      toast({
        title: t("success"),
        description: t("updateSuccessMessage"),
      })

      setEditModalOpen(false)
    } catch (error: any) {
      toast({
        title: t("error"),
        description: error.message || t("updateErrorMessage"),
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleCancelEdit = () => {
    setUser(JSON.parse(JSON.stringify(originalUser)))
    setEditModalOpen(false)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setWrongOldPassword(false)
    if (newPassword !== confirmPassword) {
      toast({
        title: "Lỗi",
        description: tPassword("passwordMismatch"),
        variant: "destructive",
      })
      return
    }

    if (!currentPassword || !newPassword) {
      toast({
        title: "Lỗi",
        description: t("fillAllFields"),
        variant: "destructive",
      })
      return
    }

    setChangingPassword(true)
    try {
      await ChangePassword({
        old_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      })

      toast({
        title: t("success"),
        description: t("changePasswordSuccess"),
      })

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setPasswordModalOpen(false)
    } catch (error: any) {
      if (error.message && error.message.toLowerCase().includes("mật khẩu hiện tại")) {
        setWrongOldPassword(true)
      }
      toast({
        title: t("error"),
        description: error.message || t("changePasswordError"),
        variant: "destructive",
      })
    } finally {
      setChangingPassword(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      if (!file.type.startsWith("image/")) {
        toast({
          title: "Lỗi",
          description: t("selectImageFile"),
          variant: "destructive",
        })
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Lỗi",
          description: t("fileSizeLimit"),
          variant: "destructive",
        })
        return
      }

      setSelectedAvatarFile(file)
      setCropperOpen(true)
    }
  }

  const handleCropComplete = (croppedFile: File) => {
    setAvatarFile(croppedFile)

    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatarPreview(event.target.result as string)
      }
    }
    reader.readAsDataURL(croppedFile)

    setCropperOpen(false)
    setSelectedAvatarFile(null)
  }

  const handleCropperClose = () => {
    setCropperOpen(false)
    setSelectedAvatarFile(null)
  }

  const saveAvatarChange = async () => {
    if (!avatarFile) return
    setIsAvatarLoading(true)
    try {
      const uploadResponse = await UploadMedia(avatarFile, "avatars")
      const imageUrl = uploadResponse.data?.url || uploadResponse.url
      if (!imageUrl) {
        throw new Error(t("noImageUrl"))
      }
      const updatedUserData = {
        ...user,
        avatar: imageUrl,
      }
      const response = await UpdateUserLogin(updatedUserData)
      if (response && response.data) {
        setUser({ ...response.data, avatar: imageUrl })
        setOriginalUser({ ...response.data, avatar: imageUrl })
      } else {
        setUser({ ...user, avatar: imageUrl })
      }
      setAvatarFile(null)
      setAvatarPreview(null)
      setSelectedAvatarFile(null)
      toast({
        title: t("success"),
        description: t("updateAvatarSuccess"),
      })
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || t("updateAvatarError"),
        variant: "destructive",
      })
    } finally {
      setIsAvatarLoading(false)
    }
  }

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    folder: string,
    setFileUrl: (url: string) => void,
    setUploadingState: (loading: boolean) => void,
    successMessage: string,
    errorMessage: string,
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingState(true)
      const response = await UploadFile(file, folder)
      const fileUrl = response.url || response.data?.url

      if (fileUrl) {
        setFileUrl(fileUrl)
        toast({
          title: "Thành công",
          description: successMessage,
        })
      } else {
        throw new Error("Không nhận được URL file từ server")
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.response?.data?.message || errorMessage,
        variant: "destructive",
      })
    } finally {
      setUploadingState(false)
    }
  }

  const handleAddCertificate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newCertificate.name.trim() || !newCertificate.issued_by.trim() || !newCertificate.issued_date) {
      toast({
        title: "Lỗi",
        description: t("blankError"),
        variant: "destructive",
      })
      return
    }

    if (newCertificate.expiry_date && newCertificate.issued_date) {
      const issuedDate = new Date(newCertificate.issued_date)
      const expiryDate = new Date(newCertificate.expiry_date)
      if (expiryDate <= issuedDate) {
        toast({
          title: "Lỗi",
          description: t("dateError"),
          variant: "destructive",
        })
        return
      }
    }

    try {
      setAddingCertificate(true)

      if (!user.id) {
        toast({
          title: t("error"),
          description: t("userIdNotFound"),
          variant: "destructive",
        })
        return
      }

      const certificateData = {
        user_id: Number(user.id),
        name: newCertificate.name.trim(),
        issued_by: newCertificate.issued_by.trim(),
        issued_date: newCertificate.issued_date,
        expiry_date: newCertificate.expiry_date || null,
        certificate_code: newCertificate.certificate_code || null,
        status: newCertificate.status === "true",
        description: newCertificate.description || null,
        file_url: newCertificate.file_url || null,
      }

      await AddCertificate(user.id.toString(), certificateData)

      toast({
        title: t("success"),
        description: t("addCertificateSuccess"),
      })

      setNewCertificate({
        name: "",
        issued_by: "",
        issued_date: "",
        expiry_date: "",
        certificate_code: "",
        status: "true",
        description: "",
        file_url: "",
      })
      setAddCertificateModal(false)
      await fetchUserData()
    } catch (error: any) {
      let errorMessage = t("operationError")
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }

      toast({
        title: t("error"),
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setAddingCertificate(false)
    }
  }

  const handleAddDegree = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newDegree.name.trim() || !newDegree.major.trim() || !newDegree.institution.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ các trường bắt buộc (Tên bằng cấp, Chuyên ngành, Trường)",
        variant: "destructive",
      })
      return
    }

    const currentYear = new Date().getFullYear()
    if (newDegree.graduation_year < 1900 || newDegree.graduation_year > currentYear) {
      toast({
        title: "Lỗi",
        description: `Năm tốt nghiệp phải từ 1900 đến ${currentYear}`,
        variant: "destructive",
      })
      return
    }

    try {
      setAddingDegree(true)

      if (!user.id) {
        toast({
          title: "Lỗi",
          description: "Không tìm thấy ID người dùng. Vui lòng đăng nhập lại.",
          variant: "destructive",
        })
        return
      }

      const degreeData = {
        user_id: Number(user.id),
        name: newDegree.name.trim(),
        major: newDegree.major.trim(),
        institution: newDegree.institution.trim(),
        graduation_year: Number(newDegree.graduation_year),
        degree_code: newDegree.degree_code || null,
        degree_level: newDegree.degree_level || null,
        received_date: newDegree.received_date || null,
        note: newDegree.note || null,
        file_url: newDegree.file_url || null,
        status: newDegree.status === "true",
      }

      await AddDegree(user.id.toString(), degreeData)

      toast({
        title: "Thành công",
        description: "Thêm bằng cấp thành công",
      })

      setNewDegree({
        name: "",
        major: "",
        institution: "",
        graduation_year: new Date().getFullYear(),
        degree_code: "",
        degree_level: "",
        received_date: "",
        note: "",
        file_url: "",
        status: "true",
      })
      setAddDegreeModal(false)
      await fetchUserData()
    } catch (error: any) {
      let errorMessage = "Có lỗi xảy ra"
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }

      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setAddingDegree(false)
    }
  }

  const handleDeleteCertificate = async () => {
    if (!deleteCertificateModal.data?.id) {
      toast({
        title: t("error"),
        description: t("deleteCertificateIdError"),
        variant: "destructive",
      })
      return
    }

    try {
      setDeletingCertificate(true)
      await DeleteCertificate(deleteCertificateModal.data.id)

      toast({
        title: t("success"),
        description: t("deleteCertificateSuccess"),
      })

      setDeleteCertificateModal({ open: false, data: null, index: -1 })
      fetchUserData()
    } catch (error: any) {
      toast({
        title: t("error"),
        description: error.message || t("deleteCertificateError"),
        variant: "destructive",
      })
    } finally {
      setDeletingCertificate(false)
    }
  }

  const handleDeleteDegree = async () => {
    if (!deleteDegreeModal.data?.id) {
      toast({
        title: t("error"),
        description: t("deleteDegreeIdError"),
        variant: "destructive",
      })
      return
    }

    try {
      setDeletingDegree(true)
      await DeleteDegree(deleteDegreeModal.data.id)

      toast({
        title: t("success"),
        description: t("deleteDegreeSuccess"),
      })

      setDeleteDegreeModal({ open: false, data: null, index: -1 })
      fetchUserData()
    } catch (error: any) {
      toast({
        title: t("error"),
        description: error.message || t("deleteDegreeError"),
        variant: "destructive",
      })
    } finally {
      setDeletingDegree(false)
    }
  }

  const handleEditCertificate = (cert: any) => {
    setEditCertificateForm({
      name: cert.name || "",
      issued_by: cert.issued_by || "",
      issued_date: cert.issued_date || "",
      expiry_date: cert.expiry_date || "",
      certificate_code: cert.certificate_code || "",
      status: String(cert.status) === "true" ? "true" : "false",
      description: cert.description || "",
      file_url: cert.file_url || "",
    })
    setEditCertificateModal({ open: true, data: cert })
  }

  const handleEditDegree = (degree: any) => {
    setEditDegreeForm({
      name: degree.name || "",
      major: degree.major || "",
      institution: degree.institution || "",
      graduation_year: degree.graduation_year || new Date().getFullYear(),
      degree_code: degree.degree_code || "",
      degree_level: degree.degree_level || "",
      received_date: degree.received_date || "",
      note: degree.note || "",
      file_url: degree.file_url || "",
      status: String(degree.status) === "true" ? "true" : "false",
    })
    setEditDegreeModal({ open: true, data: degree })
  }

  const handleUpdateCertificate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editCertificateForm.name || !editCertificateForm.issued_by || !editCertificateForm.issued_date) {
      toast({
        title: t("error"),
        description: t("requiredCertificateFields"),
        variant: "destructive",
      })
      return
    }

    if (!editCertificateModal.data?.id) {
      toast({
        title: t("error"),
        description: t("updateCertificateIdError"),
        variant: "destructive",
      })
      return
    }

    try {
      setEditingCertificate(true)

      const updateData = {
        user_id: Number(user.id),
        name: editCertificateForm.name.trim(),
        issued_by: editCertificateForm.issued_by.trim(),
        issued_date: editCertificateForm.issued_date,
        expiry_date: editCertificateForm.expiry_date || null,
        certificate_code: editCertificateForm.certificate_code || null,
        status: editCertificateForm.status === "true",
        description: editCertificateForm.description || null,
        file_url: editCertificateForm.file_url || null,
      }

      await UpdateCertificates(editCertificateModal.data.id, updateData)

      toast({
        title: t("success"),
        description: t("updateCertificateSuccess"),
      })

      setEditCertificateModal({ open: false, data: null })
      await fetchUserData()
    } catch (error: any) {
      let errorMessage = t("operationError")
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }

      toast({
        title: t("error"),
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setEditingCertificate(false)
    }
  }

  const handleUpdateDegree = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!editDegreeModal.data?.id) {
      toast({
        title: t("error"),
        description: t("updateDegreeIdError"),
        variant: "destructive",
      })
      return
    }

    try {
      setEditingDegree(true)

      const { degree_code, degree_level, received_date, note, file_url, status } = editDegreeForm

      const updateData = {
        user_id: Number(user.id),
        name: editDegreeForm.name.trim(),
        major: editDegreeForm.major.trim(),
        institution: editDegreeForm.institution.trim(),
        graduation_year: Number(editDegreeForm.graduation_year),
        degree_code: degree_code || null,
        degree_level: degree_level || null,
        received_date: received_date || null,
        note: note || null,
        file_url: file_url || null,
        status: status === "true",
      }

      await UpdateDegrees(editDegreeModal.data.id, updateData)

      toast({
        title: t("success"),
        description: t("updateDegreeSuccess"),
      })

      setEditDegreeModal({ open: false, data: null })
      await fetchUserData()
    } catch (error: any) {
      let errorMessage = t("operationError")
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }

      toast({
        title: t("error"),
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setEditingDegree(false)
    }
  }

  if (loading) {
    return (
      <>
        <TeacherDashboardHeader />
        <div className="container mx-auto py-6 px-4 md:px-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p>{t("loading")}</p>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (error || !user) {
    return (
      <>
        <TeacherDashboardHeader />
        <div className="container mx-auto py-6 px-4 md:px-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-500">{error || t("loadError")}</p>
              <Button onClick={() => fetchUserData()} className="mt-4">
                {t("tryAgain")}
              </Button>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <TeacherDashboardHeader />
      <div className="container mx-auto py-6 px-4 md:px-6">
        <div className="flex flex-col space-y-6">
          <div className="flex flex-col space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-primary">{t("teacherProfile")}</h1>
            <p className="text-muted-foreground">{t("teacherProfileDescription")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 ">
            {/* Left Column - User Info Card */}
            <Card className="md:col-span-1 flex items-center justify-center bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-900/10 dark:to-purple-900/10 border border-blue-100/50 dark:border-blue-800/30 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
              <CardContent className="pt-6 flex flex-col items-center text-center justify-center w-full space-y-4">
                <div className="relative group">
                  <Avatar className="h-28 w-28 mb-4 ring-4 ring-blue-100 dark:ring-blue-800/30 shadow-lg">
                    <AvatarImage
                      src={user.avatar || "/placeholder.svg?height=96&width=96"}
                      alt={user.name || "User"}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-blue-600 text-white text-2xl font-bold">
                      {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <label
                    htmlFor="avatar-upload"
                    className="absolute top-0 left-0 w-28 h-28 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center cursor-pointer"
                  >
                    <div className="text-white text-sm font-medium pointer-events-none">{t("changeAvatar")}</div>
                  </label>
                  <label
                    htmlFor="avatar-upload"
                    className="absolute -bottom-1 -right-1 bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 cursor-pointer border-2 border-white dark:border-gray-800 z-10"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="feather feather-camera"
                    >
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
                <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-300">{user.name || t("notUpdated")}</h2>
                <p className="text-muted-foreground font-medium">{user.email || t("notUpdated")}</p>
                <Badge className="bg-blue-600 text-white shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 border-0">
                  {getRoleName()}
                </Badge>
                <p className="text-sm text-muted-foreground font-medium px-4 py-2 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-100/50 dark:border-blue-800/30">
                  {user.user_info?.school?.name || t("notUpdated")}
                </p>

                <div className="w-full space-y-3 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10 border border-blue-100/50 dark:border-blue-800/20 rounded-xl p-4 backdrop-blur-sm">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-medium">{t("username")}:</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200 bg-white/50 dark:bg-gray-800/50 px-2 py-1 rounded-md">
                      {user.username || t("notSpecified")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-medium">{t("status")}:</span>
                    <Badge
                      variant={user.status ? "default" : "secondary"}
                      className={user.status ? "bg-green-600 text-white shadow-sm" : "bg-gray-500 text-white shadow-sm"}
                    >
                      {user.status ? t("active") : t("inactive")}
                    </Badge>
                  </div>
                </div>

                <div className="w-full space-y-2">
                  <Button
                    onClick={() => setPasswordModalOpen(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 ease-out border-0"
                  >
                    <div className="flex items-center justify-center gap-3">
                      <Settings className="h-5 w-5" />
                      <span className="text-base">{t("changePassword")}</span>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Right Column - Tabs Content */}
            <div className="md:col-span-2 space-y-4">
              <Tabs defaultValue="info" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-2 gap-2">
                  <TabsTrigger value="info" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden md:inline">{t("infoTab")}</span>
                  </TabsTrigger>
                  <TabsTrigger value="qualifications" className="flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    <span className="hidden md:inline">{t("certificates")}</span>
                  </TabsTrigger>
                  {/* <TabsTrigger value="settings" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span className="hidden md:inline">{t('settings')}</span>
                  </TabsTrigger> */}
                </TabsList>

                {/* Personal Info Tab */}
                <TabsContent value="info">
                  <Card className="h-[500px] flex flex-col">
                    <CardHeader className="flex-shrink-0">
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        {t("personalInfo")}
                      </CardTitle>
                      <CardDescription>{t("personalDetails")}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-50 dark:scrollbar-thumb-blue-600 dark:scrollbar-track-blue-900/20">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">{t("fullName")}</h3>
                          <p className="text-sm font-medium">{user.name || t("notUpdated")}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                          <p className="text-sm font-medium">{user.email || t("notUpdated")}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">{t("phone")}</h3>
                          <p className="text-sm font-medium">{user.phone_number || t("notUpdated")}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">{t("role")}</h3>
                          <p className="text-sm font-medium">{getRoleName()}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">{t("address")}</h3>
                          <p className="text-sm font-medium">{user.address || t("notUpdated")}</p>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium mb-2">{t("studyInfo")}</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{t("school")}:</span>
                            <span className="font-medium">{user.user_info?.school?.name || t("notUpdated")}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>{t("class")}:</span>
                            <span className="font-medium">{user.user_info?.class?.name || t("notUpdated")}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>{t("numberOfCourses")}:</span>
                            <span className="font-medium">{user.user_info?.courses?.length || 0}</span>
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        onClick={() => setEditModalOpen(true)}
                        className="bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 dark:hover:from-blue-800/30 dark:hover:to-purple-800/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 font-medium py-2.5 px-4 rounded-lg shadow-sm hover:shadow-md transform hover:scale-[1.02] transition-all duration-200"
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        {t("updateInfo")}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Qualifications Tab */}
                <TabsContent value="qualifications">
                  <Card className="h-[500px] flex flex-col">
                    <CardHeader className="flex-shrink-0">
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-primary" />
                        {t("certificatesAndDegrees")}
                      </CardTitle>
                      <CardDescription>{t("certificatesInfo")}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-50 dark:scrollbar-thumb-blue-600 dark:scrollbar-track-blue-900/20">
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-lg font-medium">{t("certificates")}</h3>
                          <Button
                            size="sm"
                            onClick={() => setAddCertificateModal(true)}
                            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 border-0"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            {t("addCertificate")}
                          </Button>
                        </div>
                        {user.user_info?.certificates && user.user_info.certificates.length > 0 ? (
                          <div className="space-y-3">
                            {user.user_info.certificates.map((cert: any, index: number) => (
                              <div
                                key={cert.id || index}
                                className="flex justify-between items-center p-4 rounded-lg border"
                              >
                                <div>
                                  <p className="font-medium">{cert.name || t("notSpecified")}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {t("issuedBy")}: {cert.issued_by || t("notSpecified")}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {t("issueDate")}: {formatDate(cert.issued_date)}
                                  </p>
                                  {cert.certificate_code && (
                                    <p className="text-sm text-muted-foreground">
                                      {t("certificateCode")}: {cert.certificate_code}
                                    </p>
                                  )}
                                  <Badge
                                    variant="outline"
                                    className={`mt-1 text-white font-medium ${String(cert.status) === "true"
                                      ? "bg-green-600 border-green-600"
                                      : "bg-red-600 border-red-600"
                                      }`}
                                  >
                                    {String(cert.status) === "true" ? t("active") : t("expired")}
                                  </Badge>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setViewCertificateModal({ open: true, data: cert })}
                                  >
                                    <Eye className="" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditCertificate(cert)}
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  >
                                    <Pencil className="" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setDeleteCertificateModal({ open: true, data: cert, index })}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-muted-foreground">
                            <p>{t("noCertificates")}</p>
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-lg font-medium">{t("degrees")}</h3>
                          <Button
                            size="sm"
                            onClick={() => setAddDegreeModal(true)}
                            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 border-0"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            {t("addDegree")}
                          </Button>
                        </div>
                        {user.user_info?.degrees && user.user_info.degrees.length > 0 ? (
                          <div className="space-y-3">
                            {user.user_info.degrees.map((degree: any, index: number) => (
                              <div key={degree.id || index} className="p-4 rounded-lg border">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <p className="font-medium">{degree.name || t("unknownDegree")}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {t("major")}: {degree.major || t("unknownValue")}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {t("institutionName")}: {degree.institution || t("unknownValue")}
                                    </p>
                                    {degree.graduation_year && degree.graduation_year !== 0 && (
                                      <p className="text-sm text-muted-foreground">
                                        {t("graduationYear")}: {degree.graduation_year}
                                      </p>
                                    )}
                                    {degree.degree_code && (
                                      <p className="text-sm text-muted-foreground">
                                        {t("degreeCodeLabel")}: {degree.degree_code}
                                      </p>
                                    )}
                                    <div className="mt-2">
                                      <Badge
                                        variant="outline"
                                        className={`text-white font-medium ${String(degree.status) === "true"
                                          ? "bg-green-600 border-green-600"
                                          : "bg-red-600 border-red-600"
                                          }`}
                                      >
                                        {String(degree.status) === "true" ? t("validDegree") : t("invalidDegree")}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div className="flex gap-2 justify-center">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setViewDegreeModal({ open: true, data: degree })}
                                    >
                                      <Eye className="" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEditDegree(degree)}
                                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    >
                                      <Pencil className="" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setDeleteDegreeModal({ open: true, data: degree, index })}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-muted-foreground">
                            <p>{t("noDegrees")}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings">
                  <Card className="h-[500px] flex flex-col">
                    <CardHeader className="flex-shrink-0">
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-primary" />
                        {t("quickSettings")}
                      </CardTitle>
                      <CardDescription>{t("quickSettingsDescription")}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-50 dark:scrollbar-thumb-blue-600 dark:scrollbar-track-blue-900/20">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button
                          variant="outline"
                          className="justify-start bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 dark:hover:from-blue-800/30 dark:hover:to-indigo-800/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 font-medium py-3 shadow-sm hover:shadow-md transform hover:scale-[1.02] transition-all duration-200"
                          onClick={() => setEditModalOpen(true)}
                        >
                          <User className="mr-3 h-5 w-5" />
                          {t("editProfile")}
                        </Button>
                        <Button
                          variant="outline"
                          className="justify-start bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 dark:hover:from-purple-800/30 dark:hover:to-pink-800/30 border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:text-purple-800 dark:hover:text-purple-200 font-medium py-3 shadow-sm hover:shadow-md transform hover:scale-[1.02] transition-all duration-200"
                          onClick={() => setPasswordModalOpen(true)}
                        >
                          <Settings className="mr-3 h-5 w-5" />
                          {t("changePassword")}
                        </Button>
                        <Button
                          variant="outline"
                          className="justify-start bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20 dark:hover:from-emerald-800/30 dark:hover:to-teal-800/30 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 font-medium py-3 shadow-sm hover:shadow-md transform hover:scale-[1.02] transition-all duration-200"
                        >
                          <Bell className="mr-3 h-5 w-5" />
                          {t("notificationSettings")}
                        </Button>
                        <Button
                          variant="outline"
                          className="justify-start bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 dark:hover:from-amber-800/30 dark:hover:to-orange-800/30 border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 font-medium py-3 shadow-sm hover:shadow-md transform hover:scale-[1.02] transition-all duration-200"
                        >
                          <Mail className="mr-3 h-5 w-5" />
                          {t("changeEmail")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={(open) => !updating && setEditModalOpen(open)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("editProfile")}</DialogTitle>
            <DialogDescription>{t("updatePersonalInfo")}</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSave}>
            <div>
              <Label htmlFor="username">{t("username")}</Label>
              <Input
                id="username"
                value={user.username || ""}
                onChange={(e) => setUser({ ...user, username: e.target.value })}
                required
                disabled={updating}
              />
            </div>

            <div>
              <Label htmlFor="name">{t("fullName")}</Label>
              <Input
                id="name"
                value={user.name || ""}
                onChange={(e) => setUser({ ...user, name: e.target.value })}
                required
                disabled={updating}
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user.email || ""}
                onChange={(e) => setUser({ ...user, email: e.target.value })}
                required
                disabled={updating}
              />
              <p className="text-xs text-muted-foreground mt-1">{t("emailFormat")}</p>
            </div>

            <div>
              <Label htmlFor="address">{t("address")}</Label>
              <Input
                id="address"
                value={user.address || ""}
                onChange={(e) => setUser({ ...user, address: e.target.value })}
                disabled={updating}
              />
            </div>

            <div>
              <Label htmlFor="phone">{t("phone")}</Label>
              <Input
                id="phone"
                value={user.phone_number || ""}
                onChange={(e) => setUser({ ...user, phone_number: e.target.value })}
                disabled={updating}
              />
              <p className="text-xs text-muted-foreground mt-1">{t("phoneFormat")}</p>
            </div>

            <DialogFooter className="gap-2 mt-4">
              <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={updating}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={updating}>
                {updating ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full"></div>
                    {t("saving")}
                  </>
                ) : (
                  t("saveChanges")
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Password Change Modal */}
      <Dialog open={passwordModalOpen} onOpenChange={(open) => !changingPassword && setPasswordModalOpen(open)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{tPassword("changePassword")}</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleChangePassword}>
            <div className="relative">
              <Label htmlFor="oldPassword">{tPassword("currentPassword")}</Label>
              <Input
                id="oldPassword"
                type={showOldPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={changingPassword}
              />
              <button
                type="button"
                className="absolute right-2 top-8"
                tabIndex={-1}
                onClick={() => setShowOldPassword((v: boolean) => !v)}
              >
                {showOldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
              {wrongOldPassword && <p className="text-xs text-red-500 mt-1">{tPassword("wrongCurrentPassword")}</p>}
            </div>
            <div className="relative">
              <Label htmlFor="newPassword">{tPassword("newPassword")}</Label>
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={changingPassword}
              />
              <button
                type="button"
                className="absolute right-2 top-8"
                tabIndex={-1}
                onClick={() => setShowNewPassword((v: boolean) => !v)}
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <div className="relative">
              <Label htmlFor="confirmPassword">{tPassword("confirmPassword")}</Label>
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={changingPassword}
              />
              <button
                type="button"
                className="absolute right-2 top-8"
                tabIndex={-1}
                onClick={() => setShowConfirmPassword((v: boolean) => !v)}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <DialogFooter className="gap-2 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCurrentPassword("")
                  setNewPassword("")
                  setConfirmPassword("")
                  setPasswordModalOpen(false)
                  setWrongOldPassword(false)
                }}
                disabled={changingPassword}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={changingPassword}>
                {changingPassword ? t("changing") : tPassword("changePassword")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Avatar Change Modal */}
      {avatarPreview && (
        <Dialog
          open={!!avatarPreview}
          onOpenChange={(open) => {
            if (!open && !isAvatarLoading) {
              setAvatarFile(null)
              setAvatarPreview(null)
              setSelectedAvatarFile(null)
            }
          }}
        >
          <DialogContent className="max-w-md">
            {" "}
            <DialogHeader>
              <DialogTitle>{t("changeAvatarTitle")}</DialogTitle>
              <DialogDescription>{t("confirmAvatarDescription")}</DialogDescription>
            </DialogHeader>
            <div className="flex justify-center mb-4">
              <img
                src={avatarPreview || "/placeholder.svg"}
                alt="Avatar Preview"
                className="w-32 h-32 rounded-full object-cover"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAvatarFile(null)
                  setAvatarPreview(null)
                  setSelectedAvatarFile(null)
                }}
                disabled={isAvatarLoading}
              >
                {t("cancel")}
              </Button>
              <Button type="button" onClick={saveAvatarChange} disabled={isAvatarLoading}>
                {isAvatarLoading ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full"></div>
                    {t("saving")}
                  </>
                ) : (
                  t("saveAvatar")
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* View Certificate Modal */}
      <Dialog open={viewCertificateModal.open} onOpenChange={(open) => setViewCertificateModal({ open, data: null })}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              {t("certificateDetails")}
            </DialogTitle>
          </DialogHeader>
          {viewCertificateModal.data && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">{t("certificateName")}</Label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium">{viewCertificateModal.data.name || t("unknownValue")}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">{t("issuedBy")}</Label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium">{viewCertificateModal.data.issued_by || t("unknownIssuer")}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">{t("issuedDate")}</Label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium">
                      {viewCertificateModal.data.issued_date
                        ? formatDate(viewCertificateModal.data.issued_date)
                        : t("unknownValue")}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">{t("expiryDateLabel")}</Label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium">
                      {viewCertificateModal.data.expiry_date
                        ? formatDate(viewCertificateModal.data.expiry_date)
                        : t("noExpiry")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">{t("certificateCode")}</Label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium font-mono">
                      {viewCertificateModal.data.certificate_code || t("noCode")}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">{t("status")}</Label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <Badge
                      variant="outline"
                      className={`text-white font-medium ${String(viewCertificateModal.data.status) === "true"
                        ? "bg-green-600 border-green-600"
                        : "bg-red-600 border-red-600"
                        }`}
                    >
                      {String(viewCertificateModal.data.status) === "true" ? t("validStatus") : t("invalidStatus")}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">{t("attachedFile")}</Label>
                {viewCertificateModal.data.file_url ? (
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">{t("certificateDocument")}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(viewCertificateModal.data.file_url, "_blank")}
                          className="h-8 px-3"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          {t("view")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const link = document.createElement("a")
                            link.href = viewCertificateModal.data.file_url
                            link.download = `chung-chi-${viewCertificateModal.data.name || "document"}`
                            link.click()
                          }}
                          className="h-8 px-3"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          {t("download")}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-2 text-gray-500">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">{t("noAttachedFile")}</span>
                    </div>
                  </div>
                )}
              </div>

              {viewCertificateModal.data.description && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">{t("description")}</Label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{viewCertificateModal.data.description}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button onClick={() => setViewCertificateModal({ open: false, data: null })}>{t("close")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Degree Modal */}
      <Dialog open={viewDegreeModal.open} onOpenChange={(open) => setViewDegreeModal({ open, data: null })}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              {t("degreeDetailsTitle")}
            </DialogTitle>
          </DialogHeader>
          {viewDegreeModal.data && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">{t("degreeName")}</Label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium">{viewDegreeModal.data.name || t("unknownValue")}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">{t("major")}</Label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium">{viewDegreeModal.data.major || t("unknownValue")}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">{t("institutionName")}</Label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium">{viewDegreeModal.data.institution || t("unknownValue")}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">{t("graduationYear")}</Label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium">{viewDegreeModal.data.graduation_year || t("unknownValue")}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">{t("degreeClassification")}</Label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium">{viewDegreeModal.data.degree_level}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">{t("degreeReceivedDate")}</Label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium">
                      {viewDegreeModal.data.received_date
                        ? formatDate(viewDegreeModal.data.received_date)
                        : t("unknownValue")}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">{t("degreeCodeLabel")}</Label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium font-mono">{viewDegreeModal.data.degree_code || t("noValue")}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">{t("degreeStatusLabel")}</Label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <Badge
                      variant="outline"
                      className={`text-white font-medium ${String(viewDegreeModal.data.status) === "true"
                        ? "bg-green-600 border-green-600"
                        : "bg-red-600 border-red-600"
                        }`}
                    >
                      {String(viewDegreeModal.data.status) === "true" ? t("validDegree") : t("invalidDegree")}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">{t("degreeDocumentLabel")}</Label>
                {viewDegreeModal.data.file_url ? (
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">{t("degreeDocument")}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(viewDegreeModal.data.file_url, "_blank")}
                          className="h-8 px-3"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          {t("viewDocument")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const link = document.createElement("a")
                            link.href = viewDegreeModal.data.file_url
                            link.download = `bang-cap-${viewDegreeModal.data.name || "document"}`
                            link.click()
                          }}
                          className="h-8 px-3"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          {t("downloadDocument")}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-2 text-gray-500">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">{t("noAttachedFile")}</span>
                    </div>
                  </div>
                )}
              </div>

              {viewDegreeModal.data.note && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">{t("degreeNoteLabel")}</Label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{viewDegreeModal.data.note}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button onClick={() => setViewDegreeModal({ open: false, data: null })}>{t("close")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Certificate Modal */}
      <Dialog
        open={addCertificateModal}
        onOpenChange={(open) => {
          if (!open) {
            setNewCertificate({
              name: "",
              issued_by: "",
              issued_date: "",
              expiry_date: "",
              certificate_code: "",
              status: "true",
              description: "",
              file_url: "",
            })
          }
          setAddCertificateModal(open)
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">{t("addCertificateNew")}</DialogTitle>
            <DialogDescription>{t("addCertificateDescription")}</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleAddCertificate}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cert-name">{t("certificateNameRequired")}</Label>
                <Input
                  id="cert-name"
                  value={newCertificate.name}
                  onChange={(e) => setNewCertificate({ ...newCertificate, name: e.target.value })}
                  required
                  disabled={addingCertificate || uploadingCertificateFile}
                />
              </div>
              <div>
                <Label htmlFor="cert-issued-by">{t("issuedByRequired")}</Label>
                <Input
                  id="cert-issued-by"
                  value={newCertificate.issued_by}
                  onChange={(e) => setNewCertificate({ ...newCertificate, issued_by: e.target.value })}
                  required
                  disabled={addingCertificate || uploadingCertificateFile}
                />
              </div>
              <div>
                <Label htmlFor="cert-issued-date">{t("issuedDateRequired")}</Label>
                <Input
                  id="cert-issued-date"
                  type="date"
                  required
                  value={newCertificate.issued_date}
                  onChange={(e) => setNewCertificate({ ...newCertificate, issued_date: e.target.value })}
                  disabled={addingCertificate || uploadingCertificateFile}
                />
              </div>
              <div>
                <Label htmlFor="cert-expiry-date">{t("expiryDate")}</Label>
                <Input
                  id="cert-expiry-date"
                  type="date"
                  value={newCertificate.expiry_date}
                  onChange={(e) => setNewCertificate({ ...newCertificate, expiry_date: e.target.value })}
                  disabled={addingCertificate || uploadingCertificateFile}
                />
              </div>
              <div>
                <Label htmlFor="cert-code">{t("certificateCodeLabel")}</Label>
                <Input
                  id="cert-code"
                  value={newCertificate.certificate_code}
                  onChange={(e) => setNewCertificate({ ...newCertificate, certificate_code: e.target.value })}
                  disabled={addingCertificate || uploadingCertificateFile}
                />
              </div>
              <div>
                <Label htmlFor="cert-status">{t("status")}</Label>
                <Select
                  value={newCertificate.status}
                  onValueChange={(value) => setNewCertificate({ ...newCertificate, status: value })}
                  disabled={addingCertificate || uploadingCertificateFile}
                  defaultValue="true"
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectStatus")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">{t("active")}</SelectItem>
                    <SelectItem value="false">{t("expired")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="cert-file">{t("certificateFile")}</Label>
                <div className="space-y-2">
                  <Input
                    id="cert-file"
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) =>
                      handleFileUpload(
                        e,
                        "certificates",
                        (url) => setNewCertificate((prev) => ({ ...prev, file_url: url })),
                        setUploadingCertificateFile,
                        "File chứng chỉ đã được tải lên thành công",
                        "Không thể tải file lên. Vui lòng thử lại.",
                      )
                    }
                    disabled={addingCertificate || uploadingCertificateFile}
                  />
                  {uploadingCertificateFile && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                      {t("uploadingFile")}
                    </div>
                  )}
                  {newCertificate.file_url && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {t("fileUploadedSuccess")}
                      <a
                        href={newCertificate.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        ({t("viewFile")})
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="cert-description">{t("description")}</Label>
              <Textarea
                id="cert-description"
                placeholder={t("certificateDescriptionPlaceholder")}
                value={newCertificate.description}
                onChange={(e) => setNewCertificate({ ...newCertificate, description: e.target.value })}
                disabled={addingCertificate || uploadingCertificateFile}
                rows={3}
              />
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setNewCertificate({
                    name: "",
                    issued_by: "",
                    issued_date: "",
                    expiry_date: "",
                    certificate_code: "",
                    status: "true",
                    description: "",
                    file_url: "",
                  })
                  setAddCertificateModal(false)
                }}
                disabled={addingCertificate || uploadingCertificateFile}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={addingCertificate || uploadingCertificateFile}>
                {addingCertificate ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full"></div>
                    {t("adding")}
                  </>
                ) : (
                  t("addCertificateButton")
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Degree Modal */}
      <Dialog open={addDegreeModal} onOpenChange={setAddDegreeModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">{t("addDegreeNew")}</DialogTitle>
            <DialogDescription>{t("addDegreeDescription")}</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleAddDegree}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="degree-name">{t("degreeNameRequired")}</Label>
                <Input
                  id="degree-name"
                  value={newDegree.name}
                  onChange={(e) => setNewDegree({ ...newDegree, name: e.target.value })}
                  required
                  disabled={addingDegree || uploadingDegreeFile}
                />
              </div>
              <div>
                <Label htmlFor="degree-major">{t("majorRequired")}</Label>
                <Input
                  id="degree-major"
                  value={newDegree.major}
                  onChange={(e) => setNewDegree({ ...newDegree, major: e.target.value })}
                  required
                  disabled={addingDegree || uploadingDegreeFile}
                />
              </div>
              <div>
                <Label htmlFor="degree-institution">{t("institutionRequired")}</Label>
                <Input
                  id="degree-institution"
                  value={newDegree.institution}
                  onChange={(e) => setNewDegree({ ...newDegree, institution: e.target.value })}
                  required
                  disabled={addingDegree || uploadingDegreeFile}
                />
              </div>
              <div>
                <Label htmlFor="degree-year">{t("graduationYearLabel")} *</Label>
                <Input
                  id="degree-year"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={newDegree.graduation_year}
                  onChange={(e) => setNewDegree({ ...newDegree, graduation_year: Number.parseInt(e.target.value) })}
                  required
                  disabled={addingDegree || uploadingDegreeFile}
                />
              </div>
              <div>
                <Label htmlFor="degree-level">{t("degreeLevel")} *</Label>
                <Select
                  value={newDegree.degree_level}
                  onValueChange={(value) => setNewDegree({ ...newDegree, degree_level: value })}
                  disabled={addingDegree || uploadingDegreeFile}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectDegreeLevel")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">{t("excellent")}</SelectItem>
                    <SelectItem value="very_good">{t("veryGood")}</SelectItem>
                    <SelectItem value="good">{t("good")}</SelectItem>
                    <SelectItem value="average">{t("average")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="degree-received-date">{t("receivedDateLabel")}</Label>
                <Input
                  id="degree-received-date"
                  type="date"
                  value={newDegree.received_date}
                  onChange={(e) => setNewDegree({ ...newDegree, received_date: e.target.value })}
                  disabled={addingDegree || uploadingDegreeFile}
                />
              </div>
              <div>
                <Label htmlFor="degree-certificate-code">{t("degreeCodeLabel")}</Label>
                <Input
                  id="degree-certificate-code"
                  placeholder={t("degreeCodePlaceholder")}
                  value={newDegree.degree_code}
                  onChange={(e) => setNewDegree({ ...newDegree, degree_code: e.target.value })}
                  disabled={addingDegree || uploadingDegreeFile}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="degree-status">Trạng thái *</Label>
              <Select
                value={newDegree.status}
                onValueChange={(value) => setNewDegree({ ...newDegree, status: value })}
                disabled={addingDegree || uploadingDegreeFile}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectStatusPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">{t("validStatus")}</SelectItem>
                  <SelectItem value="false">{t("invalidStatus")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="degree-file">{t("degreeFile")}</Label>
              <div className="space-y-2">
                <Input
                  id="degree-file"
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) =>
                    handleFileUpload(
                      e,
                      "degrees",
                      (url) => setNewDegree((prev) => ({ ...prev, file_url: url })),
                      setUploadingDegreeFile,
                      "File bằng cấp đã được tải lên thành công",
                      "Không thể tải file lên. Vui lòng thử lại.",
                    )
                  }
                  disabled={addingDegree || uploadingDegreeFile}
                />
                {uploadingDegreeFile && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                    {t("uploadingFile")}
                  </div>
                )}
                {newDegree.file_url && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {t("fileUploadedSuccess")}
                    <a
                      href={newDegree.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      ({t("viewFile")})
                    </a>
                  </div>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="degree-note">{t("note")}</Label>
              <Textarea
                id="degree-note"
                placeholder={t("degreeNotePlaceholder")}
                value={newDegree.note}
                onChange={(e) => setNewDegree({ ...newDegree, note: e.target.value })}
                disabled={addingDegree || uploadingDegreeFile}
                rows={3}
              />
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setNewDegree({
                    name: "",
                    major: "",
                    institution: "",
                    graduation_year: new Date().getFullYear(),
                    degree_code: "",
                    degree_level: "",
                    received_date: "",
                    note: "",
                    file_url: "",
                    status: "true",
                  })
                  setAddDegreeModal(false)
                }}
                disabled={addingDegree || uploadingDegreeFile}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={addingDegree || uploadingDegreeFile}>
                {addingDegree ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full"></div>
                    {t("adding")}
                  </>
                ) : (
                  t("addDegreeButton")
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Certificate Confirmation Modal */}
      <Dialog
        open={deleteCertificateModal.open}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteCertificateModal({ open: false, data: null, index: -1 })
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("confirmDeleteCertificate")}</DialogTitle>
            <DialogDescription>
              {t("confirmDeleteQuestion")} "{deleteCertificateModal.data?.name}"?
              <br />
              {t("actionCannotBeUndone")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteCertificateModal({ open: false, data: null, index: -1 })}
              disabled={deletingCertificate}
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteCertificate}
              disabled={deletingCertificate}
            >
              {deletingCertificate ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full"></div>
                  {t("deleting")}
                </>
              ) : (
                t("deleteCertificateButton")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Degree Confirmation Modal */}
      <Dialog
        open={deleteDegreeModal.open}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDegreeModal({ open: false, data: null, index: -1 })
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("confirmDeleteDegree")}</DialogTitle>
            <DialogDescription>
              {t("confirmDeleteQuestion")} "{deleteDegreeModal.data?.name}"?
              <br />
              {t("actionCannotBeUndone")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDegreeModal({ open: false, data: null, index: -1 })}
              disabled={deletingDegree}
            >
              {t("cancel")}
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteDegree} disabled={deletingDegree}>
              {deletingDegree ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full"></div>
                  {t("deleting")}
                </>
              ) : (
                t("deleteDegreeButton")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Certificate Modal */}
      <Dialog
        open={editCertificateModal.open}
        onOpenChange={(open) => {
          if (!open) {
            setEditCertificateModal({ open: false, data: null })
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" />
              {t("editCertificateTitle")}
            </DialogTitle>
            <DialogDescription>{t("editCertificateDescription")}</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleUpdateCertificate}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-cert-name">{t("certificateNameRequired")}</Label>
                <Input
                  id="edit-cert-name"
                  value={editCertificateForm.name}
                  onChange={(e) => setEditCertificateForm({ ...editCertificateForm, name: e.target.value })}
                  required
                  disabled={editingCertificate || uploadingEditCertificateFile}
                />
              </div>
              <div>
                <Label htmlFor="edit-cert-issued-by">{t("issuedByRequired")}</Label>
                <Input
                  id="edit-cert-issued-by"
                  value={editCertificateForm.issued_by}
                  onChange={(e) => setEditCertificateForm({ ...editCertificateForm, issued_by: e.target.value })}
                  required
                  disabled={editingCertificate || uploadingEditCertificateFile}
                />
              </div>
              <div>
                <Label htmlFor="edit-cert-issued-date">{t("issuedDateRequired")}</Label>
                <Input
                  id="edit-cert-issued-date"
                  type="date"
                  value={editCertificateForm.issued_date}
                  onChange={(e) => setEditCertificateForm({ ...editCertificateForm, issued_date: e.target.value })}
                  required
                  disabled={editingCertificate || uploadingEditCertificateFile}
                />
              </div>
              <div>
                <Label htmlFor="edit-cert-expiry-date">{t("expiryDate")}</Label>
                <Input
                  id="edit-cert-expiry-date"
                  type="date"
                  value={editCertificateForm.expiry_date}
                  onChange={(e) => setEditCertificateForm({ ...editCertificateForm, expiry_date: e.target.value })}
                  disabled={editingCertificate || uploadingEditCertificateFile}
                />
              </div>
              <div>
                <Label htmlFor="edit-cert-code">{t("certificateCodeLabel")}</Label>
                <Input
                  id="edit-cert-code"
                  value={editCertificateForm.certificate_code}
                  onChange={(e) => setEditCertificateForm({ ...editCertificateForm, certificate_code: e.target.value })}
                  disabled={editingCertificate || uploadingEditCertificateFile}
                />
              </div>
              <div>
                <Label htmlFor="edit-cert-status">{t("status")}</Label>
                <Select
                  value={editCertificateForm.status}
                  onValueChange={(value) => setEditCertificateForm({ ...editCertificateForm, status: value })}
                  disabled={editingCertificate || uploadingEditCertificateFile}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">{t("active")}</SelectItem>
                    <SelectItem value="false">{t("expired")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-cert-file">{t("certificateFile")}</Label>
                <div className="space-y-2">
                  <Input
                    id="edit-cert-file"
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) =>
                      handleFileUpload(
                        e,
                        "certificates",
                        (url) => setEditCertificateForm((prev) => ({ ...prev, file_url: url })),
                        setUploadingEditCertificateFile,
                        "File chứng chỉ đã được tải lên thành công",
                        "Không thể tải file lên. Vui lòng thử lại.",
                      )
                    }
                    disabled={editingCertificate || uploadingEditCertificateFile}
                  />
                  {uploadingEditCertificateFile && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                      {t("uploadingFile")}
                    </div>
                  )}
                  {editCertificateForm.file_url && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {t("currentFileLabel")}
                      <a
                        href={editCertificateForm.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {t("viewFileLink")}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-cert-description">{t("description")}</Label>
              <Textarea
                id="edit-cert-description"
                placeholder={t("descriptionPlaceholder")}
                value={editCertificateForm.description}
                onChange={(e) => setEditCertificateForm({ ...editCertificateForm, description: e.target.value })}
                disabled={editingCertificate || uploadingEditCertificateFile}
                rows={3}
              />
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditCertificateModal({ open: false, data: null })}
                disabled={editingCertificate || uploadingEditCertificateFile}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={editingCertificate || uploadingEditCertificateFile}>
                {editingCertificate ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full"></div>
                    {t("updating")}
                  </>
                ) : (
                  t("updateCertificateButton")
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Degree Modal */}
      <Dialog
        open={editDegreeModal.open}
        onOpenChange={(open) => {
          if (!open) {
            setEditDegreeModal({ open: false, data: null })
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" />
              {t("editDegreeTitle")}
            </DialogTitle>
            <DialogDescription>{t("editDegreeDescription")}</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleUpdateDegree}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-degree-name">{t("degreeNameRequired")}</Label>
                <Input
                  id="edit-degree-name"
                  value={editDegreeForm.name}
                  onChange={(e) => setEditDegreeForm({ ...editDegreeForm, name: e.target.value })}
                  required
                  disabled={editingDegree || uploadingEditDegreeFile}
                />
              </div>
              <div>
                <Label htmlFor="edit-degree-major">{t("majorRequired")}</Label>
                <Input
                  id="edit-degree-major"
                  value={editDegreeForm.major}
                  onChange={(e) => setEditDegreeForm({ ...editDegreeForm, major: e.target.value })}
                  required
                  disabled={editingDegree || uploadingEditDegreeFile}
                />
              </div>
              <div>
                <Label htmlFor="edit-degree-institution">{t("institutionRequired")}</Label>
                <Input
                  id="edit-degree-institution"
                  value={editDegreeForm.institution}
                  onChange={(e) => setEditDegreeForm({ ...editDegreeForm, institution: e.target.value })}
                  required
                  disabled={editingDegree || uploadingEditDegreeFile}
                />
              </div>
              <div>
                <Label htmlFor="edit-degree-year">{t("graduationYearLabel")}</Label>
                <Input
                  id="edit-degree-year"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={editDegreeForm.graduation_year}
                  onChange={(e) =>
                    setEditDegreeForm({ ...editDegreeForm, graduation_year: Number.parseInt(e.target.value) })
                  }
                  required
                  disabled={editingDegree || uploadingEditDegreeFile}
                />
              </div>
              <div>
                <Label htmlFor="edit-degree-level">{t("degreeLevel")}</Label>
                <Select
                  value={editDegreeForm.degree_level}
                  onValueChange={(value) => setEditDegreeForm({ ...editDegreeForm, degree_level: value })}
                  disabled={editingDegree || uploadingEditDegreeFile}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectDegreeLevel")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Xuất sắc">{t("excellent")}</SelectItem>
                    <SelectItem value="Giỏi">{t("veryGood")}</SelectItem>
                    <SelectItem value="Khá">{t("good")}</SelectItem>
                    <SelectItem value="Trung bình">{t("average")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-degree-received-date">{t("receivedDateLabel")}</Label>
                <Input
                  id="edit-degree-received-date"
                  type="date"
                  value={editDegreeForm.received_date}
                  onChange={(e) => setEditDegreeForm({ ...editDegreeForm, received_date: e.target.value })}
                  disabled={editingDegree || uploadingEditDegreeFile}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-degree-certificate-code">{t("degreeCodeLabel")}</Label>
                <Input
                  id="edit-degree-certificate-code"
                  placeholder={t("degreeCodePlaceholder")}
                  value={editDegreeForm.degree_code}
                  onChange={(e) => setEditDegreeForm({ ...editDegreeForm, degree_code: e.target.value })}
                  disabled={editingDegree || uploadingEditDegreeFile}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-degree-status">{t("status")}</Label>
                <Select
                  value={editDegreeForm.status}
                  onValueChange={(value) => setEditDegreeForm({ ...editDegreeForm, status: value })}
                  disabled={editingDegree || uploadingEditDegreeFile}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectStatusPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">{t("validDegree")}</SelectItem>
                    <SelectItem value="false">{t("invalidDegree")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-degree-file">{t("degreeFile")}</Label>
              <div className="space-y-2">
                <Input
                  id="edit-degree-file"
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) =>
                    handleFileUpload(
                      e,
                      "degrees",
                      (url) => setEditDegreeForm((prev) => ({ ...prev, file_url: url })),
                      setUploadingEditDegreeFile,
                      "File bằng cấp đã được tải lên thành công",
                      "Không thể tải file lên. Vui lòng thử lại.",
                    )
                  }
                  disabled={editingDegree || uploadingEditDegreeFile}
                />
                {uploadingEditDegreeFile && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                    {t("uploadingFile")}
                  </div>
                )}
                {editDegreeForm.file_url && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {t("currentFileLabel")}
                    <a
                      href={editDegreeForm.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {t("viewFileLink")}
                    </a>
                  </div>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="edit-degree-note">{t("note")}</Label>
              <Textarea
                id="edit-degree-note"
                placeholder={t("degreeNotePlaceholder")}
                value={editDegreeForm.note}
                onChange={(e) => setEditDegreeForm({ ...editDegreeForm, note: e.target.value })}
                disabled={editingDegree || uploadingEditDegreeFile}
                rows={3}
              />
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDegreeModal({ open: false, data: null })}
                disabled={editingDegree || uploadingEditDegreeFile}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={editingDegree || uploadingEditDegreeFile}>
                {editingDegree ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full"></div>
                    {t("updating")}
                  </>
                ) : (
                  t("updateDegreeButton")
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Avatar Cropper */}
      <ImageCropper
        imageFile={selectedAvatarFile}
        isOpen={cropperOpen}
        onClose={handleCropperClose}
        onCropComplete={handleCropComplete}
        aspectRatio={1} // Square avatar
        cropSize={300}
      />
    </>
  )
}
