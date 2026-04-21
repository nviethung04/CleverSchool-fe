"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Loader2, ChevronDown } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getListSchool, getListCourse } from "@/lib/api/dashboard";
import { GetSubjectsList } from "@/lib/api/subjects";
import { GetAssessmentList, ExportAssessmentExcel } from "@/lib/api/assessment";
import { useTranslations } from "next-intl";
import { sortAlphabetGeneric, sortByNumberAndAlphabetFromSecondGeneric } from "@/lib/utils";

export function ExportTab() {
  const { toast } = useToast();
  const t = useTranslations("exportTab");

  // Filter states
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [selectedAssessment, setSelectedAssessment] = useState<string>("");
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

  // Data states
  const [subjects, setSubjects] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);

  // Loading states
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [loadingAssessments, setLoadingAssessments] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Fetch schools on mount
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        setLoadingSchools(true);
        const response = await getListSchool();
        if (response?.data?.schools) {
          setSchools(response.data.schools);
        } else if (Array.isArray(response?.data)) {
          setSchools(response.data);
        } else if (response?.code === 200 && response?.data) {
          setSchools(Array.isArray(response.data) ? response.data : []);
        } else {
          setSchools([]);
        }
      } catch (error) {
        console.error("Error fetching schools:", error);
        toast({
          title: t("common.error"),
          description: t("errors.loadSchools"),
          variant: "destructive",
        });
        setSchools([]);
      } finally {
        setLoadingSchools(false);
      }
    };

    fetchSchools();
  }, [toast]);

  // Fetch subjects on mount
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoadingSubjects(true);
        const response = await GetSubjectsList();
        if (response?.data?.subjects) {
          setSubjects(response.data.subjects);
        } else if (Array.isArray(response?.data)) {
          setSubjects(response.data);
        } else {
          setSubjects([]);
        }
      } catch (error) {
        console.error("Error fetching subjects:", error);
        toast({
          title: t("common.error"),
          description: t("errors.loadSubjects"),
          variant: "destructive",
        });
        setSubjects([]);
      } finally {
        setLoadingSubjects(false);
      }
    };

    fetchSubjects();
  }, [toast]);

  // Fetch assessments when subject changes
  useEffect(() => {
    const fetchAssessments = async () => {
      if (!selectedSubject) {
        setAssessments([]);
        setSelectedAssessment("");
        return;
      }

      try {
        setLoadingAssessments(true);
        const filters: any = {
          subject_id: selectedSubject,
          limit: 1000,
        };

        const result = await GetAssessmentList(filters);
        const list = result.assessment || [];
        setAssessments(list);
      } catch (error) {
        console.error("Error fetching assessments:", error);
        toast({
          title: t("common.error"),
          description: t("errors.loadAssessments"),
          variant: "destructive",
        });
        setAssessments([]);
      } finally {
        setLoadingAssessments(false);
      }
    };

    fetchAssessments();
  }, [selectedSubject, toast]);

  // Reset courses when assessment changes
  useEffect(() => {
    setSelectedCourses([]);
    setCourses([]);
  }, [selectedAssessment]);

  // Fetch courses when assessment or school changes
  useEffect(() => {
    const fetchCourses = async () => {
      if (!selectedAssessment) {
        setCourses([]);
        return;
      }

      try {
        setLoadingCourses(true);
        const params: any = {
          assessment_id: selectedAssessment,
        };

        if (selectedSchool) {
          params.school_id = selectedSchool;
        }

        const response = await getListCourse(params);
        if (response?.data?.courses) {
          setCourses(response.data.courses);
        } else if (Array.isArray(response?.data)) {
          setCourses(response.data);
        } else if (response?.code === 200 && response?.data) {
          setCourses(Array.isArray(response.data) ? response.data : []);
        } else {
          setCourses([]);
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
        toast({
          title: t("common.error"),
          description: t("errors.loadCourses"),
          variant: "destructive",
        });
        setCourses([]);
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchCourses();
  }, [selectedAssessment, selectedSchool, toast]);

  // Handle export
  const handleExport = async () => {
    if (!selectedAssessment || selectedCourses.length === 0) {
      toast({
        title: t("common.warning"),
        description: t("warnings.selectRequired"),
        variant: "destructive",
      });
      return;
    }

    try {
      setExporting(true);
      const courseIds = selectedCourses.join(",");
      const blob = await ExportAssessmentExcel({
        course_ids: courseIds,
        assessment_id: selectedAssessment,
      });

      // Create blob URL
      const blobUrl = window.URL.createObjectURL(blob);

      // Lấy thông tin assessment
      const assessmentObj = assessments.find(
        (a) => String(a.id) === selectedAssessment
      );

      // Lấy thông tin school
      const schoolObj = schools.find(
        (s) => String(s.id) === selectedSchool
      );

      const assessmentDescription = assessmentObj?.description
      const schoolName =
        schoolObj?.school_name || schoolObj?.name;

      // Get filename from response or use default
      const filename = `Nhập điểm & đánh giá của ${assessmentDescription}-trường ${schoolName}.xlsx`;

      // Create and trigger download
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      window.URL.revokeObjectURL(blobUrl);

      toast({
        title: t("common.success"),
        description: t("success.exportSuccess"),
      });
    } catch (error: any) {
      console.error("Error exporting excel:", error);
      toast({
        title: t("common.error"),
        description: error.response?.data?.message || t("errors.exportFailed"),
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Môn học */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("subject")}</label>
              <Select
                value={selectedSubject}
                onValueChange={setSelectedSubject}
                disabled={loadingSubjects}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectSubject")} />
                </SelectTrigger>
                <SelectContent>
                  {loadingSubjects ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    sortAlphabetGeneric(subjects, item => item.name, true).map((subject) => (
                      <SelectItem
                        key={String(subject.id)}
                        value={String(subject.id)}
                      >
                        {subject.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Trường học */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("school")}</label>
              <Select
                value={selectedSchool}
                onValueChange={setSelectedSchool}
                disabled={loadingSchools}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectSchool")} />
                </SelectTrigger>
                <SelectContent>
                  {loadingSchools ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    sortAlphabetGeneric(schools, item => item.school_name, true).map((school) => (
                      <SelectItem
                        key={String(school.id)}
                        value={String(school.id)}
                      >
                        {school.school_name || school.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Bài kiểm tra đánh giá */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("assessment")}</label>
              <Select
                value={selectedAssessment}
                onValueChange={setSelectedAssessment}
                disabled={loadingAssessments || !selectedSubject}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectAssessment")} />
                </SelectTrigger>
                <SelectContent>
                  {loadingAssessments ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    sortByNumberAndAlphabetFromSecondGeneric(assessments, item => item.name, true).map((assessment) => (
                      <SelectItem
                        key={String(assessment.id)}
                        value={String(assessment.id)}
                      >
                        {assessment.name} - {assessment.description}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Khóa học */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("course")}</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                    disabled={loadingCourses || !selectedAssessment}
                  >
                    {loadingCourses ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : selectedCourses.length === 0 ? (
                      t("selectCourse")
                    ) : selectedCourses.length === 1 ? (
                      courses.find((c) => String(c.id) === selectedCourses[0])
                        ?.name || t("selectedOneCourse")
                    ) : (
                      t("selectedCourses", { count: selectedCourses.length })
                    )}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] max-h-[min(300px,var(--radix-popover-content-available-height))] p-0" align="start">
                  <div className="p-4">
                    {loadingCourses ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : courses.length === 0 ? (
                      <div className="p-2 text-sm text-gray-400 text-center">
                        {t("noCourses")}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="sticky top-0 -mt-4 pt-4 bg-popover">
                          <div className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                            <Checkbox
                              id="select-all-courses"
                              checked={
                                selectedCourses.length === courses.length &&
                                courses.length > 0
                              }
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedCourses(
                                    courses.map((c) => String(c.id))
                                  );
                                } else {
                                  setSelectedCourses([]);
                                }
                              }}
                            />
                            <label
                              htmlFor="select-all-courses"
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                            >
                              {t("selectAll")}
                            </label>
                          </div>
                          <div className="border-t border-gray-200 my-2"></div>
                        </div>
                        <div className="space-y-1">
                          {courses.map((course) => (
                            <div
                              key={String(course.id)}
                              className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                            >
                              <Checkbox
                                id={`course-${course.id}`}
                                checked={selectedCourses.includes(
                                  String(course.id)
                                )}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedCourses([
                                      ...selectedCourses,
                                      String(course.id),
                                    ]);
                                  } else {
                                    setSelectedCourses(
                                      selectedCourses.filter(
                                        (id) => id !== String(course.id)
                                      )
                                    );
                                  }
                                }}
                              />
                              <label
                                htmlFor={`course-${course.id}`}
                                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                              >
                                {course.name || course.course_name} - {course.object_title}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Nút Xuất mẫu */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleExport}
              disabled={
                exporting || !selectedAssessment || selectedCourses.length === 0
              }
            >
              {exporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("exporting")}
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  {t("exportButton")}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
