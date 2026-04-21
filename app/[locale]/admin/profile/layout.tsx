"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { BarChart, ChevronRight, Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"
import axiosInstance from "@/lib/api/axios"
import { GetUserLogin, ChangePassword } from "@/lib/api/users"
import { UploadMedia } from "@/lib/api/picture"
import { useToast } from "@/components/ui/use-toast"
import ImageCropper from "@/components/ui/image-cropper"
import Loading from "@/app/loading"
import { useTranslations } from "next-intl"
import "@/styles/admin-profile-mobile.css"

export default function AdminProfileLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const t = useTranslations('admin')

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [user, setUser] = useState({
        name: "string",
        role: "string",
        avatar: "string",
    })

    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
    const [showCropper, setShowCropper] = useState(false)
    const [cropImageFile, setCropImageFile] = useState<File | null>(null)

    const [showOldPassword, setShowOldPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [wrongOldPassword, setWrongOldPassword] = useState(false)
    const [changingPassword, setChangingPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()

    useEffect(() => {
        const fetchUser = async () => {
            const res = await GetUserLogin()
            console.log("Kết quả trả về từ API:", res)

            const apiUser = res?.data?.user || res?.user || res?.data

            if (apiUser) {
                const roleId = apiUser.role?.id || apiUser.role_id
                const roleMap: Record<string, string> = {
                    "1": "admin",
                    "2": "teacher",
                    "3": "student",
                }
                const roleName = roleMap[roleId] || "unknown"
                setUser({
                    ...apiUser,
                    role_id: roleId,
                    role_name: roleName,
                })
                console.log("Thông tin người dùng:", {
                    ...apiUser,
                    role_id: roleId,
                    role_name: roleName,
                })
            } else {
                console.warn("API trả về user là null hoặc undefined")
            }
        }
        fetchUser()
    }, [])

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setCropImageFile(file)
            setShowCropper(true)
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

        setShowCropper(false)
    }

    const handleCropperClose = () => {
        setShowCropper(false)
        setCropImageFile(null)
    }

    const saveAvatarChange = async () => {
        if (!avatarFile) return

        try {
            setIsLoading(true)
            console.log("Đang upload ảnh lên server...")
            const uploadResponse = await UploadMedia(avatarFile, "avatars")
            console.log("Kết quả upload:", uploadResponse)

            const imageUrl = uploadResponse.data?.url || uploadResponse.url

            if (!imageUrl) {
                throw new Error(t('noImageUrlError'))
            }

            console.log("URL ảnh đã upload:", imageUrl)

            const updatedUserData = {
                ...user,
                avatar: imageUrl,
            }

            console.log("Dữ liệu gửi đi:", updatedUserData)

            const response = await axiosInstance.put("/manage/profile", updatedUserData)
            console.log("Kết quả cập nhật avatar:", response)

            setUser({
                ...user,
                avatar: imageUrl,
            })

            setAvatarFile(null)
            setAvatarPreview(null)

            toast({
                title: t('avatarUpdateSuccess'),
                description: t('avatarUpdateSuccessDesc'),
                variant: "default",
            })
        } catch (error: any) {
            console.error("Lỗi khi cập nhật ảnh đại diện:", error)
            toast({
                title: t('avatarUpdateError'),
                description: error.message || t('avatarUpdateErrorDesc'),
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handlePasswordChange = async () => {
        setWrongOldPassword(false)
        if (newPassword !== confirmPassword) {
            toast({
                title: t('error'),
                description: t('passwordMismatch'),
                variant: "destructive",
            })
            return
        }
        if (!currentPassword || !newPassword) {
            toast({
                title: t('error'),
                description: t('missingFields'),
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
                title: "Thành công",
                description: t('passwordChangeSuccess'),
            })
            setCurrentPassword("")
            setNewPassword("")
            setConfirmPassword("")
            setIsModalOpen(false)
        } catch (error: any) {
            if (error.message && error.message.toLowerCase().includes("mật khẩu hiện tại")) {
                setWrongOldPassword(true)
            }
            toast({
                title: t('error'),
                description: error.message || t('passwordChangeError'),
                variant: "destructive",
            })
        } finally {
            setChangingPassword(false)
        }
    }

    const navItems = [
        {
            title: t('changePassword'),
            href: "#",
            icon: BarChart,
            active: false,
            onClick: () => setIsModalOpen(true),
        },
    ]

    return (
        <>
            {isLoading && <Loading />}
            <div className="flex min-h-screen flex-col">
                <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 flex flex-col lg:flex-row gap-4 lg:gap-6">
                    {/* Mobile Header với Avatar */}
                    <div className="lg:hidden bg-white rounded-xl shadow-md p-4 mb-4">
                        <div className="flex items-center gap-4">
                            <div className="relative flex-shrink-0">
                                <img
                                    src={avatarPreview || (user.avatar && user.avatar !== "string" ? user.avatar : "/placeholder-user.jpg")}
                                    alt="Avatar"
                                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-blue-500 object-cover"
                                />
                                <label
                                    htmlFor="avatar-upload-mobile"
                                    className="absolute bottom-0 right-0 bg-blue-500 text-white p-1.5 rounded-full shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
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
                                    <input
                                        id="avatar-upload-mobile"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleAvatarChange}
                                    />
                                </label>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-lg sm:text-xl font-bold text-blue-600 truncate">{user.name}</h2>
                                <p className="text-gray-500 text-sm">{t('administrator')}</p>
                            </div>
                            <div className="flex-shrink-0">
                                {navItems.map((item, index) => (
                                    <button
                                        key={index}
                                        onClick={item.onClick}
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors text-sm"
                                    >
                                        <item.icon className="h-4 w-4" />
                                        <span className="hidden sm:inline">{item.title}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Desktop Sidebar */}
                    <aside className="hidden lg:block w-1/4 xl:w-1/5 bg-white rounded-xl shadow-md p-4 h-fit">
                        <div className="flex flex-col items-center mb-6">
                            <div className="relative">
                                <img
                                    src={avatarPreview || (user.avatar && user.avatar !== "string" ? user.avatar : "/placeholder-user.jpg")}
                                    alt="Avatar"
                                    className="w-24 h-24 rounded-full border-4 border-blue-500 object-cover"
                                />
                                <label
                                    htmlFor="avatar-upload"
                                    className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20"
                                        height="20"
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
                                    <input
                                        id="avatar-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleAvatarChange}
                                    />
                                </label>
                            </div>
                            <h2 className="text-xl font-bold mt-3 text-blue-600">{user.name}</h2>
                            <p className="text-gray-500 text-sm">{t('administrator')}</p>
                        </div>

                        <nav className="mt-6">
                            <ul className="space-y-3">
                                {navItems.map((item, index) => (
                                    <li key={index} className="flex justify-center px-2">
                                        <button
                                            onClick={item.onClick}
                                            className={cn(
                                                "flex items-center gap-3 px-6 py-3.5 rounded-lg transition-all duration-200 w-full max-w-[240px] min-w-[200px] hover:shadow-md",
                                                item.active
                                                    ? "bg-blue-100 text-blue-600 shadow-sm"
                                                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                                            )}
                                        >
                                            <item.icon className="h-5 w-5 flex-shrink-0" />
                                            <span className="font-medium">{item.title}</span>
                                            <ChevronRight className="h-4 w-4 ml-auto flex-shrink-0" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </aside>

                    {/* Main content */}
                    <main className="flex-1 bg-white rounded-xl shadow-md p-3">{children}</main>
                </div>

                {/* Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                            <h2 className="text-lg sm:text-xl font-bold mb-4">{t('changePasswordTitle')}</h2>
                            <div className="space-y-4">
                                <div className="relative">
                                    <label className="block text-sm font-medium mb-1">{t('currentPassword')}</label>
                                    <input
                                        type={showOldPassword ? "text" : "password"}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg text-sm pr-10"
                                        disabled={changingPassword}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-2 top-8"
                                        tabIndex={-1}
                                        onClick={() => setShowOldPassword((v) => !v)}
                                    >
                                        {showOldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                    {wrongOldPassword && (
                                        <p className="text-xs text-red-500 mt-1">{t('wrongCurrentPassword')}</p>
                                    )}
                                </div>
                                <div className="relative">
                                    <label className="block text-sm font-medium mb-1">{t('newPassword')}</label>
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg text-sm pr-10"
                                        disabled={changingPassword}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-2 top-8"
                                        tabIndex={-1}
                                        onClick={() => setShowNewPassword((v) => !v)}
                                    >
                                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                <div className="relative">
                                    <label className="block text-sm font-medium mb-1">{t('confirmNewPassword')}</label>
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg text-sm pr-10"
                                        disabled={changingPassword}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-2 top-8"
                                        tabIndex={-1}
                                        onClick={() => setShowConfirmPassword((v) => !v)}
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                            <div className="mt-6 flex flex-col sm:flex-row justify-end gap-2">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-full sm:w-auto px-4 py-2 bg-gray-200 rounded-lg text-sm order-2 sm:order-1"
                                    disabled={changingPassword}
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    onClick={handlePasswordChange}
                                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg text-sm order-1 sm:order-2"
                                    disabled={changingPassword}
                                >
                                    {changingPassword ? t('changing') : t('save')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal xác nhận thay đổi avatar */}
                {avatarPreview && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                            <h2 className="text-lg sm:text-xl font-bold mb-4">{t('confirmAvatarChangeTitle')}</h2>
                            <div className="flex justify-center mb-4">
                                <img
                                    src={avatarPreview || "/placeholder.svg"}
                                    alt={t('avatarPreview')}
                                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover"
                                />
                            </div>
                            <div className="mt-6 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                                <button
                                    onClick={() => {
                                        setAvatarFile(null)
                                        setAvatarPreview(null)
                                    }}
                                    className="w-full sm:w-auto px-4 py-2 bg-gray-200 rounded-lg text-sm order-2 sm:order-1"
                                    disabled={isLoading}
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    onClick={saveAvatarChange}
                                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg text-sm order-1 sm:order-2"
                                    disabled={isLoading}
                                >
                                    {isLoading ? t('saving') : t('save')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Image Cropper */}
                <ImageCropper
                    imageFile={cropImageFile}
                    isOpen={showCropper}
                    onClose={handleCropperClose}
                    onCropComplete={handleCropComplete}
                    aspectRatio={1}
                    cropSize={300}
                />
            </div>
        </>
    )
}
