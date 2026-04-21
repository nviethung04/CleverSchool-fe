"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import SchoolReportTab from "./components/school-report-tab";
import CourseReportTab from "./components/course-report-tab";
import AssessmentReportTab from "./components/assessment-report-tab";
import AssessmentSchoolReportTab from "./components/assessment-school-report-tab";

interface Week {
  label: string;
  startTimestamp: number;
  endTimestamp: number;
}

export default function ExportPage() {
  const t = useTranslations("exportReport");
  const [activeTab, setActiveTab] = useState("school-report");

  // Helper function to generate weeks from Sep 8, 2025
  const generateWeeks = (): Week[] => {
    const weeks: Week[] = [];
    const startDate = new Date("2025-09-08"); // Monday, Sep 8, 2025
    const today = new Date();

    for (
      let i = 0;
      i <=
      Math.floor(
        (today.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
      );
      i++
    ) {
      const weekStart = new Date(startDate);
      weekStart.setDate(startDate.getDate() + i * 7);
      // Set to 0h00 (midnight) of Monday
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      // Set to 23h59:59 of Sunday
      weekEnd.setHours(23, 59, 59, 999);

      const formatDate = (date: Date) => {
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        return `${day}/${month}/${date.getFullYear()}`;
      };

      const weekLabel = `Tuần ${formatDate(weekStart)}-${formatDate(weekEnd)}`;
      weeks.push({
        label: weekLabel,
        startTimestamp: Math.floor(weekStart.getTime() / 1000),
        endTimestamp: Math.floor(weekEnd.getTime() / 1000),
      });
    }

    // Thêm lựa chọn đặc biệt: 15/09/2025 đến hiện tại ở đầu danh sách
    const specialStart = new Date("2025-09-15");
    specialStart.setHours(0, 0, 0, 0);
    const specialEnd = new Date();
    const dayOfWeek = specialEnd.getDay(); // 0 = Chủ nhật
    specialEnd.setDate(
      specialEnd.getDate() + (dayOfWeek === 0 ? 0 : 7 - dayOfWeek)
    );
    specialEnd.setHours(23, 59, 59, 999);
    weeks.unshift({
      label: "15/09/2025 đến hết tuần hiện tại",
      startTimestamp: Math.floor(specialStart.getTime() / 1000),
      endTimestamp: Math.floor(specialEnd.getTime() / 1000),
    });

    return weeks;
  };

  const weeks = generateWeeks();

  // Initialize selectedWeek with the most recent week
  const [selectedWeek, setSelectedWeek] = useState<string>(
    weeks.length > 0 ? weeks[weeks.length - 1].label : ""
  );

  // Reset selectedWeek to current week when switching tabs
  useEffect(() => {
    if (weeks.length > 0) {
      setSelectedWeek(weeks[weeks.length - 1].label);
    }
  }, [activeTab]);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-gray-600 mt-2">{t("subtitle")}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full h-auto flex flex-col sm:grid sm:grid-cols-2 xl:grid-cols-4">
          <TabsTrigger value="school-report" className="w-full">
            {t("schoolReportTab")}
          </TabsTrigger>
          <TabsTrigger value="course-report" className="w-full">
            {t("courseReportTab")}
          </TabsTrigger>
          <TabsTrigger value="assessment-report" className="w-full">
            {t("assessmentClassReportTab")}
          </TabsTrigger>
          <TabsTrigger value="assessment-school-report" className="w-full">
            {t("assessmentSchoolReportTab")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="school-report" className="mt-6">
          <SchoolReportTab
            weeks={weeks}
            selectedWeek={selectedWeek}
            onWeekChange={setSelectedWeek}
          />
        </TabsContent>

        <TabsContent value="course-report" className="mt-6">
          <CourseReportTab
            weeks={weeks}
            selectedWeek={selectedWeek}
            onWeekChange={setSelectedWeek}
          />
        </TabsContent>

        <TabsContent value="assessment-report" className="mt-6">
          <AssessmentReportTab />
        </TabsContent>

        <TabsContent value="assessment-school-report" className="mt-6">
          <AssessmentSchoolReportTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
