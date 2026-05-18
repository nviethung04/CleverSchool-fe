/**
 * Template HTML cho báo cáo bài kiểm tra đánh giá
 */

export interface AssessmentReportData {
  schoolName: string;
  className: string;
  programName: string;
  subjectName: string;
  academicYear: string;
  assessmentName: string;
  assessmentType: string;
  students: Array<{
    student_id: string;
    student_name: string;
    total_score: number;
    criteria: Array<{
      id: string;
      name: string;
      max_score: number;
      score: number;
      has_subcriteria?: boolean;
      subcriteria?: Array<{
        id: string;
        name: string;
        max_score: number;
        score: number;
      }>;
    }>;
  }>;
  statistic: {
    unscored: string;
    from_0_to_50: string;
    from_50_to_70: string;
    from_70_to_80: string;
    from_80_to_100: string;
  };
}

export function generateAssessmentReportHTML(
  data: AssessmentReportData
): string {
  const currentYear = new Date().getFullYear();
  const academicYear = data.academicYear || `2025 - 2026`;

  // Xử lý className: chỉ lấy phần sau dấu " - "
  const displayClassName = data.className.includes(" - ")
    ? data.className.split(" - ")[1]
    : data.className;

  // Lấy criteria từ học sinh đầu tiên để tạo header (giả sử tất cả học sinh có cùng criteria)
  const firstStudent = data.students[0];
  const criteriaList = firstStudent?.criteria || [];

  if (criteriaList.length === 0) {
    // Nếu không có criteria, hiển thị thông báo
    return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Báo cáo bài kiểm tra đánh giá</title>
  <style>
    @font-face {
      font-family: 'TimesNewRoman';
      src: url('/fonts/SVN-Times New Roman.ttf') format('truetype');
      font-weight: 400;
      font-style: normal;
    }
    @font-face {
      font-family: 'TimesNewRoman';
      src: url('/fonts/SVN-Times New Roman Bold.ttf') format('truetype');
      font-weight: 700;
      font-style: normal;
    }
    body {
      font-family: 'TimesNewRoman', 'Times New Roman', serif;
      padding: 40px;
      text-align: center;
    }
  </style>
</head>
<body>
  <h2>Không có dữ liệu để hiển thị</h2>
</body>
</html>
    `;
  }

  // Tạo header columns động dựa trên criteria
  // Format: Array<{ criterionId, criterionName, subcriterionId?, subcriterionName? }>
  interface HeaderColumn {
    criterionId: string;
    criterionName: string;
    subcriterionId?: string;
    subcriterionName?: string;
  }

  interface CriterionGroup {
    criterionId: string;
    criterionName: string;
    maxScore: number;
    subcriteria: Array<{
      id: string;
      name: string;
      maxScore: number;
    }>;
    hasSubcriteria: boolean;
  }

  // Nhóm criteria theo cấp 1
  const criterionGroups: CriterionGroup[] = [];
  const headerColumns: HeaderColumn[] = [];

  criteriaList.forEach((criterion) => {
    if (
      criterion.has_subcriteria &&
      criterion.subcriteria &&
      criterion.subcriteria.length > 0
    ) {
      // Nếu có subcriteria, tạo group và thêm các subcriteria vào headerColumns
      criterionGroups.push({
        criterionId: criterion.id,
        criterionName: criterion.name,
        maxScore: criterion.max_score,
        subcriteria: criterion.subcriteria.map((sub) => ({
          id: sub.id,
          name: sub.name,
          maxScore: sub.max_score,
        })),
        hasSubcriteria: true,
      });
      criterion.subcriteria.forEach((sub) => {
        headerColumns.push({
          criterionId: criterion.id,
          criterionName: criterion.name,
          subcriterionId: sub.id,
          subcriterionName: sub.name,
        });
      });
    } else {
      // Nếu không có subcriteria, tạo group đơn lẻ
      criterionGroups.push({
        criterionId: criterion.id,
        criterionName: criterion.name,
        maxScore: criterion.max_score,
        subcriteria: [],
        hasSubcriteria: false,
      });
      headerColumns.push({
        criterionId: criterion.id,
        criterionName: criterion.name,
      });
    }
  });

  // Tính toán số cột để điều chỉnh width
  const availableWidth = 200; // mm (210mm - 10mm left padding - 0mm right padding)
  const sttWidth = 13; // mm
  const nameWidth = 49; // mm
  const totalScoreWidth = 23; // mm
  const fixedColumnsWidth = sttWidth + nameWidth + totalScoreWidth; // 85mm
  const criteriaAvailableWidth = availableWidth - fixedColumnsWidth; // 115mm

  // Tính toán width cho mỗi cột criteria
  const minCriteriaWidth = 20; // mm - minimum width per criterion column
  const maxCriteriaWidth = 40; // mm - maximum width per criterion column
  let actualCriteriaWidth = criteriaAvailableWidth / headerColumns.length;

  // Đảm bảo width không vượt quá min/max
  if (actualCriteriaWidth < minCriteriaWidth) {
    actualCriteriaWidth = minCriteriaWidth;
  } else if (actualCriteriaWidth > maxCriteriaWidth) {
    actualCriteriaWidth = maxCriteriaWidth;
  }

  // Tính lại tổng width thực tế và scale nếu cần
  const totalActualWidth =
    fixedColumnsWidth + actualCriteriaWidth * headerColumns.length;
  let scaleFactor = 1;
  if (totalActualWidth > availableWidth) {
    scaleFactor = availableWidth / totalActualWidth;
    actualCriteriaWidth = actualCriteriaWidth * scaleFactor;
  }

  // Tính toán font size dựa trên số cột
  let headerFontSize = 15;
  let cellFontSize = 12;
  if (headerColumns.length > 8) {
    headerFontSize = 13;
    cellFontSize = 11;
  } else if (headerColumns.length > 6) {
    headerFontSize = 14;
    cellFontSize = 11;
  }

  // Luôn có 2 hàng header
  const headerRowspan = 2;

  // Dòng 1: Các criteria cấp 1
  const headerRow1 = `
    <tr>
      <th rowspan="${headerRowspan}" style="width: ${sttWidth}mm; text-align: center; vertical-align: middle; font-size: ${headerFontSize}px; font-family: 'Times New Roman', serif; font-weight: 700;"><strong>STT</strong></th>
      <th rowspan="${headerRowspan}" style="width: ${nameWidth}mm; text-align: center; vertical-align: middle; font-size: ${headerFontSize}px; font-family: 'Times New Roman', serif; font-weight: 700;"><strong>Tên học sinh</strong></th>
      ${criterionGroups
        .map((group) => {
          if (group.hasSubcriteria) {
            // Merge các cột subcriteria - hiển thị tên + max_score trong cùng ô
            const colspan = group.subcriteria.length;
            return `<th colspan="${colspan}" style="text-align: center; font-size: ${headerFontSize}px; font-family: 'Times New Roman', serif; font-weight: 700;"><strong>${group.criterionName}<br/>(${group.maxScore})</strong></th>`;
          } else {
            // Criterion không có subcriteria - hiển thị tên + max_score trong cùng ô (rowspan=2)
            return `<th rowspan="2" style="width: ${actualCriteriaWidth}mm; text-align: center; vertical-align: middle; font-size: ${headerFontSize}px; font-family: 'Times New Roman', serif; font-weight: 700;"><strong>${group.criterionName}<br/>(${group.maxScore})</strong></th>`;
          }
        })
        .join("")}
      <th rowspan="${headerRowspan}" style="width: ${totalScoreWidth}mm; text-align: center; vertical-align: middle; font-size: ${headerFontSize}px; font-family: 'Times New Roman', serif; font-weight: 700;"><strong>Tổng điểm<br/>(100)</strong></th>
    </tr>
  `;

  // Dòng 2: Chỉ hiển thị subcriteria (nếu có)
  const headerRow2 = `
    <tr>
      ${criterionGroups
        .map((group) => {
          if (group.hasSubcriteria) {
            // Tạo các cột cho subcriteria - hiển thị tên + max_score trong cùng ô
            return group.subcriteria
              .map(
                (sub) =>
                  `<th style="width: ${actualCriteriaWidth}mm; text-align: center; font-size: ${headerFontSize}px; font-family: 'Times New Roman', serif; font-weight: 700;"><strong>${sub.name}<br/>(${sub.maxScore})</strong></th>`
              )
              .join("");
          }
          // Criterion không có subcriteria - không có gì (đã rowspan ở dòng 1)
          return "";
        })
        .join("")}
    </tr>
  `;

  // Chia danh sách học sinh thành các trang
  // Trang 1: 21 học sinh, từ trang 2 trở đi: 26 học sinh
  const studentsPerPageFirst = 21;
  const studentsPerPageRest = 27;

  // Tính số trang
  let totalPages = 1;
  let remainingStudents = data.students.length;
  if (remainingStudents > studentsPerPageFirst) {
    remainingStudents -= studentsPerPageFirst;
    totalPages += Math.ceil(remainingStudents / studentsPerPageRest);
  }

  // Tạo function để tạo rows cho một trang
  const createStudentRowsForPage = (
    students: typeof data.students,
    startIndex: number
  ) => {
    return students
      .map((student, localIndex) => {
        const globalIndex = startIndex + localIndex;
        // Tạo cells cho từng criterion/subcriterion
        const criteriaCells = headerColumns.map((headerCol) => {
          let score: number | null = null;

          // Tìm criterion tương ứng
          const criterion = student.criteria.find(
            (c) => c.id === headerCol.criterionId
          );

          if (criterion) {
            if (headerCol.subcriterionId && criterion.subcriteria) {
              // Tìm subcriterion
              const subcriterion = criterion.subcriteria.find(
                (sub) => sub.id === headerCol.subcriterionId
              );
              if (subcriterion) {
                score = subcriterion.score >= 0 ? subcriterion.score : null;
              }
            } else {
              // Lấy score của criterion (nếu không có subcriteria)
              score = criterion.score >= 0 ? criterion.score : null;
            }
          }

          const displayScore = score !== null ? score : "-";
          return `<td style="text-align: center; font-family: 'TimesNewRoman', 'Times New Roman', serif; font-weight: 700;"><strong>${displayScore}</strong></td>`;
        });

        const totalScore =
          student.total_score >= 0 && student.total_score !== -1
            ? student.total_score
            : "-";

        // Kiểm tra nếu là hàng cuối cùng của trang
        const isLastRow = localIndex === students.length - 1;
        const borderBottomStyle = isLastRow
          ? "border-bottom: 2px solid #000;"
          : "";

        return `
        <tr>
          <td style="text-align: center; font-family: 'TimesNewRoman', 'Times New Roman', serif; font-weight: 700; ${borderBottomStyle}"><strong>${
          globalIndex + 1
        }</strong></td>
            <td style="text-align: center; font-family: 'TimesNewRoman', 'Times New Roman', serif; font-weight: 700; ${borderBottomStyle}"><strong>${
          student.student_name
        }</strong></td>
          ${criteriaCells
            .map((cell) => {
              // Thêm border-bottom cho các cell nếu là hàng cuối cùng
              if (isLastRow) {
                return cell.replace(
                  'style="',
                  'style="border-bottom: 2px solid #000; '
                );
              }
              return cell;
            })
            .join("")}
            <td style="text-align: center; font-family: 'TimesNewRoman', 'Times New Roman', serif; font-weight: 700; ${borderBottomStyle}"><strong>${totalScore}</strong></td>
        </tr>
      `;
      })
      .join("");
  };

  // Tạo HTML cho header (dùng chung cho tất cả các trang)
  const headerHTML = `
    <div class="header">
      <div class="header-left">
        <div style="font-weight: 700; font-size: 18px; font-family: 'TimesNewRoman', 'Times New Roman', serif;"><strong>TRUNG TÂM ANH NGỮ Clever School</strong></div>
        <div style="font-size: 15px; font-family: 'TimesNewRoman', 'Times New Roman', serif; font-weight: 700; margin-top: 5px;"><strong>Năm học 2025-2026</strong></div>
      </div>
      <div class="header-right">
        <div style="font-weight: 700; font-size: 18px; font-family: 'TimesNewRoman', 'Times New Roman', serif; text-transform: uppercase;"><strong>TRƯỜNG TIỂU HỌC ${
          data.schoolName
        }</strong></div>
      </div>
    </div>
    
    <div class="header-center">
      <div class="center-title"><strong>TỔNG HỢP KẾT QUẢ KIỂM TRA ${data.assessmentName.toUpperCase()} ${
        data.subjectName ? ` MÔN ${data.subjectName.toUpperCase()}` : ""
      }</strong></div>
    </div>
    
    <div class="info-section">
      <div class="info-row">
        <span class="info-label"><strong>Program/Chương trình:</strong></span>
        <span class="info-value"><strong>${data.programName}</strong></span>
      </div>
      <div class="info-row">
        <span class="info-label"><strong>School/Trường:</strong></span>
        <span class="info-value"><strong>${data.schoolName}</strong></span>
      </div>
      <div class="info-row">
        <span class="info-label"><strong>Class/Lớp:</strong></span>
        <span class="info-value"><strong>${displayClassName}</strong></span>
      </div>
    </div>
  `;

  // Tạo HTML cho bảng (dùng chung header)
  const createTableHTML = (studentRowsHTML: string) => {
    return `
    <table class="results-table">
      <thead>
        ${headerRow1}
        ${headerRow2}
      </thead>
      <tbody>
        ${studentRowsHTML}
      </tbody>
    </table>
    `;
  };

  // Tạo các trang
  const pagesHTML = [];
  let currentIndex = 0;
  let page2StudentCount = 0; // Lưu số học sinh trên trang 2

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    const studentsPerPage =
      pageIndex === 0 ? studentsPerPageFirst : studentsPerPageRest;
    const endIndex = Math.min(
      currentIndex + studentsPerPage,
      data.students.length
    );
    const pageStudents = data.students.slice(currentIndex, endIndex);
    const pageStudentRows = createStudentRowsForPage(
      pageStudents,
      currentIndex
    );

    // Lưu số học sinh trên trang 2 để kiểm tra điều kiện ngắt trang
    if (pageIndex === 1) {
      page2StudentCount = pageStudents.length;
    }

    if (pageIndex === 0) {
      pagesHTML.push(`
      <div class="page-wrapper first-page">
        ${headerHTML}
        ${createTableHTML(pageStudentRows)}
        <div class="page-end-spacer"></div>
      </div>
    `);
    } else {
      pagesHTML.push(`
      <div class="page-wrapper new-page-wrapper">
        <div class="page-start-marker"></div>
        ${createTableHTML(pageStudentRows)}
        ${
          pageIndex < totalPages - 1
            ? '<div class="page-end-spacer"></div>'
            : ""
        }
      </div>
    `);
    }

    currentIndex = endIndex;
  }

  // Kiểm tra điều kiện: nếu trang 2 có từ 23-27 học sinh thì cần ngắt trang cho phần thống kê
  const shouldBreakForStatistics =
    totalPages >= 2 && page2StudentCount >= 23 && page2StudentCount <= 27;

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Báo cáo bài kiểm tra đánh giá</title>
  <style>
    @font-face {
      font-family: 'TimesNewRoman';
      src: url('/fonts/SVN-Times New Roman.ttf') format('truetype');
      font-weight: 400;
      font-style: normal;
    }
    @font-face {
      font-family: 'TimesNewRoman';
      src: url('/fonts/SVN-Times New Roman Bold.ttf') format('truetype');
      font-weight: 700;
      font-style: normal;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
    }
    .pdf-body {
      font-family: 'TimesNewRoman', 'Times New Roman', serif;
      background: white;
      color: black;
      padding: 40px 40px 45px 40px;
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    
    .pdf-container {
      width: 100%;
      max-width: 210mm;
      margin: 0 auto;
      background: white;
      padding: 20px 20px 25px 20px;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      gap: 18px;
    }
    
    .header-left {
      flex: 1;
      font-family: 'TimesNewRoman', 'Times New Roman', serif;
    }
    
    .header-right {
      flex: 1;
      text-align: right;
      font-family: 'TimesNewRoman', 'Times New Roman', serif;
    }
    
    .header-center {
      text-align: center;
      margin: 20px 0;
      font-family: 'TimesNewRoman', 'Times New Roman', serif;
    }
    
    .center-title {
      font-size: 18px;
      font-family: 'TimesNewRoman', 'Times New Roman', serif;
      font-weight: 700;
      text-transform: uppercase;
      margin: 20px 0;
      text-align: center;
      line-height: 1.2;
    }
    
    .info-section {
      margin: 20px 0;
      font-size: 15px;
      font-family: 'TimesNewRoman', 'Times New Roman', serif;
      font-weight: 700;
    }
    
    .info-row {
      margin: 5px 0;
    }
    
    .info-label {
      display: inline-block;
      width: 180px;
    }
    
    .info-value {
      display: inline-block;
    }
    
    .results-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 14px;
      font-family: 'TimesNewRoman', 'Times New Roman', serif;
      table-layout: fixed;
      word-wrap: break-word;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    
    .results-table thead {
      display: table-header-group;
    }
    
    .results-table tbody {
      display: table-row-group;
    }
    
    .results-table th {
      background-color: #f0f0f0;
      border: 1px solid #000;
      padding: 12px 8px;
      text-align: center;
      font-family: 'TimesNewRoman', 'Times New Roman', serif;
      font-weight: 700;
      font-size: 14px;
      vertical-align: middle;
      word-wrap: break-word;
      overflow: hidden;
    }
    
    .results-table td {
      border: 1px solid #000;
      padding: 8px;
      text-align: left;
      font-family: 'TimesNewRoman', 'Times New Roman', serif;
      font-weight: 700;
      font-size: 14px;
      word-wrap: break-word;
      overflow: hidden;
    }
    
    .results-table td:first-child {
      text-align: center;
      width: ${sttWidth}mm;
    }
    
    .results-table td:nth-child(2) {
      text-align: center;
      width: ${nameWidth}mm;
    }
    
    .results-table td:nth-child(n+3):not(:last-child) {
      text-align: center;
      width: ${actualCriteriaWidth}mm;
    }
    
    .results-table td:last-child {
      text-align: center;
      font-weight: 700;
      width: ${totalScoreWidth}mm;
    }
    
    .statistic-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 14px;
      font-family: 'TimesNewRoman', 'Times New Roman', serif;
      table-layout: fixed;
    }
    
    .statistic-table th {
      background-color: #f0f0f0;
      border: 1px solid #000;
      padding: 12px 8px;
      text-align: center;
      font-family: 'TimesNewRoman', 'Times New Roman', serif;
      font-weight: 700;
      font-size: 14px;
    }
    
    .statistic-table th:first-child {
      width: 30mm;
    }
    
    .statistic-table td {
      border: 1px solid #000;
      padding: 8px;
      text-align: center;
      font-family: 'TimesNewRoman', 'Times New Roman', serif;
      font-weight: 700;
      font-size: 14px;
    }
    
    .statistic-table td:first-child {
      font-weight: 700;
      background-color: #f9f9f9;
    }
    
    .footer {
      margin-top: 40px;
      text-align: right;
      font-size: 14px;
      font-family: 'TimesNewRoman', 'Times New Roman', serif;
      font-weight: 700;
    }
    
    .page-wrapper {
      display: block;
      width: 100%;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    
    .page-wrapper.first-page {
      page-break-after: always !important;
      break-after: page !important;
    }
    
    .page-wrapper.new-page-wrapper {
      page-break-before: always !important;
      break-before: page !important;
      page-break-after: always;
      break-after: page;
    }
    
    .page-wrapper:last-of-type {
      page-break-after: auto;
      break-after: auto;
    }
    
    .page-end-spacer {
      display: block;
      height: 1px;
      width: 100%;
      page-break-after: always !important;
      break-after: page !important;
      margin: 0;
      padding: 0;
    }
    
    .page-start-marker {
      display: block;
      height: 0;
      width: 100%;
      page-break-before: always !important;
      break-before: page !important;
      margin: 0;
      padding: 0;
    }
    
    @page {
      size: A4;
      margin: 20mm;
    }
    
    @media print {
      .page-break.first-page {
        page-break-after: always !important;
        break-after: page !important;
      }
      
      .page-separator {
        page-break-before: always !important;
        break-before: page !important;
      }
      
      .new-page-wrapper {
        page-break-before: always !important;
        break-before: page !important;
      }
      
      .results-table {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    }
  </style>
</head>
<body class="pdf-body">
  <div class="pdf-container">
    <div>
      ${pagesHTML.join("\n")}
      <div class="statistic-section" data-avoid-break="true" data-force-new-page="${
        shouldBreakForStatistics ? "true" : "false"
      }">
        <table class="statistic-table">
        <thead>
          <tr>
            <th></th>
            <th style="background-color: yellow;"><strong>80-100</strong></th>
            <th style="background-color: yellow;"><strong>70-79</strong></th>
            <th style="background-color: yellow;"><strong>50-69</strong></th>
            <th style="background-color: yellow;"><strong>Cần cố gắng</strong></th>
            <th style="background-color: yellow;"><strong>Tổng</strong></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Số HS</strong></td>
            <td><strong>${data.statistic.from_80_to_100}</strong></td>
            <td><strong>${data.statistic.from_70_to_80}</strong></td>
            <td><strong>${data.statistic.from_50_to_70}</strong></td>
            <td><strong>${data.statistic.from_0_to_50}</strong></td>
            <td><strong>${data.students.length}</strong></td>
          </tr>
          <tr>
            <td><strong>%</strong></td>
            <td style="color: red;"><strong>${calculatePercentage(
              data.statistic.from_80_to_100,
              data.students.length
            )}</strong></td>
            <td style="color: red;"><strong>${calculatePercentage(
              data.statistic.from_70_to_80,
              data.students.length
            )}</strong></td>
            <td style="color: red;"><strong>${calculatePercentage(
              data.statistic.from_50_to_70,
              data.students.length
            )}</strong></td>
            <td style="color: red;"><strong>${calculatePercentage(
              data.statistic.from_0_to_50,
              data.students.length
            )}</strong></td>
            <td><strong>100,0</strong></td>
          </tr>
        </tbody>
      </table>
      
      <div class="footer">
        <div><strong>Giáo viên phụ trách</strong></div>
      </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// Helper function để tính phần trăm
function calculatePercentage(value: string, total: number): string {
  const num = parseInt(value) || 0;
  if (total === 0) return "0,0";
  const percentage = (num / total) * 100;
  return percentage.toFixed(1).replace(".", ",");
}
