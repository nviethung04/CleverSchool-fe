"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Star, ArrowLeft, Loader2, Save } from "lucide-react";
import { useTypedTranslations } from "@/lib/i18n/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  GetStudyReportCriteriaDetail,
  StudyReportCriteriaResponseData,
} from "@/lib/api/report-criteria";
import {
  CreateStudyReport,
  CreateStudyReportRequest,
  GetStudyReportDetail,
  UpdateStudyReport,
} from "@/lib/api/study-report";
import {
  GetAssessmentDetail,
  GetAssessmentStudents,
  type AssessmentStudentItem,
  type CourseInfo,
} from "@/lib/api/assessment";
import Loading from "@/app/loading";

type StarValuesMap = Record<string, number>;
type CheckValuesMap = Record<string, boolean>;

export default function AssessStudentPage() {
  const t = useTypedTranslations("assessStudent");
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();

  const assessmentId = searchParams.get("assessmentId");
  const courseId = searchParams.get("courseId");
  const tab = searchParams.get("tab") || "assessment";
  const reportId = searchParams.get("reportId") || "0";
  const studentId = params?.studentId as string | undefined;

  const [criteria, setCriteria] =
    useState<StudyReportCriteriaResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [starValues, setStarValues] = useState<StarValuesMap>({});
  const [checkValues, setCheckValues] = useState<CheckValuesMap>({});
  const [generalComment, setGeneralComment] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [assessmentStudent, setAssessmentStudent] =
    useState<AssessmentStudentItem | null>(null);
  const [courseInfo, setCourseInfo] = useState<CourseInfo | null>(null);
  const [loadingScores, setLoadingScores] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [className, setClassName] = useState("");
  const [courseName, setCourseName] = useState("");
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [missingItemIds, setMissingItemIds] = useState<Set<string>>(new Set());
  const [firstMissingItemId, setFirstMissingItemId] = useState<string | null>(
    null
  );
  const [maxCardWidth, setMaxCardWidth] = useState<number | null>(null);
  const starSkillsTableRefs = useRef<(HTMLTableElement | null)[]>([]);

  // Các nhận xét mẫu
  const commentTemplates = [
    "Con rất nhanh nhẹn, thông minh, nắm vững kiến thức và vận dụng hiệu quả.",
    "Con nắm khá vững kiến thức, nhưng vận dụng chưa thực sự hiệu quả ở các kĩ năng.",
    "Con học ngoan, chăm chỉ làm bài cô giao nhưng chưa thực sự mạnh dạn.",
    "Con có tinh thần học tập nhưng nắm bài chưa vững, cần chăm chỉ làm bài luyện tập hơn.",
    "Con có khả năng tiếp thu bài tương đối tốt nhưng chưa thực sự nghiêm túc trong giờ học.",
    "Con cần tăng cường luyện tập thêm để nắm vững cấu trúc câu, nhớ và hiểu từ vựng.",
  ];

  const maxStar = useMemo(() => {
    if (!criteria) return 5;
    return criteria.max_star || 5;
  }, [criteria]);

  // Hàm quay về trang reports với tab đúng
  const handleBack = () => {
    router.push(`/${params?.locale}/teacher/reports?tab=${tab}`);
  };

  // Fetch assessment detail -> lấy study_report_criteria_id -> fetch tiêu chí
  // Nếu có reportId != 0, fetch study report detail để fill dữ liệu
  useEffect(() => {
    const fetchCriteria = async () => {
      if (!assessmentId) {
        toast({
          title: t("errors.missingInfo"),
          description: t("errors.assessmentNotFound"),
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // 1. Lấy thông tin bài kiểm tra để biết study_report_criteria_id
        const assessment = await GetAssessmentDetail(assessmentId);
        const criteriaId = assessment?.study_report_criteria_id;
        if (!criteriaId) {
          throw new Error(t("errors.criteriaNotAttached"));
        }

        // 2. Lấy chi tiết form tiêu chí theo study_report_criteria_id
        const criteriaResponse = await GetStudyReportCriteriaDetail(
          String(criteriaId)
        );
        const data = criteriaResponse?.data;
        if (!data) {
          throw new Error(t("errors.criteriaNotFound"));
        }

        setCriteria(data);

        // Khởi tạo state sao và check-box
        const initialStars: StarValuesMap = {};
        const initialChecks: CheckValuesMap = {};

        data.star_skills?.forEach((skill) => {
          skill.types?.forEach((type) => {
            // Nếu có node_types (cấp 3), chỉ khởi tạo cho node_types hoặc cấp 4
            // Nếu không có node_types, khởi tạo cho types (cấp 2)
            if (type.node_types && type.node_types.length > 0) {
              type.node_types.forEach((node) => {
                // Kiểm tra xem có cấp 4 không
                if (node.node_types && node.node_types.length > 0) {
                  // Có cấp 4 -> khởi tạo cho cấp 4
                  node.node_types.forEach((level4Node: any) => {
                    if (level4Node.id) {
                      initialStars[String(level4Node.id)] = 0;
                    }
                  });
                } else {
                  // Chỉ có cấp 3 -> khởi tạo cho cấp 3
                  if (node.id) {
                    initialStars[String(node.id)] = 0;
                  }
                }
              });
            } else {
              if (type.id) {
                initialStars[String(type.id)] = 0;
              }
            }
          });
        });

        data.check_skills?.forEach((skill) => {
          skill.types?.forEach((type) => {
            if (type.id) {
              initialChecks[String(type.id)] = false;
            }
            // Khởi tạo cho node_types (cấp 3)
            type.node_types?.forEach((node) => {
              if (node.id) {
                initialChecks[String(node.id)] = false;
              }
            });
          });
        });

        // 3. Nếu có reportId và reportId != "0", fetch study report detail để fill dữ liệu
        if (reportId && reportId !== "0") {
          try {
            const reportResponse = await GetStudyReportDetail(reportId);
            const reportData = reportResponse?.data;

            if (reportData) {
              // Fill general comment
              if (reportData.general_comment) {
                setGeneralComment(reportData.general_comment);
              }

              // Fill is_completed
              if (reportData.is_completed !== undefined) {
                setIsCompleted(reportData.is_completed);
              }

              // Fill star values từ star_skills
              reportData.star_skills?.forEach((skill) => {
                skill.types?.forEach((type) => {
                  // Nếu có node_types (cấp 3), chỉ fill cho node_types hoặc cấp 4
                  // Nếu không có node_types, fill cho types (cấp 2)
                  const nodeTypes = (type as any).node_types;
                  if (nodeTypes && nodeTypes.length > 0) {
                    nodeTypes.forEach((node: any) => {
                      // Kiểm tra xem có cấp 4 không
                      const level4Nodes = node.node_types;
                      if (level4Nodes && level4Nodes.length > 0) {
                        // Có cấp 4 -> fill cho cấp 4
                        level4Nodes.forEach((level4Node: any) => {
                          if (level4Node.id && level4Node.star !== undefined) {
                            initialStars[String(level4Node.id)] =
                              level4Node.star;
                          }
                        });
                      } else {
                        // Chỉ có cấp 3 -> fill cho cấp 3
                        if (node.id && node.star !== undefined) {
                          initialStars[String(node.id)] = node.star;
                        }
                      }
                    });
                  } else {
                    if (type.id && type.star !== undefined) {
                      initialStars[String(type.id)] = type.star;
                    }
                  }
                });
              });

              // Fill check values từ check_skills
              reportData.check_skills?.forEach((skill) => {
                skill.types?.forEach((type) => {
                  if (type.id && type.is_check !== undefined) {
                    initialChecks[String(type.id)] = type.is_check;
                  }
                  // Fill node_types (cấp 3)
                  (type as any).node_types?.forEach((node: any) => {
                    if (node.id && node.is_check !== undefined) {
                      initialChecks[String(node.id)] = node.is_check;
                    }
                  });
                });
              });
            }
          } catch (error: any) {
            console.error("Error fetching study report detail:", error);
            // Không hiển thị toast vì đây là optional, chỉ để fill dữ liệu
            // Nếu lỗi, vẫn tiếp tục với form trống
          }
        }

        setStarValues(initialStars);
        setCheckValues(initialChecks);
      } catch (error: any) {
        console.error("Error fetching study report criteria detail:", error);
        toast({
          title: t("errors.error"),
          description:
            error?.response?.data?.message ||
            error?.message ||
            t("errors.failedToLoadForm"),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCriteria();
  }, [assessmentId, reportId, toast]);

  // Fetch assessment student scores (bảng điểm học sinh)
  useEffect(() => {
    const fetchAssessmentStudent = async () => {
      if (!assessmentId || !courseId || !studentId) return;

      try {
        setLoadingScores(true);
        const response = await GetAssessmentStudents({
          course_id: courseId,
          assessment_id: assessmentId,
          student_id: studentId,
          page: 1,
          limit: 1,
          get_score: true,
        });

        const students = response?.data?.students || [];
        const course_info = response?.data?.course_info || null;

        const found =
          students.find((s) => String(s.student_id) === String(studentId)) ||
          null;

        setAssessmentStudent(found);
        setCourseInfo(course_info);
      } catch (error: any) {
        console.error("Error fetching assessment student scores:", error);
        toast({
          title: t("errors.error"),
          description:
            error?.response?.data?.message ||
            error?.message ||
            t("errors.failedToLoadForm"),
          variant: "destructive",
        });
        setAssessmentStudent(null);
      } finally {
        setLoadingScores(false);
      }
    };

    fetchAssessmentStudent();
  }, [assessmentId, courseId, studentId, toast, t]);

  // Đo chiều rộng bảng star_skills (3 hoặc 4 cấp) và cập nhật maxCardWidth
  // Dùng requestAnimationFrame để chờ DOM render xong (ổn định cho cả dev & production)
  useEffect(() => {
    if (!criteria) return;

    let frameId: number;

    const measure = () => {
      const tables = starSkillsTableRefs.current;
      if (!tables.length) {
        // Nếu refs chưa được gán, chờ frame tiếp theo
        frameId = requestAnimationFrame(measure);
        return;
      }

      let maxTableWidth = 0;
      tables.forEach((table) => {
        if (table && table.isConnected) {
          const tableWidth = table.getBoundingClientRect().width;
          if (tableWidth > maxTableWidth) {
            maxTableWidth = tableWidth;
          }
        }
      });

      if (maxTableWidth > 0) {
        // Card width = table width + padding (khoảng 32px mỗi bên = 64px tổng)
        const cardWidth = maxTableWidth + 64;
        setMaxCardWidth(cardWidth);
      }
    };

    frameId = requestAnimationFrame(measure);

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [criteria]);

  const handleStarClick = (typeId: string, value: number) => {
    setStarValues((prev) => ({
      ...prev,
      [typeId]: value,
    }));
    // Xóa highlight khi người dùng click vào star
    if (missingItemIds.has(typeId)) {
      setMissingItemIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(typeId);
        return newSet;
      });
    }
  };

  const handleCheckToggle = (typeId: string, checked: boolean) => {
    setCheckValues((prev) => ({
      ...prev,
      [typeId]: checked,
    }));
  };

  // Mảng màu để phân biệt các skill
  const skillColors = [
    // Xanh cốm
    {
      border: "border-[#73a106]",
      bg: "bg-[#73a106]/10",
      text: "text-[#73a106]",
      tableBorder: "border-[#73a106]",
      checkboxBorder: "border-[#73a106]",
      checkboxBg: "bg-[#73a106]",
    },

    // Xanh lam
    {
      border: "border-[#33438e]",
      bg: "bg-[#33438e]/10",
      text: "text-[#33438e]",
      tableBorder: "border-[#33438e]",
      checkboxBorder: "border-[#33438e]",
      checkboxBg: "bg-[#33438e]",
    },

    // Cam
    {
      border: "border-[#f0a222]",
      bg: "bg-[#f0a222]/10",
      text: "text-[#f0a222]",
      tableBorder: "border-[#f0a222]",
      checkboxBorder: "border-[#f0a222]",
      checkboxBg: "bg-[#f0a222]",
    },

    // Đỏ
    {
      border: "border-[#d84839]",
      bg: "bg-[#d84839]/10",
      text: "text-[#d84839]",
      tableBorder: "border-[#d84839]",
      checkboxBorder: "border-[#d84839]",
      checkboxBg: "bg-[#d84839]",
    },

    // Xám
    {
      border: "border-[#929292]",
      bg: "bg-[#929292]/10",
      text: "text-[#929292]",
      tableBorder: "border-[#929292]",
      checkboxBorder: "border-[#929292]",
      checkboxBg: "bg-[#929292]",
    },
  ];

  // Helper function để lấy màu cho skill
  const getSkillColor = (index: number) => {
    return skillColors[index % skillColors.length];
  };

  // Style cho card dựa trên maxCardWidth
  const cardStyle = maxCardWidth
    ? { maxWidth: `${maxCardWidth}px` }
    : undefined;

  // Helper function để xác định số cấp và flatten dữ liệu cho bảng
  const getSkillTableData = (skill: any) => {
    let maxLevel = 2; // Mặc định 2 cấp
    const rows: any[] = [];

    skill.types?.forEach((type: any) => {
      const nodes = type.node_types || [];

      if (nodes.length === 0) {
        // Type không có node_types -> chỉ có 2 cấp
        rows.push({
          level2: type.name_vn || "",
          level2Id: type.id,
          level3: null,
          level3Id: null,
          level4: null,
          level4Id: null,
          description: (type as any).description || "",
          id: type.id,
          type: "level2",
        });
      } else {
        // Có node_types -> kiểm tra xem có cấp 4 không
        nodes.forEach((node: any) => {
          const level4Nodes = node.node_types || [];

          if (level4Nodes.length > 0) {
            // Có cấp 4 -> maxLevel = 4
            maxLevel = Math.max(maxLevel, 4);
            level4Nodes.forEach((level4Node: any) => {
              const hasLevel4Value = level4Node.name_vn?.trim() !== "";
              if (!hasLevel4Value) return; // Bỏ qua nếu cấp 4 rỗng

              // Luôn tạo row với đầy đủ các cấp, nếu rỗng thì để rỗng
              rows.push({
                level2: type.name_vn || "",
                level2Id: type.id,
                level3: node.name_vn || "",
                level3Id: node.id,
                level4: level4Node.name_vn,
                level4Id: level4Node.id,
                description:
                  (level4Node as any).description ||
                  (node as any).description ||
                  (type as any).description ||
                  "",
                id: level4Node.id,
                type: "level4",
              });
            });
          } else {
            // Chỉ có cấp 3 -> maxLevel = 3
            maxLevel = Math.max(maxLevel, 3);
            const hasLevel3Value = node.name_vn?.trim() !== "";
            if (!hasLevel3Value) return; // Bỏ qua nếu cấp 3 rỗng

            rows.push({
              level2: type.name_vn || "",
              level2Id: type.id,
              level3: node.name_vn,
              level3Id: node.id,
              level4: null,
              level4Id: null,
              description:
                (node as any).description || (type as any).description || "",
              id: node.id,
              type: "level3",
            });
          }
        });
      }
    });

    return { maxLevel, rows };
  };

  // Kiểm tra xem bài kiểm tra có bảng điểm không
  const hasScoreTable = useMemo(() => {
    if (!assessmentStudent) return true; // Mặc định hiển thị nếu chưa có dữ liệu
    const criteriaGroupId = assessmentStudent.assessment?.assessment_criteria_group_id;
    // Kiểm tra cả string "0" và number 0
    return String(criteriaGroupId) !== "0";
  }, [assessmentStudent]);

  // Tính toán các cột động từ criteria và subcriteria (kế thừa UI progress-report)
  const scoreColumns = useMemo(() => {
    if (!assessmentStudent) {
      return { criteria: [] as any[], subcriteria: [] as any[] };
    }

    const criteria =
      assessmentStudent.assessment?.criteria?.map((c) => ({
        id: c.id,
        name: c.name,
        max_score: c.max_score,
        subcriteria:
          c.subcriteria?.map((s) => ({
            id: s.id,
            name: s.name,
            max_score: s.max_score,
          })) || [],
      })) || [];

    const subcriteria = criteria.flatMap((c) =>
      c.subcriteria.map((s: any) => ({
        ...s,
        criteriaId: c.id,
        criteriaName: c.name,
      }))
    );

    return { criteria, subcriteria };
  }, [assessmentStudent]);

  // Mảng màu cho các kỹ năng (criteria) - dùng cho UI final_exam (kế thừa progress-report)
  const criteriaSkillColors = [
    // Xanh lam
    {
      text: "text-[#33438e]",
      border: "border-[#33438e]/30",
      textScore: "text-[#33438e]",
    },

    // Cam
    {
      text: "text-[#f0a222]",
      border: "border-[#f0a222]/30",
      textScore: "text-[#f0a222]",
    },

    // Xanh cốm
    {
      text: "text-[#73a106]",
      border: "border-[#73a106]/30",
      textScore: "text-[#73a106]",
    },

    // Xám
    {
      text: "text-[#929292]",
      border: "border-[#929292]/30",
      textScore: "text-[#929292]",
    },

    // Đỏ
    {
      text: "text-[#d84839]",
      border: "border-[#d84839]/30",
      textScore: "text-[#d84839]",
    },
  ];

  // Tính tổng điểm của một criteria (kế thừa logic từ progress-report)
  const calculateCriterionScore = (criteriaId: string) => {
    if (!assessmentStudent) return 0;
    const criterion = assessmentStudent.assessment?.criteria?.find(
      (c) => c.id === criteriaId
    );
    if (!criterion) return 0;

    // Nếu có subcriteria thì cộng điểm subcriteria; nếu không thì dùng score trực tiếp
    if (criterion.subcriteria && criterion.subcriteria.length > 0) {
      const total =
        criterion.subcriteria?.reduce((sum, sub) => {
          return sum + (typeof sub.score === "number" ? sub.score : 0);
        }, 0) || 0;
      return Math.max(total, 0);
    }

    const score = typeof criterion.score === "number" ? criterion.score : 0;
    return Math.max(score, 0);
  };

  // Hàm kiểm tra các tiêu chí cấp cuối có star = 0
  const checkValidation = (): {
    hasMissing: boolean;
    missingIds: Set<string>;
    firstMissingId: string | null;
  } => {
    const missingIds = new Set<string>();
    let firstMissingId: string | null = null;

    if (!criteria) {
      return { hasMissing: false, missingIds, firstMissingId };
    }

    // Kiểm tra star_skills - tìm các tiêu chí cấp cuối có star = 0
    criteria.star_skills?.forEach((skill) => {
      skill.types?.forEach((type) => {
        const hasNodeTypes = type.node_types && type.node_types.length > 0;

        if (hasNodeTypes) {
          // Có node_types - kiểm tra cấp 3 hoặc cấp 4
          type.node_types.forEach((node) => {
            const level4Nodes = (node as any).node_types;
            if (level4Nodes && level4Nodes.length > 0) {
              // Có cấp 4 -> kiểm tra cấp 4
              level4Nodes.forEach((level4Node: any) => {
                const itemId = String(level4Node.id);
                const starValue = starValues[itemId] || 0;
                if (starValue === 0) {
                  missingIds.add(itemId);
                  if (!firstMissingId) {
                    firstMissingId = itemId;
                  }
                }
              });
            } else {
              // Chỉ có cấp 3 -> kiểm tra cấp 3
              const itemId = String(node.id);
              const starValue = starValues[itemId] || 0;
              if (starValue === 0) {
                missingIds.add(itemId);
                if (!firstMissingId) {
                  firstMissingId = itemId;
                }
              }
            }
          });
        } else {
          // Không có node_types -> kiểm tra type (cấp 2)
          const itemId = String(type.id);
          const starValue = starValues[itemId] || 0;
          if (starValue === 0) {
            missingIds.add(itemId);
            if (!firstMissingId) {
              firstMissingId = itemId;
            }
          }
        }
      });
    });

    return {
      hasMissing: missingIds.size > 0,
      missingIds,
      firstMissingId,
    };
  };

  // Hàm scroll đến vị trí thiếu đầu tiên và highlight
  const scrollToFirstMissing = (itemId: string | null) => {
    if (!itemId) return;

    // Tìm element theo data-id
    const element = document.querySelector(`[data-star-item-id="${itemId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const saveReport = async () => {
    if (!criteria || !assessmentId || !studentId || !courseId) {
      toast({
        title: t("errors.missingInfo"),
        description: t("errors.invalidData"),
        variant: "destructive",
      });
      return;
    }

    // Lưu báo cáo (dù đã đủ hay còn thiếu tuỳ theo luồng gọi)
    try {
      setSaving(true);

      const payload: CreateStudyReportRequest = {
        study_report_criteria_id: Number(criteria.id),
        subject_id: Number(criteria.subject_id),
        assessment_id: Number(assessmentId),
        student_id: Number(studentId),
        course_id: Number(courseId),
        // TODO: Lấy teacher_id từ context / profile đăng nhập
        teacher_id: 0,
        general_comment: generalComment,
        is_completed: isCompleted,
        star_skills:
          criteria.star_skills?.map((skill) => ({
            id: Number(skill.id),
            types:
              skill.types?.map((type) => {
                const hasNodeTypes =
                  type.node_types && type.node_types.length > 0;
                // Nếu có node_types, chỉ gửi node_types hoặc cấp 4 (star = 0 cho type)
                // Nếu không có node_types, chỉ gửi types với star thực tế
                if (hasNodeTypes) {
                  return {
                    id: Number(type.id),
                    star: 0,
                    node_types: type.node_types.map((node) => {
                      // Kiểm tra xem có cấp 4 không
                      const level4Nodes = (node as any).node_types;
                      if (level4Nodes && level4Nodes.length > 0) {
                        // Có cấp 4 -> gửi cấp 4
                        return {
                          id: Number(node.id),
                          star: 0,
                          node_types: level4Nodes.map((level4Node: any) => ({
                            id: Number(level4Node.id),
                            star: starValues[String(level4Node.id)] || 0,
                          })),
                        };
                      } else {
                        // Chỉ có cấp 3 -> gửi cấp 3
                        return {
                          id: Number(node.id),
                          star: starValues[String(node.id)] || 0,
                        };
                      }
                    }),
                  };
                } else {
                  return {
                    id: Number(type.id),
                    star: starValues[String(type.id)] || 0,
                  };
                }
              }) || [],
          })) || [],
        check_skills:
          criteria.check_skills?.map((skill) => ({
            id: Number(skill.id),
            types:
              skill.types?.map((type) => ({
                id: Number(type.id),
                is_check: !!checkValues[String(type.id)],
                node_types:
                  type.node_types?.map((node) => ({
                    id: Number(node.id),
                    is_check: !!checkValues[String(node.id)],
                  })) || [],
              })) || [],
          })) || [],
      };

      let response;
      if (!reportId || reportId === "0") {
        // Tạo mới báo cáo
        response = await CreateStudyReport(payload);
      } else {
        // Cập nhật báo cáo đã tồn tại
        response = await UpdateStudyReport(reportId, payload as any);
      }

      if (response?.code === 200) {
        // Toast thành công (code 200)
        toast({
          title: t("success.title"),
          description: t("success.completed"),
        });

        // Nếu là tạo mới (reportId = 0) -> quay lại trang list sau khi lưu thành công
        if (!reportId || reportId === "0") {
          handleBack();
        }
      } else {
        // Toast thất bại (code khác 200 nhưng không throw)
        toast({
          title: t("errors.error"),
          description: response?.message || t("errors.failedToSave"),
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error creating study report:", error);
      toast({
        title: t("errors.error"),
        description:
          error?.response?.data?.message ||
          error?.message ||
          t("errors.failedToSave"),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!criteria || !assessmentId || !studentId || !courseId) {
      toast({
        title: t("errors.missingInfo"),
        description: t("errors.invalidData"),
        variant: "destructive",
      });
      return;
    }

    // Kiểm tra validation trước khi lưu
    const validation = checkValidation();
    if (validation.hasMissing) {
      setMissingItemIds(validation.missingIds);
      setFirstMissingItemId(validation.firstMissingId);
      setShowValidationDialog(true);
      return;
    }

    // Đủ dữ liệu -> lưu luôn, không hiển thị dialog
    await saveReport();
  };

  // Xử lý khi nhấn "Có" trong dialog validation
  const handleContinueEvaluation = () => {
    setShowValidationDialog(false);
    if (firstMissingItemId) {
      // Scroll đến vị trí thiếu đầu tiên sau một chút delay để dialog đóng
      setTimeout(() => {
        scrollToFirstMissing(firstMissingItemId);
      }, 100);
    }
  };

  // Xử lý khi nhấn "Không" trong dialog validation
  const handleCancelEvaluation = async () => {
    setShowValidationDialog(false);
    // Người dùng chọn không tiếp tục đánh giá -> vẫn lưu dữ liệu hiện tại
    await saveReport();
  };

  if (loading) {
    return <Loading />;
  }

  if (!criteria) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <CardTitle>{t("notFound.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{t("notFound.description")}</p>
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("notFound.back")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30">
      <main className="container mx-auto px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="px-0" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("header.back")}
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t("header.title")}
              </h1>
              <p className="text-sm text-gray-500 mt-1">{criteria.name}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-sm">
            {t("header.maxStars", { count: maxStar })}
          </Badge>
        </div>

        <div className="flex justify-center">
          <div className="space-y-6">
            {/* Thông tin chung: học sinh, giáo viên, lớp, khóa */}
            <Card className="border-0 shadow-lg rounded-2xl" style={cardStyle}>
              <CardContent className="p-2">
                <div className="grid w-full gap-[2px] grid-cols-2">
                  {/* Họ và tên */}
                  <div className="cell text-left text-sm gap-1">
                    <span className="font-semibold">Họ và tên:</span>
                    <span>{assessmentStudent?.student_name || ""}</span>
                  </div>

                  {/* Chương trình / Khóa học */}
                  <div className="cell text-left text-sm gap-1">
                    <span className="font-semibold">Chương trình: </span>
                    <span>{courseInfo?.name || ""}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bảng điểm bài kiểm tra của học sinh - UI kiểu final_exam từ progress-report */}
            {hasScoreTable && (
              <Card style={cardStyle}>
                <CardContent>
                {loadingScores ? (
                  <Loading />
                ) : assessmentStudent ? (
                  <div className="overflow-x-auto bg-white flex justify-center">
                    {/* KHUNG VÔ HÌNH – co theo nội dung */}
                    <div className="inline-flex flex-col w-max p-3">
                      {/* Tổng điểm */}
                      <div className="flex w-max">
                        <div className="sticky left-0 bg-white z-10 min-w-[200px] px-4 py-3 font-bold text-lg whitespace-nowrap">
                          Tổng điểm
                        </div>
                        {(() => {
                          const totalScore = assessmentStudent.total_score;
                          const maxTotalScore = scoreColumns.criteria.reduce(
                            (sum, c) => sum + c.max_score,
                            0
                          );
                          const displayScore = Math.max(totalScore, 0);
                          return (
                            <div className="min-w-[150px] px-4 py-3 text-center whitespace-nowrap">
                              <span className="text-red-600 font-bold text-xl">
                                {displayScore}
                              </span>
                              <span className="text-gray-400 font-normal">
                                {" "}
                                /{maxTotalScore}
                              </span>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Các kỹ năng (criteria) */}
                      {scoreColumns.criteria.map(
                        (criterion, criterionIndex) => {
                          const colorIndex =
                            criterionIndex % criteriaSkillColors.length;
                          const colors = criteriaSkillColors[colorIndex];
                          const criterionMaxScore = criterion.max_score;

                          return (
                            <div
                              key={`criteria-${criterion.id}`}
                              className="mb-2 w-max"
                            >
                              {/* Header kỹ năng */}
                              <div className="flex rounded-lg mb-1 w-max">
                                <div
                                  className={`sticky left-0 z-10 min-w-[200px] px-4 font-bold 
                                          rounded-l-lg border-l-2 border-t-2 border-b-2 
                                          ${colors.border} ${colors.text} whitespace-nowrap`}
                                >
                                  {criterion.name}
                                </div>

                                <div
                                  className={`min-w-[150px] px-4 text-center font-semibold 
                                          border-t-2 border-b-2 ${colors.border} 
                                          ${colors.textScore} whitespace-nowrap
                                          rounded-r-lg border-r-2`}
                                >
                                  {(() => {
                                    const criterionScore =
                                      calculateCriterionScore(criterion.id);
                                    return (
                                      <>
                                        <span className="font-bold text-xl">
                                          {criterionScore}
                                        </span>
                                        <span className="text-gray-400 font-normal text-sm">
                                          {" "}
                                          /{criterionMaxScore}
                                        </span>
                                      </>
                                    );
                                  })()}
                                </div>
                              </div>

                              {/* Subcriteria */}
                              {criterion.subcriteria.map((sub: any) => (
                                <div
                                  key={`sub-${sub.id}`}
                                  className="flex w-max"
                                >
                                  <div
                                    className={`sticky left-0 z-10 min-w-[200px] px-4 py-2 pl-8 
                                            ${colors.textScore} font-medium whitespace-nowrap`}
                                  >
                                    {sub.name}
                                  </div>

                                  {(() => {
                                    const criterionData =
                                      assessmentStudent.assessment?.criteria?.find(
                                        (c) => c.id === criterion.id
                                      );
                                    const subcriteriaData =
                                      criterionData?.subcriteria?.find(
                                        (s) => s.id === sub.id
                                      );
                                    const score =
                                      typeof subcriteriaData?.score === "number"
                                        ? Math.max(subcriteriaData.score, 0)
                                        : 0;

                                    return (
                                      <div
                                        className={`min-w-[150px] px-4 py-2 text-center 
                                                ${colors.textScore} whitespace-nowrap`}
                                      >
                                        <span className="font-bold text-xl">
                                          {score}
                                        </span>
                                        <span className="text-gray-400 font-normal text-sm">
                                          {" "}
                                          /{sub.max_score}
                                        </span>
                                      </div>
                                    );
                                  })()}
                                </div>
                              ))}
                            </div>
                          );
                        }
                      )}

                      {/* Section Bài thi */}
                      {assessmentStudent.files && assessmentStudent.files.length > 0 && (
                        <div className="flex w-max">
                          <div className="sticky left-0 bg-white z-10 min-w-[200px] px-4 py-3 font-bold text-lg text-blue-800 whitespace-nowrap">
                            Bài thi
                          </div>

                          <div className="min-w-[150px] px-4 py-3">
                            <div className="flex flex-wrap gap-2 justify-center">
                              {assessmentStudent.files.map((url, idx) => (
                                <a
                                  key={idx}
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-blue-800 underline whitespace-nowrap"
                                >
                                  {t("scoresTable.image", { index: idx + 1 })}
                                </a>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {t("scoresTable.noData")}
                  </div>
                )}
              </CardContent>
            </Card>
            )}

            {/* Star skills */}
            {criteria.star_skills && criteria.star_skills.length > 0 && (
              <Card
                className="border-0 shadow-lg rounded-2xl pt-2"
                style={cardStyle}
              >
                <CardContent className="space-y-4">
                  {criteria.star_skills.map((skill, skillIndex) => {
                    const skillHasNodeTypes = skill.types?.some(
                      (t) => t.node_types && t.node_types.length > 0
                    );
                    const color = getSkillColor(skillIndex);

                    return (
                      <div key={skill.id} className="space-y-2">
                        <div
                          className={`rounded-2xl border-2 ${color.border} px-3 py-1.5 inline-block`}
                        >
                          <p className={`font-bold ${color.text}`}>
                            {skill.name_vn}
                          </p>
                        </div>

                        {/* Nếu có từ 3 cấp (có node_types) => hiển thị dạng bảng */}
                        {skillHasNodeTypes ? (
                          (() => {
                            const { maxLevel, rows } = getSkillTableData(skill);

                            // Tính rowSpan cho level2 và level3
                            const rowsWithRowSpan = rows.map((row, index) => {
                              let level2RowSpan = 0;
                              let level3RowSpan = 0;

                              // Tính rowSpan cho level2
                              if (
                                index === 0 ||
                                rows[index - 1].level2Id !== row.level2Id
                              ) {
                                level2RowSpan = rows.filter(
                                  (r) => r.level2Id === row.level2Id
                                ).length;
                              }

                              // Tính rowSpan cho level3 (nếu có)
                              if (maxLevel >= 3 && row.level3Id) {
                                if (
                                  index === 0 ||
                                  rows[index - 1].level2Id !== row.level2Id ||
                                  rows[index - 1].level3Id !== row.level3Id
                                ) {
                                  level3RowSpan = rows.filter(
                                    (r) =>
                                      r.level2Id === row.level2Id &&
                                      r.level3Id === row.level3Id
                                  ).length;
                                }
                              }

                              return { ...row, level2RowSpan, level3RowSpan };
                            });

                            return (
                              <div className="overflow-x-auto">
                                <table
                                  ref={(el) => {
                                    if (
                                      el &&
                                      !starSkillsTableRefs.current.includes(el)
                                    ) {
                                      starSkillsTableRefs.current.push(el);
                                    }
                                  }}
                                  className="w-auto text-sm border-separate border-spacing-[2px]"
                                >
                                  <tbody className="bg-white">
                                    {rowsWithRowSpan.map((row, index) => {
                                      const isFirstLevel2 =
                                        index === 0 ||
                                        rowsWithRowSpan[index - 1].level2Id !==
                                          row.level2Id;
                                      const isFirstLevel3 =
                                        maxLevel >= 3 &&
                                        row.level3Id &&
                                        (index === 0 ||
                                          rowsWithRowSpan[index - 1]
                                            .level2Id !== row.level2Id ||
                                          rowsWithRowSpan[index - 1]
                                            .level3Id !== row.level3Id);

                                      return (
                                        <tr
                                          key={`${row.id}-${index}`}
                                          className={`border-t ${color.tableBorder}`}
                                        >
                                          {isFirstLevel2 && (
                                            <td
                                              className={`px-3 py-2 font-bold ${color.text} border ${color.tableBorder} bg-white`}
                                              rowSpan={row.level2RowSpan}
                                            >
                                              {row.level2?.trim() || "-"}
                                            </td>
                                          )}
                                          {maxLevel >= 3 && (
                                            <>
                                              {isFirstLevel3 ? (
                                                <td
                                                  className={`px-3 py-2 ${color.text} border ${color.tableBorder} bg-white`}
                                                  rowSpan={row.level3RowSpan}
                                                >
                                                  {row.level3?.trim() || "-"}
                                                </td>
                                              ) : !row.level3Id ? (
                                                <td
                                                  className={`px-3 py-2 text-gray-400 border ${color.tableBorder} bg-white`}
                                                >
                                                  -
                                                </td>
                                              ) : null}
                                            </>
                                          )}
                                          {maxLevel >= 4 && (
                                            <td
                                              className={`px-3 py-2 ${color.text} border ${color.tableBorder} bg-white`}
                                            >
                                              {row.level4?.trim() || "-"}
                                            </td>
                                          )}
                                          <td
                                            className={`px-3 py-2 border ${color.tableBorder} bg-white`}
                                          >
                                            <div
                                              className={`flex items-center justify-center gap-1
                                              ${
                                                missingItemIds.has(
                                                  String(row.id)
                                                )
                                                  ? "bg-red-700/10 rounded"
                                                  : ""
                                              }`}
                                              data-star-item-id={String(row.id)}
                                            >
                                              {Array.from(
                                                { length: maxStar },
                                                (_, index) => {
                                                  const starIndex = index + 1;
                                                  const currentValue =
                                                    starValues[
                                                      String(row.id)
                                                    ] || 0;
                                                  const filled =
                                                    starIndex <= currentValue;
                                                  return (
                                                    <button
                                                      key={starIndex}
                                                      type="button"
                                                      onClick={() =>
                                                        handleStarClick(
                                                          String(row.id),
                                                          starIndex
                                                        )
                                                      }
                                                      className="focus:outline-none"
                                                    >
                                                      <Star
                                                        className={`h-5 w-5 ${
                                                          filled
                                                            ? "text-yellow-400 fill-yellow-400"
                                                            : "text-gray-300"
                                                        }`}
                                                      />
                                                    </button>
                                                  );
                                                }
                                              )}
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            );
                          })()
                        ) : (
                          <div className="mt-2 space-y-2">
                            {skill.types?.map((type) => (
                              <div
                                key={type.id}
                                className={`flex items-center justify-between py-2 pr-8 ${color.tableBorder}`}
                              >
                                <span className={`text-sm ${color.text}`}>
                                  {type.name_vn}
                                </span>

                                <div
                                  className={`flex items-center gap-1 ${
                                    missingItemIds.has(String(type.id))
                                      ? "bg-red-700/10 rounded"
                                      : ""
                                  }`}
                                  data-star-item-id={String(type.id)}
                                >
                                  {Array.from(
                                    { length: maxStar },
                                    (_, index) => {
                                      const starIndex = index + 1;
                                      const currentValue =
                                        starValues[String(type.id)] || 0;
                                      const filled = starIndex <= currentValue;

                                      return (
                                        <button
                                          key={starIndex}
                                          type="button"
                                          onClick={() =>
                                            handleStarClick(
                                              String(type.id),
                                              starIndex
                                            )
                                          }
                                          className="focus:outline-none"
                                        >
                                          <Star
                                            className={`h-5 w-5 ${
                                              filled
                                                ? "text-yellow-400 fill-yellow-400"
                                                : "text-gray-300"
                                            }`}
                                          />
                                        </button>
                                      );
                                    }
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Notes */}
                  {criteria.notes && criteria.notes.length > 0 && (
                    <div className="bg-yellow-50 rounded-xl p-4 mt-4">
                      <p className="text-sm font-semibold text-amber-900 mb-3">
                        {t("notes.title")}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {criteria.notes.map((note, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-1 px-3 py-1.5 rounded-lg border border-yellow-300 bg-white"
                          >
                            <div className="flex items-center gap-1 text-yellow-500 flex-shrink-0 leading-none">
                              <span className="text-sm font-semibold leading-none">
                                {note.value}
                              </span>
                              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                              <span className="leading-none">:</span>
                            </div>

                            <span className="text-sm text-gray-800 leading-5">
                              <span className="font-semibold">
                                {note.text || t("notes.noContent")}
                              </span>
                              {" – "}
                              {note.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Check skills */}
            {criteria.check_skills && criteria.check_skills.length > 0 && (
              <Card
                className="border-0 shadow-lg rounded-2xl pt-2"
                style={cardStyle}
              >
                <CardContent className="space-y-4">
                  {criteria.check_skills.map((skill, skillIndex) => {
                    const color = getSkillColor(
                      (criteria.star_skills?.length || 0) + skillIndex
                    );
                    return (
                      <div key={skill.id} className="space-y-2">
                        <div
                          className={`rounded-2xl border-2 ${color.border} px-3 py-1.5 inline-block`}
                        >
                          <p className={`font-semibold ${color.text}`}>
                            {skill.name_vn}
                          </p>
                        </div>
                        {skill.description && (
                          <p className={`text-sm ${color.text} opacity-70`}>
                            {skill.description}
                          </p>
                        )}
                        <div className="mt-2">
                          <div className="grid grid-cols-4 gap-3">
                            {skill.types?.map((type) => (
                              <div key={type.id} className="space-y-2">
                                {/* Cấp 2: Type */}
                                <label
                                  className={`flex items-start gap-2 p-2 rounded-lg border ${
                                    checkValues[String(type.id)]
                                      ? `${color.border} ${color.bg}`
                                      : "border-gray-200 bg-white"
                                  } hover:bg-opacity-80 cursor-pointer`}
                                  onClick={() =>
                                    handleCheckToggle(
                                      String(type.id),
                                      !checkValues[String(type.id)]
                                    )
                                  }
                                >
                                  <div
                                    className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                      checkValues[String(type.id)]
                                        ? `${color.checkboxBorder} ${color.checkboxBg}`
                                        : "border-gray-300"
                                    }`}
                                  >
                                    {checkValues[String(type.id)] && (
                                      <svg
                                        className="w-3 h-3 text-white"
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path d="M5 13l4 4L19 7"></path>
                                      </svg>
                                    )}
                                  </div>
                                  <span
                                    className={`text-sm font-medium ${
                                      checkValues[String(type.id)]
                                        ? color.text
                                        : "text-gray-600"
                                    }`}
                                  >
                                    {type.name_vn}
                                  </span>
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* General comment & status */}
            <Card className="border-0 shadow-lg rounded-2xl" style={cardStyle}>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  {t("generalComment.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Nhận xét mẫu
                  </label>
                  <Select
                    onValueChange={(value) => {
                      setGeneralComment(value);
                    }}
                  >
                    <SelectTrigger className="rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-200">
                      <SelectValue placeholder="Chọn nhận xét mẫu" />
                    </SelectTrigger>
                    <SelectContent className="max-w-[700px]">
                      {commentTemplates.map((template, index) => (
                        <SelectItem
                          key={index}
                          value={template}
                          className="whitespace-normal py-3"
                        >
                          <div className="break-words">{template}</div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {t("generalComment.label")}
                  </label>
                  <Textarea
                    id="general-comment-textarea"
                    value={generalComment}
                    onChange={(e) => {
                      setGeneralComment(e.target.value);
                    }}
                    rows={4}
                    placeholder={t("generalComment.placeholder")}
                    className="rounded-xl border-gray-200 focus:border-emerald-500 focus:ring-emerald-200"
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="px-6"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("actions.saving")}
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        {t("actions.save")}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Validation Dialog */}
      <Dialog
        open={showValidationDialog}
        onOpenChange={setShowValidationDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("validationDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("validationDialog.message")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelEvaluation}>
              {t("validationDialog.cancel")}
            </Button>
            <Button onClick={handleContinueEvaluation}>
              {t("validationDialog.continue")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
