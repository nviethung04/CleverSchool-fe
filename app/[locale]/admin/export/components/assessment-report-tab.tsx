"use client";

import React, { useState, useEffect } from "react";
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
import { getListSchool, getListClassMain } from "@/lib/api/dashboard";
import { GetSubjectsList } from "@/lib/api/subjects";
import {
  GetAssessmentList,
  GetAssessmentReport,
  type AssessmentReportStudentItem,
} from "@/lib/api/assessment";
import { useTranslations } from "next-intl";
import {
  loadJSZip,
  loadJsPDF,
  loadHtml2Canvas,
  generatePDFFromHTML,
  convertReportDataToTemplate,
  sanitizeFileName,
} from "./assessment-report-utils";
import { generateAssessmentReportHTML } from "./assessment-report-template";
import {
  generateAssessmentStudentReportHTML,
  type AssessmentStudentReportData,
} from "./assessment-student-report-template";
import { sortAlphabetGeneric, sortByNumberAndAlphabetFromSecondGeneric } from "@/lib/utils";

export default function AssessmentReportTab() {
  const t = useTranslations("exportReport");
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  // Store assessments by class_main_id and subject_id
  // Key format: `${class_main_id}_${subject_id}`
  const [assessmentsByClassAndSubject, setAssessmentsByClassAndSubject] =
    useState<
      Record<
        string,
        {
          id: string;
          name: string;
          description: string;
          class_main_id: string;
          subject_id: string;
          type: string;
        }[]
      >
    >({});

  // Flattened list for display (with class_main_id and subject_id mapping)
  const [assessments, setAssessments] = useState<
    {
      id: string;
      name: string;
      description: string;
      class_main_id: string;
      subject_id: string;
      type: string;
    }[]
  >([]);

  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [selectedAssessmentIds, setSelectedAssessmentIds] = useState<string[]>(
    []
  );

  const [loadingSchools, setLoadingSchools] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingAssessments, setLoadingAssessments] = useState(false);
  const [classesPopoverOpen, setClassesPopoverOpen] = useState(false);
  const [subjectsPopoverOpen, setSubjectsPopoverOpen] = useState(false);
  const [assessmentsPopoverOpen, setAssessmentsPopoverOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingType, setExportingType] = useState<
    "class" | "student" | null
  >(null);

  // Fetch schools list
  const fetchSchools = async () => {
    setLoadingSchools(true);
    try {
      const response = await getListSchool();
      if (response.data && response.data.schools) {
        const schoolsList = response.data.schools.map((school: any) => ({
          id: school.id,
          name: school.school_name,
        }));
        setSchools(schoolsList);
        // Auto-select first school if none selected
        if (schoolsList.length > 0) {
          setSelectedSchoolId((prev) => prev || schoolsList[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching schools:", error);
    } finally {
      setLoadingSchools(false);
    }
  };

  // Fetch classes list (depends on school filter)
  const fetchClasses = async () => {
    if (!selectedSchoolId) {
      setClasses([]);
      return;
    }

    setLoadingClasses(true);
    try {
      const response = await getListClassMain({
        school_id: selectedSchoolId,
        limit: 1000, // Get all classes
      });
      const data = response?.data || response;
      if (data?.class_mains) {
        setClasses(
          data.class_mains.map((cls: any) => ({
            id: String(cls.id),
            name: cls.name,
          }))
        );
      } else {
        setClasses([]);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
      setClasses([]);
    } finally {
      setLoadingClasses(false);
    }
  };

  // Fetch subjects list
  const fetchSubjects = async () => {
    setLoadingSubjects(true);
    try {
      const response = await GetSubjectsList();
      // Handle different response structures
      if (response?.data?.subjects) {
        setSubjects(
          response.data.subjects.map((subject: any) => ({
            id: String(subject.id),
            name: subject.name,
          }))
        );
      } else if (response?.subjects) {
        setSubjects(
          response.subjects.map((subject: any) => ({
            id: String(subject.id),
            name: subject.name,
          }))
        );
      } else if (Array.isArray(response?.data)) {
        setSubjects(
          response.data.map((subject: any) => ({
            id: String(subject.id),
            name: subject.name,
          }))
        );
      } else {
        setSubjects([]);
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
      setSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  };

  // Fetch assessments list (depends on class and subject filter)
  const fetchAssessments = async () => {
    if (
      !selectedSchoolId ||
      selectedClassIds.length === 0 ||
      selectedSubjectIds.length === 0 ||
      classes.length === 0
    ) {
      setAssessments([]);
      setAssessmentsByClassAndSubject({});
      return;
    }

    setLoadingAssessments(true);
    try {
      // Get classes to fetch (if "all" is selected, use all classes)
      const classesToFetch =
        selectedClassIds.length === classes.length && classes.length > 0
          ? classes
          : classes.filter((c) => selectedClassIds.includes(c.id));

      if (classesToFetch.length === 0) {
        setAssessments([]);
        setAssessmentsByClassAndSubject({});
        return;
      }

      const newAssessmentsByClassAndSubject: Record<
        string,
        {
          id: string;
          name: string;
          description: string;
          class_main_id: string;
          subject_id: string;
          type: string;
        }[]
      > = {};

      // Fetch assessments for each class_main_id and subject_id combination
      const allPromises: Promise<void>[] = [];

      for (const classItem of classesToFetch) {
        // For each class, fetch assessments for each selected subject
        const classPromises = selectedSubjectIds.flatMap((subjectId) => {
          // Fetch both final_exam and mini_test types
          return ["final_exam", "mini_test"].map(async (assessmentType) => {
            try {
              const response = await GetAssessmentList({
                type: assessmentType,
                subject_id: subjectId,
                class_main_id: classItem.id,
                limit: 1000, // Get all assessments
              });

              if (response?.assessment) {
                // Key format: `${class_main_id}_${subject_id}`
                const key = `${classItem.id}_${subjectId}`;
                if (!newAssessmentsByClassAndSubject[key]) {
                  newAssessmentsByClassAndSubject[key] = [];
                }

                // Add assessments with class_main_id and subject_id mapping
                const classAssessments = response.assessment.map(
                  (assessment: any) => ({
                    id: String(assessment.id),
                    name: assessment.name,
                    description: assessment.description,
                    class_main_id: classItem.id,
                    subject_id: subjectId,
                    type: assessment.type || assessmentType,
                  })
                );

                newAssessmentsByClassAndSubject[key].push(...classAssessments);
              }
            } catch (error) {
              console.error(
                `Error fetching assessments for class ${classItem.id}, subject ${subjectId}, type ${assessmentType}:`,
                error
              );
            }
          });
        });

        allPromises.push(...classPromises);
      }

      await Promise.all(allPromises);

      // Remove duplicates within each class-subject combination based on assessment id
      Object.keys(newAssessmentsByClassAndSubject).forEach((key) => {
        newAssessmentsByClassAndSubject[key] = Array.from(
          new Map(
            newAssessmentsByClassAndSubject[key].map((assessment) => [
              assessment.id,
              assessment,
            ])
          ).values()
        );
      });

      setAssessmentsByClassAndSubject(newAssessmentsByClassAndSubject);

      // Flatten for display (keep class_main_id and subject_id for mapping)
      const flattenedAssessments: {
        id: string;
        name: string;
        description: string;
        class_main_id: string;
        subject_id: string;
        type: string;
      }[] = [];
      Object.values(newAssessmentsByClassAndSubject).forEach(
        (classSubjectAssessments) => {
          flattenedAssessments.push(...classSubjectAssessments);
        }
      );

      // Remove duplicates across classes/subjects for display (but keep mapping info)
      // Note: Keep the first occurrence which may have different type, so we need to track by id+type
      const uniqueAssessmentsMap = new Map<
        string,
        {
          id: string;
          name: string;
          description: string;
          class_main_id: string;
          subject_id: string;
          type: string;
        }
      >();
      flattenedAssessments.forEach((assessment) => {
        // Use id+type as key to handle same assessment with different types
        const key = `${assessment.id}_${assessment.type}`;
        const existing = uniqueAssessmentsMap.get(key);
        if (!existing) {
          uniqueAssessmentsMap.set(key, assessment);
        }
      });

      setAssessments(Array.from(uniqueAssessmentsMap.values()));
    } catch (error) {
      console.error("Error fetching assessments:", error);
      setAssessments([]);
      setAssessmentsByClassAndSubject({});
    } finally {
      setLoadingAssessments(false);
    }
  };

  // Handle school selection change
  const handleSchoolChange = (schoolId: string) => {
    setSelectedSchoolId(schoolId);
    setSelectedClassIds([]); // Reset classes when school changes
    setSelectedAssessmentIds([]); // Reset assessments when school changes
    setAssessmentsByClassAndSubject({}); // Reset assessments by class and subject
  };

  // Handle class selection toggle
  const handleClassToggle = (classId: string) => {
    if (classId === "all") {
      // Toggle "Tất cả"
      if (selectedClassIds.length === classes.length && classes.length > 0) {
        setSelectedClassIds([]);
      } else {
        setSelectedClassIds(classes.map((c) => c.id));
      }
    } else {
      // Toggle individual class
      if (selectedClassIds.includes(classId)) {
        setSelectedClassIds(selectedClassIds.filter((id) => id !== classId));
      } else {
        setSelectedClassIds([...selectedClassIds, classId]);
      }
    }
  };

  // Handle subject selection toggle
  const handleSubjectToggle = (subjectId: string) => {
    if (subjectId === "all") {
      // Toggle "Tất cả"
      if (selectedSubjectIds.length === subjects.length) {
        setSelectedSubjectIds([]);
      } else {
        setSelectedSubjectIds(subjects.map((s) => s.id));
      }
    } else {
      // Toggle individual subject
      if (selectedSubjectIds.includes(subjectId)) {
        setSelectedSubjectIds(
          selectedSubjectIds.filter((id) => id !== subjectId)
        );
      } else {
        setSelectedSubjectIds([...selectedSubjectIds, subjectId]);
      }
    }
  };

  // Handle assessment selection toggle
  const handleAssessmentToggle = (assessmentId: string, assessmentType?: string) => {
    if (assessmentId === "all") {
      // Toggle "Tất cả" - không hỗ trợ khi có logic disable theo type
      // Chỉ cho phép chọn tất cả nếu chưa có bài nào được chọn
      if (selectedAssessmentIds.length === 0) {
        // Không cho phép chọn tất cả vì cần chọn theo type
        return;
      } else {
        setSelectedAssessmentIds([]);
      }
    } else {
      // Toggle individual assessment
      if (selectedAssessmentIds.includes(assessmentId)) {
        setSelectedAssessmentIds(
          selectedAssessmentIds.filter((id) => id !== assessmentId)
        );
      } else {
        // Kiểm tra xem đã có bài nào được chọn chưa
        if (selectedAssessmentIds.length > 0) {
          // Kiểm tra type của bài đã chọn
          const selectedAssessment = assessments.find(
            (a) => selectedAssessmentIds.includes(a.id)
          );
          if (selectedAssessment && assessmentType) {
            // Nếu type khác nhau, không cho phép chọn
            if (selectedAssessment.type !== assessmentType) {
              return;
            }
          }
        }
        setSelectedAssessmentIds([...selectedAssessmentIds, assessmentId]);
      }
    }
  };

  // Get selected assessment type (if any)
  const getSelectedAssessmentType = (): string | null => {
    if (selectedAssessmentIds.length === 0) {
      return null;
    }
    const selectedAssessment = assessments.find(
      (a) => selectedAssessmentIds.includes(a.id)
    );
    return selectedAssessment?.type || null;
  };

  // Check if assessment should be disabled
  const isAssessmentDisabled = (assessmentType: string): boolean => {
    const selectedType = getSelectedAssessmentType();
    if (!selectedType) {
      return false;
    }
    return selectedType !== assessmentType;
  };

  // Handle export report
  // getStudyReportCriteria = true: thêm param get_study_report_criteria vào API
  const handleExportReport = async (
    getStudyReportCriteria: boolean = false,
    type: "class" | "student" = "class"
  ) => {
    // Validate filters
    if (!selectedSchoolId) {
      alert("Vui lòng chọn trường");
      return;
    }

    if (classes.length === 0) {
      alert("Không có lớp nào để xuất báo cáo");
      return;
    }

    if (selectedClassIds.length === 0) {
      alert("Vui lòng chọn ít nhất một lớp");
      return;
    }

    if (selectedAssessmentIds.length === 0) {
      alert("Vui lòng chọn ít nhất một bài kiểm tra");
      return;
    }

    setExporting(true);
    setExportingType(type);

    try {
      // Load libraries
      await Promise.all([loadJSZip(), loadJsPDF(), loadHtml2Canvas()]);

      const JSZip = (window as any).JSZip;
      const zip = new JSZip();

      // Get classes to export
      const classesToExport =
        selectedClassIds.length === classes.length && classes.length > 0
          ? classes
          : classes.filter((c) => selectedClassIds.includes(c.id));

      if (classesToExport.length === 0) {
        alert("Không có lớp nào để xuất");
        setExporting(false);
        return;
      }

      // Get selected assessment IDs (if "all" is selected, collect all unique assessment IDs from assessmentsByClassAndSubject)
      const selectedAssessmentIdsToUse =
        selectedAssessmentIds.length === assessments.length &&
        assessments.length > 0
          ? (() => {
              // Collect all unique assessment IDs from all class-subject combinations
              const allAssessmentIds = new Set<string>();
              Object.values(assessmentsByClassAndSubject).forEach(
                (classSubjectAssessments) => {
                  classSubjectAssessments.forEach((a) => {
                    allAssessmentIds.add(a.id);
                  });
                }
              );
              return Array.from(allAssessmentIds);
            })()
          : selectedAssessmentIds;

      if (selectedAssessmentIdsToUse.length === 0) {
        alert("Vui lòng chọn ít nhất một bài kiểm tra");
        setExporting(false);
        return;
      }

      // NEW LOGIC: For each selected assessment, find all class_main_id and subject_id combinations
      // that contain this assessment, then create pairs for GetAssessmentReport
      const classAssessmentPairs: Array<{
        classId: string;
        className: string;
        subjectId: string;
        assessmentId: string;
        assessmentName: string;
        assessmentDescription: string;
      }> = [];

      console.log(
        `Export: Processing ${selectedAssessmentIdsToUse.length} selected assessments`
      );

      // Iterate through each selected assessment
      for (const selectedAssessmentId of selectedAssessmentIdsToUse) {
        // Find all class_main_id and subject_id combinations that contain this assessment
        const matchingPairs: Array<{
          classId: string;
          subjectId: string;
          assessment: {
            id: string;
            name: string;
            description: string;
          };
        }> = [];

        // Search through all class-subject combinations to find where this assessment exists
        for (const classItem of classesToExport) {
          for (const subjectId of selectedSubjectIds) {
            const key = `${classItem.id}_${subjectId}`;
            const classSubjectAssessments =
              assessmentsByClassAndSubject[key] || [];

            // Find if this assessment exists in this class-subject combination
            const foundAssessment = classSubjectAssessments.find(
              (a) =>
                a.id === selectedAssessmentId &&
                a.class_main_id === classItem.id &&
                a.subject_id === subjectId
            );

            if (foundAssessment) {
              matchingPairs.push({
                classId: classItem.id,
                subjectId: subjectId,
                assessment: {
                  id: foundAssessment.id,
                  name: foundAssessment.name,
                  description: foundAssessment.description,
                },
              });
              console.log(
                `Export: Found assessment ${selectedAssessmentId} (${foundAssessment.name}) in class ${classItem.id} (${classItem.name}), subject ${subjectId}`
              );
            }
          }
        }

        // Add all matching pairs for this assessment
        for (const pair of matchingPairs) {
          const classItem = classesToExport.find((c) => c.id === pair.classId);
          if (classItem) {
            classAssessmentPairs.push({
              classId: pair.classId,
              className: classItem.name,
              subjectId: pair.subjectId,
              assessmentId: pair.assessment.id,
              assessmentName: pair.assessment.name,
              assessmentDescription: pair.assessment.description,
            });
            console.log(
              `Export: Added pair - Class ${pair.classId} (${classItem.name}), Subject ${pair.subjectId}, Assessment ${pair.assessment.id} (${pair.assessment.name})`
            );
          }
        }

        if (matchingPairs.length === 0) {
          console.warn(
            `Export: Assessment ${selectedAssessmentId} not found in any class-subject combination`
          );
        } else {
          console.log(
            `Export: Assessment ${selectedAssessmentId} found in ${matchingPairs.length} class-subject combination(s)`
          );
        }
      }

      const totalRequests = classAssessmentPairs.length;

      if (totalRequests === 0) {
        alert("Không có bài kiểm tra nào tương ứng với các lớp đã chọn");
        setExporting(false);
        return;
      }

      console.log(
        `Export: Total ${totalRequests} API calls will be made for GetAssessmentReport`
      );

      let completedRequests = 0;

      // Process each class-subject-assessment combination
      for (const pair of classAssessmentPairs) {
        try {
          completedRequests++;
          console.log(
            `Processing: Class ${pair.className} (${pair.classId}) - Subject ${pair.subjectId} - Assessment ${pair.assessmentName} (${pair.assessmentId}) (${completedRequests}/${totalRequests})`
          );

          // Verify the pair is valid before calling API
          const key = `${pair.classId}_${pair.subjectId}`;
          const classSubjectAssessments =
            assessmentsByClassAndSubject[key] || [];
          const matchingAssessment = classSubjectAssessments.find(
            (a) =>
              a.id === pair.assessmentId &&
              a.class_main_id === pair.classId &&
              a.subject_id === pair.subjectId
          );

          if (!matchingAssessment) {
            console.error(
              `Skipping invalid pair: Assessment ${pair.assessmentId} not found for class ${pair.classId} and subject ${pair.subjectId}`
            );
            continue;
          }

          // Call API GetAssessmentReport với class_main_id & assessment_id tương ứng
          const reportResponse = await GetAssessmentReport({
            class_main_id: pair.classId,
            assessment_id: pair.assessmentId,
            get_score: true,
            ...(getStudyReportCriteria
              ? { get_study_report_criteria: true }
              : {}),
          });

          if (reportResponse.code !== 200 || !reportResponse.data) {
            console.error(
              `Error fetching report for class ${pair.className}, subject ${pair.subjectId}, assessment ${pair.assessmentId}:`,
              reportResponse.message
            );
            continue;
          }

          const sanitizedClassName = sanitizeFileName(pair.className);

          if (!getStudyReportCriteria) {
            // Xuất báo cáo tổng hợp theo lớp (template cũ)
            const templateData = convertReportDataToTemplate(
              reportResponse,
              "N/A",
              pair.assessmentName
            );

            const html = generateAssessmentReportHTML(templateData);
            const pdfBlob = await generatePDFFromHTML(html);

            const sanitizedAssessmentName = sanitizeFileName(
              pair.assessmentName
            );
            const sanitizedAssessmentDescription = sanitizeFileName(
              pair.assessmentDescription || ""
            );
            const pdfFileName = sanitizedAssessmentDescription
              ? `${sanitizedAssessmentName}_${sanitizedAssessmentDescription}.pdf`
              : `${sanitizedAssessmentName}.pdf`;

            zip.file(`${sanitizedClassName}/${pdfFileName}`, pdfBlob);
          } else {
            // Xuất báo cáo theo từng học sinh (mỗi file PDF là 1 học sinh)
            // Xử lý batch để tăng tốc độ và cleanup memory sau mỗi batch
            const students = reportResponse.data.students || [];
            const info = reportResponse.data.info;

            // Batch processing: xử lý 3 PDF cùng lúc để tăng tốc độ
            const BATCH_SIZE = 3;
            const studentBatches: Array<{ index: number; student: AssessmentReportStudentItem }>[] = [];
            
            for (let i = 0; i < students.length; i += BATCH_SIZE) {
              const batch = students.slice(i, i + BATCH_SIZE).map((student, batchIndex) => ({
                index: i + batchIndex,
                student,
              }));
              studentBatches.push(batch);
            }

            // Xử lý từng batch
            for (const batch of studentBatches) {
              // Xử lý batch song song
              await Promise.all(
                batch.map(async ({ index, student }) => {
                  try {
                    const maxTotalScore =
                      (student.assessment.criteria || []).reduce(
                        (sum, c) => sum + (c.max_score || 0),
                        0
                      ) || 0;

                    const studyCriteria = student.study_report_criteria;

                    const studentData: AssessmentStudentReportData = {
                      schoolName: info.school_name,
                      className: info.class_name,
                      programName: info.program_name || "N/A",
                      subjectName: student.assessment.subject_name || "",
                      subjectId: student.assessment.subject_id,
                      assessmentId: Number(student.assessment.id),
                      assessmentName: student.assessment.name,
                      assessmentType: student.assessment.type || "",
                      studentName: student.student_name,
                      totalScore:
                        typeof student.total_score === "number"
                          ? student.total_score
                          : Number(student.total_score || 0),
                      maxTotalScore,
                      criteria: (student.assessment.criteria || []).map((c) => ({
                        id: String(c.id),
                        name: c.name,
                        max_score: c.max_score,
                        score: c.score,
                        subcriteria: (c.subcriteria || []).map((s) => ({
                          id: String(s.id),
                          name: s.name,
                          max_score: s.max_score,
                          score: s.score,
                        })),
                      })),
                      examFiles: student.files || [],
                      studyReportCriteria: studyCriteria,
                      info: {
                        ...info,
                      },
                      generalComment: (student as any).general_comment,
                    };

                    const html = generateAssessmentStudentReportHTML(studentData);
                    const pdfBlob = await generatePDFFromHTML(html);

                    const sanitizedStudentName = sanitizeFileName(
                      student.student_name
                    );

                    // Thêm số thứ tự vào đầu tên file để đảm bảo thứ tự trong ZIP
                    // Format: 001_Tên_Học_Sinh.pdf, 002_Tên_Học_Sinh.pdf, ...
                    const indexStr = String(index + 1).padStart(3, '0');
                    const pdfFileName = `${indexStr}_${sanitizedStudentName}.pdf`;

                    zip.file(`${sanitizedClassName}/${pdfFileName}`, pdfBlob);
                  } catch (err) {
                    console.error(
                      `Error generating student report PDF for ${student.student_name} in class ${pair.className}`,
                      err
                    );
                  }
                })
              );

              // Cleanup memory sau mỗi batch
              // Force garbage collection nếu có thể (chỉ trong development)
              if (window.gc) {
                window.gc();
              }
              
              // Đợi một chút để browser có thời gian cleanup
              await new Promise((resolve) => setTimeout(resolve, 50));
            }
          }
        } catch (error) {
          console.error(
            `Error processing class ${pair.className}, subject ${pair.subjectId}, assessment ${pair.assessmentName}:`,
            error
          );
          // Continue with next pair
        }
      }

      // Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const currentDate = new Date().toISOString().split("T")[0];
      const schoolName =
        schools.find((s) => s.id === selectedSchoolId)?.name || "School";
      const sanitizedSchoolName = sanitizeFileName(schoolName);
      const zipFileName = `Bao_cao_bai_kiem_tra_${sanitizedSchoolName}_${currentDate}.zip`;

      const link = document.createElement("a");
      link.href = URL.createObjectURL(zipBlob);
      link.download = zipFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      setTimeout(() => {
        URL.revokeObjectURL(link.href);
      }, 1000);
    } catch (error) {
      console.error("Error exporting report:", error);
      alert("Có lỗi xảy ra khi xuất báo cáo. Vui lòng thử lại.");
    } finally {
      setExporting(false);
      setExportingType(null);
    }
  };

  // Initial load
  useEffect(() => {
    fetchSchools();
    fetchSubjects();
  }, []);

  // Fetch classes when school changes
  useEffect(() => {
    fetchClasses();
  }, [selectedSchoolId]);

  // Reset assessments when class changes
  useEffect(() => {
    setSelectedAssessmentIds([]);
    setAssessmentsByClassAndSubject({});
  }, [selectedClassIds]);

  // Fetch assessments when school, class, or subject changes
  useEffect(() => {
    fetchAssessments();
  }, [selectedSchoolId, selectedClassIds, selectedSubjectIds, classes]);

  // Get display text for classes
  const getClassesDisplayText = () => {
    if (selectedClassIds.length === 0) {
      return "Chọn lớp";
    }
    if (selectedClassIds.length === classes.length && classes.length > 0) {
      return "Tất cả lớp";
    }
    if (selectedClassIds.length === 1) {
      const classItem = classes.find((c) => c.id === selectedClassIds[0]);
      return classItem?.name || "1 lớp đã chọn";
    }
    return `${selectedClassIds.length} lớp đã chọn`;
  };

  // Get display text for subjects
  const getSubjectsDisplayText = () => {
    if (selectedSubjectIds.length === 0) {
      return "Chọn môn";
    }
    if (selectedSubjectIds.length === subjects.length) {
      return "Tất cả môn";
    }
    if (selectedSubjectIds.length === 1) {
      const subject = subjects.find((s) => s.id === selectedSubjectIds[0]);
      return subject?.name || "1 môn đã chọn";
    }
    return `${selectedSubjectIds.length} môn đã chọn`;
  };

  // Get display text for assessments
  const getAssessmentsDisplayText = () => {
    if (selectedAssessmentIds.length === 0) {
      return "Chọn bài kiểm tra";
    }
    const selectedType = getSelectedAssessmentType();
    const assessmentsOfSelectedType = assessments.filter(
      (a) => a.type === selectedType
    );
    if (
      selectedAssessmentIds.length === assessmentsOfSelectedType.length &&
      assessmentsOfSelectedType.length > 0
    ) {
      const typeLabel =
        selectedType === "final_exam" ? "cuối kỳ" : "tháng";
      return `Tất cả bài kiểm tra ${typeLabel}`;
    }
    if (selectedAssessmentIds.length === 1) {
      const assessment = assessments.find(
        (a) => a.id === selectedAssessmentIds[0]
      );
      return assessment?.name || "1 bài kiểm tra đã chọn";
    }
    const typeLabel = selectedType === "final_exam" ? "cuối kỳ" : "tháng";
    return `${selectedAssessmentIds.length} bài kiểm tra ${typeLabel} đã chọn`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4 flex-1">
            {/* Trường */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 w-full sm:w-auto min-w-0">
              <Label
                htmlFor="school-select"
                className="whitespace-nowrap text-sm sm:text-base"
              >
                Trường:
              </Label>
              <Select
                value={selectedSchoolId}
                onValueChange={handleSchoolChange}
                disabled={loadingSchools || schools.length === 0}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Chọn trường" />
                </SelectTrigger>
                <SelectContent>
                  {sortAlphabetGeneric(schools, schools => schools.name, true).map((school) => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Lớp - Multi-select */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 w-full sm:w-auto min-w-0">
              <Label
                htmlFor="class-select"
                className="whitespace-nowrap text-sm sm:text-base"
              >
                Lớp:
              </Label>
              <Popover
                open={classesPopoverOpen}
                onOpenChange={setClassesPopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full sm:w-[180px] justify-between"
                    disabled={loadingClasses || !selectedSchoolId}
                  >
                    <span className="truncate">
                      {loadingClasses
                        ? "Đang tải..."
                        : getClassesDisplayText()}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" align="start">
                  <div className="max-h-[300px] overflow-y-auto p-2">
                    <div
                      className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                      onClick={() => handleClassToggle("all")}
                    >
                      <Checkbox
                        checked={
                          selectedClassIds.length === classes.length &&
                          classes.length > 0
                        }
                        onCheckedChange={() => handleClassToggle("all")}
                      />
                      <label className="text-sm font-medium cursor-pointer">
                        Tất cả
                      </label>
                    </div>
                    {sortByNumberAndAlphabetFromSecondGeneric(classes, classes => classes.name, true).map((cls) => (
                      <div
                        key={cls.id}
                        className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                        onClick={() => handleClassToggle(cls.id)}
                      >
                        <Checkbox
                          checked={selectedClassIds.includes(cls.id)}
                          onCheckedChange={() => handleClassToggle(cls.id)}
                        />
                        <label className="text-sm cursor-pointer">
                          {cls.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Môn - Multi-select */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 w-full sm:w-auto min-w-0">
              <Label
                htmlFor="subject-select"
                className="whitespace-nowrap text-sm sm:text-base"
              >
                Môn:
              </Label>
              <Popover
                open={subjectsPopoverOpen}
                onOpenChange={setSubjectsPopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full sm:w-[200px] justify-between"
                    disabled={loadingSubjects}
                  >
                    <span className="truncate">
                      {loadingSubjects
                        ? "Đang tải..."
                        : getSubjectsDisplayText()}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" align="start">
                  <div className="max-h-[300px] overflow-y-auto p-2">
                    <div
                      className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                      onClick={() => handleSubjectToggle("all")}
                    >
                      <Checkbox
                        checked={
                          selectedSubjectIds.length === subjects.length &&
                          subjects.length > 0
                        }
                        onCheckedChange={() => handleSubjectToggle("all")}
                      />
                      <label className="text-sm font-medium cursor-pointer">
                        Tất cả
                      </label>
                    </div>
                    {sortAlphabetGeneric(subjects, subjects => subjects.name, true).map((subject) => (
                      <div
                        key={subject.id}
                        className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                        onClick={() => handleSubjectToggle(subject.id)}
                      >
                        <Checkbox
                          checked={selectedSubjectIds.includes(subject.id)}
                          onCheckedChange={() =>
                            handleSubjectToggle(subject.id)
                          }
                        />
                        <label className="text-sm cursor-pointer">
                          {subject.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Bài kiểm tra - Multi-select */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 w-full sm:w-auto min-w-0">
              <Label
                htmlFor="assessment-select"
                className="whitespace-nowrap text-sm sm:text-base"
              >
                Bài kiểm tra:
              </Label>
              <Popover
                open={assessmentsPopoverOpen}
                onOpenChange={setAssessmentsPopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full sm:w-[300px] justify-between"
                    disabled={
                      loadingAssessments ||
                      !selectedSchoolId ||
                      selectedClassIds.length === 0 ||
                      selectedSubjectIds.length === 0 ||
                      classes.length === 0
                    }
                  >
                    <span className="truncate">
                      {loadingAssessments
                        ? "Đang tải..."
                        : !selectedSchoolId ||
                          selectedClassIds.length === 0 ||
                          selectedSubjectIds.length === 0 ||
                          classes.length === 0
                        ? "Chọn trường, lớp và môn trước"
                        : getAssessmentsDisplayText()}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <div className="max-h-[500px] overflow-y-auto p-2">
                    {/* Group by type */}
                    {(() => {
                      const finalExamAssessments = assessments.filter(
                        (a) => a.type === "final_exam"
                      );
                      const miniTestAssessments = assessments.filter(
                        (a) => a.type === "mini_test"
                      );
                      const selectedType = getSelectedAssessmentType();
                      const isFinalExamDisabled = selectedType === "mini_test";
                      const isMiniTestDisabled = selectedType === "final_exam";

                      return (
                        <>
                          {/* Bài kiểm tra cuối kỳ */}
                          {finalExamAssessments.length > 0 && (
                            <>
                              <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase bg-gray-50 sticky top-0">
                                Bài kiểm tra cuối kỳ
                              </div>
                              {sortAlphabetGeneric(
                                finalExamAssessments,
                                (a) => a.name,
                                true
                              ).map((assessment) => {
                                const isDisabled = isFinalExamDisabled;
                                return (
                                  <div
                                    key={assessment.id}
                                    className={`flex items-center space-x-2 p-2 rounded cursor-pointer ${
                                      isDisabled
                                        ? "opacity-50 cursor-not-allowed"
                                        : "hover:bg-gray-100"
                                    }`}
                                    onClick={() =>
                                      !isDisabled &&
                                      handleAssessmentToggle(
                                        assessment.id,
                                        assessment.type
                                      )
                                    }
                                  >
                                    <Checkbox
                                      checked={selectedAssessmentIds.includes(
                                        assessment.id
                                      )}
                                      disabled={isDisabled}
                                      onCheckedChange={() =>
                                        !isDisabled &&
                                        handleAssessmentToggle(
                                          assessment.id,
                                          assessment.type
                                        )
                                      }
                                    />
                                    <label
                                      className={`text-sm ${
                                        isDisabled
                                          ? "cursor-not-allowed"
                                          : "cursor-pointer"
                                      }`}
                                    >
                                      {assessment.name} - {assessment.description}
                                    </label>
                                  </div>
                                );
                              })}
                            </>
                          )}

                          {/* Bài kiểm tra tháng */}
                          {miniTestAssessments.length > 0 && (
                            <>
                              <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase bg-gray-50 sticky top-0 mt-2">
                                Bài kiểm tra tháng
                              </div>
                              {sortAlphabetGeneric(
                                miniTestAssessments,
                                (a) => a.name,
                                true
                              ).map((assessment) => {
                                const isDisabled = isMiniTestDisabled;
                                return (
                                  <div
                                    key={assessment.id}
                                    className={`flex items-center space-x-2 p-2 rounded cursor-pointer ${
                                      isDisabled
                                        ? "opacity-50 cursor-not-allowed"
                                        : "hover:bg-gray-100"
                                    }`}
                                    onClick={() =>
                                      !isDisabled &&
                                      handleAssessmentToggle(
                                        assessment.id,
                                        assessment.type
                                      )
                                    }
                                  >
                                    <Checkbox
                                      checked={selectedAssessmentIds.includes(
                                        assessment.id
                                      )}
                                      disabled={isDisabled}
                                      onCheckedChange={() =>
                                        !isDisabled &&
                                        handleAssessmentToggle(
                                          assessment.id,
                                          assessment.type
                                        )
                                      }
                                    />
                                    <label
                                      className={`text-sm ${
                                        isDisabled
                                          ? "cursor-not-allowed"
                                          : "cursor-pointer"
                                      }`}
                                    >
                                      {assessment.name} - {assessment.description}
                                    </label>
                                  </div>
                                );
                              })}
                            </>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          <span className="text-red-600 font-semibold">
            Xuất báo cáo điểm & đánh giá theo học sinh:
          </span>{" "}
          Chỉ có thể xuất theo từng môn một, mỗi học sinh chỉ có một bài kiểm tra đánh giá.
        </p>

        <p className="text-sm text-gray-600 mb-4">
          <span className="text-red-600 font-semibold">
            Xuất báo cáo điểm theo lớp:
          </span>{" "}
          Có thể xuất đồng thời nhiều môn, mỗi lớp chỉ có một bài kiểm tra đánh giá/môn.
        </p>
        {/* Nút Xuất báo cáo */}
        <div className="w-full flex flex-col sm:flex-row gap-2 justify-end">
          <Button
            onClick={() => handleExportReport(false, "class")}
            className="w-full sm:w-auto"
            disabled={exporting}
          >
            {exporting && exportingType === "class" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xuất...
              </>
            ) : (
              "Xuất báo cáo điểm theo lớp"
            )}
          </Button>
          <Button
            onClick={() => handleExportReport(true, "student")}
            className="w-full sm:w-auto h-auto min-h-10 whitespace-normal"
            disabled={exporting}
          >
            {exporting && exportingType === "student" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xuất...
              </>
            ) : (
              "Xuất báo cáo điểm & đánh giá theo học sinh"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}