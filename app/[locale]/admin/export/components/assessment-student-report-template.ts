/**
 * Template HTML cho báo cáo từng học sinh
 * Gần giống UI trang: app/[locale]/teacher/reports/assess-student/[studentId]/page.tsx
 */

import type { StudyReportCriteria } from "@/lib/api/assessment";

export interface AssessmentStudentReportCriterion {
  id: string;
  name: string;
  max_score: number;
  score: number;
  subcriteria: Array<{
    id: string;
    name: string;
    max_score: number;
    score: number;
  }>;
}

export interface AssessmentStudentReportData {
  schoolName: string;
  className: string;
  programName: string;
  subjectName: string;
  subjectId?: string | number;
  assessmentId?: string | number;
  assessmentName: string;
  assessmentType: string;
  studentName: string;
  totalScore: number;
  maxTotalScore: number;
  criteria: AssessmentStudentReportCriterion[];
  examFiles: string[];
  studyReportCriteria: StudyReportCriteria;
  generalComment?: string;
  info?: {
    school_name: string;
    class_name: string;
    program_name?: string;
    school_logo?: string;
    vn_teacher?: string;
    fr_teacher?: string;
  };
}

/**
 * Format comment để các gạch đầu dòng thẳng hàng khi xuống dòng
 * Xử lý cả trường hợp có và không có gạch đầu dòng
 */
function formatCommentWithBullets(comment: string): string {
  if (!comment) return "";
  
  // Escape HTML để tránh XSS
  const escapeHtml = (text: string): string => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  };
  
  // Split theo \n để lấy từng dòng
  const lines = comment.split('\n');
  
  return lines
    .map((line) => {
      const trimmedLine = line.trim();
      
      // Nếu dòng bắt đầu bằng "- " hoặc "-" (có thể có khoảng trắng trước)
      if (trimmedLine.startsWith('-')) {
        // Tách phần gạch đầu dòng và phần nội dung
        const match = trimmedLine.match(/^(\s*-)\s*(.+)$/);
        if (match) {
          const bullet = match[1]; // "-" hoặc "  -"
          const content = match[2]; // Phần nội dung sau gạch đầu dòng
          
          // Tạo HTML với flex để gạch đầu dòng luôn ở đầu, nội dung có thể wrap
          return `
            <div style="display:flex; align-items:flex-start; margin-bottom:4px;">
              <span style="flex-shrink:0; margin-right:4px;">${escapeHtml(bullet)}</span>
              <span style="flex:1; word-wrap:break-word;">${escapeHtml(content)}</span>
            </div>
          `;
        }
      }
      
      // Nếu không phải bullet point, giữ nguyên nhưng vẫn có margin
      if (trimmedLine) {
        return `<div style="margin-bottom:4px; word-wrap:break-word;">${escapeHtml(trimmedLine)}</div>`;
      }
      
      return '<div style="margin-bottom:4px;"><br></div>'; // Dòng trống
    })
    .join('');
}

