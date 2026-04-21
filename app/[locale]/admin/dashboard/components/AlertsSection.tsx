import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
} from "recharts";
import {
  UserX,
  TrendingUp,
  ClipboardCheck,
  AlertTriangle,
  Eye,
  X as CloseIcon,
  Shield,
} from "lucide-react";
import AlertMetricCard from "./AlertMetricCard";
import FailedLoginsDialog from "./FailedLoginsDialog";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { getFailedLoginsCount } from "@/lib/api/dashboard";

const COLORS = {
  primary: "#2563EB",
  secondary: "#7C3AED",
  success: "#059669",
  warning: "#D97706",
  danger: "#DC2626",
  info: "#0891B2",
  gray: "#4B5563",
  light: "#F3F4F6",
  orange: "#EA580C",
  pink: "#DB2777",
  teal: "#0D9488",
  indigo: "#4F46E5",
};

function DetailModal({ open, onClose, title, columns, data }: any) {
  if (!open) return null;
  // Đổi tên cột cho giáo viên chấm bài chậm
  const columnMap: Record<string, string> = {
    id: "Mã",
    name: "Tên",
    graded: "Bài đã chấm",
    submitted: "Bài học sinh đã nộp",
    avg_wait_hours: "Giờ chờ TB",
    percent: "Tỉ lệ chấm (%)",
    class_name: "Lớp",
    last_login: "Lần đăng nhập cuối",
    absent_days: "Số ngày vắng",
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl p-6 relative animate-fade-in">
        <button
          className="absolute top-3 right-3 p-2 rounded hover:bg-gray-100"
          onClick={onClose}
        >
          <CloseIcon className="w-5 h-5" />
        </button>
        <div className="text-lg font-bold mb-4 text-blue-700 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          {title}
        </div>
        <div
          className="overflow-x-auto"
          style={{ maxHeight: "80vh", overflowY: "auto" }}
        >
          <table className="w-full text-sm border border-blue-100 rounded-lg overflow-hidden shadow-sm bg-white">
            <thead>
              <tr className="bg-blue-50 text-blue-700 font-semibold text-center">
                {columns.map((col: string) => (
                  <th
                    key={col}
                    className="px-4 py-2 border-b border-blue-100 text-center"
                  >
                    {columnMap[col] || col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row: any, i: number) => (
                <tr
                  key={i}
                  className="border-b border-blue-50 hover:bg-blue-50 transition"
                >
                  {columns.map((col: string, j: number) => (
                    <td key={j} className="px-4 py-2 text-center">
                      {col === "name" && row.avatar ? (
                        <div className="flex items-center gap-2 justify-center">
                          <img
                            src={row.avatar}
                            alt={row.name}
                            className="w-8 h-8 rounded-full object-cover border"
                          />
                          <span>{row[col]}</span>
                        </div>
                      ) : (
                        row[col]
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AlertsSection({
  metrics,
  riskTrend,
  inactiveStudents,
  decliningStudents,
  slowGradingTeachers,
}: any) {
  const t = useTranslations("admin.dashboard");
  const [modal, setModal] = useState<{
    open: boolean;
    title: string;
    columns: string[];
    data: any[];
  }>({ open: false, title: "", columns: [], data: [] });

  const [failedLoginsDialog, setFailedLoginsDialog] = useState(false);
  const [failedLoginsCount, setFailedLoginsCount] = useState<number | null>(null);
  const [failedLoginsLoading, setFailedLoginsLoading] = useState(false);

  // Card click handlers
  const handleShowInactive = () => {
    if (!inactiveStudents || inactiveStudents.length === 0) return;
    setModal({
      open: true,
      title: t("alerts.inactiveStudentsDetail"),
      columns: ["id", "name", "class_name", "last_login", "absent_days"],
      data: inactiveStudents,
    });
  };
  const handleShowDeclining = () => {
    if (!decliningStudents || decliningStudents.length === 0) return;
    setModal({
      open: true,
      title: t("alerts.decliningStudentsDetail"),
      columns: ["id", "name", "class_name", "last_login", "absent_days"],
      data: decliningStudents,
    });
  };
  const handleShowSlowGrading = () => {
    if (!slowGradingTeachers || slowGradingTeachers.length === 0) return;
    setModal({
      open: true,
      title: t("alerts.slowGradingTeachersDetail"),
      columns: [
        "id",
        "name",
        "graded",
        "submitted",
        "avg_wait_hours",
        "percent",
      ],
      data: slowGradingTeachers,
    });
  };

  const handleShowFailedLogins = () => {
    setFailedLoginsDialog(true);
  };

  // Fetch failed logins count
  useEffect(() => {
    async function fetchFailedLoginsCount() {
      setFailedLoginsLoading(true);
      try {
        const response = await getFailedLoginsCount(3600); // 1 hour
        if (response.code === 200 && response.data?.total_failed_logins !== undefined) {
          setFailedLoginsCount(response.data.total_failed_logins);
        } else {
          setFailedLoginsCount(0);
        }
      } catch (error) {
        console.error("Error fetching failed logins count:", error);
        setFailedLoginsCount(0);
      } finally {
        setFailedLoginsLoading(false);
      }
    }

    fetchFailedLoginsCount();
    // Refresh every 5 minutes
    const interval = setInterval(fetchFailedLoginsCount, 300000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Alert Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AlertMetricCard
          title={t("alerts.inactiveStudents")}
          value={inactiveStudents?.length ?? 0}
          severity="high"
          icon={<UserX className="h-6 w-6" />}
          onDetail={handleShowInactive}
        />
        <AlertMetricCard
          title={t("alerts.decliningStudents")}
          value={decliningStudents?.length ?? 0}
          severity="low"
          icon={<TrendingUp className="h-6 w-6" />}
          onDetail={handleShowDeclining}
        />
        <AlertMetricCard
          title={t("alerts.slowGradingTeachers")}
          value={slowGradingTeachers?.length ?? 0}
          severity="medium"
          icon={<ClipboardCheck className="h-6 w-6" />}
          onDetail={handleShowSlowGrading}
        />
        <AlertMetricCard
          title={t("alerts.failedLogins")}
          value={failedLoginsLoading ? "..." : failedLoginsCount ?? 0}
          severity={failedLoginsCount && failedLoginsCount > 5 ? "high" : failedLoginsCount && failedLoginsCount > 2 ? "medium" : "low"}
          icon={<Shield className="h-6 w-6" />}
          onDetail={handleShowFailedLogins}
        />
      </div>

      {/* Xu hướng rủi ro */}
      {/* <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-red-600" />
            Xu hướng rủi ro theo tuần
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={riskTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.light} />
              <XAxis dataKey="week" stroke={COLORS.gray} />
              <YAxis stroke={COLORS.gray} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="inactive"
                stroke={COLORS.danger}
                strokeWidth={3}
                name="Học sinh không hoạt động"
                dot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="declining"
                stroke={COLORS.warning}
                strokeWidth={2}
                name="Học sinh điểm giảm"
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="lowGrading"
                stroke={COLORS.info}
                strokeWidth={2}
                name="Giáo viên chấm bài chậm"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card> */}
      <DetailModal
        {...modal}
        onClose={() => setModal({ ...modal, open: false })}
      />

      <FailedLoginsDialog
        open={failedLoginsDialog}
        onOpenChange={setFailedLoginsDialog}
      />
    </div>
  );
}
