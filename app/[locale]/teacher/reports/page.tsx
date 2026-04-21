"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTypedTranslations } from "@/lib/i18n/client";
import { TeacherDashboardHeader } from "@/components/teacher-dashboard-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, ClipboardList } from "lucide-react";

import { getListCourse } from "@/lib/api/dashboard";
import { HomeworkTab } from "./components/homework-tab";
import { ExamTab } from "./components/exam-tab";
import { AssessmentTab } from "./components/assessment-tab";
import { ExportTab } from "./components/export-tab";
import { sortByNumberAndAlphabetFromSecondGeneric } from "@/lib/utils";

export default function TeacherReportsPage() {
  const t = useTypedTranslations("reportsPage");
  const searchParams = useSearchParams();
  const router = useRouter();

  // Đọc tab từ query param, mặc định là "homework"
  const tabFromQuery = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabFromQuery || "homework");

  // API data states
  const [courses, setCourses] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);

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

  // Fetch courses on component mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await getListCourse({});
        if (response.data?.courses) {
          setCourses(response.data.courses);
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };

    fetchCourses();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50/30">
      <TeacherDashboardHeader />
      <main className="container mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Main Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="space-y-6"
          >
            <TabsList className="bg-white p-1 h-auto rounded-2xl shadow-sm border flex-wrap md:flex-nowrap">
              <TabsTrigger
                value="homework"
                className="px-6 py-3 rounded-xl data-[state=active]:bg-emerald-600 data-[state=active]:text-white w-full justify-start"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                {t("tabs.homework")}
              </TabsTrigger>
              <TabsTrigger
                value="assessment"
                className="px-6 py-3 rounded-xl data-[state=active]:bg-emerald-600 data-[state=active]:text-white w-full justify-start"
              >
                <ClipboardList className="h-4 w-4 mr-2" />
                {t("tabs.assessment")}
              </TabsTrigger>
              {/* <TabsTrigger
                value="exam"
                className="px-6 py-3 rounded-xl data-[state=active]:bg-emerald-600 data-[state=active]:text-white w-full justify-start"
              >
                <ClipboardList className="h-4 w-4 mr-2" />
                {t("tabs.exam")}
              </TabsTrigger> */}
              <TabsTrigger
                value="export"
                className="px-6 py-3 rounded-xl data-[state=active]:bg-emerald-600 data-[state=active]:text-white w-full justify-start"
              >
                <ClipboardList className="h-4 w-4 mr-2" />
                {t("tabs.export")}
              </TabsTrigger>
            </TabsList>

            {/* Homework Tab */}
            <TabsContent value="homework">
              <HomeworkTab courses={sortByNumberAndAlphabetFromSecondGeneric(courses, i => i.name, true)} />
            </TabsContent>

            {/* Exam Tab */}
            <TabsContent value="exam">
              <ExamTab courses={courses} exams={exams} />
            </TabsContent>

            {/* Assessment Tab */}
            <TabsContent value="assessment">
              <AssessmentTab />
            </TabsContent>

            {/* Export Tab */}
            <TabsContent value="export">
              <ExportTab />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