export function generateAssessmentStudentReportHTML(
  data: AssessmentStudentReportData
): string {
  const academicYear = `2025 - 2026`;

  // Hàm lấy text chương trình dựa trên subject_id
  const getSubjectProgramText = (subjectId?: string | number): string => {
    const id = typeof subjectId === "string" ? parseInt(subjectId) : subjectId;
    switch (id) {
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

  // Màu sắc trắng đen - chỉ dùng 2 màu: đen và xám (không đậm nhạt)
  const GRAY = "#808080"; // Màu xám duy nhất
  const BLACK = "#000000"; // Màu đen

  const skillColors = [
    {
      border: GRAY,
      bg: "rgba(128,128,128,0.08)",
      text: BLACK,
      tableBorder: GRAY,
    },
    {
      border: GRAY,
      bg: "rgba(128,128,128,0.08)",
      text: BLACK,
      tableBorder: GRAY,
    },
    {
      border: GRAY,
      bg: "rgba(128,128,128,0.08)",
      text: BLACK,
      tableBorder: GRAY,
    },
    {
      border: GRAY,
      bg: "rgba(128,128,128,0.08)",
      text: BLACK,
      tableBorder: GRAY,
    },
    {
      border: GRAY,
      bg: "rgba(128,128,128,0.08)",
      text: BLACK,
      tableBorder: GRAY,
    },
  ];

  const getSkillColor = (index: number) =>
    skillColors[index % skillColors.length];

  const formatScore = (value: number): string => {
    if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
      return "";
    }
    return String(value);
  };

  // Tính tổng điểm của từng tiêu chí (nếu cần)
  const calculateCriterionScore = (
    criterion: AssessmentStudentReportCriterion
  ) => {
    if (criterion.subcriteria && criterion.subcriteria.length > 0) {
      const validScores = criterion.subcriteria.filter(
        (sub) => typeof sub.score === "number" && sub.score >= 0
      );
      if (validScores.length === 0) {
        return null;
      }
      const total = validScores.reduce((sum, sub) => sum + sub.score, 0);
      return total;
    }
    if (typeof criterion.score !== "number" || criterion.score < 0) {
      return null;
    }
    return criterion.score;
  };

  const criteriaBlocks = data.criteria
    .map((criterion, index) => {
      const criteriaColors = [
        { text: BLACK, border: GRAY, textScore: BLACK },
        { text: BLACK, border: GRAY, textScore: BLACK },
        { text: BLACK, border: GRAY, textScore: BLACK },
        { text: BLACK, border: GRAY, textScore: BLACK },
        { text: BLACK, border: GRAY, textScore: BLACK },
      ];
      const colors = criteriaColors[index % criteriaColors.length];
      const criterionScore = calculateCriterionScore(criterion);

      const headerHtml = `
        <div style="display:flex; border-radius:999px; margin-bottom:3px; border-left:2px solid ${
          colors.border
        }; border-top:2px solid ${colors.border}; border-bottom:2px solid ${
        colors.border
      }; border-right:2px solid ${colors.border}; width:max-content;">
          <div style="min-width:200px; padding:5px 12px; font-weight:700; font-size:16px; color:${
            colors.text
          }; white-space:nowrap;">
            ${criterion.name}
          </div>
          <div style="min-width:150px; padding:5px 12px; text-align:center; font-weight:600; color:${
            colors.textScore
          }; white-space:nowrap;">
            <span style="font-weight:700; font-size:20px;">
              ${criterionScore !== null ? formatScore(criterionScore) : ""}
            </span>
            <span style="color:#000000; font-size:14px; font-weight:500;"> /${
              criterion.max_score
            }</span>
          </div>
        </div>
      `;

      const subRows = criterion.subcriteria
        .map((sub) => {
          const subScore =
            typeof sub.score === "number" && sub.score >= 0 ? sub.score : -1;
          return `
            <div style="display:flex; width:max-content;">
              <div style="min-width:200px; padding:4px 12px 4px 24px; font-size:15px; font-weight:500; color:${
                colors.textScore
              }; white-space:nowrap;">
                ${sub.name}
              </div>
              <div style="min-width:150px; padding:4px 12px; text-align:center; color:${
                colors.textScore
              }; white-space:nowrap;">
                <span style="font-weight:700; font-size:20px;">
                  ${formatScore(subScore)}
                </span>
                <span style="color:#000000; font-size:14px; font-weight:500;"> /${
                  sub.max_score
                }</span>
              </div>
            </div>
          `;
        })
        .join("");

      return `
        <div style="margin-bottom:6px; width:max-content;">
          ${headerHtml}
          ${subRows}
        </div>
      `;
    })
    .join("");

  const hasValidCriteria = (data.criteria || []).some(
    (criterion) => String(criterion.id) !== "0"
  );

  const starSkillsSection =
    data.studyReportCriteria.star_skills &&
    data.studyReportCriteria.star_skills.length > 0
      ? `
    <div style="margin-top:12px;">
      ${data.studyReportCriteria.star_skills
        .map((skill, skillIndex) => {
          const color = getSkillColor(skillIndex);
          const skillHasNodeTypes = skill.types?.some(
            (t: any) => t.node_types && t.node_types.length > 0
          );

          // Hàm flatten dữ liệu giống trang giáo viên (3–4 cấp)
          const getSkillTableData = (skill: any) => {
            let maxLevel = 2;
            const rows: any[] = [];
            const maxStar = data.studyReportCriteria.max_star || 5;

            skill.types?.forEach((type: any) => {
              const nodes = type.node_types || [];

              if (nodes.length === 0) {
                const starValue =
                  typeof type.star === "number"
                    ? Math.max(0, Math.min(maxStar, type.star))
                    : 0;
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
                  star: starValue,
                });
              } else {
                nodes.forEach((node: any) => {
                  const level4Nodes = node.node_types || [];

                  if (level4Nodes.length > 0) {
                    maxLevel = Math.max(maxLevel, 4);
                    level4Nodes.forEach((level4Node: any) => {
                      const hasLevel4Value =
                        (level4Node.name_vn || "").toString().trim() !== "";
                      if (!hasLevel4Value) return;
                      const starValue =
                        typeof level4Node.star === "number"
                          ? Math.max(0, Math.min(maxStar, level4Node.star))
                          : 0;
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
                        star: starValue,
                      });
                    });
                  } else {
                    maxLevel = Math.max(maxLevel, 3);
                    const hasLevel3Value =
                      (node.name_vn || "").toString().trim() !== "";
                    if (!hasLevel3Value) return;
                    const starValue =
                      typeof node.star === "number"
                        ? Math.max(0, Math.min(maxStar, node.star))
                        : 0;
                    rows.push({
                      level2: type.name_vn || "",
                      level2Id: type.id,
                      level3: node.name_vn,
                      level3Id: node.id,
                      level4: null,
                      level4Id: null,
                      description:
                        (node as any).description ||
                        (type as any).description ||
                        "",
                      id: node.id,
                      type: "level3",
                      star: starValue,
                    });
                  }
                });
              }
            });

            return { maxLevel, rows };
          };

          let tableHtml = "";

          if (skillHasNodeTypes) {
            const { maxLevel, rows } = getSkillTableData(skill);

            // Xác định tiêu chí con để đếm (level3 cho 3 cấp, level4 cho 4 cấp)
            const getChildLevel = (row: any) => {
              if (maxLevel >= 4 && row.level4Id) {
                return row.level4Id; // 4 cấp: đếm theo level4
              } else if (maxLevel >= 3 && row.level3Id) {
                return row.level3Id; // 3 cấp: đếm theo level3
              }
              return null;
            };

            // Chia rows thành các nhóm, mỗi nhóm tối đa 9 tiêu chí con
            // Chuyển đổi assessmentId sang number để so sánh
            const assessmentIdNum =
              typeof data.studyReportCriteria.id === "string"
                ? parseInt(data.studyReportCriteria.id, 10)
                : data.studyReportCriteria.id;
            const MAX_CHILD_ITEMS_PER_PAGE =
              assessmentIdNum === 11 ? 8 : assessmentIdNum === 1 ? 8 : assessmentIdNum === 6 ? 6 : assessmentIdNum === 7 ? 5 : assessmentIdNum === 2 ? 2 : assessmentIdNum === 44 ? 8 :7;
            const rowGroups: any[][] = [];
            let currentGroup: any[] = [];
            let currentChildCount = 0;
            let lastChildId: string | null = null;
            let isFirstPage = true; // Đánh dấu đây là trang đầu tiên

            rows.forEach((row: any) => {
              const childId = getChildLevel(row);

              // Nếu là tiêu chí con mới (khác với tiêu chí trước đó)
              if (childId && childId !== lastChildId) {
                // Chỉ giới hạn cho trang đầu tiên, các trang sau không giới hạn
                if (
                  isFirstPage &&
                  currentChildCount >= MAX_CHILD_ITEMS_PER_PAGE
                ) {
                  rowGroups.push(currentGroup);
                  currentGroup = [];
                  currentChildCount = 0;
                  lastChildId = null; // Reset để bắt đầu đếm lại
                  isFirstPage = false; // Đánh dấu các trang sau không giới hạn
                }
                currentChildCount++;
                lastChildId = childId;
              }

              // Thêm row vào nhóm hiện tại
              currentGroup.push(row);
            });

            // Thêm nhóm cuối cùng
            if (currentGroup.length > 0) {
              rowGroups.push(currentGroup);
            }

            const maxStar = data.studyReportCriteria.max_star || 5;

            // Tạo HTML cho từng nhóm (mỗi nhóm là một bảng)
            const tableHtmlParts: string[] = [];

            rowGroups.forEach((groupRows, groupIndex) => {
              // Merge ô cấp 2, cấp 3 cho nhóm này
              const rowsWithRowSpan = groupRows.map(
                (row: any, index: number) => {
                  let level2RowSpan = 0;
                  let level3RowSpan = 0;

                  // Tính rowspan trong phạm vi nhóm hiện tại
                  if (
                    index === 0 ||
                    groupRows[index - 1].level2Id !== row.level2Id
                  ) {
                    level2RowSpan = groupRows.filter(
                      (r: any) => r.level2Id === row.level2Id
                    ).length;
                  }

                  if (maxLevel >= 3 && row.level3Id) {
                    if (
                      index === 0 ||
                      groupRows[index - 1].level2Id !== row.level2Id ||
                      groupRows[index - 1].level3Id !== row.level3Id
                    ) {
                      level3RowSpan = groupRows.filter(
                        (r: any) =>
                          r.level2Id === row.level2Id &&
                          r.level3Id === row.level3Id
                      ).length;
                    }
                  }

                  return { ...row, level2RowSpan, level3RowSpan };
                }
              );

              // Thêm page-break trước nhóm thứ 2 trở đi
              const pageBreakStyle =
                groupIndex > 0
                  ? "page-break-before: always; break-before: page;"
                  : "";
              const marginTop = groupIndex > 0 ? "20px" : "0";

              const tableRowsHtml = rowsWithRowSpan
                .map((row: any, index: number) => {
                  const isFirstLevel2 =
                    index === 0 ||
                    rowsWithRowSpan[index - 1].level2Id !== row.level2Id;
                  const isFirstLevel3 =
                    maxLevel >= 3 &&
                    row.level3Id &&
                    (index === 0 ||
                      rowsWithRowSpan[index - 1].level2Id !== row.level2Id ||
                      rowsWithRowSpan[index - 1].level3Id !== row.level3Id);

                  const starValue = typeof row.star === "number" ? row.star : 0;

                  // Border cho level2: border đầy đủ cho mỗi ô
                  const level2BorderStyle = `border:1px solid ${color.tableBorder};`;

                  // Border cho level3: border đầy đủ cho mỗi ô
                  const level3BorderStyle = `border:1px solid ${color.tableBorder};`;

                  // Tính width cho từng cột theo %
                  // Bảng 3 cấp: Level2 (25%), Level3 (55%), Star (20%)
                  // Bảng 4 cấp: Level2 (20%), Level3 (20%), Level4 (50%), Star (10%)
                  const level2Width = maxLevel >= 4 ? "15%" : "25%";
                  const level3Width = maxLevel >= 4 ? "15%" : "60%";
                  const level4Width = maxLevel >= 4 ? "55%" : "";
                  const starWidth = maxLevel >= 4 ? "15%" : "15%";

                  return `
                        <tr data-avoid-break="true">
                          ${
                            isFirstLevel2
                              ? `<td style="padding:5px 6px; font-weight:700; font-size:15px; color:${
                                  color.text
                                }; ${level2BorderStyle} background-color:#ffffff; width:${level2Width}; vertical-align:middle; border-radius:2px;" rowspan="${
                                  row.level2RowSpan
                                }">
                                  ${(row.level2 || "").toString().trim() || ""}
                                </td>`
                              : ""
                          }
                          ${
                            maxLevel >= 3
                              ? isFirstLevel3
                                ? `<td style="padding:5px 6px; font-size:15px; font-weight:600; color:${
                                    color.text
                                  }; ${level3BorderStyle} background-color:#ffffff; width:${level3Width}; vertical-align:middle; border-radius:2px;" rowspan="${
                                    row.level3RowSpan
                                  }">
                                    ${
                                      (row.level3 || "").toString().trim() || ""
                                    }
                                  </td>`
                                : !row.level3Id
                                ? `<td style="padding:5px 6px; font-size:15px; font-weight:500; color:#808080; border:1px solid ${color.tableBorder}; background-color:#ffffff; width:${level3Width}; border-radius:2px;">-</td>`
                                : ""
                              : ""
                          }
                          ${
                            maxLevel >= 4
                              ? `<td style="padding:5px 6px; font-size:15px; font-weight:500; color:${
                                  color.text
                                }; border:1px solid ${
                                  color.tableBorder
                                }; background-color:#ffffff; width:${level4Width}; border-radius:2px;">
                                  ${(row.level4 || "").toString().trim() || ""}
                                </td>`
                              : ""
                          }
                          <td style="padding:5px 6px; font-size:15px; font-weight:500; border:1px solid ${
                            color.tableBorder
                          }; background-color:#ffffff; width:${starWidth}; border-radius:2px;">
                            <div style="display:flex; align-items:center; justify-content:center; gap:2px;">
                              ${Array.from(
                                { length: maxStar },
                                (_: any, i: number) => {
                                  const idx = i + 1;
                                  const filled = idx <= starValue;
                                  const starColor = filled
                                    ? "#000000"
                                    : "#ffffff";
                                  return `
                                  <span style="width:18px; height:18px; display:inline-flex; align-items:center; justify-content:center; color:${starColor};">
                                    ★
                                  </span>
                                `;
                                }
                              ).join("")}
                            </div>
                          </td>
                        </tr>
                      `;
                })
                .join("");

              tableHtmlParts.push(`
                  <div style="${pageBreakStyle} margin-top: ${marginTop};">
                    <table style="width:100%; border-collapse:separate; border-spacing:2px; font-size:15px; font-weight:500; table-layout:fixed;">
                      <tbody style="background-color:#ffffff;">
                        ${tableRowsHtml}
                      </tbody>
                    </table>
                  </div>
                `);
            });

            tableHtml = tableHtmlParts.join("");
          } else {
            // Không có node_types: hiển thị dạng list 2 cấp giống UI
            const maxStar = data.studyReportCriteria.max_star || 5;
            const typeRows =
              skill.types
                ?.map((type: any) => {
                  const starValue =
                    typeof type.star === "number"
                      ? Math.max(0, Math.min(maxStar, type.star))
                      : 0;
                  return `
                    <div style="display:flex; align-items:center; justify-content:space-between; padding:4px 3px;">
                      <span style="font-size:15px; font-weight:500; color:${
                        color.text
                      };">
                        ${type.name_vn}
                      </span>
                      <div style="display:flex; align-items:center; gap:3px;">
                        ${Array.from(
                          { length: maxStar },
                          (_: any, i: number) => {
                            const idx = i + 1;
                            const filled = idx <= starValue;
                            const starColor = filled ? "#000000" : "#ffffff";
                            return `
                            <span style="width:18px; height:18px; display:inline-flex; align-items:center; justify-content:center; color:${starColor};">
                              ★
                            </span>
                          `;
                          }
                        ).join("")}
                      </div>
                    </div>
                  `;
                })
                .join("") || "";

            tableHtml = `
              <div style="margin-top:3px;">
                ${typeRows}
              </div>
            `;
          }

          return `
          <div style="margin-bottom:10px; border-radius:12px; padding:8px 10px; background-color:#ffffff;">
            <div style="display:inline-block; border-radius:999px; border:1px solid ${color.border}; padding:3px 8px; margin-bottom:6px; background-color:${color.bg};">
              <span style="font-size:15px; font-weight:600; color:${color.text};">${skill.name_vn}</span>
            </div>
            ${tableHtml}
          </div>
        `;
        })
        .join("")}
    </div>
  `
      : "";

  const checkSkillsSection =
    data.studyReportCriteria.check_skills &&
    data.studyReportCriteria.check_skills.length > 0
      ? `
    <div style="margin-top:12px;">
      ${data.studyReportCriteria.check_skills
        .map((skill, skillIndex) => {
          const color = getSkillColor(
            (data.studyReportCriteria.star_skills?.length || 0) + skillIndex
          );
          const items =
            skill.types
              ?.map((type) => {
                const isChecked = type.is_check === true;
                const checkboxBorderColor = isChecked ? "#000000" : "#808080";
                const checkboxBgColor = isChecked ? "#000000" : "transparent";
                return `
            <label style="display:flex; align-items:flex-start; gap:5px; padding:4px 8px; font-size:15px; font-weight:500; color:${
              color.text
            }; margin-bottom:4px;">
              <span style="margin-top:2px; width:16px; height:16px; border-radius:4px; border:2px solid ${checkboxBorderColor}; background-color:${checkboxBgColor}; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0;">
                ${
                  isChecked
                    ? `<svg style="width:12px; height:12px; color:#ffffff;" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>`
                    : ""
                }
              </span>
              <span>${type.name_vn}</span>
            </label>
          `;
              })
              .join("") || "";

          return `
          <div style="margin-bottom:10px; padding:8px;">
            <div style="display:inline-block; border-radius:999px; border:1px solid #808080; padding:3px 8px; margin-bottom:6px;">
              <span style="font-size:15px; font-weight:600; color:#000000;">${skill.name_vn}</span>
            </div>
            <div style="margin-top:6px; display:flex; flex-wrap:wrap; gap:6px;">
              ${items}
            </div>
          </div>
        `;
        })
        .join("")}
    </div>
  `
      : "";

  const notesSection =
    data.studyReportCriteria.notes && data.studyReportCriteria.notes.length > 0
      ? `
    <div style="margin-top:12px; padding:8px;">
      <div style="font-size:15px; font-weight:600; color:#000000; margin-bottom:6px;">
        Ghi chú đánh giá
      </div>
      <div style="display:flex; flex-wrap:wrap; gap:6px;">
        ${data.studyReportCriteria.notes
          .map(
            (note) => `
          <div style="display:flex; align-items:flex-start; gap:3px; padding:5px 6px; border-radius:999px; border:1px solid #808080; background-color:#ffffff; max-width:100%;">
            <div style="display:flex; align-items:center; gap:2px; color:#000000; font-size:15px; font-weight:600; white-space:nowrap;">
              <span>${note.value}</span>
              <span>★</span>
              <span>:</span>
            </div>
            <span style="font-size:15px; font-weight:500; color:#000000;">
              ${note.text}
            </span>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  `
      : "";

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Báo cáo đánh giá học sinh</title>
  <style>
    @font-face {
      font-family: 'BeVietnamPro';
      src: url('/fonts/BeVietnamPro-Regular.ttf') format('truetype');
      font-weight: 400;
      font-style: normal;
    }
    @font-face {
      font-family: 'BeVietnamPro';
      src: url('/fonts/BeVietnamPro-Medium.ttf') format('truetype');
      font-weight: 500;
      font-style: normal;
    }
    @font-face {
      font-family: 'BeVietnamPro';
      src: url('/fonts/BeVietnamPro-SemiBold.ttf') format('truetype');
      font-weight: 600;
      font-style: normal;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'BeVietnamPro', Arial, sans-serif;
      background: white;
      color: #111827;
    }
    .pdf-body {
      padding: 16px;
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      background-color: #f3f4f6;
      font-size: 15px;
      font-weight: 500;
    }
    .pdf-container {
      max-width: 210mm;
      margin: 0 auto;
      border-bottom: none !important;
    }
  </style>
</head>
<body class="pdf-body">
  <div class="pdf-container" style="background-color: #ffffff;">
    <!-- Header với logo và tiêu đề -->
    <div style="margin-bottom:12px;">
      <div style="display:flex; justify-content:center; align-items:center; gap:24px; margin-bottom:2px;">
        ${
          data.schoolName === "Tiểu học Lomonoxop" ||
          data.schoolName === "Hệ thống liên cấp Lomonoxop"
            ? `<img
                src="${
                  data.schoolName === "Tiểu học Lomonoxop"
                    ? "/logo-lomo.png"
                    : "/logo-lomolc.jpg"
                }"
                alt="Logo trường"
                crossOrigin="anonymous"
                loading="eager"
                style="max-height:80px; max-width:170px; object-fit:contain; image-rendering:auto;"
              />`
            : ""
        }
        <img src="/logo-smt.png" alt="Logo trung tâm" crossOrigin="anonymous" loading="eager" style="max-height:80px; max-width:170px; object-fit:contain; image-rendering:auto;" />
      </div>
      <div style="font-size:22px; font-weight:700; color:#000000; margin-bottom:6px; text-transform:uppercase; text-align:center;">
        PHIẾU ĐÁNH GIÁ HỌC SINH ${data.assessmentName.toUpperCase()}
      </div>
      <div style="font-size:15px; font-weight:500; color:#000000; font-style:italic; margin-bottom:6px; text-align:center;">
        ${getSubjectProgramText(data.subjectId)}
      </div>
    </div>

    <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:10px;">
      <div style="border-radius:12px; background:white; box-shadow:0 10px 25px rgba(15,23,42,0.04); padding:8px 10px;">
        <table style="width:100%; border-collapse:collapse; font-size:15px; font-weight:500; color:#000000;">
          <tbody>
            <tr>
              <td style="width:50%; padding:5px 8px; border:1px solid #000; vertical-align:middle;">
                <div style="display:table;">
                  <div style="display:table-row;">
                    <span style="display:table-cell; font-weight:600; padding-right:4px; vertical-align:middle; white-space:nowrap;">Họ và tên:</span>
                    <div style="display:table-cell; vertical-align:middle; padding-left:0;">
                      <span>${data.studentName || ""}</span>
                    </div>
                  </div>
                  <div style="display:table-row; min-height:20px;">
                    <span style="display:table-cell; padding-right:4px; height:20px;"></span>
                    <div style="display:table-cell; height:20px; padding-left:0;">
                      <span>&nbsp;</span>
                    </div>
                  </div>
                </div>
              </td>

              <td style="width:50%; padding:5px 8px; border:1px solid #000; vertical-align:middle;">
                <div style="display:table;">
                  <div style="display:table-row;">
                    <span style="display:table-cell; font-weight:600; padding-right:4px; vertical-align:middle; white-space:nowrap;">Giáo trình:</span>
                    <div style="display:table-cell; vertical-align:middle; padding-left:0;">
                      <span>${data.programName || ""}</span>
                    </div>
                  </div>
                  <div style="display:table-row; min-height:20px;">
                    <span style="display:table-cell; padding-right:4px; height:20px;"></span>
                    <div style="display:table-cell; height:20px; padding-left:0;">
                      <span>&nbsp;</span>
                    </div>
                  </div>
                </div>
              </td>
            </tr>

            <tr>
              <td style="width:50%; padding:5px 8px; border:1px solid #000; vertical-align:middle;">
                <div style="display:table;">
                  <div style="display:table-row;">
                    <span style="display:table-cell; font-weight:600; padding-right:4px; vertical-align:middle; white-space:nowrap;">Lớp:</span>
                    <div style="display:table-cell; vertical-align:middle; padding-left:0;">
                      <span>${
                        data.className?.split("-").pop()?.trim() ?? ""
                      }</span>
                    </div>
                  </div>
                  <div style="display:table-row; min-height:20px;">
                    <span style="display:table-cell; padding-right:4px; height:20px;"></span>
                    <div style="display:table-cell; height:20px; padding-left:0;">
                      <span>&nbsp;</span>
                    </div>
                  </div>
                </div>
              </td>

              <td style="width:50%; padding:5px 8px; border:1px solid #000; vertical-align:middle;">
                ${(() => {
                  // Chuyển đổi subjectId sang number để so sánh
                  const subjectIdNum =
                    typeof data.subjectId === "string"
                      ? parseInt(data.subjectId, 10)
                      : data.subjectId;
                  const teacherField =
                    subjectIdNum === 4 || subjectIdNum === 5
                      ? data.info?.vn_teacher
                      : data.info?.fr_teacher;
                  const teacherValue = teacherField || "";
                  if (!teacherValue) {
                    return `<div style="display:table;">
                      <div style="display:table-row;">
                        <span style="display:table-cell; font-weight:600; padding-right:4px; vertical-align:middle; white-space:nowrap;">Giáo viên:</span>
                        <div style="display:table-cell; vertical-align:middle; padding-left:0;">
                          <span>&nbsp;</span>
                        </div>
                      </div>
                      <div style="display:table-row; min-height:20px;">
                        <span style="display:table-cell; padding-right:4px; height:20px;"></span>
                        <div style="display:table-cell; height:20px; padding-left:0;">
                          <span>&nbsp;</span>
                        </div>
                      </div>
                    </div>`;
                  }
                  const teachers = teacherValue
                    .split(",")
                    .map((t) => t.trim())
                    .filter((t) => t);
                  if (teachers.length === 0) {
                    return `<div style="display:table;">
                      <div style="display:table-row;">
                        <span style="display:table-cell; font-weight:600; padding-right:4px; vertical-align:middle; white-space:nowrap;">Giáo viên:</span>
                        <div style="display:table-cell; vertical-align:middle; padding-left:0;">
                          <span>&nbsp;</span>
                        </div>
                      </div>
                      <div style="display:table-row; min-height:20px;">
                        <span style="display:table-cell; padding-right:4px; height:20px;"></span>
                        <div style="display:table-cell; height:20px; padding-left:0;">
                          <span>&nbsp;</span>
                        </div>
                      </div>
                    </div>`;
                  }
                  return `<div style="display:table;">
                    <div style="display:table-row;">
                      <span style="display:table-cell; font-weight:600; padding-right:4px; vertical-align:middle; white-space:nowrap;">Giáo viên:</span>
                      <div style="display:table-cell; vertical-align:middle; padding-left:0;">
                        <span>${teachers[0] || ""}</span>
                      </div>
                    </div>
                    <div style="display:table-row; min-height:20px;">
                      <span style="display:table-cell; padding-right:4px; height:20px;"></span>
                      <div style="display:table-cell; height:20px; vertical-align:middle; padding-left:0;">
                        <span>${teachers[1] || ""}</span>
                      </div>
                    </div>
                  </div>`;
                })()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      ${
        hasValidCriteria
          ? `<div style="padding:2px 4px;">
        <div style="font-size:16px; font-weight:600; color:#000000; margin-bottom:0px;">
          1. Điểm thi
        </div>
        ${
          data.assessmentType === "mini_test"
            ? `
        <div style="display:flex; justify-content:center; padding:4px 2px;">
          <div
            style="display:flex; border-radius:999px; margin-bottom:3px; border-left:2px solid #808080; border-top:2px solid #808080; border-bottom:2px solid #808080; border-right:2px solid #808080; width:max-content; background-color:#ffffff;"
          >
            <div
              style="min-width:200px; padding:5px 12px; font-weight:700; font-size:18px; color:#000000; white-space:nowrap;"
            >
              ${data.assessmentName}
            </div>
            <div
              style="min-width:150px; padding:5px 12px; text-align:center; font-weight:600; color:#000000; white-space:nowrap;"
            >
              <span style="font-weight:700; font-size:22px;">
                ${data.totalScore < 0 ? "" : data.totalScore}
              </span>
              <span style="color:#000000; font-size:16px; font-weight:500;">
                / ${data.maxTotalScore}
              </span>
            </div>
          </div>
        </div>`
            : `
        <div style="overflow-x:auto; display:flex; justify-content:center; padding:2px;">
          <div style="display:inline-flex; flex-direction:column; width:max-content; padding:2px;">
            <div style="display:flex; width:max-content; margin-bottom:3px;">
              <div style="min-width:200px; padding:8px 12px; font-weight:700; font-size:20px; background-color:#ffffff; white-space:nowrap;">
                Tổng điểm
              </div>
              <div style="min-width:150px; padding:8px 12px; text-align:center; background-color:#ffffff; white-space:nowrap;">
                <span style="font-weight:700; color:#000000; font-size:22px;">${
                  data.totalScore < 0 ? "" : data.totalScore
                }</span>
                <span style="color:#000000; font-size:16px; font-weight:500;"> / ${
                  data.maxTotalScore
                }</span>
              </div>
            </div>
            ${criteriaBlocks}
          </div>
        </div>`
        }
      </div>`
          : ""
      }
    </div>

    <div style="border-radius:12px; background:white; padding:8px 10px; margin-bottom:3px;">
      <div style="font-size:16px; font-weight:600; color:#000000; margin-bottom:3px;">
        ${hasValidCriteria ? "2. Đánh giá" : "Đánh giá"}
      </div>
      ${starSkillsSection}
      ${notesSection}
    </div>

    <div style="padding:8px 10px; margin-bottom:3px;">
      ${checkSkillsSection}
    </div>

    ${
      data.generalComment && data.generalComment.trim() !== ""
        ? `
    <div style="padding:8px 10px; margin-top:3px;">
      <div style="font-size:16px; font-weight:600; color:#000000; margin-bottom:4px;">
        ${hasValidCriteria ? "3. Nhận xét chung" : "Nhận xét chung"}
      </div>
      <div style="min-height:60px; border-radius:10px; padding:6px; font-size:15px; font-weight:500; color:#000000;">
        ${formatCommentWithBullets(data.generalComment)}
      </div>
    </div>
    `
        : ""
    }
  </div>
</body>
</html>
  `;
}
