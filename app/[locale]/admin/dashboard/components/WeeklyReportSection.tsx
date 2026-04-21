"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Users,
    GraduationCap,
    UserCheck,
    Calendar,
    Download,
    School,
    TrendingUp
} from "lucide-react";
import { useState, useEffect } from "react";
import axiosInstance from "@/lib/api/axios";
// Import dynamic để tránh SSR issues
import dynamic from "next/dynamic";
import { exportWeeklyReport } from "@/lib/api/export-import";

interface ReportData {
    total_schools: string | number;
    total_classes: string | number;
    total_users: string | number;
    student_active: string | number;
    teacher_active: string | number;
    student_active_weekly: string | number;
    teacher_active_weekly: string | number;
    frequent_login_students: string | number;
    frequent_login_students_weekly: string | number;
}

export default function WeeklyReportSection() {
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Helper function để convert string sang number
    const toNumber = (value: string | number): number => {
        if (typeof value === 'number') return value;
        return parseInt(value) || 0;
    };

    useEffect(() => {
        const fetchReportData = async () => {
            try {
                setLoading(true);
                const response = await axiosInstance.get("/dashboard/report");
                console.log("API Response:", response.data);
                // API trả về cấu trúc: { data: { data: { actual_data } } }
                setReportData(response.data.data.data);
            } catch (error: any) {
                setError("Không thể tải dữ liệu báo cáo");
                console.error("Error fetching report data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReportData();
    }, []);

    // Function để load thư viện từ CDN
    const loadScript = (src: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load ${src}`));
            document.head.appendChild(script);
        });
    };

    const exportReport = async () => {
        console.log("Export report called", reportData);
        if (!reportData) {
            console.log("No report data available");
            setError("Không có dữ liệu báo cáo để xuất");
            return;
        }

        try {
            console.log("Loading PDF libraries from CDN...");

            // Load thư viện từ CDN
            await Promise.all([
                loadScript('https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js'),
                loadScript('https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js')
            ]);

            console.log("Libraries loaded:", {
                jspdf: typeof (window as any).jspdf,
                jsPDF: typeof (window as any).jsPDF,
                html2canvas: typeof (window as any).html2canvas
            });

            console.log("Generating PDF...");

            // Tạo temporary div để render HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = generateReportHTML(reportData);
            tempDiv.style.position = 'absolute';
            tempDiv.style.left = '-9999px';
            tempDiv.style.width = '210mm'; // A4 width
            document.body.appendChild(tempDiv);

            // Sử dụng html2canvas từ global scope
            const canvas = await (window as any).html2canvas(tempDiv, {
                scale: 2, // Tăng chất lượng
                useCORS: true,
                allowTaint: true,
                width: 794, // A4 width in px (210mm)
                height: 1123 // A4 height in px (297mm)
            });

            // Tạo PDF từ canvas - sử dụng jsPDF từ global scope
            let jsPDF = (window as any).jspdf?.jsPDF || (window as any).jsPDF;

            // Fallback: thử các cách khác để access jsPDF
            if (!jsPDF) {
                jsPDF = (window as any).window?.jsPDF || (window as any).jspdf;
            }

            if (!jsPDF) {
                console.error('Available window properties:', Object.keys(window));
                throw new Error('jsPDF constructor not found');
            }

            console.log('Using jsPDF:', typeof jsPDF);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgData = canvas.toDataURL('image/png');

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            const imgX = (pdfWidth - imgWidth * ratio) / 2;
            const imgY = 0;

            pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

            // Download PDF
            pdf.save(`bao-cao-hang-tuan-${new Date().toLocaleDateString('vi-VN')}.pdf`);

            // Cleanup
            document.body.removeChild(tempDiv);
            console.log("PDF exported successfully");
        } catch (err) {
            console.error("Export error:", err);
            setError(`Không thể xuất báo cáo: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    }; const generateReportHTML = (data: ReportData) => {
        const today = new Date().toLocaleDateString('vi-VN');

        return `
        <!DOCTYPE html>
        <html lang="vi">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Báo cáo tổng quan hàng tuần</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 20px; 
                    background: #f5f5f5;
                }
                .report-container {
                    max-width: 800px;
                    margin: 0 auto;
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }
                .header {
                    text-align: center;
                    border-bottom: 3px solid #2563EB;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .header h1 {
                    color: #2563EB;
                    margin: 0;
                    font-size: 24px;
                }
                .header p {
                    color: #666;
                    margin: 10px 0 0 0;
                }
                .metrics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }
                .metric-card {
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 20px;
                    background: #f9fafb;
                }
                .metric-title {
                    font-weight: bold;
                    color: #374151;
                    margin-bottom: 10px;
                }
                .metric-value {
                    font-size: 28px;
                    font-weight: bold;
                    color: #2563EB;
                    margin-bottom: 5px;
                }
                .metric-description {
                    color: #6b7280;
                    font-size: 14px;
                    line-height: 1.4;
                }
                .summary-section {
                    background: #f3f4f6;
                    padding: 20px;
                    border-radius: 8px;
                    margin-top: 30px;
                }
                .summary-title {
                    font-size: 18px;
                    font-weight: bold;
                    color: #374151;
                    margin-bottom: 15px;
                }
                .summary-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                }
                .summary-item {
                    text-align: center;
                    background: white;
                    padding: 15px;
                    border-radius: 6px;
                }
                .summary-value {
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 5px;
                }
                .blue { color: #2563EB; }
                .green { color: #059669; }
                .orange { color: #EA580C; }
                .footer {
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #e5e7eb;
                    text-align: center;
                    color: #6b7280;
                    font-size: 14px;
                }
            </style>
        </head>
        <body>
            <div class="report-container">
                <div class="header">
                    <h1>BÁO CÁO TỔNG QUAN HÀNG TUẦN</h1>
                    <p>Theo dõi số lượng và tần xuất sử dụng LMS 2025</p>
                    <p>Ngày xuất báo cáo: ${today}</p>
                </div>

                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-title">Tổng trường & lớp</div>
                        <div class="metric-value">${data.total_schools || '--'} trường, ${data.total_classes || '--'} lớp</div>
                        <div class="metric-description">Tổng số trường và lớp trong hệ thống</div>
                    </div>

                    <div class="metric-card">
                        <div class="metric-title">Tổng người dùng</div>
                        <div class="metric-value">${data.total_users ? data.total_users.toLocaleString() : '--'}</div>
                        <div class="metric-description">Tổng số người dùng đã đăng ký</div>
                    </div>

                    <div class="metric-card">
                        <div class="metric-title">Học sinh active (từ 15/09)</div>
                        <div class="metric-value">${data.student_active ? data.student_active.toLocaleString() : '--'}</div>
                        <div class="metric-description">Học sinh hoạt động từ ngày 15/09/2025</div>
                    </div>

                    <div class="metric-card">
                        <div class="metric-title">Giáo viên active (từ 08/09)</div>
                        <div class="metric-value">${data.teacher_active ? data.teacher_active.toLocaleString() : '--'}</div>
                        <div class="metric-description">Giáo viên hoạt động từ ngày 08/09/2025</div>
                    </div>

                    <div class="metric-card">
                        <div class="metric-title">Học sinh active tuần gần nhất</div>
                        <div class="metric-value">${data.student_active_weekly ? data.student_active_weekly.toLocaleString() : '--'}</div>
                        <div class="metric-description">Học sinh hoạt động trong tuần vừa qua</div>
                    </div>

                    <div class="metric-card">
                        <div class="metric-title">Giáo viên active tuần gần nhất</div>
                        <div class="metric-value">${data.teacher_active_weekly ? data.teacher_active_weekly.toLocaleString() : '--'}</div>
                        <div class="metric-description">Giáo viên hoạt động trong tuần vừa qua</div>
                    </div>

                    <div class="metric-card">
                        <div class="metric-title">HS đăng nhập ≥2 lần (từ 15/09)</div>
                        <div class="metric-value">${data.frequent_login_students ? data.frequent_login_students.toLocaleString() : '--'}</div>
                        <div class="metric-description">Học sinh đăng nhập ít nhất 2 lần từ 15/09/2025</div>
                    </div>

                    <div class="metric-card">
                        <div class="metric-title">HS đăng nhập ≥2 lần tuần gần nhất</div>
                        <div class="metric-value">${data.frequent_login_students_weekly ? data.frequent_login_students_weekly.toLocaleString() : '--'}</div>
                        <div class="metric-description">Học sinh đăng nhập ít nhất 2 lần trong tuần vừa qua</div>
                    </div>
                </div>

                <div class="summary-section">
                    <div class="summary-title">Tóm tắt chỉ số quan trọng</div>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <div class="summary-value blue">${data.student_active_weekly && data.student_active ? Math.round((parseInt(data.student_active_weekly.toString()) / parseInt(data.student_active.toString())) * 100) + '%' : '--'}</div>
                            <div>Tỷ lệ HS active tuần/tổng active</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-value green">${data.teacher_active_weekly && data.teacher_active ? Math.round((parseInt(data.teacher_active_weekly.toString()) / parseInt(data.teacher_active.toString())) * 100) + '%' : '--'}</div>
                            <div>Tỷ lệ GV active tuần/tổng active</div>
                        </div>
                        <div class="summary-item">
                            <div class="summary-value orange">${data.frequent_login_students && data.student_active ? Math.round((parseInt(data.frequent_login_students.toString()) / parseInt(data.student_active.toString())) * 100) + '%' : '--'}</div>
                            <div>Tỷ lệ HS đăng nhập thường xuyên</div>
                        </div>
                    </div>
                </div>

                <div class="footer">
                    <p>Báo cáo được tạo tự động bởi hệ thống LMS Enspire</p>
                    <p>© ${new Date().getFullYear()} Enspire Digital. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    };
    // 
    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Báo cáo tổng quan hàng tuần
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Báo cáo tổng quan hàng tuần
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-red-600">{error}</div>
                </CardContent>
            </Card>
        );
    }

    const reportItems = [
        {
            title: "Tổng trường & lớp",
            value: `${reportData?.total_schools ? reportData.total_schools : '--'} trường, ${reportData?.total_classes ? reportData.total_classes : '--'} lớp`,
            icon: School,
            color: "bg-blue-100 text-blue-700",
            description: "Tổng số trường và lớp trong hệ thống"
        },
        {
            title: "Tổng người dùng",
            value: reportData?.total_users ? toNumber(reportData.total_users).toLocaleString() : "--",
            icon: Users,
            color: "bg-gray-100 text-gray-700",
            description: "Tổng số người dùng đã đăng ký"
        },
        {
            title: "Học sinh active (từ 15/09)",
            value: reportData?.student_active ? toNumber(reportData.student_active).toLocaleString() : "--",
            icon: GraduationCap,
            color: "bg-green-100 text-green-700",
            description: "Học sinh hoạt động từ ngày 15/09/2025"
        },
        {
            title: "Giáo viên active (từ 08/09)",
            value: reportData?.teacher_active ? toNumber(reportData.teacher_active).toLocaleString() : "--",
            icon: UserCheck,
            color: "bg-purple-100 text-purple-700",
            description: "Giáo viên hoạt động từ ngày 08/09/2025"
        },
        {
            title: "Học sinh active tuần gần nhất",
            value: reportData?.student_active_weekly ? toNumber(reportData.student_active_weekly).toLocaleString() : "--",
            icon: GraduationCap,
            color: "bg-emerald-100 text-emerald-700",
            description: "Học sinh hoạt động trong tuần vừa qua"
        },
        {
            title: "Giáo viên active tuần gần nhất",
            value: reportData?.teacher_active_weekly ? toNumber(reportData.teacher_active_weekly).toLocaleString() : "--",
            icon: UserCheck,
            color: "bg-indigo-100 text-indigo-700",
            description: "Giáo viên hoạt động trong tuần vừa qua"
        },
        {
            title: "HS đăng nhập ≥2 lần (từ 15/09)",
            value: reportData?.frequent_login_students ? toNumber(reportData.frequent_login_students).toLocaleString() : "--",
            icon: Calendar,
            color: "bg-orange-100 text-orange-700",
            description: "Học sinh đăng nhập ít nhất 2 lần từ 15/09/2025"
        },
        {
            title: "HS đăng nhập ≥2 lần tuần gần nhất",
            value: reportData?.frequent_login_students_weekly ? toNumber(reportData.frequent_login_students_weekly).toLocaleString() : "--",
            icon: Calendar,
            color: "bg-red-100 text-red-700",
            description: "Học sinh đăng nhập ít nhất 2 lần trong tuần vừa qua"
        }
    ];

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Báo cáo tổng quan hàng tuần
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                            Theo dõi số lượng và tần xuất sử dụng LMS 2025
                        </p>
                    </div>
                    <Button onClick={exportReport} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Xuất báo cáo
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {reportItems.map((item, index) => {
                        const IconComponent = item.icon;
                        return (
                            <div
                                key={index}
                                className="p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className={`p-2 rounded-lg ${item.color}`}>
                                        <IconComponent className="h-5 w-5" />
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                        {index < 2 ? "Tổng quan" : index < 4 ? "Active từ tháng 9" : index < 6 ? "Tuần gần nhất" : "Đăng nhập thường xuyên"}
                                    </Badge>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-semibold text-lg">{item.value}</h3>
                                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                                    <p className="text-xs text-gray-500 leading-tight">{item.description}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Summary metrics */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Tóm tắt chỉ số quan trọng</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                                {reportData && toNumber(reportData.student_active_weekly) && toNumber(reportData.student_active)
                                    ? Math.round((toNumber(reportData.student_active_weekly) / toNumber(reportData.student_active)) * 100) + '%'
                                    : '--'}
                            </div>
                            <div className="text-sm text-gray-600">Tỷ lệ HS active tuần/tổng active</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {reportData && toNumber(reportData.teacher_active_weekly) && toNumber(reportData.teacher_active)
                                    ? Math.round((toNumber(reportData.teacher_active_weekly) / toNumber(reportData.teacher_active)) * 100) + '%'
                                    : '--'}
                            </div>
                            <div className="text-sm text-gray-600">Tỷ lệ GV active tuần/tổng active</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">
                                {reportData && toNumber(reportData.frequent_login_students) && toNumber(reportData.student_active)
                                    ? Math.round((toNumber(reportData.frequent_login_students) / toNumber(reportData.student_active)) * 100) + '%'
                                    : '--'}
                            </div>
                            <div className="text-sm text-gray-600">Tỷ lệ HS đăng nhập thường xuyên</div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}