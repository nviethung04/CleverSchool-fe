"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Star, ArrowLeft } from "lucide-react";
import { GetStudyReportDetail } from "@/lib/api/study-report";
import {
  GetDashboardStudentAssessments,
  DashboardStudentAssessmentItem,
} from "@/lib/api/assessment";
import { GetUserLogin } from "@/lib/api/users";
import { GetSchoolDetail } from "@/lib/api/schools";
import { useCurrentLocale, useTypedTranslations } from "@/lib/i18n/client";
import Loading from "@/app/loading";
import Image from "next/image";

export default function StudyReportDetailPage() {
  const t = useTypedTranslations(
    "progressReport.assessmentTab.studyReportDetail"
  );
  const { toast } = useToast();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentLocale = useCurrentLocale();

  const reportId = params?.id as string | undefined;
  const courseId = searchParams?.get("course_id") || "";
  const assessmentId = searchParams?.get("assessment_id") || "";

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dashboardAssessments, setDashboardAssessments] = useState<
    DashboardStudentAssessmentItem[]
  >([]);
  const [loadingDashboardAssessments, setLoadingDashboardAssessments] =
    useState(false);
  const [maxCardWidth, setMaxCardWidth] = useState<number | null>(null);
  const starSkillsTableRefs = useRef<(HTMLTableElement | null)[]>([]);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [schoolLogo, setSchoolLogo] = useState<string | null>(null);
  const [loadingUserInfo, setLoadingUserInfo] = useState(false);

  // Hàm quay về trang progress-report
  const handleBack = () => {
    router.push(`/${currentLocale}/progress-report?tab=assessment`);
  };

  // Fetch study report detail
  useEffect(() => {
    const fetchReport = async () => {
      if (!reportId) {
        toast({
          title: t("errors.missingInfo"),
          description: t("errors.reportNotFound"),
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await GetStudyReportDetail(reportId);
        const data = response?.data;
        if (!data) {
          throw new Error(t("errors.reportNotFound"));
        }

        setReport(data);
      } catch (error: any) {
        console.error("Error fetching study report detail:", error);
        toast({
          title: t("errors.error"),
          description:
            error?.response?.data?.message ||
            error?.message ||
            t("errors.failedToLoad"),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportId, toast]);

  // Fetch dashboard assessments
  useEffect(() => {
    const fetchDashboardAssessments = async () => {
      if (!courseId || !assessmentId) {
        setDashboardAssessments([]);
        return;
      }

      try {
        setLoadingDashboardAssessments(true);
        const params: any = {
          course_id: courseId,
          assessment_id: assessmentId,
          page: 1,
          limit: 1000,
        };

        const response = await GetDashboardStudentAssessments(params);
        if (response?.code === 200 && response?.data?.assessments) {
          setDashboardAssessments(response.data.assessments);
        } else {
          setDashboardAssessments([]);
        }
      } catch (error: any) {
        console.error("Error fetching dashboard assessments:", error);
        toast({
          title: t("errors.error"),
          description:
            error?.response?.data?.message ||
            error?.message ||
            "Không thể tải bảng điểm",
          variant: "destructive",
        });
        setDashboardAssessments([]);
      } finally {
        setLoadingDashboardAssessments(false);
      }
    };

    fetchDashboardAssessments();
  }, [courseId, assessmentId, toast]);

  // Fetch user info và school logo
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setLoadingUserInfo(true);
        const userResponse = await GetUserLogin();
        const userData = userResponse?.data;

        if (userData) {
          setUserInfo(userData);

          // Lấy school_id từ user_info.school.id và fetch school detail để lấy logo
          const schoolId = userData.user_info?.school?.id;
          if (schoolId) {
            try {
              const schoolResponse = await GetSchoolDetail(String(schoolId));
              if (schoolResponse?.logo) {
                setSchoolLogo(schoolResponse.logo);
              }
            } catch (error) {
              console.error("Error fetching school detail:", error);
              // Không hiển thị toast vì đây là optional
            }
          }
        }
      } catch (error: any) {
        console.error("Error fetching user info:", error);
        // Không hiển thị toast vì đây là optional
      } finally {
        setLoadingUserInfo(false);
      }
    };

    fetchUserInfo();
  }, []);

  // Đo chiều rộng bảng star_skills (3 hoặc 4 cấp) và cập nhật maxCardWidth
  // Dùng requestAnimationFrame để chờ DOM render xong (ổn định cho cả dev & production)
  useEffect(() => {
    if (!report) return;

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
  }, [report]);

  // Tính toán các cột động từ criteria và subcriteria
  // Phải đặt trước các return sớm để tuân thủ quy tắc hooks
  const scoreColumns = useMemo(() => {
    const firstItem = dashboardAssessments[0];
    if (!firstItem) {
      return { criteria: [] as any[], subcriteria: [] as any[] };
    }

    const criteria =
      firstItem.assessment?.criteria?.map((c) => ({
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
  }, [dashboardAssessments]);

  // Mảng màu cho các kỹ năng (criteria) - dùng cho UI final_exam
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

  // Tính tổng điểm từ criteria và subcriteria
  const calculateTotalScore = (item: DashboardStudentAssessmentItem) => {
    if (item.is_scored) {
      return item.total_score;
    }
    // Nếu chưa chấm điểm, tính từ criteria
    let total = 0;
    item.assessment?.criteria?.forEach((criterion) => {
      criterion.subcriteria?.forEach((sub) => {
        total += typeof sub.score === "number" ? sub.score : 0;
      });
    });
    return total;
  };

  // Tính tổng điểm của một criteria
  const calculateCriterionScore = (
    item: DashboardStudentAssessmentItem,
    criteriaId: string
  ) => {
    const criterion = item.assessment?.criteria?.find(
      (c) => c.id === criteriaId
    );
    if (!criterion) return 0;

    // Ưu tiên dùng score trực tiếp của criterion nếu có
    if (typeof criterion.score === "number") {
      return criterion.score;
    }

    // Nếu không có score trực tiếp, tính từ subcriteria
    return (
      criterion.subcriteria?.reduce((sum, sub) => {
        return sum + (typeof sub.score === "number" ? sub.score : 0);
      }, 0) || 0
    );
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
          description: type.description || "",
          id: type.id,
          star: type.star || 0,
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
                  level4Node.description ||
                  node.description ||
                  type.description ||
                  "",
                id: level4Node.id,
                star: level4Node.star || 0,
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
              description: node.description || type.description || "",
              id: node.id,
              star: node.star || 0,
              type: "level3",
            });
          }
        });
      }
    });

    return { maxLevel, rows };
  };

  const normalizeQuarterStar = (value: number) => {
    const fixed = Number(value.toFixed(2));
    const integer = Math.floor(fixed);
    const decimal = +(fixed - integer).toFixed(2);

    let extra = 0;

    if (decimal >= 0.01 && decimal <= 0.25) extra = 0.25;
    else if (decimal >= 0.26 && decimal <= 0.5) extra = 0.5;
    else if (decimal >= 0.51 && decimal <= 0.75) extra = 0.75;
    else if (decimal >= 0.76) extra = 1;

    return integer + extra;
  };

  const QuarterStar = ({ percent }: { percent: number }) => (
    <div className="relative w-4 h-4">
      <Star className="absolute inset-0 w-4 h-4 text-gray-300" />
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${percent}%` }}
      >
        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
      </div>
    </div>
  );

  const renderAverageStars = (value: number, maxStar: number) => {
    const normalized = normalizeQuarterStar(value);

    return Array.from({ length: maxStar }, (_, i) => {
      const starIndex = i + 1;
      let percent = 0;

      if (normalized >= starIndex) {
        percent = 100;
      } else if (normalized > i) {
        percent = (normalized - i) * 100; // 25 / 50 / 75
      }

      return <QuarterStar key={i} percent={percent} />;
    });
  };

  // Early returns - phải đặt sau tất cả hooks
  if (loading) {
    return <Loading />;
  }

  if (!report) {
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

  const maxStar = report.max_star || 5;

  // Lấy assessment name và subject_id
  const assessmentName =
    report?.assessment?.name || dashboardAssessments[0]?.assessment?.name || "Bài kiểm tra";
  const subjectId = report.subject_id
    ? Number(report.subject_id)
    : dashboardAssessments[0]?.assessment?.subject_id
    ? Number(dashboardAssessments[0].assessment.subject_id)
    : null;

  // Hàm lấy tên chương trình dựa vào subject_id
  const getProgramName = (subjectId: number | null): string => {
    if (!subjectId) {
      return "Chương trình dạy làm quen và bổ trợ tiếng Anh Smartree (năm học 2025-2026)";
    }

    switch (subjectId) {
      case 3:
        return "Chương trình dạy làm quen và bổ trợ tiếng Anh Smartree (năm học 2025-2026)";
      case 6:
        return "Chương trình dạy làm quen và bổ trợ tiếng Anh Smartree Science (năm học 2025-2026)";
      case 4:
        return "Chương trình dạy làm quen và bổ trợ tiếng Anh Smartree Maths (năm học 2025-2026)";
      case 5:
        return "Chương trình dạy làm quen và bổ trợ tiếng Anh với sự hỗ trợ Công nghệ (2025-2026)";
      default:
        return "Chương trình dạy làm quen và bổ trợ tiếng Anh Smartree (năm học 2025-2026)";
    }
  };

  const programName = getProgramName(subjectId);

  // Lấy tên chương trình từ user_info.courses[0].program.name
  const userProgramName =
    userInfo?.user_info?.courses?.[0]?.program?.name || programName;

  return (
    <div className="min-h-screen bg-gray-50/30">
      <main className="container mx-auto px-6 py-8">
        <div className="mb-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="px-0" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("header.back")}
            </Button>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="space-y-6">
            {/* Card tiêu đề và thông tin học sinh */}
            <Card className="border-0 shadow-lg rounded-2xl">
              <CardContent className="pt-1">
                <div className="flex items-center justify-center gap-4 mb-1">
                  {/* Logo trường */}
                  {schoolLogo && (
                    <div className="relative w-20 h-20 flex-shrink-0">
                      <Image
                        src={schoolLogo}
                        alt="Logo trường"
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}
                  {/* Logo Smartree */}
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <Image
                      src="/logo-smt.png"
                      alt="Logo Smartree"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 uppercase text-center">
                  Phiếu đánh giá học sinh {assessmentName}
                </h1>
                <p className="text-sm italic text-gray-600 mt-2 text-center">
                  {programName}
                </p>

                {/* Bảng thông tin học sinh */}
                {report?.student_info && (
                  <div className="mt-4">
                    <div className="grid w-full gap-[2px] grid-cols-2">
                      {/* Họ và tên */}
                      <div className="cell text-left text-sm gap-1">
                        <span className="font-semibold">Họ và tên:</span>
                        <span>{report.student_info.name || ""}</span>
                      </div>

                      {/* Chương trình */}
                      <div className="cell text-left text-sm gap-1">
                        <span className="font-semibold">Chương trình: </span>
                        <span>{report.course_info?.program || ""}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            {/* Bảng điểm bài kiểm tra - UI kiểu final_exam */}
            {dashboardAssessments.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-bold">
                    {t("scoreTable.title")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {loadingDashboardAssessments ? (
                    <Loading />
                  ) : (
                    <div className="overflow-x-auto flex justify-center">
                      {/* KHUNG VÔ HÌNH – co theo nội dung */}
                      <div className="inline-flex flex-col w-max p-0">
                        {/* Tổng điểm */}
                        <div className="flex w-max">
                          <div className="sticky left-0 bg-white z-10 min-w-[200px] px-4 py-3 font-bold text-lg whitespace-nowrap">
                            Tổng điểm
                          </div>
                          {dashboardAssessments.map((item) => {
                            const totalScore = calculateTotalScore(item);
                            const maxTotalScore = scoreColumns.criteria.reduce(
                              (sum, c) => sum + c.max_score,
                              0
                            );
                            const displayScore = Math.max(totalScore, 0);
                            return (
                              <div
                                key={`total-${item.assessment.id}`}
                                className="min-w-[150px] px-4 py-3 text-center whitespace-nowrap"
                              >
                                <span className="text-red-600 font-bold text-xl">
                                  {displayScore}
                                </span>
                                <span className="text-gray-400 font-normal">
                                  {" "}
                                  /{maxTotalScore}
                                </span>
                              </div>
                            );
                          })}
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

                                  {dashboardAssessments.map((item, idx) => {
                                    const criterionScore =
                                      calculateCriterionScore(
                                        item,
                                        criterion.id
                                      );
                                    const isLast =
                                      idx === dashboardAssessments.length - 1;
                                    return (
                                      <div
                                        key={`criteria-header-${item.assessment.id}`}
                                        className={`min-w-[150px] px-4 text-center font-semibold 
                                        border-t-2 border-b-2 ${colors.border} 
                                        ${colors.textScore} whitespace-nowrap
                                        ${
                                          isLast
                                            ? "rounded-r-lg border-r-2"
                                            : ""
                                        }`}
                                      >
                                        <span className="font-bold text-xl">
                                          {criterionScore}
                                        </span>
                                        <span className="text-gray-400 font-normal text-sm">
                                          {" "}
                                          /{criterionMaxScore}
                                        </span>
                                      </div>
                                    );
                                  })}
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

                                    {dashboardAssessments.map((item) => {
                                      const criterionData =
                                        item.assessment?.criteria?.find(
                                          (c) => c.id === criterion.id
                                        );
                                      const subcriteriaData =
                                        criterionData?.subcriteria?.find(
                                          (s) => s.id === sub.id
                                        );
                                      const score =
                                        typeof subcriteriaData?.score ===
                                        "number"
                                          ? subcriteriaData.score
                                          : 0;

                                      return (
                                        <div
                                          key={`sub-score-${item.assessment.id}-${sub.id}`}
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
                                    })}
                                  </div>
                                ))}
                              </div>
                            );
                          }
                        )}

                        {/* Section Bài thi */}
                        {dashboardAssessments.some(
                          (item) =>
                            Array.isArray(item.files) && item.files.length > 0
                        ) && (
                          <div className="flex w-max">
                            <div className="sticky left-0 bg-white z-10 min-w-[200px] px-4 py-3 font-bold text-lg text-blue-800 whitespace-nowrap">
                              Bài thi
                            </div>

                            {dashboardAssessments.map((item) => (
                              <div
                                key={`files-${item.assessment.id}`}
                                className="min-w-[150px] px-4 py-3"
                              >
                                {item.files && item.files.length > 0 ? (
                                  <div className="flex flex-wrap gap-2 justify-center">
                                    {item.files.map((url, idx) => (
                                      <a
                                        key={idx}
                                        href={url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs text-blue-800 underline whitespace-nowrap"
                                      >
                                        Tệp {idx + 1}
                                      </a>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="w-16 h-12 rounded-lg bg-gray-100 mx-auto"></div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Star skills */}
            {report.star_skills && report.star_skills.length > 0 && (
              <Card
                className="border-0 shadow-lg rounded-2xl pt-2"
                style={cardStyle}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-bold">
                    {dashboardAssessments.length > 0 ? t("studyReport.title2") : t("studyReport.title")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  {report.star_skills.map((skill: any, skillIndex: number) => {
                    const skillHasNodeTypes = skill.types?.some(
                      (t: any) => t.node_types && t.node_types.length > 0
                    );
                    const color = getSkillColor(skillIndex);

                    return (
                      <div key={skill.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`rounded-2xl border-2 ${color.border} px-3 py-1.5`}
                            >
                              <p className={`font-bold ${color.text}`}>
                                {skill.name_vn}
                              </p>
                            </div>
                            {skill.average_star !== undefined && (
                              <Badge
                                variant="outline"
                                className="flex items-center gap-1 px-2 py-1"
                              >
                                {t("starSkills.average")}
                                {renderAverageStars(
                                  skill.average_star,
                                  maxStar
                                )}
                              </Badge>
                            )}
                          </div>
                        </div>

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
                                            <div className="flex items-center justify-center gap-1">
                                              {Array.from(
                                                { length: maxStar },
                                                (_, index) => {
                                                  const starIndex = index + 1;
                                                  const filled =
                                                    starIndex <=
                                                    (row.star || 0);
                                                  return (
                                                    <Star
                                                      key={starIndex}
                                                      className={`h-5 w-5 ${
                                                        filled
                                                          ? "text-yellow-400 fill-yellow-400"
                                                          : "text-gray-300"
                                                      }`}
                                                    />
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
                            {skill.types?.map((type: any) => (
                              <div
                                key={type.id}
                                className={`flex items-center justify-between py-2 pr-8 ${color.tableBorder}`}
                              >
                                <span className={`text-sm ${color.text}`}>
                                  {type.name_vn}
                                </span>
                                <div className="flex items-center gap-1">
                                  {Array.from(
                                    { length: maxStar },
                                    (_, index) => {
                                      const starIndex = index + 1;
                                      const filled =
                                        starIndex <= (type.star || 0);
                                      return (
                                        <Star
                                          key={starIndex}
                                          className={`h-5 w-5 ${
                                            filled
                                              ? "text-yellow-400 fill-yellow-400"
                                              : "text-gray-300"
                                          }`}
                                        />
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
                  {report.notes && report.notes.length > 0 && (
                    <div className="bg-yellow-50 rounded-xl p-4 mt-4">
                      <p className="text-sm font-semibold text-amber-900 mb-3">
                        {t("notes.title")}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {report.notes.map((note: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-yellow-300 bg-white"
                          >
                            <span className="text-sm font-bold text-yellow-500">
                              {note.value}
                            </span>

                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />

                            <span className="text-sm">: {note.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Check skills */}
            {report.check_skills && report.check_skills.length > 0 && (
              <Card
                className="border-0 shadow-lg rounded-2xl pt-2"
                style={cardStyle}
              >
                <CardContent className="space-y-4">
                  {report.check_skills.map((skill: any, skillIndex: number) => {
                    const color = getSkillColor(
                      (report.star_skills?.length || 0) + skillIndex
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
                            {skill.types?.map((type: any) => {
                              return (
                                <div key={type.id} className="space-y-2">
                                  {/* Cấp 2: Type */}
                                  <div
                                    className={`flex items-start gap-2 p-2 rounded-lg border ${
                                      type.is_check
                                        ? `${color.border} ${color.bg}`
                                        : "border-gray-200 bg-white"
                                    }`}
                                  >
                                    <div
                                      className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center ${
                                        type.is_check
                                          ? `${color.checkboxBorder} ${color.checkboxBg}`
                                          : "border-gray-300"
                                      }`}
                                    >
                                      {type.is_check && (
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
                                        type.is_check
                                          ? color.text
                                          : "text-gray-600"
                                      }`}
                                    >
                                      {type.name_vn}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* General comment & summary */}
            <Card className="border-0 shadow-lg rounded-2xl" style={cardStyle}>
              <CardHeader>
                <CardTitle className="text-lg font-bold">
                  {dashboardAssessments.length > 0
                    ? t("generalComment.title")
                    : t("generalComment.title2")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {t("generalComment.label")}
                  </label>
                  <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 min-h-[100px]">
                    {report.general_comment ? (
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">
                        {report.general_comment}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">
                        {t("generalComment.noComment")}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
