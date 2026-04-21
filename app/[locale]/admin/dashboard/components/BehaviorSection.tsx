import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as TooltipRecharts} from "recharts";
import {
  Clock,
  Users,
  TrendingUp,
  Activity,
  MessageSquare,
  Check,
  Percent,
} from "lucide-react";
import MetricCard from "./MetricCard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
} from "recharts";
import { useTranslations } from "next-intl";
import { TooltipContent, TooltipTrigger, Tooltip } from "@/components/ui/tooltip";

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
  COLORS.orange,
  COLORS.pink,
  COLORS.teal,
  COLORS.indigo,
];

export default function BehaviorSection({
  metrics,
  deviceUsage,
  weeklyUsage,
}: any) {
  const t = useTranslations("admin.dashboard");
  const safeDeviceUsage = Array.isArray(deviceUsage) ? deviceUsage : [];
  const safeWeeklyUsage = Array.isArray(weeklyUsage) ? weeklyUsage : [];
  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-6 gap-6">
        <MetricCard
          title={metrics?.avgSessionTime?.label || ""}
          value={metrics?.avgSessionTime?.value ?? 0}
          change={metrics?.avgSessionTime?.change ?? 0}
          icon={<Clock className="h-6 w-6" />}
          color="blue"
        />
        <MetricCard
          title={metrics?.dailyActiveUsers?.label || ""}
          value={metrics?.dailyActiveUsers?.value ?? 0}
          change={metrics?.dailyActiveUsers?.change ?? 0}
          icon={<Users className="h-6 w-6" />}
          color="rose"
        />
        <Tooltip>
          <TooltipTrigger >
            <MetricCard
              title={metrics?.weeklyRetention?.label || ""}
              value={metrics?.weeklyRetention?.value ?? 0}
              change={metrics?.weeklyRetention?.change ?? 0}
              icon={<TrendingUp className="h-6 w-6" />}
              color="purple"
              suffix="%"
            />
          </TooltipTrigger>
          <TooltipContent className="border-purple-500 bg-purple-50 text-black">
            <p>{t("behavior.weeklyRetentionTooltip")}</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger >
            <MetricCard
              title={metrics?.engagementRate?.label || ""}
              value={metrics?.engagementRate?.value ?? 0}
              change={metrics?.engagementRate?.change ?? 0}
              icon={<Activity className="h-6 w-6" />}
              color="orange"
              suffix="%"
            />
          </TooltipTrigger>
          <TooltipContent className="border-orange-500 bg-orange-50 text-black">
            <p>{t("behavior.engagementRateTooltip")}</p>
          </TooltipContent>
        </Tooltip>
        <MetricCard
          title={metrics?.completeCount?.label || ""}
          value={metrics?.completeCount?.value ?? 0}
          change={metrics?.completeCount?.change ?? 0}
          icon={<Check className="h-6 w-6" />}
          color="green"
        />
        <Tooltip>
          <TooltipTrigger >
            <MetricCard
              title={metrics?.completeRate?.label || ""}
              value={metrics?.completeRate?.value ?? 0}
              change={metrics?.completeRate?.change ?? 0}
              icon={<Percent className="h-6 w-6" />}
              color="yellow"
              suffix="%"
            />
          </TooltipTrigger>
          <TooltipContent className="border-yellow-500 bg-yellow-50 text-black">
            <p>{t("behavior.completeRateTooltip")}</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Thiết bị truy cập */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              {t("behavior.deviceUsage")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={safeDeviceUsage}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    dataKey="users"
                    label={({ device, percentage }) =>
                      `${device}: ${percentage}%`
                    }
                  >
                    {safeDeviceUsage.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <TooltipRecharts
                    formatter={(value: any, name: any, props: any) => [
                      `${value} ${t("behavior.users")}`,
                      props.payload.device,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {safeDeviceUsage.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor:
                            CHART_COLORS[index % CHART_COLORS.length],
                        }}
                      />
                      <span className="font-medium text-sm">{item.device}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm">
                        {item.users.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.percentage}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Thời lượng sử dụng trung bình theo tuần */}
        {safeWeeklyUsage.length > 0 && (
          <Card className="shadow-lg border-0 flex flex-col justify-center">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                {t("behavior.weeklyUsage")}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col justify-center h-full">
              <div className="flex-1 flex items-center justify-center min-h-[350px]">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={safeWeeklyUsage}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={COLORS.light}
                    />
                    <XAxis dataKey="week" stroke={COLORS.gray} />
                    <YAxis
                      stroke={COLORS.gray}
                      label={{
                        value: `(${t("behavior.minutes")})`,
                        position: "bottom",
                        offset: 10,
                        style: {
                          textAnchor: "middle",
                          fontSize: 14,
                          fill: "#4B5563",
                        },
                      }}
                    />
                    <TooltipRecharts
                      formatter={(_v: any, _n: any, props: any) => [
                        props.payload.averageDuration,
                        t("behavior.averageDuration"),
                      ]}
                    />
                    <Bar dataKey="averageDurationMinute" radius={[4, 4, 0, 0]}>
                      {safeWeeklyUsage.map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                      <LabelList
                        dataKey="averageDuration"
                        position="insideTop"
                        dy={10}
                        style={{ fontSize: 13, fill: "#fff" }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
