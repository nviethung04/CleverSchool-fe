"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTypedTranslations } from "@/lib/i18n/client";
import { TeacherDashboardHeader } from "@/components/teacher-dashboard-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, ClipboardList, Dumbbell } from "lucide-react";

import { getListCourse } from "@/lib/api/dashboard";
import { HomeworkTab } from "./components/homework-tab";
import { ExerciseTab } from "./components/exercise-tab";
import { ExamTab } from "./components/exam-tab";
import { AssessmentTab } from "./components/assessment-tab";
import { ExportTab } from "./components/export-tab";
import { TEACHER_REPORTS_ASSESSMENT_TAB_ENABLED, TEACHER_REPORTS_EXPORT_TAB_ENABLED } from "@/config/hiddenModules";
import { sortByNumberAndAlphabetFromSecondGeneric } from "@/lib/utils";

export default function TeacherReportsPage() {
  const t = useTypedTranslations("reportsPage");
  const searchParams = useSearchParams();
  const router = useRouter();

  const defaultTab = "homework";
  const tabFromQuery = searchParams.get("tab");
  const resolveTab = (tab: string | null) => {
    if (tab === "assessment" && !TEACHER_REPORTS_ASSESSMENT_TAB_ENABLED) {
      return defaultTab;
    }
    if (tab === "export" && !TEACHER_REPORTS_EXPORT_TAB_ENABLED) {
      return defaultTab;
    }
    return tab || defaultTab;
  };
  const [activeTab, setActiveTab] = useState(resolveTab(tabFromQuery));

  const [courses, setCourses] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);

  useEffect(() => {
    const currentTab = resolveTab(searchParams.get("tab"));
    if (currentTab !== activeTab) {
      setActiveTab(currentTab);
    }
    const rawTab = searchParams.get("tab");
    const tabHidden =
      (rawTab === "assessment" && !TEACHER_REPORTS_ASSESSMENT_TAB_ENABLED) ||
      (rawTab === "export" && !TEACHER_REPORTS_EXPORT_TAB_ENABLED);
    if (tabHidden) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", defaultTab);
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  }, [searchParams, activeTab, router]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`?${params.toString()}`, { scroll: false });
  };

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

  const sortedCourses = sortByNumberAndAlphabetFromSecondGeneric(
    courses,
    (i) => i.name,
    true
  );

  return (
    <div className="min-h-screen bg-gray-50/30">
      <TeacherDashboardHeader />
      <main className="container mx-auto px-6 py-8">
        <div className="space-y-6">
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
                value="exercise"
                className="px-6 py-3 rounded-xl data-[state=active]:bg-violet-600 data-[state=active]:text-white w-full justify-start"
              >
                <Dumbbell className="h-4 w-4 mr-2" />
                {t("tabs.exercise")}
              </TabsTrigger>
              <TabsTrigger
                value="exam"
                className="px-6 py-3 rounded-xl data-[state=active]:bg-blue-600 data-[state=active]:text-white w-full justify-start"
              >
                <ClipboardList className="h-4 w-4 mr-2" />
                {t("tabs.exam")}
              </TabsTrigger>
              {TEACHER_REPORTS_ASSESSMENT_TAB_ENABLED && (
                <TabsTrigger
                  value="assessment"
                  className="px-6 py-3 rounded-xl data-[state=active]:bg-emerald-600 data-[state=active]:text-white w-full justify-start"
                >
                  <ClipboardList className="h-4 w-4 mr-2" />
                  {t("tabs.assessment")}
                </TabsTrigger>
              )}
              {TEACHER_REPORTS_EXPORT_TAB_ENABLED && (
                <TabsTrigger
                  value="export"
                  className="px-6 py-3 rounded-xl data-[state=active]:bg-emerald-600 data-[state=active]:text-white w-full justify-start"
                >
                  <ClipboardList className="h-4 w-4 mr-2" />
                  {t("tabs.export")}
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="homework">
              <HomeworkTab courses={sortedCourses} />
            </TabsContent>

            <TabsContent value="exercise">
              <ExerciseTab courses={sortedCourses} />
            </TabsContent>

            <TabsContent value="exam">
              <ExamTab courses={sortedCourses} exams={exams} />
            </TabsContent>

            {TEACHER_REPORTS_ASSESSMENT_TAB_ENABLED && (
              <TabsContent value="assessment">
                <AssessmentTab />
              </TabsContent>
            )}

            {TEACHER_REPORTS_EXPORT_TAB_ENABLED && (
              <TabsContent value="export">
                <ExportTab />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
    </div>
  );
}
