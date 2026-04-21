"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import type { StudyReportEvaluateItem } from "@/lib/api/study-report";

interface AssessmentPDFExportProps {
  evaluatedItems: StudyReportEvaluateItem[];
  courseName: string;
  assessmentName: string;
  courseId?: string;
  onExportComplete?: () => void;
  onExportError?: (error: string) => void;
}

interface EvaluationFormData {
  studentName: string;
  className: string;
  teachers: string;
  courseName: string;
  englishProgram: string;
  mathProgram: string;
  month: string;
  comments: string;
  starSkills: Array<{
    id: string;
    name_vn: string;
    name_en: string;
    average_star: number;
    types: Array<{
      id: string;
      name_vn: string;
      name_en: string;
      star: number;
    }>;
  }>;
  checkSkills: Array<{
    id: string;
    name_vn: string;
    name_en: string;
    types: Array<{
      id: string;
      name_vn: string;
      name_en: string;
      is_check: boolean;
    }>;
  }>;
}

const renderStars = (value: number, max: number = 5) => {
  const stars = Array.from(
    { length: max },
    (_, index) =>
      `<span class="star ${index < value ? "filled" : ""}">${
        index < value ? "★" : "☆"
      }</span>`
  ).join("");
  return `<div class="stars">${stars}</div>`;
};

