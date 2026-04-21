"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TeacherDashboardHeader } from "@/components/teacher-dashboard-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, BookOpen, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/context/auth-context";
import { LessonsTab } from "./components/lessons-tab";
import { GradingTab } from "./components/grading-tab";
import { GradingHomeworkTab } from "./components/grading-homework-tab";
import { useTypedTranslations, useCurrentLocale } from "@/lib/i18n/client";

const getDisplayWeekNumber = (weekNumber: number) => weekNumber;

export default function TeacherWeeklyLessonsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTypedTranslations("lessonsTab");
  const currentLocale = useCurrentLocale();
  const [activeTab, setActiveTab] = useState("lessons");

  // Function to update URL with tab parameter
  const updateTabInUrl = useCallback(
    (tabValue: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tabValue);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  // Sync active tab from URL and set default on first load
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (
      tabParam === "grading" ||
      tabParam === "lessons" ||
      tabParam === "homework-grading"
    ) {
      setActiveTab(tabParam);
    } else {
      // Lần đầu vào trang, set tab mặc định vào URL
      updateTabInUrl("lessons");
    }
  }, [searchParams, updateTabInUrl]);

  return (
    <div className="min-h-screen bg-gray-50/30 overflow-x-hidden">
      <TeacherDashboardHeader />
      <main className="container mx-auto px-6 py-8">
        {/* Main Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(val) => {
            setActiveTab(val);
            updateTabInUrl(val);
          }}
          className="space-y-6"
        >
          <TabsList className="bg-white p-1 h-auto rounded-2xl shadow-sm border flex-wrap md:flex-nowrap">
            <TabsTrigger
              value="lessons"
              className="px-6 py-3 rounded-xl data-[state=active]:bg-emerald-600 data-[state=active]:text-white w-full justify-start"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              {t("tabs.lessons")}
            </TabsTrigger>
            {/* <TabsTrigger
              value="grading"
              className="px-6 py-3 rounded-xl data-[state=active]:bg-emerald-600 data-[state=active]:text-white w-full justify-start"
            >
              <Edit className="h-4 w-4 mr-2" />
              {t("tabs.grading")}
            </TabsTrigger> */}
            <TabsTrigger
              value="homework-grading"
              className="px-6 py-3 rounded-xl data-[state=active]:bg-emerald-600 data-[state=active]:text-white w-full justify-start"
            >
              <ClipboardList className="h-4 w-4 mr-2" />
              {t("tabs.homeworkGrading")}
            </TabsTrigger>
          </TabsList>

          {/* Lessons Tab */}
          <TabsContent value="lessons">
            <LessonsTab />
          </TabsContent>

          {/* Grading Tab */}
          <TabsContent value="grading">
            <GradingTab />
          </TabsContent>

          {/* Homework Grading Tab */}
          <TabsContent value="homework-grading">
            <GradingHomeworkTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
