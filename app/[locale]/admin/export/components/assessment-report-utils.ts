import {
  GetAssessmentReport,
  AssessmentReportResponse,
} from "@/lib/api/assessment";
import {
  generateAssessmentReportHTML,
  AssessmentReportData,
} from "./assessment-report-template";

/**
 * Load thư viện JSZip từ CDN
 */
export async function loadJSZip(): Promise<void> {
  if ((window as any).JSZip) {
    return;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Không thể tải JSZip"));
    document.head.appendChild(script);
  });
}

/**
 * Load thư viện jsPDF từ CDN
 */
export async function loadJsPDF(): Promise<void> {
  if ((window as any).jspdf?.jsPDF || (window as any).jsPDF) {
    return;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Không thể tải jsPDF"));
    document.head.appendChild(script);
  });
}

/**
 * Load thư viện html2canvas từ CDN
 */
export async function loadHtml2Canvas(): Promise<void> {
  if ((window as any).html2canvas) {
    return;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Không thể tải html2canvas"));
    document.head.appendChild(script);
  });
}

/**
 * Generate PDF từ HTML string sử dụng jsPDF + html2canvas
 * @param html - HTML string để render
 * @param grayscale - Chuyển sang trắng đen (mặc định: false - đã sửa màu trong template)
 */