const generateEvaluationHTML = (
  data: EvaluationFormData,
  assessmentName: string,
  courseName: string,
  options?: { preview?: boolean }
) => {
  const hasStarSkills = data.starSkills && data.starSkills.length > 0;
  const hasCheckSkills = data.checkSkills && data.checkSkills.length > 0;

  const starSkillsSection = hasStarSkills
    ? data.starSkills
        .map(
          (skill, index) => `
<div class="skill-block">
  <div class="skill-block-title">
    ${skill.name_en} / ${skill.name_vn}
  </div>

  <table class="skill-table">
    <tr>
      ${skill.types
        .map(
          (type) => `
        <th>
          <span class="skill-type-en">${type.name_en}</span>
          <span class="skill-type-vn">${type.name_vn}</span>
        </th>
      `
        )
        .join("")}
    </tr>

    <tr>
      ${skill.types
        .map(
          (type) => `
        <td>${renderStars(Math.round(type.star || 0))}</td>
      `
        )
        .join("")}
    </tr>
  </table>
</div>
`
        )
        .join("")
    : "";

  const checkSkillsSection = hasCheckSkills
    ? data.checkSkills
        .map(
          (skill, index) => `
<div class="skill-block">
  <div class="skill-block-title">
    ${skill.name_en} / ${skill.name_vn}
  </div>

  <table class="skill-table">
    <tr>
      ${skill.types
        .map(
          (type) => `
        <th>
          <span class="skill-type-en">${type.name_en}</span>
          <span class="skill-type-vn">${type.name_vn}</span>
        </th>
      `
        )
        .join("")}
    </tr>

    <tr>
      ${skill.types
        .map(
          (type) => `
        <td>${type.is_check ? "✓" : ""}</td>
      `
        )
        .join("")}
    </tr>
  </table>
</div>
`
        )
        .join("")
    : "";

  const styles = `
        <style>
            * {
                box-sizing: border-box;
            }

            body {
                font-family: "Arial", "Helvetica", sans-serif;
                margin: 0;
                padding: 0;
                background: #f5f5f5;
            }

            .report-container {
                width: 100%;
                max-width: 1100px;
                margin: 0 auto;
                padding: 20px 28px 24px;
                background: #ffffff;
                color: #1f2933;
                position: relative;
            }

            .report-container::before {
                content: "";
                position: absolute;
                top: 0;
                left: 0;
                width: 60px;
                height: 60px;
                border-top: 4px solid #f5a623;
                border-left: 4px solid #f5a623;
            }

            .report-container::after {
                content: "";
                position: absolute;
                bottom: 0;
                right: 0;
                width: 60px;
                height: 60px;
                border-bottom: 4px solid #f5a623;
                border-right: 4px solid #f5a623;
            }

            .report-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 16px;
            }

            .header-text {
                font-size: 11px;
                text-transform: uppercase;
                color: #000000ff;
                line-height: 1.5;
                font-weight: 600;
            }

            .title-block {
                text-align: center;
                margin-top: 8px;
            }

            .title-block h1 {
                margin: 0;
                font-size: 18px;
                font-weight: 700;
                letter-spacing: 0.03em;
                color: #0f172a;
            }

            .info-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
                margin-top: 16px;
            }

            .info-cell {
              border: 1px solid #f1efefff;
              border-radius: 6px;
              padding: 8px 10px;
              background: #f1efefff;
              display: flex;
              align-items: center;  
              gap: 8px;
            }

            .info-label {
              font-size: 12px;
              text-transform: uppercase;
              min-width: 130px;   
              color: #000000ff;
              font-weight: 600;
            }

            .info-value {
              font-size: 15px;
              font-weight: 600;
              margin-top: 0;      
            }

            .section {
                margin-top: 18px;
                overflow: hidden;
            }

            .section-content {
                padding: 6px;
                background: #ffffff;
            }

            .section h2 {
                margin: 0;
                padding: 8px 12px;
                font-size: 15px;
                font-weight: 600;
                color: #0f172a;
                background: #e0e7ff;
                border-radius: 4px 4px 0 0;
            }

            .section h2 span {
                display: block;
                font-size: 12px;
                font-weight: 400;
                color: #000000ff;
            }

            .grid {
                display: grid;
                gap: 10px;
            }

            .grid.star-skills {
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            }

            .grid.check-skills {
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            }

            .grid-cell {
                border: 1px solid #dbe1ec;
                border-radius: 8px;
                padding: 10px 12px;
                min-height: 82px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                background: linear-gradient(180deg, #fff 0%, #f8fbff 100%);
                position: relative;
            }

            .cell-label {
                font-size: 13px;
                color: #0f172a;
                line-height: 1.3;
            }

            .cell-label span {
                display: block;
                font-size: 11px;
                color: #000000ff;
                margin-top: 2px;
            }

            .stars {
                margin-top: 10px;
            }

            .star {
                font-size: 17px;
                color: #cbd5f5;
                margin-right: 1px;
            }

            .star.filled {
                color: #f5a623;
            }

            .star-types {
                margin-top: 10px;
                padding-top: 10px;
                border-top: 1px solid #e2e8f0;
            }

            .star-type-item {
                margin-top: 8px;
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .star-type-item:first-child {
                margin-top: 0;
            }

            .star-type-label {
                font-size: 11px;
                color: #64748b;
                font-weight: 500;
            }

            .check-skills {
                margin-top: 8px;
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
            }

            .check-badge {
                display: inline-block;
                padding: 4px 8px;
                background: #e0e7ff;
                color: #3730a3;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 500;
            }

            .comments-section {
                margin-top: 0px;
            }

            .comments-box {
                border: 1px dashed #cfd8ea;
                border-radius: 8px;
                padding: 10px;
                min-height: 60px;
                font-size: 13px;
                white-space: pre-wrap;
            }

            .legend {
                margin-top: 16px;
                display: flex;
                gap: 16px;
                flex-wrap: wrap;
                font-size: 12px;
                color: #475569;
            }

            .legend strong {
                color: #f5a623;
            }

            .logo {
                display: flex;
                justify-content: flex-end;
                margin-top: 12px;
            }

            .logo img {
                height: 56px;
            }

            .note {
                margin-top: 4px;
                font-size: 12px;
                color: #000000ff;
            }

            .skill-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 10px;
              font-size: 12px;
            }

            .skill-table th,
            .skill-table td {
              border: 1px solid #000;
              padding: 6px 8px;
              text-align: center;
              vertical-align: middle;
            }

            .skill-table th {
              font-weight: 600;
            }

            .skill-table-title {
              background: #cce8f6;
              font-weight: 700;
              text-align: center;
            }

            .skill-block {
              margin-bottom: 20px;
            }

            .skill-block-title {
              background: #cce8f6;
              font-weight: 700;
              text-align: center;
              padding: 6px 10px;
              border: none;
              border-radius: 6px;
              font-size: 13px;
              margin-bottom: 5px;
            }

            .skill-type-en {
              font-weight: 700;
              display: block;
            }

            .skill-type-vn {
              font-style: italic;
              font-size: 11px;
              display: block;
              margin-top: 2px;
            }
        </style>
    `;

  const content = `
        <div class="report-container">
            <div class="report-header">
                <div class="header-text">
                    <div>Trung tâm ngoại ngữ Enspire</div>
                </div>
                <div class="logo">
                    <img src="/logo.svg" alt="Enspire logo" />
                </div>
            </div>

            <div class="title-block">
                <h1>PHIẾU NHẬN XÉT HỌC SINH ${data.month}</h1>
            </div>

            <div class="info-grid">
                <div class="info-cell">
                    <div class="info-label">Name of student</div>
                    <div class="info-value">${data.studentName || "-"}</div>
                </div>
                <div class="info-cell">
                    <div class="info-label">Class</div>
                    <div class="info-value">${data.className || "-"}</div>
                </div>
                <div class="info-cell">
                    <div class="info-label">Teacher</div>
                    <div class="info-value">${data.teachers || "-"}</div>
                </div>
                <div class="info-cell">
                    <div class="info-label">Program</div>
                    <div class="info-value">${courseName || "-"}</div>
                </div>
            </div>

            ${
              hasStarSkills || hasCheckSkills
                ? `<div class="section">
                    <div class="section-content">
                    ${hasStarSkills ? `${starSkillsSection}` : ""}
                    ${hasCheckSkills ? `${checkSkillsSection}` : ""}
                    </div>
                </div>`
                : ""
            }

            <div class="comments-section">
                <div class="info-label">Other comments (if any)/Nhận xét (Nếu có)</div>
                <div class="comments-box">${data.comments || "..."}</div>
            </div>

            ${
              hasStarSkills
                ? `<div class="legend">
                <span><strong>★★★★★</strong> Xuất sắc/Nổi bật</span>
                <span><strong>★★★★☆</strong> Tốt</span>
                <span><strong>★★★☆☆</strong> Hoàn thành yêu cầu</span>
                <span><strong>★★☆☆☆</strong> Đang tiến bộ</span>
                <span><strong>★☆☆☆☆</strong> Cần cố gắng thêm</span>
            </div>`
                : ""
            }
        </div>
    `;

  if (options?.preview) {
    return `${styles}${content}`;
  }

  return `
        <!DOCTYPE html>
        <html lang="vi">
            <head>
                <meta charset="UTF-8" />
                <meta http-equiv="X-UA-Compatible" content="IE=edge" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                ${styles}
            </head>
            <body>
                ${content}
            </body>
        </html>
    `;
};

