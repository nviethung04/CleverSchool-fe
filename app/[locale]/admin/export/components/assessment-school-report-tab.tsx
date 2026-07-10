"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { getListSchool } from "@/lib/api/dashboard";
import { GetSubjectsList } from "@/lib/api/subjects";
import { GetGrades, GradeItem } from "@/lib/api/grade";
import {
  GetAssessmentList,
  ExportAssessmentSchoolReportExcel,
} from "@/lib/api/assessment";
import { sortAlphabetGeneric } from "@/lib/utils";
import { useAuth } from "@/lib/context/auth-context";
import { isSchoolManager } from "@/lib/auth/roles";

interface School {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
}

interface Assessment {
  id: string;
  name: string;
  description: string;
  type: string;
}

interface GradeGroup {
  gradeId: string;
  selectedAssessmentId: string; // Chỉ cho phép chọn 1 assessment
  assessments: Assessment[];
  loadingAssessments: boolean;
  lastFetchedType?: "month" | "semester"; // Track type đã fetch để tránh fetch lại không cần thiết
}

interface SubjectGroup {
  subjectId: string;
  subjectName: string;
  gradeGroups: GradeGroup[];
}

export default function AssessmentSchoolReportTab() {
  const { user } = useAuth()
  const [schools, setSchools] = useState<School[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [selectedSchoolIds, setSelectedSchoolIds] = useState<string[]>([]);
  const [subjectGroups, setSubjectGroups] = useState<SubjectGroup[]>([]);
  const [globalType, setGlobalType] = useState<"month" | "semester" | "">("");

  const [loadingSchools, setLoadingSchools] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [schoolsPopoverOpen, setSchoolsPopoverOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Fetch schools list
  const fetchSchools = async () => {
    setLoadingSchools(true);
    try {
      const response = await getListSchool();
      if (response.data && response.data.schools) {
        const schoolsList = response.data.schools.map((school: any) => ({
          id: String(school.id),
          name: school.school_name,
        }));
        setSchools(schoolsList);
      }
    } catch (error) {
      console.error("Error fetching schools:", error);
    } finally {
      setLoadingSchools(false);
    }
  };

  // Fetch grades list
  const fetchGrades = async () => {
    setLoadingGrades(true);
    try {
      const response = await GetGrades({ per_page: 1000 });
      if (response.data && response.data.grades) {
        setGrades(response.data.grades);
      }
    } catch (error) {
      console.error("Error fetching grades:", error);
    } finally {
      setLoadingGrades(false);
    }
  };

  // Fetch subjects list
  const fetchSubjects = async () => {
    setLoadingSubjects(true);
    try {
      const response = await GetSubjectsList();
      let subjectsList: Subject[] = [];

      // Handle different response structures
      if (response?.data?.subjects) {
        subjectsList = response.data.subjects.map((subject: any) => ({
          id: String(subject.id),
          name: subject.name,
        }));
      } else if (response?.subjects) {
        subjectsList = response.subjects.map((subject: any) => ({
          id: String(subject.id),
          name: subject.name,
        }));
      } else if (Array.isArray(response?.data)) {
        subjectsList = response.data.map((subject: any) => ({
          id: String(subject.id),
          name: subject.name,
        }));
      }

      setSubjects(subjectsList);

      // Initialize subject groups with grade groups
      const groups: SubjectGroup[] = subjectsList.map((subject) => ({
        subjectId: subject.id,
        subjectName: subject.name,
        gradeGroups: [],
      }));
      setSubjectGroups(groups);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      setSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  };

  // Fetch assessments for a specific subject, grade and type
  const fetchAssessments = useCallback(
    async (subjectId: string, gradeId: string, type: "month" | "semester") => {
      // Use functional update to get latest state
      setSubjectGroups((prev) => {
        const groupIndex = prev.findIndex((g) => g.subjectId === subjectId);
        if (groupIndex === -1) return prev;

        const gradeGroupIndex = prev[groupIndex].gradeGroups.findIndex(
          (gg) => gg.gradeId === gradeId
        );
        if (gradeGroupIndex === -1) return prev;

        // Update loading state
        const updated = [...prev];
        const gradeGroups = [...updated[groupIndex].gradeGroups];
        gradeGroups[gradeGroupIndex] = {
          ...gradeGroups[gradeGroupIndex],
          loadingAssessments: true,
        };
        updated[groupIndex] = {
          ...updated[groupIndex],
          gradeGroups,
        };
        return updated;
      });

      try {
        // Map type to API type value
        const apiType = type === "month" ? "monthly" : "final_exam";

        console.log("Calling GetAssessmentList with:", {
          type: apiType,
          subject_id: subjectId,
          grade_id: gradeId,
          limit: 1000,
        });

        const response = await GetAssessmentList({
          type: apiType,
          subject_id: subjectId,
          grade_id: gradeId,
          limit: 1000,
        });

        const assessmentsList: Assessment[] = [];
        if (response?.assessment) {
          assessmentsList.push(
            ...response.assessment.map((assessment: any) => ({
              id: String(assessment.id),
              name: assessment.name,
              description: assessment.description || "",
              type: assessment.type || apiType,
            }))
          );
        }

        console.log("GetAssessmentList response:", {
          subjectId,
          gradeId,
          type,
          count: assessmentsList.length,
        });

        // Update assessments for this grade group
        setSubjectGroups((prev) => {
          const groupIndex = prev.findIndex((g) => g.subjectId === subjectId);
          if (groupIndex === -1) return prev;

          const gradeGroupIndex = prev[groupIndex].gradeGroups.findIndex(
            (gg) => gg.gradeId === gradeId
          );
          if (gradeGroupIndex === -1) return prev;

          const updated = [...prev];
          const gradeGroups = [...updated[groupIndex].gradeGroups];
          gradeGroups[gradeGroupIndex] = {
            ...gradeGroups[gradeGroupIndex],
            assessments: assessmentsList,
            loadingAssessments: false,
            lastFetchedType: type,
          };
          updated[groupIndex] = {
            ...updated[groupIndex],
            gradeGroups,
          };
          return updated;
        });
      } catch (error) {
        console.error(
          `Error fetching assessments for subject ${subjectId}, grade ${gradeId}, type ${type}:`,
          error
        );
        setSubjectGroups((prev) => {
          const groupIndex = prev.findIndex((g) => g.subjectId === subjectId);
          if (groupIndex === -1) return prev;

          const gradeGroupIndex = prev[groupIndex].gradeGroups.findIndex(
            (gg) => gg.gradeId === gradeId
          );
          if (gradeGroupIndex === -1) return prev;

          const updated = [...prev];
          const gradeGroups = [...updated[groupIndex].gradeGroups];
          gradeGroups[gradeGroupIndex] = {
            ...gradeGroups[gradeGroupIndex],
            assessments: [],
            loadingAssessments: false,
            lastFetchedType: undefined,
          };
          updated[groupIndex] = {
            ...updated[groupIndex],
            gradeGroups,
          };
          return updated;
        });
      }
    },
    []
  );

  // Handle school selection toggle
  const handleSchoolToggle = (schoolId: string) => {
    if (schoolId === "all") {
      // Toggle "Tất cả"
      if (selectedSchoolIds.length === schools.length) {
        setSelectedSchoolIds([]);
      } else {
        setSelectedSchoolIds(schools.map((s) => s.id));
      }
    } else {
      // Toggle individual school
      if (selectedSchoolIds.includes(schoolId)) {
        setSelectedSchoolIds(selectedSchoolIds.filter((id) => id !== schoolId));
      } else {
        setSelectedSchoolIds([...selectedSchoolIds, schoolId]);
      }
    }
  };

  // Handle global type change
  const handleGlobalTypeChange = (type: "month" | "semester") => {
    setGlobalType(type);
    // Clear all assessments when type changes
    setSubjectGroups((prev) => {
      return prev.map((group) => ({
        ...group,
        gradeGroups: group.gradeGroups.map((gg) => ({
          ...gg,
          assessments: [],
          selectedAssessmentId: "",
          lastFetchedType: undefined,
        })),
      }));
    });
  };

  // Handle add grade group to a subject
  const handleAddGradeGroup = (subjectId: string) => {
    setSubjectGroups((prev) => {
      const updated = prev.map((group) => {
        if (group.subjectId === subjectId) {
          const newGradeGroup: GradeGroup = {
            gradeId: "",
            selectedAssessmentId: "",
            assessments: [],
            loadingAssessments: false,
            lastFetchedType: undefined,
          };
          return {
            ...group,
            gradeGroups: [...group.gradeGroups, newGradeGroup],
          };
        }
        return group;
      });
      return updated;
    });
  };

  // Handle remove grade group
  const handleRemoveGradeGroup = (
    subjectId: string,
    gradeGroupIndex: number
  ) => {
    setSubjectGroups((prev) => {
      const updated = prev.map((group) => {
        if (group.subjectId === subjectId) {
          return {
            ...group,
            gradeGroups: group.gradeGroups.filter(
              (_, index) => index !== gradeGroupIndex
            ),
          };
        }
        return group;
      });
      return updated;
    });
  };

  // Handle grade selection change
  const handleGradeChange = (
    subjectId: string,
    gradeGroupIndex: number,
    gradeId: string
  ) => {
    setSubjectGroups((prev) => {
      const updated = prev.map((group) => {
        if (group.subjectId === subjectId) {
          const gradeGroups = [...group.gradeGroups];
          gradeGroups[gradeGroupIndex] = {
            ...gradeGroups[gradeGroupIndex],
            gradeId,
            selectedAssessmentId: "",
            assessments: [],
            lastFetchedType: undefined,
          };
          return {
            ...group,
            gradeGroups,
          };
        }
        return group;
      });
      return updated;
    });

    // Fetch assessments if type is selected
    if (globalType && gradeId) {
      fetchAssessments(subjectId, gradeId, globalType);
    }
  };

  // Handle assessment selection change (single select)
  const handleAssessmentChange = (
    subjectId: string,
    gradeGroupIndex: number,
    assessmentId: string
  ) => {
    setSubjectGroups((prev) => {
      const updated = prev.map((group) => {
        if (group.subjectId === subjectId) {
          const gradeGroups = [...group.gradeGroups];
          gradeGroups[gradeGroupIndex] = {
            ...gradeGroups[gradeGroupIndex],
            selectedAssessmentId: assessmentId || "",
          };
          return {
            ...group,
            gradeGroups,
          };
        }
        return group;
      });
      return updated;
    });
  };

  // Handle export report
  const handleExportReport = async () => {
    // Validate filters
    if (selectedSchoolIds.length === 0) {
      alert("Vui lòng chọn ít nhất một trường");
      return;
    }

    if (!globalType) {
      alert("Vui lòng chọn Loại");
      return;
    }

    // Build request body
    const subjectsData: Array<{
      subject_id: number;
      grades: Array<{
        grade_id: number;
        assessment_id: number;
      }>;
    }> = [];

    subjectGroups.forEach((group) => {
      const gradesData: Array<{
        grade_id: number;
        assessment_id: number;
      }> = [];

      group.gradeGroups.forEach((gradeGroup) => {
        if (gradeGroup.gradeId && gradeGroup.selectedAssessmentId) {
          gradesData.push({
            grade_id: Number(gradeGroup.gradeId),
            assessment_id: Number(gradeGroup.selectedAssessmentId),
          });
        }
      });

      if (gradesData.length > 0) {
        subjectsData.push({
          subject_id: Number(group.subjectId),
          grades: gradesData,
        });
      }
    });

    if (subjectsData.length === 0) {
      alert("Vui lòng chọn ít nhất một môn học với khối và bài kiểm tra");
      setExporting(false);
      return;
    }

    setExporting(true);

    try {
      // Call API to export Excel
      const blob = await ExportAssessmentSchoolReportExcel({
        school_ids: selectedSchoolIds.join(","),
        subjects: subjectsData,
      });

      // Create blob URL and download file
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;

      // Generate filename with current date
      const currentDate = new Date().toISOString().split("T")[0];
      const fileName = `Bao_cao_bai_kiem_tra_danh_gia_${currentDate}.xlsx`;
      link.setAttribute("download", fileName);

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting report:", error);
      alert("Có lỗi xảy ra khi xuất báo cáo. Vui lòng thử lại.");
    } finally {
      setExporting(false);
    }
  };

  // Get display text for schools
  const getSchoolsDisplayText = () => {
    if (selectedSchoolIds.length === 0) {
      return "Chọn trường";
    }
    if (selectedSchoolIds.length === schools.length) {
      return "Tất cả trường";
    }
    if (selectedSchoolIds.length === 1) {
      const school = schools.find((s) => s.id === selectedSchoolIds[0]);
      return school?.name || "1 trường đã chọn";
    }
    return `${selectedSchoolIds.length} trường đã chọn`;
  };

  // Get display text for assessments in a grade group
  const getAssessmentsDisplayText = (gradeGroup: GradeGroup) => {
    if (!gradeGroup.selectedAssessmentId) {
      return "Chọn bài kiểm tra";
    }
    const assessment = gradeGroup.assessments.find(
      (a) => a.id === gradeGroup.selectedAssessmentId
    );
    return assessment?.name || "Chọn bài kiểm tra";
  };

  // Get grade name by id
  const getGradeName = (gradeId: string) => {
    const grade = grades.find((g) => String(g.id) === gradeId);
    return grade?.name_vn || grade?.name_en || gradeId;
  };

  // Khi globalType thay đổi, tự động fetch lại cho các grade đã chọn
  // Sử dụng ref để track type đã xử lý và tránh infinite loop
  const lastProcessedTypeRef = useRef<string>("");

  useEffect(() => {
    if (!globalType) {
      lastProcessedTypeRef.current = "";
      return;
    }

    // Chỉ xử lý khi type thay đổi (không phải do subjectGroups update)
    if (lastProcessedTypeRef.current === globalType) {
      return;
    }

    lastProcessedTypeRef.current = globalType;

    // Lấy snapshot của subjectGroups hiện tại
    // Sử dụng functional update để tránh stale closure
    let groupsToFetch: Array<{
      subjectId: string;
      gradeId: string;
    }> = [];

    setSubjectGroups((prev) => {
      groupsToFetch = [];
      prev.forEach((group) => {
        group.gradeGroups.forEach((gradeGroup) => {
          // Chỉ fetch nếu có gradeId, không đang loading, và chưa fetch type này
          if (
            gradeGroup.gradeId &&
            !gradeGroup.loadingAssessments &&
            gradeGroup.lastFetchedType !== globalType
          ) {
            groupsToFetch.push({
              subjectId: group.subjectId,
              gradeId: gradeGroup.gradeId,
            });
          }
        });
      });
      return prev; // Không thay đổi state ở đây
    });

    // Fetch assessments sau khi đã lấy được danh sách
    // Sử dụng setTimeout để đảm bảo state update trước đó đã hoàn tất
    if (groupsToFetch.length > 0) {
      setTimeout(() => {
        groupsToFetch.forEach(({ subjectId, gradeId }) => {
          fetchAssessments(subjectId, gradeId, globalType);
        });
      }, 0);
    }
  }, [globalType, fetchAssessments]);

  // auto select school when user type = school
  const schoolAutoSelectedRef = useRef(false);
  useEffect(() => {
    if (
      schoolAutoSelectedRef.current ||
      !isSchoolManager(user) ||
      schools.length === 0
    ) return;

    const first = schools[0]
    
    if (first) {
      schoolAutoSelectedRef.current = true;
      setSelectedSchoolIds([first.id]);
    }
  }, [schools, user]);

  // Initial load
  useEffect(() => {
    fetchSchools();
    fetchSubjects();
    fetchGrades();
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4 flex-1">
            {/* Trường - Multi-select */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 w-full sm:w-auto min-w-0">
              <Label
                htmlFor="school-select"
                className="whitespace-nowrap text-sm sm:text-base"
              >
                Trường:
              </Label>
              <Popover
                open={schoolsPopoverOpen}
                onOpenChange={setSchoolsPopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full sm:w-[200px] justify-between"
                    disabled={loadingSchools}
                  >
                    <span className="truncate">
                      {loadingSchools ? "Đang tải..." : getSchoolsDisplayText()}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" align="start">
                  <div className="max-h-[300px] overflow-y-auto p-2">
                    <div
                      className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                      onClick={() => handleSchoolToggle("all")}
                    >
                      <Checkbox
                        checked={
                          selectedSchoolIds.length === schools.length &&
                          schools.length > 0
                        }
                        onCheckedChange={() => handleSchoolToggle("all")}
                      />
                      <label className="text-sm font-medium cursor-pointer">
                        Tất cả
                      </label>
                    </div>
                    {sortAlphabetGeneric(schools, schools => schools.name, true).map((school) => (
                      <div
                        key={school.id}
                        className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                        onClick={() => handleSchoolToggle(school.id)}
                      >
                        <Checkbox
                          checked={selectedSchoolIds.includes(school.id)}
                          onCheckedChange={() => handleSchoolToggle(school.id)}
                        />
                        <label className="text-sm cursor-pointer">
                          {school.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Bộ lọc Loại - Global */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 w-full sm:w-auto min-w-0">
              <Label
                htmlFor="type-select"
                className="whitespace-nowrap text-sm sm:text-base"
              >
                Loại:
              </Label>
              <Select
                value={globalType}
                onValueChange={(value: "month" | "semester") =>
                  handleGlobalTypeChange(value)
                }
              >
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Chọn loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Tháng</SelectItem>
                  <SelectItem value="semester">Kỳ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Nút Xuất báo cáo */}
          <div className="w-full lg:w-auto flex justify-end lg:flex-shrink-0">
            <Button
              onClick={handleExportReport}
              className="w-full lg:w-auto"
              disabled={exporting}
            >
              {exporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xuất...
                </>
              ) : (
                "Xuất báo cáo"
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {loadingSubjects ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Đang tải môn học...</span>
            </div>
          ) : subjectGroups.length === 0 ? (
            <p className="text-sm text-gray-600 text-center py-8">
              Không có môn học nào
            </p>
          ) : (
            subjectGroups.map((group) => (
              <Card key={group.subjectId} className="border-gray-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {group.subjectName}
                    </h3>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {group.gradeGroups.map((gradeGroup, gradeGroupIndex) => (
                      <div
                        key={gradeGroupIndex}
                        className="flex flex-col lg:flex-row gap-4 p-4 border border-gray-200 rounded-lg"
                      >
                        {/* Bộ lọc Khối (Grade) */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 w-full lg:w-auto min-w-0">
                          <Label
                            htmlFor={`grade-select-${group.subjectId}-${gradeGroupIndex}`}
                            className="whitespace-nowrap text-sm sm:text-base"
                          >
                            Khối:
                          </Label>
                          <Select
                            value={gradeGroup.gradeId}
                            onValueChange={(value) =>
                              handleGradeChange(
                                group.subjectId,
                                gradeGroupIndex,
                                value
                              )
                            }
                            disabled={!globalType}
                          >
                            <SelectTrigger className="w-full sm:w-[150px]">
                              <SelectValue placeholder="Chọn khối" />
                            </SelectTrigger>
                            <SelectContent>
                              {sortAlphabetGeneric(grades, grades => grades.name_vn || grades.name_en, true).map((grade) => (
                                <SelectItem
                                  key={grade.id}
                                  value={String(grade.id)}
                                >
                                  {grade.name_vn || grade.name_en}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Bộ lọc Assessment - Single select */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 w-full lg:flex-1 min-w-0">
                          <Label
                            htmlFor={`assessment-select-${group.subjectId}-${gradeGroupIndex}`}
                            className="whitespace-nowrap text-sm sm:text-base"
                          >
                            Bài kiểm tra đánh giá:
                          </Label>
                          <Select
                            value={gradeGroup.selectedAssessmentId}
                            onValueChange={(value) =>
                              handleAssessmentChange(
                                group.subjectId,
                                gradeGroupIndex,
                                value
                              )
                            }
                            disabled={
                              gradeGroup.loadingAssessments ||
                              !globalType ||
                              !gradeGroup.gradeId ||
                              gradeGroup.assessments.length === 0
                            }
                          >
                            <SelectTrigger className="w-full sm:w-[300px]">
                              <SelectValue
                                placeholder={
                                  gradeGroup.loadingAssessments
                                    ? "Đang tải..."
                                    : !globalType
                                    ? "Chọn Loại trước"
                                    : !gradeGroup.gradeId
                                    ? "Chọn Khối trước"
                                    : gradeGroup.assessments.length === 0
                                    ? "Không có bài kiểm tra"
                                    : "Chọn bài kiểm tra"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {sortAlphabetGeneric(gradeGroup.assessments, item =>  item.name, true).map((assessment) => (
                                <SelectItem
                                  key={assessment.id}
                                  value={assessment.id}
                                >
                                  {assessment.name}
                                  {assessment.description &&
                                    ` - ${assessment.description}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Nút Xóa grade group */}
                        {group.gradeGroups.length > 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleRemoveGradeGroup(
                                group.subjectId,
                                gradeGroupIndex
                              )
                            }
                            className="w-full lg:w-auto"
                          >
                            Xóa
                          </Button>
                        )}
                      </div>
                    ))}

                    {/* Nút Thêm grade group */}
                    <Button
                      variant="outline"
                      onClick={() => handleAddGradeGroup(group.subjectId)}
                      className="w-full lg:w-auto"
                    >
                      + Thêm khối
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
