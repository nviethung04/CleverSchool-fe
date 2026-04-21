// Utility để tạo HTML preview cho PDF export
import { GetUserListAdvanced } from '@/lib/api/users';

// Hàm sắp xếp danh sách học sinh theo alphabet của tên cuối cùng
function sortUsersByLastName(users: any[]): any[] {
  return users.slice().sort((a, b) => {
    const getLastName = (name: string) => {
      if (!name) return '';
      const parts = name.trim().split(/\s+/);
      return parts[parts.length - 1];
    };
    const nameA = getLastName(a.name || a.full_name || '');
    const nameB = getLastName(b.name || b.full_name || '');
    // Sử dụng localeCompare với chuẩn tiếng Việt
    return nameA.localeCompare(nameB, 'vi', { sensitivity: 'base' });
  });
}

// Tạo HTML template với giao diện y hệt PDF
export function createPDFPreviewHTML(users: any[], params: {
  school_id?: number | string;
  class_id?: number | string;
  role_id?: number;
}): string {
  let schoolClassInfo = "Tất cả";
  if (params.school_id && params.class_id && users.length > 0) {
    const firstUser = users[0];
    const schoolName = firstUser?.user_info?.school?.name || `School ID: ${params.school_id}`;
    const className = firstUser?.user_info?.class?.name || `Class ID: ${params.class_id}`;
    schoolClassInfo = `${schoolName} — ${className}`;
  } else if (params.school_id && users.length > 0) {
    const firstUser = users[0];
    const schoolName = firstUser?.user_info?.school?.name || `School ID: ${params.school_id}`;
    schoolClassInfo = schoolName;
  }

  // Sắp xếp users trước khi render
  const sortedUsers = sortUsersByLastName(users);

  const userRows = sortedUsers.map((user: any, index: number) => {
    const userName = user.name || "N/A";
    const userAccount = user.code || user.identifier || user.username || "N/A";
    
    return `
      <tr style="${index % 2 === 1 ? 'background-color: #f9f9f9;' : 'background-color: white;'}">
        <td style="border: 1px solid #ccc; padding: 8px; text-align: center; font-size: 12px;">${index + 1}</td>
        <td style="border: 1px solid #ccc; padding: 8px; font-size: 12px;">${userName}</td>
        <td style="border: 1px solid #ccc; padding: 8px; text-align: center; font-size: 12px;">${userAccount}</td>
      </tr>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview - Danh sách tài khoản</title>
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
      /* Đổi thành .pdf-body để tránh ảnh hưởng layout trang chính */
    }
    .pdf-body {
      font-family: 'BeVietnamPro', Arial, sans-serif;
      background: white;
      color: black;
      padding: 40px;
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
      padding: 20px;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      gap: 18px;
    }
    
    .logo {
      color: #007bbf;
      font-size: 18px;
      font-weight: bold;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .header-titles {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      margin-left: 0;
      gap: 2px;
    }
    
    .main-title {
      color: #007bbf;
      font-size: 16px;
      font-family: 'BeVietnamPro', Arial, sans-serif;
      font-weight: 500;
      margin-bottom: 2px;
      line-height: 1.2;
    }
    
    .subtitle {
      font-family: 'BeVietnamPro', Arial, sans-serif;
      font-weight: 400;
      font-size: 13px;
      margin-bottom: 0;
      color: #333;
      line-height: 1.2;
    }
    
    .school-info-small {
      font-size: 12px;
      font-family: 'BeVietnamPro', Arial, sans-serif;
      font-weight: 400;
      color: #555;
      margin-bottom: 0;
      line-height: 1.2;
    }
    
    .contact {
      text-align: right;
      font-size: 12px;
      line-height: 1.4;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
      min-width: 140px;
    }
    
    .hotline-label {
      text-align: center;
      width: 100%;
      font-size: 12px;
      color: #007bbf;
      font-weight: 700;
      margin-top: 2px;
      letter-spacing: 1px;
    }
    .title-section {
      display: block;
      text-align: center;
      margin-bottom: 12px;
    }
    .school-info {
      font-size: 13px;
      font-weight: 500;
      color: #007bbf;
      margin-bottom: 0;
      line-height: 1.2;
    }
    
    .table-header {
      color: orange;
      padding: 12px;
      text-align: center;
      font-size: 22px;
      font-family: 'BeVietnamPro', Arial, sans-serif;
      font-weight: 600;
      margin-bottom: 0;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(255,165,0,0.08);
    }
    
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 0;
    }
    
    .data-table tr {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    
    .data-table th {
      background:rgb(255, 205, 69);
      color: white;
      padding: 12px 8px;
      text-align: center;
      font-family: 'BeVietnamPro', Arial, sans-serif;
      font-weight: 500;
      border: 1px solid #bbb;
      font-size: 12px;
      text-shadow: 0 1px 2px rgba(0,0,0,0.18), 0 0px 1px rgba(0,0,0,0.12);
    }
    
    .data-table td {
      font-family: 'BeVietnamPro', Arial, sans-serif;
      font-weight: 400;
      padding: 8px;
      border: 1px solid #ccc;
      vertical-align: middle;
      font-size: 12px;
      color:  #007bbf;
    }
    
    .preview-controls {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      background: rgba(0,0,0,0.8);
      padding: 15px;
      border-radius: 8px;
    }
    
    .preview-button {
      background: #007bbf;
      color: white;
      border: none;
      padding: 10px 20px;
      margin: 5px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    
    .preview-button:hover {
      background: #005a8b;
    }
    
    .print-button {
      background: #28a745;
    }
    
    .print-button:hover {
      background: #1e7e34;
    }
    
    .hotline-container {
      display: inline-block;
      background: linear-gradient(90deg, #007bbf 0%, #00c6ff 100%);
      color: #fff;
      border-radius: 20px;
      padding: 4px 16px;
      font-family: 'BeVietnamPro', Arial, sans-serif;
      font-weight: 500;
      font-size: 13px;
      margin-bottom: 4px;
      box-shadow: 0 2px 8px rgba(0,123,191,0.08);
      letter-spacing: 1px;
    }
    .hotline-number {
      font-family: 'BeVietnamPro', Arial, sans-serif;
      font-weight: 600;
    }
    
    @media print {
      body {
        box-shadow: none;
        padding: 0;
      }
      .preview-controls {
        display: none;
      }
    }
    
    @page {
      size: A4;
      margin: 20mm;
    }
  </style>
</head>
<body class="pdf-body">
  <div class="pdf-container">
    <div class="header">
      <div class="logo">
        <!-- Sử dụng ảnh PNG/JPG từ public để đảm bảo html2pdf.js render được -->
        <img src="/logo.png" alt="enspire logo" style="height:32px; width:auto; display:inline-block; vertical-align:middle;" />
        <div class="header-titles">
          <span class="main-title">Thông tin đăng nhập hệ thống LMS</span>
          <span class="subtitle">Danh sách tài khoản</span>
        </div>
      </div>
      <div class="contact">
        <div class="hotline-container">
          <span class="hotline-number">0934609998</span>
        </div>
        <div class="hotline-label">HOTLINE HỖ TRỢ</div>
      </div>
    </div>
    
    <div class="table-header">TÀI KHOẢN & MẬT KHẨU</div>
    <div class="title-section">
      <div class="school-info">${schoolClassInfo}</div>
    </div>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 60px;">STT</th>
          <th style="width: 200px;">Họ và tên</th>
          <th style="width: 150px;">Tài khoản / Mật khẩu</th>
        </tr>
      </thead>
      <tbody>
        ${userRows}
      </tbody>
    </table>
  </div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
  <script>
    function exportPDFFile() {
      const pdfContent = document.querySelector('.pdf-container');
      const opt = {
        margin:       0,
        filename:     'danh_sach_tai_khoan.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      html2pdf().set(opt).from(pdfContent).save();
    }
    
    function convertToPDF() {
      alert('Chức năng convert PDF sẽ được implement sau!');
      // Sẽ gọi API để convert HTML này thành PDF
    }
    
    // Auto focus để sẵn sàng in
    window.onload = function() {
      console.log('PDF Preview loaded successfully');
    };
  </script>
</body>
</html>
  `;
}

// Hàm tạo và mở HTML preview
export async function openPDFPreview(params: {
  school_id?: number | string;
  class_id?: number | string;
  role_id?: number;
}) {
  try {
    console.log("📄 Creating PDF preview with params:", JSON.stringify(params, null, 2));

    // 1. Lấy dữ liệu người dùng
    const apiParams: any = {};
    if (params.role_id !== undefined) apiParams.role_id = params.role_id;
    if (params.school_id) apiParams.school_id = params.school_id;
    if (params.class_id) apiParams.class_id = params.class_id;

    const response = await GetUserListAdvanced(apiParams);
    const users = response.data?.users || [];

    if (users.length === 0) {
      throw new Error("Không có dữ liệu để tạo preview");
    }

    console.log(`📊 Found ${users.length} users for preview`);

    // 2. Tạo HTML content
    const htmlContent = createPDFPreviewHTML(users, params);

    // 3. Tạo Blob từ HTML content
    const blob = new Blob([htmlContent], { type: 'text/html; charset=utf-8' });
    const url = URL.createObjectURL(blob);

    // 4. Mở popup với HTML preview
    const popup = window.open(url, '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes');
    
    if (!popup) {
      throw new Error("Không thể mở popup. Vui lòng cho phép popup trên trình duyệt.");
    }

    // 5. Clean up URL sau 5 giây
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 5000);

    console.log("✅ PDF preview opened successfully");
    return { success: true, popup };

  } catch (error: any) {
    console.error("❌ Error creating PDF preview:", error);
    throw new Error(error.message || "Không thể tạo PDF preview");
  }
}

function showLoadingOverlay(text = 'Đang xuất file PDF...') {
  let overlay = document.getElementById('pdf-export-loading');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'pdf-export-loading';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.background = 'rgba(0,0,0,0.35)';
    overlay.style.zIndex = '99999';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.flexDirection = 'column';
    overlay.innerHTML = `<div style="background: white; padding: 32px 48px; border-radius: 12px; box-shadow: 0 2px 16px rgba(0,0,0,0.18); font-size: 20px; color: #007bbf; font-weight: 700; text-align: center;">
      <span class="loader" style="display:block; margin-bottom:16px;">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="20" stroke="#007bbf" stroke-width="6" stroke-linecap="round" stroke-dasharray="80" stroke-dashoffset="60"><animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="1s" repeatCount="indefinite"/></circle></svg>
      </span>
      <span>${text}</span>
    </div>`;
    document.body.appendChild(overlay);
  } else {
    overlay.style.display = 'flex';
    const textSpan = overlay.querySelector('span:last-child');
    if (textSpan) textSpan.textContent = text;
  }
}
function hideLoadingOverlay() {
  const overlay = document.getElementById('pdf-export-loading');
  if (overlay) overlay.style.display = 'none';
}

