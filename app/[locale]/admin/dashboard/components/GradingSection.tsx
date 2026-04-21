import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
  Line,
  LabelList,
} from "recharts";
import {
  FileText,
  CheckCircle,
  BookOpen,
  TrendingUp,
  AlertTriangle,
  Inbox,
  CheckSquare,
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

export default function GradingSection({
  metrics,
  notGraded,
  weeklyAssignAssignmentRates,
  weeklySubmitRates,
  weeklyPerformanceOverviewRates
}: any) {
  const t = useTranslations("admin.dashboard");
  
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="font-bold text-center text-lg p-6">
          {t("grading.summaryNotice")}
        </CardContent>
      </Card>
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-6 gap-6">
        <MetricCard
          title={metrics.totalAssignments.label}
          value={metrics.totalAssignments.value}
          icon={<BookOpen className="h-6 w-6" />}
          color="blue"
          titleClassName="text-left"
        />
        <MetricCard
          title={metrics.totalAssigned.label}
          value={metrics.totalAssigned.value}
          icon={<CheckCircle className="h-6 w-6" />}
          color="yellow"
          titleClassName="text-left"
        />
        <MetricCard
          title={metrics.totalSubmissions.label}
          value={metrics.totalSubmissions.value}
          icon={<Inbox className="h-6 w-6" />}
          color="orange"
          titleClassName="text-left"
        />
        <MetricCard
          title={metrics.totalSubmissionsSaW.label}
          value={metrics.totalSubmissionsSaW.value}
          icon={<FileText className="h-6 w-6" />}
          color="gray"
          titleClassName="text-left"
        />
        <MetricCard
          title={metrics.gradedSubmissionsSaW.label}
          value={metrics.gradedSubmissionsSaW.value}
          icon={<CheckSquare className="h-6 w-6" />}
          color="green"
          titleClassName="text-left"
        />
        <MetricCard
          title={metrics.ungradedSubmissionsSaW.label}
          value={metrics.ungradedSubmissionsSaW.value}
          icon={<AlertTriangle className="h-6 w-6" />}
          color="red"
          titleClassName="text-left"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Tình trạng giao bài */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              {t("grading.assignmentStatus")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={weeklyAssignAssignmentRates || []}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.light} />
                <XAxis dataKey="week" stroke={COLORS.gray} />
                <YAxis
                  stroke={COLORS.gray}
                  domain={[0, "dataMax"]}
                />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="total"
                  fill={COLORS.primary}
                  name={t("grading.totalAssignmentsCount")}
                  opacity={0.7}
                >
                  <LabelList
                    dataKey="total"
                    position="insideTop"
                    dy={18}
                    style={{ fontSize: 13, fill: "#fff" }}
                  />
                </Bar>
                <Line
                  type="monotone"
                  dataKey="assign_assignment"
                  stroke={COLORS.danger}
                  strokeWidth={3}
                  name={t("grading.assignedCount")}
                  dot={{ r: 0 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

          {/* Tổng bài đã nộp và tổng bài chưa chấm */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
                {t("grading.submittedAndUngraded")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={weeklySubmitRates || []}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.light} />
                <XAxis dataKey="week" stroke={COLORS.gray} />
                <YAxis
                  stroke={COLORS.gray}
                  domain={[0, "dataMax"]}
                />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="total"
                  fill={COLORS.primary}
                  name={t("grading.totalSubmitted")}
                  opacity={0.7}
                >
                  <LabelList
                    dataKey="total"
                    position="insideTop"
                    dy={18}
                    style={{ fontSize: 13, fill: "#fff" }}
                  />
                </Bar>
                <Line
                  type="monotone"
                  dataKey="not_graded"
                  stroke={COLORS.danger}
                  strokeWidth={3}
                  name={t("grading.totalUngraded")}
                  dot={{ r: 0 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tỉ lệ giao bài, nộp bài, chấm bài */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            {t("grading.performanceOverview")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={weeklyPerformanceOverviewRates || []}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.light} />
              <XAxis dataKey="week" stroke={COLORS.gray} />
              <YAxis
                stroke={COLORS.gray}
                domain={[0, 100]}
                tickFormatter={(v) => v + "%"}
              />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="assign_assignment_percent"
                stroke={COLORS.primary}
                strokeWidth={3}
                name={t("grading.assignedPercent")}
                dot={{ r: 0 }}
              />
              <Line
                type="monotone"
                dataKey="submit_percent"
                stroke={COLORS.danger}
                strokeWidth={3}
                name={t("grading.submittedPercent")}
                dot={{ r: 0 }}
              />
              <Line
                type="monotone"
                dataKey="not_graded_percent"
                stroke={COLORS.warning}
                strokeWidth={3}
                name={t("grading.ungradedPercentChart")}
                dot={{ r: 0 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Danh sách bài kiểm tra chưa chấm theo tuần */}
      {(notGraded || []).map(
        (week: any, idx: number) =>
          week.not_graded_exams &&
          week.not_graded_exams.length > 0 && (
            <Card
              className="shadow-lg border-0 flex flex-col"
              key={week.week + idx}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  {t("grading.ungradedExams")} - {week.week}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center w-full">
                <div className="overflow-x-auto w-full flex justify-center">
                  <table className="w-full text-sm border border-blue-100 rounded-lg overflow-hidden shadow-sm bg-white">
                    <thead>
                      <tr className="bg-blue-50 text-blue-700 font-semibold text-center">
                        <th className="px-4 py-2 border-b border-blue-100 text-center">
                          {t("grading.student")}
                        </th>
                        <th className="px-4 py-2 border-b border-blue-100 text-center">
                          {t("grading.teacher")}
                        </th>
                        <th className="px-4 py-2 border-b border-blue-100 text-center">
                          {t("grading.exam")}
                        </th>
                        <th className="px-4 py-2 border-b border-blue-100 text-center">
                          {t("grading.submissionTime")}
                        </th>
                        <th className="px-4 py-2 border-b border-blue-100 text-center">
                          {t("grading.questionCount")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {week.not_graded_exams.map(
                        (exam: any, i: number) => (
                          <tr
                            key={i}
                            className="border-b border-blue-50 hover:bg-blue-50 transition"
                          >
                            <td className="px-4 py-2 text-center">
                              {exam.student_name}
                            </td>
                            <td className="px-4 py-2 text-center">
                              {exam.teacher_name}
                            </td>
                            <td className="px-4 py-2 text-center">
                              {exam.not_graded_name}
                            </td>
                            <td className="px-4 py-2 text-center">
                              {exam.submitted_at}
                            </td>
                            <td className="px-4 py-2 text-center font-semibold text-blue-700">
                              {exam.question_count}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )
      )}
      {/* Danh sách bài tập về nhà chưa chấm theo tuần */}
      {(notGraded || []).map(
        (week: any, idx: number) =>
          week.not_graded_homeworks &&
          week.not_graded_homeworks.length > 0 && (
            <Card
              className="shadow-lg border-0 flex flex-col"
              key={week.week + idx}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  {t("grading.ungradedHomeworks")} - {week.week}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center w-full">
                <div className="overflow-x-auto w-full flex justify-center">
                  <table className="w-full text-sm border border-blue-100 rounded-lg overflow-hidden shadow-sm bg-white">
                    <thead>
                      <tr className="bg-blue-50 text-blue-700 font-semibold text-center">
                        <th className="px-4 py-2 border-b border-blue-100 text-center">
                          {t("grading.student")}
                        </th>
                        <th className="px-4 py-2 border-b border-blue-100 text-center">
                          {t("grading.teacher")}
                        </th>
                        <th className="px-4 py-2 border-b border-blue-100 text-center">
                          {t("grading.exam")}
                        </th>
                        <th className="px-4 py-2 border-b border-blue-100 text-center">
                          {t("grading.submissionTime")}
                        </th>
                        <th className="px-4 py-2 border-b border-blue-100 text-center">
                          {t("grading.questionCount")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {week.not_graded_homeworks.map(
                        (hw: any, i: number) => (
                          <tr
                            key={i}
                            className="border-b border-blue-50 hover:bg-blue-50 transition"
                          >
                            <td className="px-4 py-2 text-center">
                              {hw.student_name}
                            </td>
                            <td className="px-4 py-2 text-center">
                              {hw.teacher_name}
                            </td>
                            <td className="px-4 py-2 text-center">
                              {hw.not_graded_name}
                            </td>
                            <td className="px-4 py-2 text-center">
                              {hw.submitted_at}
                            </td>
                            <td className="px-4 py-2 text-center font-semibold text-blue-700">
                              {hw.question_count}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )
      )}
      {/* Danh sách bài luyện tập chưa chấm theo tuần */}
      {(notGraded || []).map(
        (week: any, idx: number) =>
          week.not_graded_exercises &&
          week.not_graded_exercises.length > 0 && (
            <Card
              className="shadow-lg border-0 flex flex-col"
              key={week.week + idx}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  {t("grading.ungradedExercises")} - {week.week}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center w-full">
                <div className="overflow-x-auto w-full flex justify-center">
                  <table className="w-full text-sm border border-blue-100 rounded-lg overflow-hidden shadow-sm bg-white">
                    <thead>
                      <tr className="bg-blue-50 text-blue-700 font-semibold text-center">
                        <th className="px-4 py-2 border-b border-blue-100 text-center">
                          {t("grading.student")}
                        </th>
                        <th className="px-4 py-2 border-b border-blue-100 text-center">
                          {t("grading.teacher")}
                        </th>
                        <th className="px-4 py-2 border-b border-blue-100 text-center">
                          {t("grading.exam")}
                        </th>
                        <th className="px-4 py-2 border-b border-blue-100 text-center">
                          {t("grading.submissionTime")}
                        </th>
                        <th className="px-4 py-2 border-b border-blue-100 text-center">
                          {t("grading.questionCount")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {week.not_graded_exercises.map(
                        (exercise: any, i: number) => (
                          <tr
                            key={i}
                            className="border-b border-blue-50 hover:bg-blue-50 transition"
                          >
                            <td className="px-4 py-2 text-center">
                              {exercise.student_name}
                            </td>
                            <td className="px-4 py-2 text-center">
                              {exercise.teacher_name}
                            </td>
                            <td className="px-4 py-2 text-center">
                              {exercise.not_graded_name}
                            </td>
                            <td className="px-4 py-2 text-center">
                              {exercise.submitted_at}
                            </td>
                            <td className="px-4 py-2 text-center font-semibold text-blue-700">
                              {exercise.question_count}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )
      )}
    </div>
  );
}
