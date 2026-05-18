"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { User, Bell, Palette, Lock, Link2 } from "lucide-react"

// Mock data for settings
const settingsData = {
  role: "student", // student, teacher, parent, school_admin, admin
  name: "Nguyễn Văn A",
  avatar: "/avatar-kid.png",
  personalization: {
    theme: "light",
    primaryColor: "blue",
    learningPath: "speaking",
    language: "vi",
  },
  notifications: {
    email: true,
    push: false,
    newAssignments: true,
    progressUpdates: true,
    reminders: true,
  },
  permissions: {
    users: [{ id: 1, name: "User 1" }],
  },
}

export default function SettingsPage() {
  const [settings, setSettings] = useState(settingsData)
  const [activeTab, setActiveTab] = useState("personalization")

  const handleThemeChange = (theme: string) => {
    setSettings({
      ...settings,
      personalization: {
        ...settings.personalization,
        theme,
      },
    })
  }

  const handleColorChange = (primaryColor: string) => {
    setSettings({
      ...settings,
      personalization: {
        ...settings.personalization,
        primaryColor,
      },
    })
  }

  const handleLanguageChange = (language: string) => {
    setSettings({
      ...settings,
      personalization: {
        ...settings.personalization,
        language,
      },
    })
  }

  const handleLearningPathChange = (learningPath: string) => {
    setSettings({
      ...settings,
      personalization: {
        ...settings.personalization,
        learningPath,
      },
    })
  }

  const handleNotificationToggle = (key: string) => {
    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: !settings.notifications[key as keyof typeof settings.notifications],
      },
    })
  }

  const handleSaveSettings = () => {
    // In a real app, this would save to the backend
    console.log("Saving settings:", settings)
    // Show success message
    alert("Cài đặt đã được lưu thành công!")
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-primary">Cài đặt</h1>
          <p className="text-muted-foreground">Tùy chỉnh trải nghiệm học tập của bạn trên Clever School</p>
        </div>

        <Tabs defaultValue="personalization" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <TabsTrigger value="personalization" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden md:inline">Cá nhân hóa</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden md:inline">Thông báo</span>
            </TabsTrigger>
            {(settings.role === "teacher" || settings.role === "school_admin" || settings.role === "admin") && (
              <TabsTrigger value="permissions" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <span className="hidden md:inline">Quyền truy cập</span>
              </TabsTrigger>
            )}
            {(settings.role === "school_admin" || settings.role === "admin") && (
              <TabsTrigger value="integrations" className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                <span className="hidden md:inline">Tích hợp</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Personalization Tab */}
          <TabsContent value="personalization" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  Cá nhân hóa
                </CardTitle>
                <CardDescription>Tùy chỉnh giao diện và trải nghiệm học tập của bạn</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Theme Selection */}
                <div className="space-y-3">
                  <h3 className="text-lg font-medium">Giao diện</h3>
                  <RadioGroup
                    defaultValue={settings.personalization.theme}
                    onValueChange={handleThemeChange}
                    className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="light" id="theme-light" />
                      <Label htmlFor="theme-light" className="cursor-pointer">
                        Sáng
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="dark" id="theme-dark" />
                      <Label htmlFor="theme-dark" className="cursor-pointer">
                        Tối
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="system" id="theme-system" />
                      <Label htmlFor="theme-system" className="cursor-pointer">
                        Theo hệ thống
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Color Selection */}
                <div className="space-y-3">
                  <h3 className="text-lg font-medium">Màu chủ đạo</h3>
                  <div className="grid grid-cols-4 gap-2 md:grid-cols-6 md:gap-4">
                    {["blue", "green", "purple", "pink", "orange", "yellow"].map((color) => (
                      <div
                        key={color}
                        className={`h-10 w-10 rounded-full cursor-pointer transition-all ${
                          settings.personalization.primaryColor === color
                            ? "ring-2 ring-offset-2 ring-primary scale-110"
                            : "hover:scale-105"
                        } bg-${color}-500`}
                        onClick={() => handleColorChange(color)}
                      />
                    ))}
                  </div>
                </div>

                {/* Learning Path */}
                <div className="space-y-3">
                  <h3 className="text-lg font-medium">Lộ trình học</h3>
                  <p className="text-sm text-muted-foreground">Chọn kỹ năng bạn muốn ưu tiên trong lộ trình học</p>
                  <Select defaultValue={settings.personalization.learningPath} onValueChange={handleLearningPathChange}>
                    <SelectTrigger className="w-full md:w-[250px]">
                      <SelectValue placeholder="Chọn kỹ năng ưu tiên" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="listening">Nghe</SelectItem>
                      <SelectItem value="speaking">Nói</SelectItem>
                      <SelectItem value="reading">Đọc</SelectItem>
                      <SelectItem value="writing">Viết</SelectItem>
                      <SelectItem value="vocabulary">Từ vựng</SelectItem>
                      <SelectItem value="grammar">Ngữ pháp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Language */}
                <div className="space-y-3">
                  <h3 className="text-lg font-medium">Ngôn ngữ</h3>
                  <Select defaultValue={settings.personalization.language} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="w-full md:w-[250px]">
                      <SelectValue placeholder="Chọn ngôn ngữ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vi">Tiếng Việt</SelectItem>
                      <SelectItem value="en">Tiếng Anh</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Thông báo
                </CardTitle>
                <CardDescription>Quản lý cách bạn nhận thông báo từ Clever School</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Notification Channels */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Kênh thông báo</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="email-notifications">Email</Label>
                        <p className="text-sm text-muted-foreground">Nhận thông báo qua email</p>
                      </div>
                      <Switch
                        id="email-notifications"
                        checked={settings.notifications.email}
                        onCheckedChange={() => handleNotificationToggle("email")}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="push-notifications">Push Notification</Label>
                        <p className="text-sm text-muted-foreground">Nhận thông báo trên thiết bị</p>
                      </div>
                      <Switch
                        id="push-notifications"
                        checked={settings.notifications.push}
                        onCheckedChange={() => handleNotificationToggle("push")}
                      />
                    </div>
                  </div>
                </div>

                {/* Notification Content */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Nội dung thông báo</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="new-assignments"
                        checked={settings.notifications.newAssignments}
                        onCheckedChange={() => handleNotificationToggle("newAssignments")}
                      />
                      <div className="grid gap-1.5">
                        <Label htmlFor="new-assignments">Bài tập mới</Label>
                        <p className="text-sm text-muted-foreground">Thông báo khi có bài tập mới được giao</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="progress-updates"
                        checked={settings.notifications.progressUpdates}
                        onCheckedChange={() => handleNotificationToggle("progressUpdates")}
                      />
                      <div className="grid gap-1.5">
                        <Label htmlFor="progress-updates">Cập nhật tiến độ</Label>
                        <p className="text-sm text-muted-foreground">Thông báo về tiến độ học tập của bạn</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="reminders"
                        checked={settings.notifications.reminders}
                        onCheckedChange={() => handleNotificationToggle("reminders")}
                      />
                      <div className="grid gap-1.5">
                        <Label htmlFor="reminders">Nhắc nhở</Label>
                        <p className="text-sm text-muted-foreground">Nhắc nhở về lịch học và bài tập chưa hoàn thành</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permissions Tab (for teachers and admins) */}
          {(settings.role === "teacher" || settings.role === "school_admin" || settings.role === "admin") && (
            <TabsContent value="permissions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-primary" />
                    Quyền truy cập
                  </CardTitle>
                  <CardDescription>Quản lý quyền truy cập và phân quyền người dùng</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* User Management */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Quản lý người dùng</h3>
                      {(settings.role === "school_admin" || settings.role === "admin") && (
                        <Button variant="outline" size="sm">
                          Thêm người dùng
                        </Button>
                      )}
                    </div>

                    <div className="rounded-md border">
                      <div className="p-4">
                        <div className="grid grid-cols-12 gap-4 text-sm font-medium">
                          <div className="col-span-5">Tên</div>
                          <div className="col-span-4">Vai trò</div>
                          <div className="col-span-3">Hành động</div>
                        </div>
                      </div>
                      <div className="divide-y">
                        {[
                          { id: 1, name: "Nguyễn Văn A", role: "student" },
                          { id: 2, name: "Trần Thị B", role: "student" },
                          { id: 3, name: "Lê Văn C", role: "teacher" },
                        ].map((user) => (
                          <div key={user.id} className="grid grid-cols-12 gap-4 p-4 items-center">
                            <div className="col-span-5 flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                              <span>{user.name}</span>
                            </div>
                            <div className="col-span-4">
                              <Badge
                                variant={
                                  user.role === "student"
                                    ? "secondary"
                                    : user.role === "teacher"
                                      ? "default"
                                      : "outline"
                                }
                              >
                                {user.role === "student" ? "Học sinh" : user.role === "teacher" ? "Giáo viên" : "Khác"}
                              </Badge>
                            </div>
                            <div className="col-span-3 flex space-x-2">
                              <Button variant="outline" size="sm">
                                Xem
                              </Button>
                              {(settings.role === "school_admin" || settings.role === "admin") && (
                                <Button variant="outline" size="sm">
                                  Sửa
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Role Permissions (admin only) */}
                  {settings.role === "admin" && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Phân quyền vai trò</h3>
                      <div className="rounded-md border">
                        <div className="p-4">
                          <div className="grid grid-cols-12 gap-4 text-sm font-medium">
                            <div className="col-span-4">Vai trò</div>
                            <div className="col-span-8">Quyền</div>
                          </div>
                        </div>
                        <div className="divide-y">
                          {[
                            { role: "student", permissions: ["Xem khóa học", "Làm bài tập", "Xem tiến độ"] },
                            { role: "teacher", permissions: ["Quản lý học sinh", "Tạo bài tập", "Xem báo cáo"] },
                            {
                              role: "admin",
                              permissions: ["Quản lý toàn bộ hệ thống", "Phân quyền", "Quản lý nội dung"],
                            },
                          ].map((role, idx) => (
                            <div key={idx} className="grid grid-cols-12 gap-4 p-4">
                              <div className="col-span-4">
                                <Badge
                                  variant={
                                    role.role === "student"
                                      ? "secondary"
                                      : role.role === "teacher"
                                        ? "default"
                                        : "outline"
                                  }
                                >
                                  {role.role === "student"
                                    ? "Học sinh"
                                    : role.role === "teacher"
                                      ? "Giáo viên"
                                      : role.role === "admin"
                                        ? "Quản trị viên"
                                        : "Khác"}
                                </Badge>
                              </div>
                              <div className="col-span-8">
                                <div className="flex flex-wrap gap-2">
                                  {role.permissions.map((perm, i) => (
                                    <Badge key={i} variant="outline">
                                      {perm}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Integrations Tab (for admins) */}
          {(settings.role === "school_admin" || settings.role === "admin") && (
            <TabsContent value="integrations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link2 className="h-5 w-5 text-primary" />
                    Tích hợp
                  </CardTitle>
                  <CardDescription>Kết nối Clever School với các ứng dụng và dịch vụ khác</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Video Conferencing */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Họp trực tuyến</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Card className="border-2 hover:border-primary/50 transition-all cursor-pointer">
                        <CardHeader className="p-4">
                          <CardTitle className="text-base">Zoom</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 flex justify-between items-center">
                          <CardDescription>Tích hợp lớp học trực tuyến với Zoom</CardDescription>
                          <Button variant="outline" size="sm">
                            Kết nối
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="border-2 hover:border-primary/50 transition-all cursor-pointer">
                        <CardHeader className="p-4">
                          <CardTitle className="text-base">Microsoft Teams</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 flex justify-between items-center">
                          <CardDescription>Tích hợp lớp học trực tuyến với Microsoft Teams</CardDescription>
                          <Button variant="outline" size="sm">
                            Kết nối
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Calendar & Scheduling */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Lịch & Lập kế hoạch</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Card className="border-2 hover:border-primary/50 transition-all cursor-pointer">
                        <CardHeader className="p-4">
                          <CardTitle className="text-base">Google Calendar</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 flex justify-between items-center">
                          <CardDescription>Đồng bộ lịch học với Google Calendar</CardDescription>
                          <Button variant="outline" size="sm">
                            Kết nối
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* AI & Learning Tools */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Công cụ AI & Học tập</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Card className="border-2 hover:border-primary/50 transition-all cursor-pointer">
                        <CardHeader className="p-4">
                          <CardTitle className="text-base">AI Pronunciation</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 flex justify-between items-center">
                          <CardDescription>Công cụ AI đánh giá phát âm</CardDescription>
                          <Button variant="outline" size="sm">
                            Kết nối
                          </Button>
                        </CardContent>
                      </Card>

                      <Card className="border-2 hover:border-primary/50 transition-all cursor-pointer">
                        <CardHeader className="p-4">
                          <CardTitle className="text-base">SCORM/xAPI</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 flex justify-between items-center">
                          <CardDescription>Nhập nội dung từ các nguồn bên ngoài</CardDescription>
                          <Button variant="outline" size="sm">
                            Kết nối
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        <div className="flex justify-end space-x-4">
          <Button variant="outline">Hủy</Button>
          <Button onClick={handleSaveSettings}>Lưu cài đặt</Button>
        </div>
      </div>
    </div>
  )
}
