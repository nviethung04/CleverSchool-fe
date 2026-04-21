"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { User, ChevronRight, Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { DashboardHeader } from "@/components/dashboard-header"
import { GetUserLogin, ChangePassword } from "@/lib/api/users"
import axiosInstance from "@/lib/api/axios"
import { UploadMedia } from "@/lib/api/picture"
import { useToast } from "@/components/ui/use-toast"
import ImageCropper from "@/components/ui/image-cropper"
import Loading from "@/app/loading"
import { useTranslations } from "next-intl"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProfileLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const t = useTranslations()
    const pathname = usePathname()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [user, setUser] = useState<any>(null)
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
            console.log("API response result:", res)

            const apiUser = res?.data?.user || res?.user || res?.data

            if (apiUser) {
                // Get role_id from API
                const roleId = apiUser.role?.id || apiUser.role_id
                // Map role_id to role_name
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
                console.log("User information:", {
                    ...apiUser,
                    role_id: roleId,
                    role_name: roleName,
                })
            } else {
                console.warn("API returned null or undefined user")
            }
        }
        fetchUser()
    }, [])

    const handlePasswordChange = async () => {
        setWrongOldPassword(false)
        if (newPassword !== confirmPassword) {
            toast({
                title: t("common.error"),
                description: t("password.passwordMismatch"),
                variant: "destructive",
            })
            return
        }
        if (!currentPassword || !newPassword) {
            toast({
                title: t("common.error"),
                description: t("password.fillAllFields"),
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
                title: t("common.success"),
                description: t("password.passwordUpdated"),
            })
            setCurrentPassword("")
            setNewPassword("")
            setConfirmPassword("")
            setIsModalOpen(false)
        } catch (error: any) {
            if (error.message && error.message.toLowerCase().includes("current password")) {
                setWrongOldPassword(true)
            }
            toast({
                title: t("common.error"),
                description: error.message || t("password.passwordUpdateError"),
                variant: "destructive",
            })
        } finally {
            setChangingPassword(false)
        }
    }

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            setCropImageFile(file)
            setShowCropper(true)
        }
    }

    const handleCropComplete = (croppedFile: File) => {
        setAvatarFile(croppedFile)

        // Create URL preview for cropped image
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
            // Upload file to server to get URL
            setIsLoading(true)
            console.log("Uploading image to server...")
            const uploadResponse = await UploadMedia(avatarFile, "avatars")
            console.log("Upload result:", uploadResponse)

            // Get image URL from response
            const imageUrl = uploadResponse.data?.url || uploadResponse.url

            if (!imageUrl) {
                throw new Error("Could not receive image URL from server")
            }

            console.log("Uploaded image URL:", imageUrl)

            // Prepare data to send with URL
            const updatedUserData = {
                ...user,
                avatar: imageUrl, // Use URL
            }

            console.log("Data to send:", updatedUserData)

            // Call API to update user information
            const response = await axiosInstance.put("/manage/profile", updatedUserData)
            console.log("Avatar update result:", response)

            // Update user state with new avatar
            setUser({ ...user, avatar: imageUrl })

            // Reset state
            setAvatarFile(null)
            setAvatarPreview(null)

            toast({
                title: t("common.success"),
                description: t("profile.updateAvatarSuccess"),
            })
        } catch (error: any) {
            console.error("Error updating avatar:", error)
            toast({
                title: t("common.error"),
                description: error.message || t("profile.updateAvatarError"),
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    const navItems = [
        {
            title: t("profile.changePassword"),
            href: "#",
            icon: User,
            active: false,
            onClick: () => setIsModalOpen(true),
        },
    ]

    return (
        <>
            {isLoading && <Loading />}
            <div className="flex min-h-screen flex-col">
                <DashboardHeader />
                <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-6">
                    {/* Sidebar */}
                    <aside className="w-full md:w-1/4 lg:w-1/5 bg-white rounded-xl shadow-md p-4 h-fit">
                        <div className="flex flex-col items-center mb-6">
                            <div className="relative">
                                {/* Avatar */}
                                {user ? (
                                    <img
                                        src={
                                            avatarPreview ||
                                            (user.avatar && user.avatar !== "string" ? user.avatar : "/placeholder-user.jpg")
                                        }
                                        alt="Avatar"
                                        className="w-24 h-24 rounded-full border-4 border-blue-500 object-cover"
                                    />
                                ) : (
                                    <Skeleton className="w-24 h-24 rounded-full" />
                                )}

                                {user && (
                                    <label
                                        htmlFor="avatar-upload"
                                        className="absolute bottom-0 right-0 bg-blue-500 text-white p-1.5 sm:p-2 rounded-full shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer"
                                    >
                                        {/* camera icon responsive */}
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="w-4 h-4 sm:w-5 sm:h-5"
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
                                )}
                            </div>

                            {/* Student Name */}
                            {user ? (
                                <h2 className="text-xl font-bold mt-3 text-blue-600">{user.name}</h2>
                            ) : (
                                <Skeleton className="h-5 w-32 mt-4 rounded-md" />
                            )}

                            <p className="text-gray-500 text-sm">{t("profile.student")}</p>
                        </div>

                        {/* School */}
                        {user ? (
                            <p className="text-m text-muted-foreground mb-5 text-center">
                                {t("profile.school")} : {user.user_info?.school?.name || t("profile.notUpdated")}
                            </p>
                        ) : (
                            <Skeleton className="h-4 w-48 mx-auto mb-4 rounded-md" />
                        )}

                        {/* Class */}
                        {user ? (
                            <p className="text-m text-muted-foreground mb-5 text-center">
                                {t("profile.class")} : {user.user_info?.class?.name || t("profile.notUpdated")}
                            </p>
                        ) : (
                            <Skeleton className="h-4 w-40 mx-auto mb-4 rounded-md" />
                        )}

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

                    {avatarPreview && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                                <h2 className="text-xl font-bold mb-4">{t("profile.changeAvatarConfirm")}</h2>
                                <div className="flex justify-center mb-4">
                                    <img
                                        src={avatarPreview || "/placeholder.svg"}
                                        alt="Avatar Preview"
                                        className="w-32 h-32 rounded-full object-cover"
                                    />
                                </div>
                                <div className="mt-6 flex justify-end space-x-2">
                                    <button
                                        onClick={() => {
                                            setAvatarFile(null)
                                            setAvatarPreview(null)
                                        }}
                                        className="px-4 py-2 bg-gray-200 rounded-lg text-sm"
                                        disabled={isLoading}
                                    >
                                        {t("common.cancel")}
                                    </button>
                                    <button
                                        onClick={saveAvatarChange}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? t("profile.saving") : t("common.save")}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Main content */}
                    <main className="flex-1 bg-white rounded-xl shadow-md p-6">{children}</main>
                </div>

                {/* Image Cropper Modal */}
                <ImageCropper
                    imageFile={cropImageFile}
                    isOpen={showCropper}
                    onCropComplete={handleCropComplete}
                    onClose={handleCropperClose}
                />

                {/* Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                            <h2 className="text-xl font-bold mb-4">{t("password.changePassword")}</h2>
                            <div className="space-y-4">
                                <div className="relative">
                                    <label className="block text-sm font-medium mb-1">{t("password.currentPassword")}</label>
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
                                    {wrongOldPassword && <p className="text-xs text-red-500 mt-1">{t("password.wrongCurrentPassword")}</p>}
                                </div>
                                <div className="relative">
                                    <label className="block text-sm font-medium mb-1">{t("password.newPassword")}</label>
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
                                    <label className="block text-sm font-medium mb-1">{t("password.confirmPassword")}</label>
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
                            <div className="mt-6 flex justify-end space-x-2">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 bg-gray-200 rounded-lg text-sm"
                                    disabled={changingPassword}
                                >
                                    {t("common.cancel")}
                                </button>
                                <button
                                    onClick={handlePasswordChange}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
                                    disabled={changingPassword}
                                >
                                    {changingPassword ? t("profile.changing") : t("common.save")}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}
