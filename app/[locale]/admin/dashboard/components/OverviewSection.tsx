import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChartIcon,
  BarChart3,
  School,
  UserCheck,
  GraduationCap,
  Activity,
  Users,
  History,
  CalendarDays,
  CalendarRange,
} from "lucide-react";
import { useParams } from "next/navigation";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Bar,
  LabelList,
} from "recharts";
import MetricCard from "./MetricCard";
import OnlineUsersDialog from "./OnlineUsersDialog";
import Online24hUsersDialog from "./Online24hUsersDialog";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  DASHBOARD_OVERVIEW_CARDS,
  DASHBOARD_OVERVIEW_CHARTS,
} from "@/config/adminDashboard";

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

const CHART_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.success,
  COLORS.warning,
  COLORS.danger,
  COLORS.info,
  COLORS.gray,
  COLORS.light,
  COLORS.orange,
  COLORS.pink,
  COLORS.teal,
  COLORS.indigo,
];

export default function OverviewSection({
  metrics,
  studentsByGrade,
  courseMetrics,
}: any) {
  const t = useTranslations("admin.dashboard");
  const params = useParams();
  const locale = params.locale as string;
  const [isOnlineUsersDialogOpen, setIsOnlineUsersDialogOpen] = useState(false);
  const [isOnline24hUsersDialogOpen, setIsOnline24hUsersDialogOpen] = useState(false);
  const [isOnline1wUsersDialogOpen, setIsOnline1wUsersDialogOpen] = useState(false);
  const [isOnline1mUsersDialogOpen, setIsOnline1mUsersDialogOpen] = useState(false);

  return (
    <>
      <div className="space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {DASHBOARD_OVERVIEW_CARDS.totalUsers && (
          <MetricCard
            title={metrics.totalUsers?.label || t("overview.totalUsers")}
            value={metrics.totalUsers?.value ?? 0}
            change={metrics.totalUsers?.change ?? 0}
            icon={<Users className="h-6 w-6" />}
            color="blue"
            message={metrics.totalUsers?.message}
          />
          )}
          {DASHBOARD_OVERVIEW_CARDS.onlineUsers && (
          <MetricCard
            title={metrics.onlineUsers?.label || t("overview.onlineUsers")}
            value={metrics.onlineUsers?.value ?? 0}
            change={metrics.onlineUsers?.change ?? 0}
            icon={<Activity className="h-6 w-6" />}
            color="cyan"
            message={metrics.onlineUsers?.message}
            clickable={metrics.onlineUsers?.value > 0}
            onClick={() => setIsOnlineUsersDialogOpen(true)}
          />
          )}
          {DASHBOARD_OVERVIEW_CARDS.onlineUsers24h && (
          <MetricCard
            title={t("overview.onlineUsers24h")}
            value={metrics.onlineUsers24h?.value ?? 0}
            icon={<History className="h-6 w-6" />}
            color="indigo"
            clickable={metrics.onlineUsers24h?.value > 0}
            onClick={() => setIsOnline24hUsersDialogOpen(true)}
          />
          )}
          {DASHBOARD_OVERVIEW_CARDS.onlineUsers1w && (
          <MetricCard
            title={t("overview.onlineUsers1w")}
            value={metrics.onlineUsers1w?.value ?? 0}
            icon={<CalendarDays className="h-6 w-6" />}
            color="pink"
            clickable={metrics.onlineUsers1w?.value > 0}
            onClick={() => setIsOnline1wUsersDialogOpen(true)}
          />
          )}
          {DASHBOARD_OVERVIEW_CARDS.onlineUsers1m && (
          <MetricCard
            title={t("overview.onlineUsers1m")}
            value={metrics.onlineUsers1m?.value ?? 0}
            icon={<CalendarRange className="h-6 w-6" />}
            color="teal"
            clickable={metrics.onlineUsers1m?.value > 0}
            onClick={() => setIsOnline1mUsersDialogOpen(true)}
          />
          )}
          {DASHBOARD_OVERVIEW_CARDS.totalSchools && (
          <MetricCard
            title={metrics.totalSchools?.label || t("overview.totalSchools")}
            value={metrics.totalSchools?.value ?? 0}
            change={metrics.totalSchools?.change ?? 0}
            icon={<School className="h-6 w-6" />}
            color="green"
            message={metrics.totalSchools?.message}
            clickable={true}
            href={`/${locale}/admin/schools`}
          />
          )}
          {DASHBOARD_OVERVIEW_CARDS.totalTeachers && (
          <MetricCard
            title={metrics.totalTeachers?.label || t("overview.totalTeachers")}
            value={metrics.totalTeachers?.value}
            change={metrics.totalTeachers?.change}
            icon={<UserCheck className="h-6 w-6" />}
            color="purple"
            message={metrics.totalTeachers?.message}
            clickable={true}
            href={`/${locale}/admin/users/list?tab=teachers`}
          />
          )}
          {DASHBOARD_OVERVIEW_CARDS.totalStudents && (
          <MetricCard
            title={metrics.totalStudents?.label || t("overview.totalStudents")}
            value={metrics.totalStudents?.value}
            change={metrics.totalStudents?.change}
            icon={<GraduationCap className="h-6 w-6" />}
            color="orange"
            message={metrics.totalStudents?.message}
            clickable={true}
            href={`/${locale}/admin/users/list?tab=students`}
          />
          )}
          {DASHBOARD_OVERVIEW_CARDS.activeToday && (
          <MetricCard
            title={metrics.activeToday?.label || t("overview.activeToday")}
            value={metrics.activeToday?.value}
            change={metrics.activeToday?.change}
            icon={<Activity className="h-6 w-6" />}
            color="red"
            message={metrics.activeToday?.message}
          />
          )}
        </div>

        {DASHBOARD_OVERVIEW_CHARTS.courseOverview && (
        <div className="grid md:grid-cols-1 gap-6">
          {/* Tổng quan về khóa học */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                {t("overview.courseOverview")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={(courseMetrics?.overviews || []).map((item: any) => ({
                    name: item.title,
                    count: item.count,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.light} />
                  <XAxis dataKey="name" stroke={COLORS.gray} />
                  <YAxis stroke={COLORS.gray} />
                  <Tooltip
                    formatter={(value: any, name: any, props: any) => [
                      `${value} ${t("filters.items")}`,
                      props.payload?.name,
                    ]}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {(courseMetrics?.overviews || []).map(
                      (item: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      )
                    )}
                    <LabelList
                      dataKey="count"
                      position="top"
                      formatter={(value: any) => `${value}`}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        )}

        {DASHBOARD_OVERVIEW_CHARTS.completionRate && (
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              {t("overview.completionRate")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={(courseMetrics?.rates || []).map((item: any) => ({
                  name: item.title,
                  percent: item.percent,
                  complete_total: item.complete_total,
                  total: item.total,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.light} />
                <XAxis dataKey="name" stroke={COLORS.gray} />
                <YAxis
                  stroke={COLORS.gray}
                  domain={[0, 100]}
                  tickFormatter={(v) => v + "%"}
                />
                <Tooltip
                  formatter={(_value: any, _name: any, props: any) => [
                    `${props.payload.complete_total}/${props.payload.total} ${t(
                      "overview.completed"
                    )}`,
                    `${props.payload.percent}%`,
                  ]}
                  labelFormatter={(label) => label}
                />
                <Bar dataKey="percent" radius={[4, 4, 0, 0]}>
                  {(courseMetrics?.rates || []).map(
                    (item: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    )
                  )}
                  <LabelList
                    dataKey="percent"
                    position="top"
                    formatter={(value: any) => `${value}%`}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        )}
      </div>

      {DASHBOARD_OVERVIEW_CARDS.onlineUsers && (
      <OnlineUsersDialog
        isOpen={isOnlineUsersDialogOpen}
        onClose={() => setIsOnlineUsersDialogOpen(false)}
      />
      )}

      {(DASHBOARD_OVERVIEW_CARDS.onlineUsers24h ||
        DASHBOARD_OVERVIEW_CARDS.onlineUsers1w ||
        DASHBOARD_OVERVIEW_CARDS.onlineUsers1m) && (
      <Online24hUsersDialog
        isOpen={isOnline24hUsersDialogOpen}
        onClose={() => setIsOnline24hUsersDialogOpen(false)}
      />
      )}
    </>
  );
}
