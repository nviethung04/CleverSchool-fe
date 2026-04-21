"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { DashboardHeader } from "@/components/dashboard-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, BookOpen, ClipboardList } from "lucide-react";

import ExamTab from "./components/exam-tab";
import HomeworkTab from "./components/homework-tab";
import AssessmentTab from "./components/assessment-tab";

export default function RankingPage() {
  const t = useTranslations("ranking");
  const searchParams = useSearchParams();
  const router = useRouter();

  // Đọc tab từ query param, mặc định là "exam"
  const tabFromQuery = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabFromQuery || "homework");

  // Đồng bộ tab với query param khi tab thay đổi
  useEffect(() => {
    const currentTab = searchParams.get("tab") || "homework";
    if (currentTab !== activeTab) {
      setActiveTab(currentTab);
    }
  }, [searchParams, activeTab]);

  // Cập nhật query param khi tab thay đổi
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="min-h-screen bg-gray-50/30">
      <DashboardHeader />
      <main className="container mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Main Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="space-y-6"
          >
            <TabsList className="bg-white p-1 h-auto rounded-2xl shadow-sm border flex-wrap md:flex-nowrap">
              {/* <TabsTrigger
                value="exam"
                className="px-6 py-3 rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white w-full justify-start"
              >
                <Trophy className="h-4 w-4 mr-2" />
                {t("examTitle")}
              </TabsTrigger> */}
              <TabsTrigger
                value="homework"
                className="px-6 py-3 rounded-xl data-[state=active]:bg-green-600 data-[state=active]:text-white w-full justify-start"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                {t("homeworkTitle")}
              </TabsTrigger>
              <TabsTrigger
                value="assessment"
                className="px-6 py-3 rounded-xl data-[state=active]:bg-purple-600 data-[state=active]:text-white w-full justify-start"
              >
                <ClipboardList className="h-4 w-4 mr-2" />
                {t("assessmentTitle")}
              </TabsTrigger>
            </TabsList>

            {/* Exam Tab */}
            <TabsContent value="exam" className="mt-6">
              <ExamTab />
            </TabsContent>

            {/* Homework Tab */}
            <TabsContent value="homework" className="mt-6">
              <HomeworkTab />
            </TabsContent>

            {/* Assessment Tab */}
            <TabsContent value="assessment" className="mt-6">
              <AssessmentTab />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
