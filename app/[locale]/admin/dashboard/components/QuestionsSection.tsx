import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  BookMarked,
  CheckCircle,
  Headphones,
  Layers,
  Lightbulb,
  MessageSquare,
  Target,
  TrendingUp,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import MetricCard from "./MetricCard";

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

const CustomLabel = (props: any) => {
  const { x, y, width, height, value, index, data } = props;
  const entry = data[index];

  // Ngưỡng chiều cao để quyết định chữ nằm trong hay ngoài
  const MIN_HEIGHT_FOR_INSIDE = 25;
  const isInside = height > MIN_HEIGHT_FOR_INSIDE;

  const posY = isInside ? y + height / 2 : y - 10;
  const fill = isInside ? "#fff" : entry.color;

  return (
    <text
      x={x + width / 2}
      y={posY}
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize={14}
      fill={fill}
      fontWeight={500}
    >
      {value}%
    </text>
  );
};

export default function QuestionsSection({
  metrics = {},
  mediaMetrics = {},
  questionsByType = [],
  attributes = [],
}: any) {
  // check mobile
  const isMobile = useIsMobile();
  // i18n
  const t = useTranslations("admin.dashboard");
  const params = useParams();
  const locale = params.locale as string;
  // Icon and color mapping for attribute names (extend as needed)
  const attributeIcons: Record<string, React.ReactNode> = {
    "Kỹ năng": <Headphones className="h-5 w-5 text-blue-600" />,
    "Mức độ": <BookMarked className="h-5 w-5 text-green-600" />,
    "Mức độ nhận thức": <Lightbulb className="h-5 w-5 text-yellow-600" />,
  };
  const attributeChartType: Record<string, "pie" | "bar" | "progress"> = {
    "Kỹ năng": "pie",
    "Mức độ": "progress",
    "Mức độ nhận thức": "bar",
  };
  const attributeColors = [
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

  // Assign color to each item in attributes
  const coloredAttributes = attributes.map((attr: any, idx: number) => ({
    ...attr,
    items: attr.items.map((item: any, i: number) => ({
      ...item,
      color: attributeColors[i % attributeColors.length],
    })),
  }));

  // Assign color to each type
  const coloredQuestionsByType = questionsByType.map(
    (item: any, i: number) => ({
      ...item,
      color: attributeColors[i % attributeColors.length],
    })
  );

  // Media metrics cards (5 cards)
  const mediaCards = [
    {
      key: "totalQuestions",
      icon: <MessageSquare className="h-6 w-6" />,
      color: "blue",
      ...mediaMetrics.totalQuestions,
      clickable: true,
      href: `/${locale}/manage/question-bank`,
    },
    {
      key: "audioPercent",
      icon: <Headphones className="h-6 w-6" />,
      color: "purple",
      ...mediaMetrics.audioPercent,
    },
    {
      key: "imagePercent",
      icon: <Layers className="h-6 w-6" />,
      color: "orange",
      ...mediaMetrics.imagePercent,
    },
    {
      key: "withAudio",
      icon: <Headphones className="h-6 w-6" />,
      color: "green",
      ...mediaMetrics.withAudio,
    },
    {
      key: "withImage",
      icon: <Layers className="h-6 w-6" />,
      color: "pink",
      ...mediaMetrics.withImage,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Media Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {mediaCards.map((card) => (
          <MetricCard
            key={card.key}
            title={card.label}
            value={card.value}
            suffix={card.suffix}
            icon={card.icon}
            color={card.color}
            clickable={card.clickable}
            href={card.href}
          />
        ))}
      </div>

      {/* 4 card cũ nếu có */}
      {metrics && metrics.totalQuestions && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title={metrics.totalQuestions.label}
            value={metrics.totalQuestions.value}
            change={metrics.totalQuestions.change}
            icon={<MessageSquare className="h-6 w-6" />}
            color="blue"
            clickable={true}
            href={`/${locale}/manage/question-bank`}
          />
          <MetricCard
            title={metrics.usedQuestions.label}
            value={metrics.usedQuestions.value}
            change={metrics.usedQuestions.change}
            icon={<CheckCircle className="h-6 w-6" />}
            color="green"
          />
          <MetricCard
            title={metrics.usageRate.label}
            value={metrics.usageRate.value}
            change={metrics.usageRate.change}
            icon={<Target className="h-6 w-6" />}
            color="purple"
            suffix="%"
          />
          <MetricCard
            title={metrics.newQuestions.label}
            value={metrics.newQuestions.value}
            change={metrics.newQuestions.change}
            icon={<TrendingUp className="h-6 w-6" />}
            color="orange"
          />
        </div>
      )}

      {/* Thống kê theo dạng câu hỏi */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-purple-600" />
            {t("questions.statisticsByType")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={coloredQuestionsByType} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.light} />
              <XAxis
                dataKey="type"
                stroke={COLORS.gray}
                angle={isMobile ? -60 : -15}
                textAnchor={"end"}
                interval={0}
                height={100}
              />
              <YAxis stroke={COLORS.gray} />
              <Tooltip
                formatter={(value: any, name: any, props: any) => [
                  `${value} câu (${props.payload.percentage}%)`,
                  "Số lượng",
                ]}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {coloredQuestionsByType.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
                {/* hide if is mobile */}
                {!isMobile && (
                  <LabelList
                    dataKey="percentage"
                    content={(props) => (
                      <CustomLabel {...props} data={coloredQuestionsByType} />
                    )}
                  />
                )}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Dynamic attribute-based statistics */}
      <div className={`grid lg:grid-cols-${coloredAttributes.length} gap-6`}>
        {coloredAttributes.map((attr: any, idx: number) => {
          const chartType = attributeChartType[attr.name] || "bar";
          const icon = attributeIcons[attr.name] || (
            <Layers className="h-5 w-5 text-gray-600" />
          );
          if (chartType === "pie") {
            return (
              <Card className="shadow-lg border-0" key={attr.name}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {icon}
                    {t("questions.statisticsBy")} {attr.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={isMobile ? 280 : 250}>
                    <PieChart>
                      <Pie
                        data={attr.items.map((item: any) => ({
                          ...item,
                          skill: item.name,
                        }))}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="count"
                        label={
                          isMobile
                            ? false
                            : ({ skill, percentage }: any) =>
                              `${skill}: ${percentage}%`
                        }
                      >
                        {attr.items.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any, name: any, props: any) => [
                          `${value} ${t("questions.questions")} (${props.payload.percentage
                          }%)`,
                          props.payload.skill,
                        ]}
                      />
                      {isMobile && (
                        <Legend
                          verticalAlign="bottom"
                          height={80}
                          align="center"
                          iconType="rect"
                          formatter={(value: string) => {
                            const item = attr.items.find((i: any) => i.name === value)
                            return item ? `${item.name}: ${item.percentage}%` : value
                          }}
                          wrapperStyle={{
                            fontSize: '12px',
                            paddingTop: '12px',
                            textAlign: 'center',
                            width: '100%'
                          }}
                        />
                      )}
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            );
          } else if (chartType === "progress") {
            return (
              <Card className="shadow-lg border-0" key={attr.name}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {icon}
                    {t("questions.statisticsBy")} {attr.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {attr.items.map((level: any, index: number) => (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{level.name}</span>
                          <span className="font-medium">
                            {level.percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                          <div
                            className="h-2.5 rounded-full"
                            style={{
                              width: `${level.percentage}%`,
                              backgroundColor: level.color,
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 text-right">
                          {level.count} {t("questions.questions")}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          } else {
            // Default to bar chart
            return (
              <Card className="shadow-lg border-0" key={attr.name}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {icon}
                    {t("questions.statisticsBy")} {attr.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer
                    width="100%"
                    height={isMobile ? 300 : 250}
                  >
                    <BarChart
                      data={attr.items.map((item: any) => ({
                        ...item,
                        level: item.name,
                      }))}
                      layout="horizontal"
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={COLORS.light}
                      />
                      <XAxis
                        dataKey="level"
                        stroke={COLORS.gray}
                        interval={0}
                        angle={isMobile ? -60 : -15}
                        textAnchor="end"
                        height={isMobile ? 120 : 60}
                      />
                      <YAxis stroke={COLORS.gray} />
                      <Tooltip
                        formatter={(value: any, name: any, props: any) => [
                          `${value} ${t("questions.questions")} (${props.payload.percentage
                          }%)`,
                          "Số lượng",
                        ]}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {attr.items.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                        <LabelList
                          dataKey="percentage"
                          position="top"
                          formatter={(value: any) => `${value}%`}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            );
          }
        })}
      </div>
    </div>
  );
}