export async function generatePDFFromHTML(html: string, grayscale: boolean = false): Promise<Blob> {
  // Tạo temporary container để render HTML
  const tempDiv = document.createElement("div");

  // Extract body content từ HTML string
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const bodyContent = doc.body || doc.documentElement;

  // Copy styles từ head
  const styles = doc.head.querySelectorAll("style");
  const styleText = Array.from(styles)
    .map((style) => style.textContent)
    .join("\n");

  // Tạo wrapper với styles
  tempDiv.innerHTML = `
    <style>${styleText}</style>
    ${bodyContent.innerHTML}
  `;

  tempDiv.style.position = "absolute";
  tempDiv.style.left = "-9999px";
  tempDiv.style.top = "0";
  tempDiv.style.width = "210mm";
  tempDiv.style.maxWidth = "210mm";
  tempDiv.style.background = "#fff";
  tempDiv.style.padding = "0";
  tempDiv.style.margin = "0";
  tempDiv.style.fontFamily = "Times New Roman, serif";
  tempDiv.style.boxSizing = "border-box";
  tempDiv.style.overflow = "hidden";

  document.body.appendChild(tempDiv);

  try {
    // Đợi một chút để DOM render
    await new Promise((resolve) => setTimeout(resolve, 100));
    
    // Đợi images load với timeout ngắn để tối ưu
    const images = tempDiv.querySelectorAll("img");
    if (images.length > 0) {
      await Promise.all(
        Array.from(images).map((img: any) => {
          // Nếu đã load xong thì không cần chờ
          if (img.complete) {
            return Promise.resolve();
          }
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
            // Timeout ngắn để tối ưu - không chờ quá lâu
            setTimeout(resolve, 200);
          });
        })
      );
    }

    // Tính toán vị trí các phần tử cần tránh ngắt (table rows, skill blocks, etc.)
    // Đợi một chút để đảm bảo DOM đã render xong (tăng thời gian để đảm bảo phần tử được render đúng)
    await new Promise((resolve) => setTimeout(resolve, 50));
    
    // Force reflow để đảm bảo layout đã được tính toán
    tempDiv.offsetHeight;
    
    const avoidBreakElements = tempDiv.querySelectorAll('[data-avoid-break="true"]');
    const elementPositions: Array<{ top: number; bottom: number; forceNewPage?: boolean }> = [];
    const forceNewPagePositions: number[] = []; // Vị trí các phần tử bắt buộc phải bắt đầu trang mới
    
    avoidBreakElements.forEach((el: any) => {
      const rect = el.getBoundingClientRect();
      const containerRect = tempDiv.getBoundingClientRect();
      const relativeTop = rect.top - containerRect.top;
      const relativeBottom = rect.bottom - containerRect.top;
      
      const forceNewPage = el.getAttribute('data-force-new-page') === 'true';
      
      // Lưu vị trí trong pixels thực tế (chưa scale)
      elementPositions.push({
        top: relativeTop,
        bottom: relativeBottom,
        forceNewPage: forceNewPage || false
      });
      
      // Nếu có data-force-new-page="true", lưu vị trí top để đảm bảo ngắt trang tại đây
      if (forceNewPage) {
        forceNewPagePositions.push(relativeTop);
        // Debug log để kiểm tra
        console.log(`[PDF Export] Found force-new-page element at top: ${relativeTop}px, bottom: ${relativeBottom}px`);
      }
    });
    
    // Debug log tổng số phần tử force-new-page
    if (forceNewPagePositions.length > 0) {
      console.log(`[PDF Export] Total force-new-page elements: ${forceNewPagePositions.length}`);
    }

    // Sắp xếp theo vị trí top để dễ xử lý
    elementPositions.sort((a, b) => a.top - b.top);
    forceNewPagePositions.sort((a, b) => a - b);
    
    // Tính toán kích thước A4 trong pixels (210mm x 297mm)
    // 1mm = 3.779527559 pixels ở 96 DPI
    const a4WidthPx = 210 * 3.779527559; // ~794px
    const a4HeightPx = 297 * 3.779527559; // ~1123px

    // Sử dụng html2canvas để convert HTML thành canvas
    // Scale 5
    const scale = 5;
    const canvas = await (window as any).html2canvas(tempDiv, {
      scale: scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: a4WidthPx,
      height: Math.max(tempDiv.scrollHeight || a4HeightPx, a4HeightPx),
      scrollX: 0,
      scrollY: 0,
      logging: false,
      windowWidth: a4WidthPx,
      letterRendering: true, // Render text tốt hơn
      removeContainer: false, // Giữ container để đảm bảo render đúng
      foreignObjectRendering: false, // Tắt foreignObject để render tốt hơn
    });

    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error("Canvas không được tạo đúng cách");
    }

    // Chuyển canvas sang grayscale nếu cần
    if (grayscale) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Convert RGB to grayscale sử dụng công thức chuẩn
        // Gray = 0.299*R + 0.587*G + 0.114*B
        for (let i = 0; i < data.length; i += 4) {
          const gray = Math.round(
            data[i] * 0.299 + 
            data[i + 1] * 0.587 + 
            data[i + 2] * 0.114
          );
          data[i] = gray;     // R
          data[i + 1] = gray; // G
          data[i + 2] = gray; // B
          // data[i + 3] giữ nguyên alpha channel
        }
        
        ctx.putImageData(imageData, 0, 0);
      }
    }

    // Lấy jsPDF
    const jsPDF =
      (window as any).jspdf?.jsPDF ||
      (window as any).jsPDF ||
      (window as any).window?.jsPDF;

    if (!jsPDF) {
      throw new Error("Không tìm thấy jsPDF");
    }

    // Tạo PDF
    const pdf = new jsPDF("portrait", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    // imgData không được dùng trực tiếp (chỉ dùng pageImgData), nhưng giữ lại để tương lai có thể cần

    // Tính toán tỷ lệ để fit vào trang A4
    // Giống với pdfExport.ts: margin: [5, 5, 5, 5] = 5mm mỗi bên
    // pdfWidth và pdfHeight đã là kích thước A4 (210mm x 297mm)
    const availableWidth = pdfWidth - 10; // 5mm mỗi bên = 200mm
    const availableHeight = pdfHeight - 10; // 5mm top + 5mm bottom = 287mm

    // Canvas được tạo với scale 3 (để có chất lượng cao)
    // HTML có width 210mm, nên canvas width = 210mm * 3.779527559 * scale pixels
    // Để convert canvas pixel về mm: canvasWidthMm = imgWidth / (scale * pixelsPerMm)
    const pixelsPerMm = 3.779527559; // Pixels per mm ở 96 DPI
    // Scale đã được định nghĩa ở trên (scale = 3)
    const canvasWidthMm = imgWidth / (scale * pixelsPerMm);
    const canvasHeightMm = imgHeight / (scale * pixelsPerMm);

    // QUAN TRỌNG: Chỉ tính ratio dựa trên width để đảm bảo width luôn đúng
    // Không tính dựa trên height để tránh thu nhỏ nội dung khi dài
    // Sau đó sẽ chia thành nhiều trang dựa trên chiều cao thực tế
    const widthRatio = availableWidth / canvasWidthMm;

    const scaledWidth = canvasWidthMm * widthRatio;
    const scaledHeight = canvasHeightMm * widthRatio; // Giữ tỷ lệ, không thu nhỏ

    // Tính số trang cần thiết dựa trên chiều cao thực tế (không thu nhỏ)
    const totalPages = Math.ceil(scaledHeight / availableHeight);

    // Tính toán vị trí ngắt trang đã điều chỉnh
    // availableHeightPx: chiều cao một trang trong canvas (đã scale)
    const availableHeightPx = (availableHeight / widthRatio) * pixelsPerMm * scale;
    
    // Tạo danh sách các phần tử force-new-page với cả top và bottom để tránh cắt
    const forceNewPageElements: Array<{ top: number; bottom: number }> = [];
    elementPositions.forEach((elem) => {
      if (elem.forceNewPage) {
        forceNewPageElements.push({
          top: elem.top * scale,
          bottom: elem.bottom * scale,
        });
      }
    });
    
    // Helper function: Kiểm tra xem một điểm có nằm trong phần tử force-new-page nào không
    // Hoặc nằm trước phần tử force-new-page (cần ngắt trước phần tử đó)
    const isInForceNewPage = (y: number): { inRange: boolean; forceTop?: number } => {
      for (const forceElem of forceNewPageElements) {
        // Nếu y nằm trong khoảng [top, bottom) của phần tử force-new-page
        if (y >= forceElem.top && y < forceElem.bottom) {
          return { inRange: true, forceTop: forceElem.top };
        }
        // Nếu y nằm rất gần top (trong vòng 50px trước top), cũng cần ngắt tại top
        // Điều này đảm bảo phần tử force-new-page không bị cắt
        if (y < forceElem.top && y > forceElem.top - 50 * scale) {
          return { inRange: true, forceTop: forceElem.top };
        }
      }
      return { inRange: false };
    };
    
    // Helper function: Kiểm tra xem có phần tử force-new-page nào nằm trong khoảng không
    const findForceNewPageInRange = (startY: number, endY: number): number | null => {
      for (const forceElem of forceNewPageElements) {
        // Nếu top của force-new-page nằm trong khoảng [startY, endY]
        if (forceElem.top >= startY && forceElem.top <= endY) {
          return forceElem.top;
        }
        // Nếu khoảng [startY, endY] cắt qua phần tử force-new-page
        if (startY < forceElem.bottom && endY > forceElem.top) {
          return forceElem.top;
        }
      }
      return null;
    };
    
    // Helper function: Kiểm tra xem đã có điểm ngắt gần vị trí này chưa
    const hasNearbyBreak = (breaks: number[], y: number, tolerance: number = 5 * scale): boolean => {
      for (const existingBreak of breaks) {
        if (Math.abs(existingBreak - y) < tolerance) {
          return true;
        }
      }
      return false;
    };
    
    const pageBreaks: number[] = [0]; // Bắt đầu từ 0
    
    // Tính toán từng điểm ngắt
    for (let page = 1; page < totalPages; page++) {
      let idealBreakY = page * availableHeightPx;
      const lastBreak = pageBreaks[pageBreaks.length - 1];
      
      // BƯỚC 1: Kiểm tra xem có phần tử force-new-page nào trong khoảng từ lastBreak đến idealBreakY không
      const forceTopInRange = findForceNewPageInRange(lastBreak, idealBreakY);
      if (forceTopInRange !== null) {
        // Có phần tử force-new-page trong khoảng này, đặt điểm ngắt tại top của nó
        if (forceTopInRange > lastBreak && !hasNearbyBreak(pageBreaks, forceTopInRange)) {
          pageBreaks.push(forceTopInRange);
        }
        continue; // Đã xử lý, bỏ qua logic thông thường
      }
      
      // BƯỚC 1b: Kiểm tra xem idealBreakY có nằm trong hoặc gần phần tử force-new-page không
      const forceNewPageCheck = isInForceNewPage(idealBreakY);
      if (forceNewPageCheck.inRange && forceNewPageCheck.forceTop !== undefined) {
        // Nếu nằm trong phần tử force-new-page, đặt điểm ngắt tại top của phần tử đó
        const forceTop = forceNewPageCheck.forceTop;
        if (forceTop > lastBreak && !hasNearbyBreak(pageBreaks, forceTop)) {
          pageBreaks.push(forceTop);
        }
        continue; // Đã xử lý, bỏ qua logic thông thường
      }
      
      // BƯỚC 2: Tìm phần tử avoid-break bị cắt tại idealBreakY
      let adjustedBreakY = idealBreakY;
      let foundIntersection = false;
      
      for (const elem of elementPositions) {
        // Bỏ qua phần tử force-new-page (đã xử lý ở trên)
        if (elem.forceNewPage) continue;
        
        const elemTopScaled = elem.top * scale;
        const elemBottomScaled = elem.bottom * scale;
        
        // Kiểm tra xem phần tử có bị cắt không
        if (elemTopScaled < idealBreakY && elemBottomScaled > idealBreakY) {
          // Kiểm tra xem có phần tử force-new-page nào nằm giữa lastBreak và elemTopScaled không
          let hasForceNewPageBefore = false;
          for (const forceElem of forceNewPageElements) {
            if (forceElem.top > lastBreak && forceElem.top <= elemTopScaled) {
              // Có phần tử force-new-page ở giữa, ưu tiên nó
              adjustedBreakY = forceElem.top;
              hasForceNewPageBefore = true;
              foundIntersection = true;
              break;
            }
          }
          
          if (!hasForceNewPageBefore) {
            // Đặt điểm ngắt ở đầu phần tử (top)
            adjustedBreakY = elemTopScaled;
            foundIntersection = true;
          }
          
          break; // Dừng lại ở phần tử đầu tiên bị cắt
        }
      }
      
      // BƯỚC 3: Kiểm tra lại adjustedBreakY có nằm trong phần tử force-new-page không
      if (foundIntersection) {
        const forceCheck = isInForceNewPage(adjustedBreakY);
        if (forceCheck.inRange && forceCheck.forceTop !== undefined) {
          adjustedBreakY = forceCheck.forceTop;
        }
      }
      
      // BƯỚC 4: Đảm bảo điểm ngắt hợp lệ
      const minGap = 20 * scale; // Khoảng cách tối thiểu 20px
      
      if (adjustedBreakY <= lastBreak) {
        adjustedBreakY = idealBreakY;
      } else if (adjustedBreakY - lastBreak < minGap && !foundIntersection) {
        adjustedBreakY = lastBreak + minGap;
      }
      
      // Kiểm tra lại lần cuối xem có nằm trong force-new-page không
      const finalCheck = isInForceNewPage(adjustedBreakY);
      if (finalCheck.inRange && finalCheck.forceTop !== undefined) {
        adjustedBreakY = finalCheck.forceTop;
      }
      
      // Đảm bảo không vượt quá chiều cao canvas
      if (adjustedBreakY >= imgHeight) {
        break;
      }
      
      // Thêm điểm ngắt nếu hợp lệ và chưa có
      if (adjustedBreakY > lastBreak && !hasNearbyBreak(pageBreaks, adjustedBreakY)) {
        pageBreaks.push(adjustedBreakY);
      }
    }
    
    // BƯỚC 5: Đảm bảo TẤT CẢ các phần tử force-new-page đều có điểm ngắt tại top
    // Và kiểm tra xem phần tử có vừa trong trang không, nếu không thì ngắt trang trước đó
    for (const forceElem of forceNewPageElements) {
      if (forceElem.top >= imgHeight) continue;
      
      if (!hasNearbyBreak(pageBreaks, forceElem.top, 10 * scale)) {
        // Tìm vị trí chèn phù hợp
        let insertIndex = pageBreaks.length;
        for (let i = 0; i < pageBreaks.length; i++) {
          if (forceElem.top < pageBreaks[i]) {
            insertIndex = i;
            break;
          }
        }
        
        // Kiểm tra xem phần tử có vừa trong trang sau điểm ngắt này không
        // Nếu không vừa, cần đảm bảo điểm ngắt trước đó đủ xa
        if (insertIndex > 0) {
          const prevBreak = pageBreaks[insertIndex - 1];
          const spaceAfterPrevBreak = forceElem.top - prevBreak;
          const elementHeight = forceElem.bottom - forceElem.top;
          
          // Nếu phần tử không vừa trong không gian còn lại, đảm bảo có điểm ngắt tại top
          if (spaceAfterPrevBreak + elementHeight > availableHeightPx * 1.1) {
            // Phần tử không vừa, cần ngắt tại top của nó
            pageBreaks.splice(insertIndex, 0, forceElem.top);
          }
        } else {
          // Không có điểm ngắt trước, thêm vào đầu (sau 0)
          pageBreaks.splice(insertIndex, 0, forceElem.top);
        }
      } else {
        // Đã có điểm ngắt gần, nhưng cần đảm bảo nó chính xác tại top
        // Tìm điểm ngắt gần nhất
        let nearestBreakIndex = -1;
        let minDistance = Infinity;
        for (let i = 0; i < pageBreaks.length; i++) {
          const distance = Math.abs(pageBreaks[i] - forceElem.top);
          if (distance < minDistance && distance < 10 * scale) {
            minDistance = distance;
            nearestBreakIndex = i;
          }
        }
        
        // Nếu tìm thấy điểm ngắt gần, điều chỉnh nó về đúng vị trí top
        if (nearestBreakIndex >= 0 && minDistance > 2 * scale) {
          pageBreaks[nearestBreakIndex] = forceElem.top;
        }
      }
    }
    
    // Sắp xếp lại và loại bỏ trùng lặp
    pageBreaks.sort((a, b) => a - b);
    
    // Loại bỏ các điểm ngắt trùng lặp và đảm bảo không có điểm nào nằm trong phần tử force-new-page
    const finalPageBreaks: number[] = [];
    for (const breakY of pageBreaks) {
      if (breakY >= imgHeight) continue;
      
      const check = isInForceNewPage(breakY);
      if (check.inRange && check.forceTop !== undefined) {
        // Điểm ngắt nằm trong phần tử force-new-page, thay thế bằng top
        if (!hasNearbyBreak(finalPageBreaks, check.forceTop, 5 * scale)) {
          finalPageBreaks.push(check.forceTop);
        }
      } else {
        // Điểm ngắt bình thường
        if (finalPageBreaks.length === 0 || breakY > finalPageBreaks[finalPageBreaks.length - 1]) {
          if (!hasNearbyBreak(finalPageBreaks, breakY, 5 * scale)) {
            finalPageBreaks.push(breakY);
          }
        }
      }
    }
    
    // Gán lại pageBreaks
    pageBreaks.length = 0;
    pageBreaks.push(...finalPageBreaks);
    
    // Đảm bảo điểm cuối cùng là imgHeight
    if (pageBreaks[pageBreaks.length - 1] < imgHeight) {
      pageBreaks.push(imgHeight);
    }

    // Thêm từng trang với vị trí ngắt đã điều chỉnh
    for (let page = 0; page < pageBreaks.length - 1; page++) {
      if (page > 0) {
        pdf.addPage();
      }

      // Tính vị trí và chiều cao trong canvas gốc (đã scale)
      const sourceY = pageBreaks[page];
      const sourceEndY = pageBreaks[page + 1];
      const sourceHeight = sourceEndY - sourceY;

      // Tạo canvas mới cho phần này với cùng scale
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = imgWidth;
      pageCanvas.height = Math.ceil(sourceHeight);
      const pageCtx = pageCanvas.getContext("2d");

      if (pageCtx) {
        // Tắt image smoothing để text và đường thẳng sắc nét hơn (không bị blur)
        pageCtx.imageSmoothingEnabled = false;
        
        // Vẽ phần canvas tương ứng vào canvas mới
        pageCtx.drawImage(
          canvas,
          0,
          sourceY, // Source position (x, y) trong canvas gốc
          imgWidth,
          sourceHeight, // Source size
          0,
          0, // Destination position
          imgWidth,
          sourceHeight // Destination size
        );

        // Dùng JPEG với quality 0.85 để giảm dung lượng file (giảm ~70-80%)
        // Vẫn giữ chất lượng tốt với scale 3
        const pageImgData = pageCanvas.toDataURL("image/jpeg", 0.7);
        // Chiều cao trong mm của phần này
        const pageImgHeightMm =
          (sourceHeight / (scale * pixelsPerMm)) * widthRatio;

        pdf.addImage(
          pageImgData,
          "JPEG", // Đổi từ PNG sang JPEG để giảm dung lượng
          5, // Margin left 5mm - giống pdfExport.ts
          5, // Margin top 5mm - giống pdfExport.ts
          scaledWidth,
          pageImgHeightMm
        );

        // Cleanup memory: Xóa pageCanvas sau khi đã add vào PDF
        if (pageCtx) {
          pageCtx.clearRect(0, 0, pageCanvas.width, pageCanvas.height);
        }
        pageCanvas.width = 0;
        pageCanvas.height = 0;
      }
    }

    const blob = pdf.output("blob");

    // Cleanup memory: Xóa canvas và tempDiv để giải phóng memory
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      canvas.width = 0;
      canvas.height = 0;
    }

    // Dọn dẹp tempDiv
    if (document.body.contains(tempDiv)) {
      document.body.removeChild(tempDiv);
    }
    
    // Force garbage collection nếu có thể (chỉ trong development)
    if (window.gc) {
      window.gc();
    }

    return blob;
  } catch (error) {
    console.error("Error generating PDF:", error);
    // Dọn dẹp nếu có lỗi
    if (document.body.contains(tempDiv)) {
      document.body.removeChild(tempDiv);
    }
    throw error;
  }
}

