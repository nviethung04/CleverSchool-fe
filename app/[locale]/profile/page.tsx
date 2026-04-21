"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { User, Book, Award } from "lucide-react";
import { GetUserLogin, UpdateUserLogin } from "@/lib/api/users";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loading from "@/app/loading";
import { useTranslations } from "next-intl";
import "@/styles/admin-profile-mobile.css";

function isValidMail(email: string) {
  return /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email);
}

function isValidPhone(phone: string) {
  return /^0\d{9}$/.test(phone);
}

function getRoleName(role_id: number | string, t: any) {
  switch (role_id) {
    case 1:
    case "1":
      return t("profile.roles.admin");
    case 2:
    case "2":
      return t("profile.roles.teacher");
    case 3:
    case "3":
      return t("profile.roles.student");
    default:
      return t("profile.roles.user");
  }
}

export default function ProfilePage() {
  const t = useTranslations();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("info");
  const [openEdit, setOpenEdit] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await GetUserLogin();
        setUser(res.data);
      } catch (error) {
        console.error("Error calling GetUserLogin API:", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (user) {
      setEditData({
        name: user.name || "",
        username: user.username || "",
        email: user.email || "",
        phone_number: user.phone_number || "",
        address: user.address || "",
      });
    }
  }, [user]);

  const handleSave = async () => {
    // Validate email
    if (user.email && !isValidMail(user.email)) {
      toast.error(t("profile.validation.invalidEmail"), {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    // Validate phone number
    if (user.phone_number && !isValidPhone(user.phone_number)) {
      toast.error(t("profile.validation.invalidPhone"), {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    // Validate required fields
    if (!user.name || !user.email || !user.phone_number) {
      toast.error(t("profile.validation.requiredFields"), {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    setIsSaving(true);
    try {
      const updatedUser = await UpdateUserLogin(user);
      console.log("Information saved:", updatedUser);
      setIsEditing(false);
      toast.success(t("profile.updateSuccess"), {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } catch (error) {
      console.error("Error saving information:", error);
      toast.error(t("profile.updateError"), {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClick = () => {
    setEditData({
      name: user.name || "",
      username: user.username || "",
      email: user.email || "",
      phone_number: user.phone_number || "",
      address: user.address || "",
    });
    setOpenEdit(true);
  };

  if (!user)
    return (
      <div className="flex items-center justify-center min-h-[50vh] p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">
            {t("profile.loading")}
          </p>
        </div>
      </div>
    );

  return (
    <>
      <ToastContainer />
      {isSaving ? (
        <Loading />
      ) : (
        <div className="container mx-auto py-3 sm:py-6 px-2 sm:px-4 md:px-6">
          <div className="flex flex-col space-y-4 sm:space-y-6">
            <div className="flex flex-col space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">
                {t("profile.title")}
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                {t("profile.description")}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:gap-6">
              {/* Tabs Content */}
              <div className="space-y-4">
                <Tabs
                  defaultValue="info"
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-2 gap-1 sm:gap-2 w-full">
                    <TabsTrigger
                      value="info"
                      className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                    >
                      <User className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="[@media(max-width:500px)]:hidden sm:inline">
                        {t("profile.tabs.info")}
                      </span>
                    </TabsTrigger>
                    {/* <TabsTrigger
                      value="progress"
                      className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                    >
                      <Book className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="[@media(max-width:500px)]:hidden sm:inline">
                        {t("profile.tabs.progress")}
                      </span>
                    </TabsTrigger> */}
                    <TabsTrigger
                      value="achievements"
                      className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
                    >
                      <Award className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="[@media(max-width:500px)]:hidden sm:inline">
                        {t("profile.tabs.achievements")}
                      </span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Personal Info Tab */}
                  <TabsContent value="info">
                    <Card
                      className={`transition-all duration-300 
                        ${
                          isEditing
                            ? "border-2 border-blue-500 shadow-lg"
                            : "border border-gray-200 shadow-md"
                        }
                      `}
                    >
                      <CardHeader className="p-3 sm:p-6">
                        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                          <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                          {t("profile.personalInfo")}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {t("profile.personalInfoDescription")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4 p-3 sm:p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div className="space-y-1">
                            <label className="text-sm font-medium">
                              {t("profile.fields.fullName")}
                            </label>
                            <input
                              type="text"
                              value={user.name}
                              readOnly={!isEditing}
                              onChange={(e) =>
                                setUser({ ...user, name: e.target.value })
                              }
                              className="w-full px-3 py-2 border rounded-lg text-sm"
                              style={{ fontSize: "16px" }} // Prevent iOS zoom
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-sm font-medium">
                              {t("profile.fields.dateOfBirth")}
                            </label>
                            {isEditing ? (
                              <input
                                type="date"
                                value={user.date_of_birth || ""}
                                readOnly={false}
                                onChange={(e) =>
                                  setUser({
                                    ...user,
                                    date_of_birth: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                                style={{ fontSize: "16px" }}
                              />
                            ) : (
                              <input
                                type="text"
                                value={
                                  user.date_of_birth
                                    ? new Date(
                                        user.date_of_birth
                                      ).toLocaleDateString("vi-VN")
                                    : ""
                                }
                                readOnly
                                className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-100 cursor-not-allowed"
                                style={{ fontSize: "16px" }}
                              />
                            )}
                          </div>

                          <div className="space-y-1">
                            <label className="text-sm font-medium">
                              {t("profile.fields.username")}
                            </label>
                            <input
                              type="text"
                              value={user.username}
                              readOnly={!isEditing}
                              onChange={(e) =>
                                setUser({ ...user, username: e.target.value })
                              }
                              className="w-full px-3 py-2 border rounded-lg text-sm"
                              style={{ fontSize: "16px" }}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-sm font-medium">Email</label>
                            <input
                              type="email"
                              value={user.email}
                              readOnly={!isEditing}
                              onChange={(e) =>
                                setUser({ ...user, email: e.target.value })
                              }
                              className="w-full px-3 py-2 border rounded-lg text-sm"
                              style={{ fontSize: "16px" }}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-sm font-medium">
                              {t("profile.fields.phone")}
                            </label>
                            <input
                              type="tel"
                              value={user.phone_number}
                              readOnly={!isEditing}
                              onChange={(e) =>
                                setUser({
                                  ...user,
                                  phone_number: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border rounded-lg text-sm"
                              style={{ fontSize: "16px" }}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-sm font-medium">
                              {t("profile.fields.address")}
                            </label>
                            <input
                              type="text"
                              value={user.address}
                              readOnly={!isEditing}
                              onChange={(e) =>
                                setUser({ ...user, address: e.target.value })
                              }
                              className="w-full px-3 py-2 border rounded-lg text-sm"
                              style={{ fontSize: "16px" }}
                            />
                          </div>
                        </div>
                        <div className="pt-4">
                          {isEditing ? (
                            <Button
                              variant="outline"
                              className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white min-h-[44px]"
                              onClick={handleSave}
                              disabled={isSaving}
                            >
                              {isSaving
                                ? t("profile.saving")
                                : t("profile.saveInfo")}
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white min-h-[44px]"
                              onClick={() => setIsEditing(true)}
                            >
                              {t("profile.editInfo")}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Progress Tab */}
                  {/* <TabsContent value="progress">
                    <Card>
                      <CardHeader className="p-3 sm:p-6">
                        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                          <Book className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                          {t("profile.learningProgress")}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {t("profile.learningProgressDescription")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-6">
                        <div className="space-y-3 sm:space-y-4">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-xs sm:text-sm font-medium">
                                {t("profile.skills.listening")}
                              </span>
                              <span className="text-xs sm:text-sm font-medium">
                                {user.progress?.listening ?? 0}%
                              </span>
                            </div>
                            <Progress
                              value={user.progress?.listening ?? 0}
                              className="h-2"
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-xs sm:text-sm font-medium">
                                {t("profile.skills.speaking")}
                              </span>
                              <span className="text-xs sm:text-sm font-medium">
                                {user.progress?.speaking ?? 0}%
                              </span>
                            </div>
                            <Progress
                              value={user.progress?.speaking ?? 0}
                              className="h-2"
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-xs sm:text-sm font-medium">
                                {t("profile.skills.reading")}
                              </span>
                              <span className="text-xs sm:text-sm font-medium">
                                {user.progress?.reading ?? 0}%
                              </span>
                            </div>
                            <Progress
                              value={user.progress?.reading ?? 0}
                              className="h-2"
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-xs sm:text-sm font-medium">
                                {t("profile.skills.writing")}
                              </span>
                              <span className="text-xs sm:text-sm font-medium">
                                {user.progress?.writing ?? 0}%
                              </span>
                            </div>
                            <Progress
                              value={user.progress?.writing ?? 0}
                              className="h-2"
                            />
                          </div>
                        </div>
                        <div className="bg-primary/5 rounded-lg p-3 sm:p-4">
                          <h3 className="text-sm font-medium mb-2">
                            {t("profile.personalizedSuggestion")}
                          </h3>
                          <p className="text-xs sm:text-sm">
                            {t("profile.suggestionText")}
                          </p>
                        </div>
                        <Button className="w-full min-h-[44px]">
                          {t("profile.continueLearning")}
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>*/}

                  {/* Achievements Tab */}
                  <TabsContent value="achievements">
                    <Card>
                      <CardHeader className="p-3 sm:p-6">
                        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                          <Award className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                          {t("profile.achievements")}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {t("profile.achievementsDescription")}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                          {/* Total Star */}
                          <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6 rounded-lg border-2 bg-gradient-to-br from-yellow-50 to-orange-50 border-[#FF9000]">
                            <div className="flex-shrink-0">
                              <img
                                src="/images/star.png"
                                alt="Star"
                                className="h-12 w-12 sm:h-16 sm:w-16 object-contain"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                                {t("profile.totalStar")}
                              </p>
                              <p className="text-2xl sm:text-3xl font-bold text-yellow-600">
                                {user.total_star ?? "0"}
                              </p>
                            </div>
                          </div>

                          {/* Total Exp */}
                          <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6 rounded-lg border-2 bg-gradient-to-br from-green-50 to-emerald-50 border-[#A4D33D]">
                            <div className="flex-shrink-0">
                              <img
                                src="/images/exp.png"
                                alt="Experience"
                                className="h-12 w-12 sm:h-16 sm:w-16 object-contain"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                                {t("profile.totalExp")}
                              </p>
                              <p className="text-2xl sm:text-3xl font-bold text-green-600">
                                {user.total_exp ?? 0}
                              </p>
                            </div>
                          </div>
                        </div>
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
  );
}
