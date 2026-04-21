"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTypedTranslations } from "@/lib/i18n/client";
import { DashboardHeader } from "@/components/dashboard-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, ClipboardList } from "lucide-react";
import HomeworkTab from "./components/homework-tab";
import { AssessmentTab } from "./components/assessment-tab";
import MobileOrientationGuard from "@/components/MobileOrientationGuard";

export default function TeacherReportsPage() {
  const t = useTypedTranslations("reportsPage");
  const searchParams = useSearchParams();
  const router = useRouter();

  // Đọc tab từ query param, mặc định là "homework"
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
    <MobileOrientationGuard requireLandscape={true}>
    <div className="min-h-screen bg-gray-50/30">
      <DashboardHeader />
      <main className="container mx-auto px-2 md:px-4 py-4 md:py-8">
        <div className="space-y-6">
          {/* Main Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="space-y-6"
          >
            <TabsList className="bg-white p-1 h-auto rounded-2xl shadow-sm border">
              <TabsTrigger
                value="homework"
                className="px-6 py-3 rounded-xl data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                {t("tabs.homework")}
              </TabsTrigger>
              <TabsTrigger
                value="assessment"
                className="px-6 py-3 rounded-xl data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
              >
                <ClipboardList className="h-4 w-4 mr-2" />
                {t("tabs.assessment")}
              </TabsTrigger>
            </TabsList>

            {/* Homework Tab */}
            <TabsContent value="homework">
              <HomeworkTab />
            </TabsContent>

            {/* Assessment Tab */}
            <TabsContent value="assessment">
              <AssessmentTab />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
    </MobileOrientationGuard>
  );
}
