import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  Cell,
  LabelList,
  ComposedChart,
  Line,
  Legend,
  LineChart,
} from "recharts";
import {
  Star,
  Target,
  TrendingUp,
  Activity,
  Trophy,
  BarChart3,
  TrendingDown,
} from "lucide-react";
import MetricCard from "./MetricCard";
import { useTranslations } from "next-intl";

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

export default function LearningSection({
  metrics,
  scoreDistributions,
  weeklyProgress,
  topStudents,
  gemsByWeek,
  lowStudents,
  averageScore,
  highestPercent,
  lowestPercent,
  behaviorPercent,
}: any) {
  const t = useTranslations("admin.dashboard");
  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Điểm trung bình"
          value={averageScore}
          change={null}
          icon={<Star className="h-6 w-6" />}
          color="blue"
        />
        <MetricCard
          title="Tỷ lệ điểm cao (>75)"
          value={highestPercent}
          change={null}
          icon={<Target className="h-6 w-6" />}
          color="green"
        />
        <MetricCard
          title="Tỷ lệ điểm thấp (<25)"
          value={lowestPercent}
          change={null}
          icon={<TrendingDown className="h-6 w-6" />}
          color="red"
        />
        <MetricCard
          title="Tỷ lệ trung bình"
          value={behaviorPercent}
          change={null}
          icon={<Activity className="h-6 w-6" />}
          color="orange"
        />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Phân bố điểm - LineChart hình chuông theo khối */}
        {Array.isArray(scoreDistributions) && scoreDistributions.length > 0 ? (
          scoreDistributions.map((distribution: any, idx: number) => {
            // Màu khác nhau cho từng khối
            const gradeColors = [
              COLORS.primary, // Khối 1 - Xanh dương
              COLORS.secondary, // Khối 2 - Tím
              COLORS.success, // Khối 3 - Xanh lá
              COLORS.warning, // Khối 4 - Cam
              COLORS.danger, // Khối 5 - Đỏ
              COLORS.info, // Khối 6 - Xanh dương nhạt
              COLORS.orange, // Khối 7 - Cam đậm
              COLORS.pink, // Khối 8 - Hồng
              COLORS.teal, // Khối 9 - Xanh ngọc
              COLORS.indigo, // Khối 10 - Chàm
            ];
            const currentColor = gradeColors[idx % gradeColors.length];

            return (
              <Card
                className="shadow-lg border-0"
                key={distribution.grade || idx}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3
                      className="h-5 w-5"
                      style={{ color: currentColor }}
                    />
                    {t("learning.scoreDistribution")} - {distribution.grade}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={distribution.data || []}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={COLORS.light}
                      />
                      <XAxis dataKey="range" stroke={COLORS.gray} />
                      <YAxis stroke={COLORS.gray} />
                      <Tooltip
                        formatter={(value: any) => [
                          `${value} ${t("learning.assignment")}`,
                          t("learning.count"),
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke={currentColor}
                        strokeWidth={2}
                        dot={{ r: 4, fill: currentColor }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                {t("learning.scoreDistribution")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-48 text-gray-500">
                {t("learning.noScoreData")}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tiến bộ theo tuần - Điểm trung bình */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              {t("learning.weeklyProgress")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={weeklyProgress || []}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.light} />
                <XAxis dataKey="week" stroke={COLORS.gray} />
                <YAxis yAxisId="left" stroke={COLORS.gray} />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="score"
                  stroke={COLORS.success}
                  strokeWidth={3}
                  name={t("learning.averageScore")}
                  dot={{ r: 6, fill: COLORS.success }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gem theo tuần nếu có */}
        {/* {gemsByWeek && gemsByWeek.length > 0 && (
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-600" />
                Gem theo tuần
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={gemsByWeek}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.light} />
                  <XAxis dataKey="week" stroke={COLORS.gray} />
                  <YAxis stroke={COLORS.gray} />
                  <Tooltip />
                  <Bar dataKey="gem" fill={COLORS.info} radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="gem" position="top" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )} */}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top học sinh xuất sắc */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              {t("learning.topStudents")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <tbody>
                  {(topStudents || []).map((student: any, index: number) => (
                    <tr
                      key={index}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold overflow-hidden">
                            {student.avatar ? (
                              <img
                                src={student.avatar}
                                alt={student.student_name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              student.student_name.charAt(0)
                            )}
                          </div>
                          <div className="font-medium text-sm">
                            {student.student_name}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-blue-600 text-sm">
                          {student.school_name} - {student.class_name}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="font-bold text-green-600 text-lg">
                          {student.score}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        {/* Top học sinh kém nhất nếu có */}
        {lowStudents && lowStudents.length > 0 && (
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                {t("learning.lowStudents")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <tbody>
                    {lowStudents.map((student: any, index: number) => (
                      <tr
                        key={index}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-700 text-xs font-bold overflow-hidden">
                              {student.avatar ? (
                                <img
                                  src={student.avatar}
                                  alt={student.student_name || student.name}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                (
                                  student.student_name ||
                                  student.name ||
                                  ""
                                ).charAt(0)
                              )}
                            </div>
                            <div className="font-medium text-sm">
                              {student.student_name || student.name}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-medium text-blue-600 text-sm">
                            {student.school_name} - {student.class_name}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="font-bold text-red-600 text-lg">
                            {student.score}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