const loadScript = (src: string): Promise<void> =>
  new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Không thể tải thư viện ${src}`));
    document.body.appendChild(script);
  });

export function AssessmentPDFExport({
  evaluatedItems,
  courseName,
  assessmentName,
  courseId,
  onExportComplete,
  onExportError,
}: AssessmentPDFExportProps) {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [courseInfo, setCourseInfo] = useState<{
    students: Map<string, { className: string }>;
    teachers: string[];
  } | null>(null);

  // Lấy thông tin học sinh và giáo viên từ course nếu có courseId
  useEffect(() => {
    if (!courseId) return;

    const fetchCourseInfo = async () => {
      try {
        const [GetUsersInCourse, GetCourseDetail] = await Promise.all([
          import("@/lib/api/courses").then((m) => m.GetUsersInCourse),
          import("@/lib/api/courses").then((m) => m.GetCourseDetail),
        ]);

        const [studentsRes, teachersRes, courseDetailRes] = await Promise.all([
          GetUsersInCourse(3, Number(courseId)),
          GetUsersInCourse(2, Number(courseId)),
          GetCourseDetail(courseId).catch(() => null),
        ]);

        const studentsMap = new Map<string, { className: string }>();
        if (studentsRes?.data?.users) {
          studentsRes.data.users.forEach((u: any) => {
            const className =
              typeof u.user_info?.class === "object"
                ? u.user_info?.class?.name || ""
                : u.user_info?.class || "";
            studentsMap.set(String(u.id), { className });
          });
        }

        const teachers: string[] = [];
        if (teachersRes?.data?.users) {
          teachersRes.data.users.forEach((u: any) => {
            const name = u.name || u.username || "";
            if (name) teachers.push(name);
          });
        }

        setCourseInfo({
          students: studentsMap,
          teachers,
        });
      } catch (error) {
        console.error("Error fetching course info:", error);
      }
    };

    fetchCourseInfo();
  }, [courseId]);

  const convertItemToFormData = async (
    item: StudyReportEvaluateItem
  ): Promise<EvaluationFormData> => {
    const starSkills =
      item.star_skills?.map((skill) => ({
        id: skill.id,
        name_vn: skill.name_vn || "",
        name_en: skill.name_en || "",
        average_star: skill.average_star || 0,
        types:
          skill.types?.map((type) => ({
            id: type.id,
            name_vn: type.name_vn || "",
            name_en: type.name_en || "",
            star: type.star || 0,
          })) || [],
      })) || [];

    const checkSkills =
      item.check_skills?.map((skill) => ({
        id: skill.id,
        name_vn: skill.name_vn || "",
        name_en: skill.name_en || "",
        types:
          skill.types?.map((type) => ({
            id: type.id,
            name_vn: type.name_vn || "",
            name_en: type.name_en || "",
            is_check: type.is_check,
          })) || [],
      })) || [];

    // Lấy thông tin lớp học và giáo viên từ courseInfo nếu có
    const studentInfo = courseInfo?.students.get(item.student_id);
    const className = studentInfo?.className || "";
    const teachers = courseInfo?.teachers.join(", ") || "";

    return {
      studentName: item.student_name || "",
      className,
      teachers,
      courseName: item.course_name || "",
      englishProgram: "",
      mathProgram: "",
      month: item.type_value || item.type || "",
      comments: item.general_comment || "",
      starSkills,
      checkSkills,
    };
  };

  const generatePDF = async (data: EvaluationFormData): Promise<Blob> => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = generateEvaluationHTML(
      data,
      assessmentName,
      courseName
    );
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    tempDiv.style.top = "0";
    tempDiv.style.width = "297mm";
    tempDiv.style.background = "#fff";
    document.body.appendChild(tempDiv);

    try {
      const canvas = await (window as any).html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        width: 1123,
        height: 894,
      });

      const jsPDF =
        (window as any).jspdf?.jsPDF ||
        (window as any).jsPDF ||
        (window as any).window?.jsPDF;

      if (!jsPDF) {
        throw new Error("Không tìm thấy jsPDF");
      }

      const pdf = new jsPDF("landscape", "mm", "a4");
      const imgData = canvas.toDataURL("image/png");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

      pdf.addImage(
        imgData,
        "PNG",
        (pdfWidth - imgWidth * ratio) / 2,
        0,
        imgWidth * ratio,
        imgHeight * ratio
      );

      const blob = pdf.output("blob");
      document.body.removeChild(tempDiv);
      return blob;
    } catch (error) {
      document.body.removeChild(tempDiv);
      throw error;
    }
  };

  const handleExport = async () => {
    if (evaluatedItems.length === 0) {
      onExportError?.("Không có dữ liệu để xuất báo cáo");
      return;
    }

    setExporting(true);
    setProgress({ current: 0, total: evaluatedItems.length });

    try {
      // Load các thư viện cần thiết
      await Promise.all([
        loadScript("https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js"),
        loadScript(
          "https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js"
        ),
        loadScript(
          "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"
        ),
      ]);

      const zip = new (window as any).JSZip();

      for (let i = 0; i < evaluatedItems.length; i++) {
        const item = evaluatedItems[i];
        setProgress({ current: i + 1, total: evaluatedItems.length });

        try {
          const formData = await convertItemToFormData(item);
          const pdfBlob = await generatePDF(formData);

          const safeName = formData.studentName
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .toLowerCase();

          zip.file(
            `phieu-nhan-xet-${safeName || `hoc-sinh-${item.student_id}`}.pdf`,
            pdfBlob
          );
        } catch (error) {
          console.error(
            `Lỗi khi tạo PDF cho học sinh ${item.student_name}:`,
            error
          );
        }
      }

      // Tạo file ZIP
      const zipBlob = await zip.generateAsync({ type: "blob" });

      // Tải xuống
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      const safeAssessmentName = (assessmentName || "danh-gia")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();
      a.download = `bao-cao-danh-gia-${safeAssessmentName}-${
        new Date().toISOString().split("T")[0]
      }.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onExportComplete?.();
    } catch (error) {
      console.error("Lỗi khi xuất báo cáo:", error);
      onExportError?.(
        error instanceof Error
          ? error.message
          : "Không thể xuất báo cáo. Vui lòng thử lại."
      );
    } finally {
      setExporting(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={exporting || evaluatedItems.length === 0}
      className="flex items-center gap-2"
    >
      {exporting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang xuất ({progress.current}/{progress.total})...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          Xuất báo cáo ({evaluatedItems.length})
        </>
      )}
    </Button>
  );
}