function showResultMessage(message: string) {
  let msg = document.getElementById('pdf-export-result');
  if (!msg) {
    msg = document.createElement('div');
    msg.id = 'pdf-export-result';
    msg.style.position = 'fixed';
    msg.style.top = '50%';
    msg.style.left = '50%';
    msg.style.transform = 'translate(-50%, -50%)';
    msg.style.background = '#e6f7ff';
    msg.style.color = '#007bbf';
    msg.style.padding = '24px 40px';
    msg.style.borderRadius = '10px';
    msg.style.boxShadow = '0 2px 16px rgba(0,0,0,0.12)';
    msg.style.fontSize = '18px';
    msg.style.fontWeight = '600';
    msg.style.zIndex = '99999';
    msg.style.textAlign = 'center';
    msg.style.opacity = '0';
    msg.style.transition = 'opacity 0.2s';
    msg.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(msg);
    setTimeout(() => { if (msg) msg.style.opacity = '1'; }, 10);
  } else {
    msg.innerHTML = `<span>${message}</span>`;
    msg.style.display = 'block';
    msg.style.opacity = '1';
  }
  setTimeout(() => {
    if (msg) {
      msg.style.opacity = '0';
      setTimeout(() => { msg.style.display = 'none'; }, 250);
    }
  }, 2500);
}
// Hàm xuất PDF cho tất cả các lớp trong trường, tải về dưới dạng ZIP
export async function exportAllClassesPDF(params: {
  school_id: number | string;
  role_id?: number;
  school_name?: string;
}) {
  try {
    
    showLoadingOverlay();
    // 1. Lấy danh sách các lớp trong trường
    const { GetClassList } = await import('@/lib/api/classes');
    const classResponse = await GetClassList(params.school_id.toString());
    const classes = classResponse.data?.classes || [];
    
    if (classes.length === 0) {
      throw new Error("Không tìm thấy lớp nào trong trường này");
    }

    console.log(`📚 Found ${classes.length} classes to export`);

    // 2. Load JSZip library
    if (!(window as any).JSZip) {
      console.log("🔄 Đang tải thư viện JSZip...");
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
      document.head.appendChild(script);
      
      await new Promise((resolve, reject) => {
        script.onload = () => {
          console.log("✅ Thư viện JSZip đã được tải");
          resolve(true);
        };
        script.onerror = () => {
          console.error("❌ Không thể tải thư viện JSZip");
          reject(new Error("Không thể tải thư viện JSZip"));
        };
      });
    }

    // 3. Load html2pdf library nếu chưa có
    if (!(window as any).html2pdf) {
      console.log("🔄 Đang tải thư viện html2pdf...");
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      document.head.appendChild(script);
      
      await new Promise((resolve, reject) => {
        script.onload = () => {
          console.log("✅ Thư viện html2pdf đã được tải");
          resolve(true);
        };
        script.onerror = () => {
          console.error("❌ Không thể tải thư viện html2pdf");
          reject(new Error("Không thể tải thư viện html2pdf"));
        };
      });
    }

    // 4. Tạo ZIP file
    const zip = new (window as any).JSZip();
    const currentDate = new Date().toISOString().split('T')[0];
    
    // 5. Tạo PDF cho từng lớp
    for (let i = 0; i < classes.length; i++) {
      const classInfo = classes[i];
      
      try {
        // Lấy danh sách học sinh trong lớp
        const classParams: any = {
          role_id: params.role_id || 3,
          school_id: params.school_id,
          class_id: classInfo.id,
          per_page: 500
        };

        const response = await GetUserListAdvanced(classParams);
        // Sắp xếp danh sách học sinh theo tên cuối cùng
        const users = sortUsersByLastName(response.data?.users || []);

        if (users.length === 0) {
          console.log(`⚠️ Lớp ${classInfo.name} không có học sinh, bỏ qua`);
          continue;
        }

        // Tạo HTML content cho lớp này
        const htmlContent = createPDFPreviewHTML(users, {
          school_id: params.school_id,
          class_id: classInfo.id,
          role_id: params.role_id || 3
        });

        // Tạo container ẩn để render HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        tempDiv.style.position = 'fixed';
        tempDiv.style.left = '0';
        tempDiv.style.top = '0';
        tempDiv.style.width = '210mm';
        tempDiv.style.visibility = 'hidden';
        tempDiv.style.pointerEvents = 'none';
        tempDiv.style.zIndex = '-1';
        tempDiv.style.background = 'white';
        tempDiv.style.fontFamily = 'Roboto, Arial, sans-serif';
        document.body.appendChild(tempDiv);

        const pdfContainer = tempDiv.querySelector('.pdf-container');
        if (!pdfContainer) {
          throw new Error(`Không tìm thấy PDF container cho lớp ${classInfo.name}`);
        }

        // Đợi một chút để đảm bảo HTML được render
        await new Promise(resolve => setTimeout(resolve, 300));

        // Tạo PDF blob
        const pdfBlob = await (window as any).html2pdf()
          .set({
            margin: [5, 5, 5, 5],
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { 
              scale: 1.5,
              useCORS: true,
              allowTaint: true,
              scrollX: 0,
              scrollY: 0
            },
            jsPDF: { 
              unit: 'mm', 
              format: 'a4', 
              orientation: 'portrait' 
            }
          })
          .from(pdfContainer)
          .outputPdf('blob');

        // Thêm PDF vào ZIP với tên file có tên lớp
        const fileName = `${classInfo.name.replace(/[^a-zA-Z0-9]/g, '_')}_${currentDate}.pdf`;
        zip.file(fileName, pdfBlob);

        // Dọn dẹp container tạm
        if (document.body.contains(tempDiv)) {
          document.body.removeChild(tempDiv);
        }

        console.log(`✅ Đã tạo PDF cho lớp ${classInfo.name}`);

      } catch (classError: any) {
        console.error(`❌ Lỗi khi tạo PDF cho lớp ${classInfo.name}:`, classError);
        // Tiếp tục với lớp tiếp theo thay vì dừng lại
        continue;
      }
    }

    // 6. Tạo và tải về file ZIP
    console.log("🔄 Đang tạo file ZIP...");
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    
    // Tạo tên file ZIP
    const schoolName = params.school_name || `School_${params.school_id}`;
    const zipFileName = `${schoolName.replace(/[^a-zA-Z0-9]/g, '_')}_All_Classes_${currentDate}.zip`;
    
    // Tải về file ZIP
    const link = document.createElement('a');
    link.href = URL.createObjectURL(zipBlob);
    link.download = zipFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    setTimeout(() => {
      URL.revokeObjectURL(link.href);
    }, 1000);

    hideLoadingOverlay();
    return { 
      success: true, 
      message: `Đã xuất thành công PDF cho ${classes.length} lớp!`,
      fileName: zipFileName
    };

  } catch (error: any) {
    hideLoadingOverlay();
    showResultMessage(error.message || 'Không thể xuất PDF cho tất cả lớp');
    throw new Error(error.message || 'Không thể xuất PDF cho tất cả lớp');
  }
}