/**
 * Convert API response thành format cho template
 */
export function convertReportDataToTemplate(
  response: AssessmentReportResponse,
  programName: string,
  assessmentName: string
): AssessmentReportData {
  const { data } = response;

  // Lấy subject_name từ student đầu tiên
  const firstStudent = data.students[0];
  const subjectName = firstStudent?.assessment?.subject_name || "";
  const assessmentType = firstStudent?.assessment?.type || "";
  // Lấy program_name từ info nếu có, nếu không thì dùng programName từ parameter
  const programNameFromInfo = data.info.program_name || programName;

  return {
    schoolName: data.info.school_name,
    className: data.info.class_name,
    programName: programNameFromInfo,
    subjectName: subjectName,
    academicYear: `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`,
    assessmentName: assessmentName,
    assessmentType: assessmentType,
    students: data.students.map((student) => ({
      student_id: student.student_id,
      student_name: student.student_name,
      total_score: student.total_score,
      criteria: (student.assessment.criteria || []).map((criterion: any) => ({
        id: String(criterion.id),
        name: criterion.name,
        max_score: criterion.max_score,
        score: criterion.score,
        has_subcriteria: criterion.has_subcriteria || false,
        subcriteria: criterion.subcriteria
          ? criterion.subcriteria.map((sub: any) => ({
              id: String(sub.id),
              name: sub.name,
              max_score: sub.max_score,
              score: sub.score,
            }))
          : undefined,
      })),
    })),
    statistic: data.statistic,
  };
}

/**
 * Tạo tên file an toàn (loại bỏ ký tự đặc biệt)
 */
export function sanitizeFileName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}
