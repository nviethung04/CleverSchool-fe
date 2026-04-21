"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, Settings, Mail, UserCog, Palette, Bell } from "lucide-react"
import Link from "next/link"
import { GetUserLogin, UpdateUserLogin } from "@/lib/api/users"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import Loading from "@/app/loading"
import { useTranslations } from "next-intl"

export default function AdminProfilePage() {
    const t = useTranslations('admin')
    const common = useTranslations('common')

    const [user, setUser] = useState<any>({
        username: "string",
        name: "string",
        email: "string",
        address: "string",
        phone_number: "string",
        role_name: "admin",
        language: "en",
    })
    const [activeTab, setActiveTab] = useState("info")
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        const fetchUser = async () => {
            const res = await GetUserLogin()
            console.log("Kết quả trả về từ API:", res)

            const apiUser = res?.data?.user || res?.user || res?.data

            if (apiUser) {
                // Lấy role_id từ API
                const roleId = apiUser.role?.id || apiUser.role_id
                // Map role_id sang role_name
                const roleMap: Record<string, string> = {
                    "0": "admin",
                    "1": "admin",
                    "2": "teacher",
                    "3": "student",
                }
                const roleName = roleMap[roleId] || "unknown"
                setUser({
                    ...apiUser,
                    role_id: roleId,
                    role_name: roleName,
                    avatar: apiUser.avatar || "/placeholder-user.jpg",
                })
                console.log("Thông tin người dùng:", {
                    ...apiUser,
                    role_id: roleId,
                    role_name: roleName,
                })
            } else {
                console.warn(t('apiReturnNull'))
            }
        }
        fetchUser()
    }, [t])

    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }

    const validatePhoneNumber = (phoneNumber: string) => {
        const phoneRegex = /^\+?[0-9]{10,15}$/
        return phoneRegex.test(phoneNumber)
    }

    const handleSave = async () => {
        if (!validateEmail(user.email)) {
            alert(t('invalidEmail'))
            return
        }

        if (!validatePhoneNumber(user.phone_number)) {
            alert(t('invalidPhone'))
            return
        }
        setIsSaving(true)
        try {
            const updatedUser = await UpdateUserLogin(user)
            console.log("Thông tin đã lưu:", updatedUser)
            setIsEditing(false)
            toast.success(t('updateSuccess'), {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            })
        } catch (error) {
            console.error("Lỗi khi lưu thông tin:", error)
            toast.error(t('updateError'), {
                position: "top-right",
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            })
        } finally {
            setIsSaving(false)
        }
    }

    if (!user) return <div>{t('loadingInfo')}</div>

    return (
        <>
            <ToastContainer />
            {isSaving ? (
                <Loading />
            ) : (
                <div className="container mx-auto py-3 sm:py-6 px-2 sm:px-4 md:px-6">
                    <div className="flex flex-col space-y-4 sm:space-y-6">
                        <div className="flex flex-col space-y-2">
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">{t('userProfile')}</h1>
                            <p className="text-muted-foreground text-sm sm:text-base">{t('userProfileDescription')}</p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:gap-6">
                            <div className="space-y-4 sm:space-y-6">
                                <Tabs defaultValue="info" value={activeTab} onValueChange={setActiveTab} className="w-full">
                                    {/* Personal Info Tab */}
                                    <TabsContent value="info">
                                        <Card
                                            className={`transition-all duration-300 
                        ${isEditing ? "border-2 border-blue-500 shadow-lg" : "border border-gray-200 shadow-md"}
                      `}
                                        >
                                            <CardContent className="p-4">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="py-1 rounded-lg space-y-1">
                                                        <label className="text-sm font-medium">{t('username')}</label>
                                                        <input
                                                            type="text"
                                                            value={user.username}
                                                            readOnly={!isEditing}
                                                            onChange={(e) => setUser({ ...user, username: e.target.value })}
                                                            className="w-full px-3 py-2 border rounded-lg text-sm"
                                                        />
                                                    </div>
                                                    <div className="py-1 rounded-lg space-y-1">
                                                        <label className="text-sm font-medium">{t('fullName')}</label>
                                                        <input
                                                            type="text"
                                                            value={user.name}
                                                            readOnly={!isEditing}
                                                            onChange={(e) => setUser({ ...user, name: e.target.value })}
                                                            className="w-full px-3 py-2 border rounded-lg text-sm"
                                                        />
                                                    </div>
                                                    <div className="py-1 rounded-lg space-y-1">
                                                        <label className="text-sm font-medium">{t('email')}</label>
                                                        <input
                                                            type="email"
                                                            value={user.email}
                                                            readOnly={!isEditing}
                                                            onChange={(e) => setUser({ ...user, email: e.target.value })}
                                                            className="w-full px-3 py-2 border rounded-lg text-sm"
                                                        />
                                                    </div>
                                                    <div className="py-1 rounded-lg space-y-1">
                                                        <label className="text-sm font-medium">{t('address')}</label>
                                                        <input
                                                            type="text"
                                                            value={user.address}
                                                            readOnly={!isEditing}
                                                            onChange={(e) => setUser({ ...user, address: e.target.value })}
                                                            className="w-full px-3 py-2 border rounded-lg text-sm"
                                                        />
                                                    </div>
                                                    <div className="py-1 rounded-lg space-y-1">
                                                        <label className="text-sm font-medium">{t('phone')}</label>
                                                        <input
                                                            type="text"
                                                            value={user.phone_number}
                                                            readOnly={!isEditing}
                                                            onChange={(e) => setUser({ ...user, phone_number: e.target.value })}
                                                            className="w-full px-3 py-2 border rounded-lg text-sm"
                                                        />
                                                    </div>
                                                    {/* <div className="py-1 rounded-lg space-y-1">
                                                        <label className="text-sm font-medium">{t('language')}</label>
                                                        <input
                                                            type="text"
                                                            value={user.language === "vi" ? t('vietnamese') : t('english')}
                                                            readOnly={!isEditing}
                                                            onChange={(e) => setUser({ ...user, language: e.target.value })}
                                                            className="w-full px-3 py-2 border rounded-lg text-sm"
                                                        />
                                                    </div> */}
                                                </div>
                                                <div>
                                                    {isEditing ? (
                                                        <Button
                                                            variant="outline"
                                                            className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white"
                                                            onClick={handleSave}
                                                        >
                                                            {t('saveInfo')}
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="outline"
                                                            className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white"
                                                            onClick={() => setIsEditing(true)}
                                                        >
                                                            {t('editInfo')}
                                                        </Button>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    {/* System Tab (for admins) */}
                                    {(user.role === "school_admin" || user.role === "admin") && (
                                        <TabsContent value="system">
                                            <Card>
                                                <CardHeader className="p-3 sm:p-6">
                                                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                                                        <UserCog className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                                                        {t('systemManagement')}
                                                    </CardTitle>
                                                    <CardDescription className="text-sm">{t('systemDescription')}</CardDescription>
                                                </CardHeader>
                                                <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-6">
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                                                        <div className="p-2 rounded-lg border text-center">
                                                            <p className="text-xl sm:text-3xl font-bold text-primary">{user.stats?.students || 0}</p>
                                                            <p className="text-xs sm:text-sm font-medium">{t('students')}</p>
                                                        </div>
                                                        <div className="p-2 rounded-lg border text-center">
                                                            <p className="text-xl sm:text-3xl font-bold text-primary">{user.stats?.teachers || 0}</p>
                                                            <p className="text-xs sm:text-sm font-medium">{t('teachers')}</p>
                                                        </div>
                                                        <div className="p-2 rounded-lg border text-center">
                                                            <p className="text-xl sm:text-3xl font-bold text-primary">{user.stats?.courses || 0}</p>
                                                            <p className="text-xs sm:text-sm font-medium">{t('courses')}</p>
                                                        </div>
                                                        <div className="p-2 rounded-lg border text-center">
                                                            <p className="text-xl sm:text-3xl font-bold text-primary">{user.stats?.completionRate || 0}%</p>
                                                            <p className="text-xs sm:text-sm font-medium">{t('completionRate')}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                                                        <Button variant="outline" className="flex-1 text-sm">{t('addUser')}</Button>
                                                        <Button variant="outline" className="flex-1 text-sm">{t('createCourse')}</Button>
                                                        <Button className="flex-1 text-sm">{t('viewDetailedReport')}</Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </TabsContent>
                                    )}

                                    {/* Settings Tab */}
                                    <TabsContent value="settings">
                                        <Card>
                                            <CardHeader className="p-3 sm:p-6">
                                                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                                                    <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                                                    {t('quickSettings')}
                                                </CardTitle>
                                                <CardDescription className="text-sm">{t('quickSettingsDescription')}</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-4 p-3 sm:p-6">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                    <Button variant="outline" className="justify-start text-sm h-auto py-3" asChild>
                                                        <Link href="/settings">
                                                            <User className="mr-2 h-4 w-4 flex-shrink-0" />
                                                            <span className="truncate">{t('editProfile')}</span>
                                                        </Link>
                                                    </Button>
                                                    <Button variant="outline" className="justify-start text-sm h-auto py-3" asChild>
                                                        <Link href="/settings">
                                                            <Palette className="mr-2 h-4 w-4 flex-shrink-0" />
                                                            <span className="truncate">{t('customizeInterface')}</span>
                                                        </Link>
                                                    </Button>
                                                    <Button variant="outline" className="justify-start text-sm h-auto py-3" asChild>
                                                        <Link href="/settings">
                                                            <Bell className="mr-2 h-4 w-4 flex-shrink-0" />
                                                            <span className="truncate">{t('notificationSettings')}</span>
                                                        </Link>
                                                    </Button>
                                                    <Button variant="outline" className="justify-start text-sm h-auto py-3" asChild>
                                                        <Link href="/settings">
                                                            <Mail className="mr-2 h-4 w-4 flex-shrink-0" />
                                                            <span className="truncate">{t('changeEmail')}</span>
                                                        </Link>
                                                    </Button>
                                                </div>
                                                <Button className="w-full text-sm" asChild>
                                                    <Link href="/settings">{t('goToSettings')}</Link>
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
