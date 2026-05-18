import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
// import { DashboardHeader } from "@/components/dashboard-header"
import {
  LucideBarChart2,
  LucideCalendar,
  LucideUsers,
  LucideBookOpen,
  LucideActivity,
  LucideArrowUp,
  LucideArrowDown,
  LucideClock,
  LucideGamepad2,
  LucideDownload,
  LucideFilter,
} from "lucide-react"
import { SkillsRadarChart } from "@/components/skills-radar-chart"
import { EngagementChart } from "@/components/engagement-chart"
import { ToolUsageChart } from "@/components/tool-usage-chart"
import { LearningPathAnalytics } from "@/components/learning-path-analytics"

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* <DashboardHeader /> */}

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Phân tích học tập 📊</h1>
            <p className="text-gray-600">Theo dõi và phân tích tiến độ học tập chi tiết</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-3">
            <Button variant="outline" className="rounded-full flex items-center gap-2">
              <LucideCalendar className="h-4 w-4" />
              Tháng này
            </Button>
            <Button variant="outline" className="rounded-full flex items-center gap-2">
              <LucideFilter className="h-4 w-4" />
              Lọc
            </Button>
            <Button variant="outline" className="rounded-full flex items-center gap-2">
              <LucideDownload className="h-4 w-4" />
              Xuất báo cáo
            </Button>
          </div>
        </div>

        {/* Analytics Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <AnalyticsCard
            title="Tổng thời gian học"
            value="32 giờ 45 phút"
            change="+5.2 giờ"
            changeType="increase"
            description="So với tháng trước"
            color="blue"
            icon={<LucideClock className="h-5 w-5 text-Clever School-blue" />}
          />
          <AnalyticsCard
            title="Hoạt động hoàn thành"
            value="87/120"
            change="+12 hoạt động"
            changeType="increase"
            description="So với tháng trước"
            color="green"
            icon={<LucideBookOpen className="h-5 w-5 text-Clever School-green" />}
          />
          <AnalyticsCard
            title="Điểm trung bình"
            value="85/100"
            change="-2 điểm"
            changeType="decrease"
            description="So với tháng trước"
            color="yellow"
            icon={<LucideActivity className="h-5 w-5 text-Clever School-yellow" />}
          />
          <AnalyticsCard
            title="Công cụ tương tác"
            value="42 lượt sử dụng"
            change="+15 lượt"
            changeType="increase"
            description="So với tháng trước"
            color="orange"
            icon={<LucideGamepad2 className="h-5 w-5 text-Clever School-orange" />}
          />
        </div>

        {/* Learning Engagement */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2">
            <Card className="h-full card-kid border-Clever School-blue">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LucideBarChart2 className="h-5 w-5 text-Clever School-blue" />
                  Mức độ tương tác học tập
                </CardTitle>
                <CardDescription>Phân tích thời gian và mức độ tương tác theo ngày</CardDescription>
              </CardHeader>
              <CardContent>
                <EngagementChart />
              </CardContent>
            </Card>
          </div>
          <div>
            <Card className="h-full card-kid border-Clever School-green">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LucideGamepad2 className="h-5 w-5 text-Clever School-green" />
                  Sử dụng công cụ tương tác
                </CardTitle>
                <CardDescription>Phân tích việc sử dụng các công cụ học tập</CardDescription>
              </CardHeader>
              <CardContent>
                <ToolUsageChart />
                <div className="mt-6 space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Wordwall</span>
                      <span className="text-sm font-medium">42%</span>
                    </div>
                    <Progress value={42} className="h-2 bg-gray-100">
                      <div className="h-full bg-Clever School-blue rounded-full" style={{ width: "42%" }}></div>
                    </Progress>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Quizizz</span>
                      <span className="text-sm font-medium">35%</span>
                    </div>
                    <Progress value={35} className="h-2 bg-gray-100">
                      <div className="h-full bg-Clever School-yellow rounded-full" style={{ width: "35%" }}></div>
                    </Progress>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">TinyTap</span>
                      <span className="text-sm font-medium">23%</span>
                    </div>
                    <Progress value={23} className="h-2 bg-gray-100">
                      <div className="h-full bg-Clever School-green rounded-full" style={{ width: "23%" }}></div>
                    </Progress>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Skills and Learning Path Analytics */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div>
            <Card className="h-full card-kid border-Clever School-yellow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LucideBarChart2 className="h-5 w-5 text-Clever School-yellow" />
                  Phân tích kỹ năng
                </CardTitle>
                <CardDescription>Đánh giá chi tiết các kỹ năng tiếng Anh</CardDescription>
              </CardHeader>
              <CardContent>
                <SkillsRadarChart />
                <div className="mt-6 space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Nghe</span>
                      <div className="flex items-center gap-1">
                        <LucideArrowUp className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-green-500">+5%</span>
                      </div>
                    </div>
                    <Progress value={70} className="h-2 bg-gray-100">
                      <div className="h-full bg-Clever School-blue rounded-full" style={{ width: "70%" }}></div>
                    </Progress>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Nói</span>
                      <div className="flex items-center gap-1">
                        <LucideArrowUp className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-green-500">+3%</span>
                      </div>
                    </div>
                    <Progress value={50} className="h-2 bg-gray-100">
                      <div className="h-full bg-Clever School-yellow rounded-full" style={{ width: "50%" }}></div>
                    </Progress>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Đọc</span>
                      <div className="flex items-center gap-1">
                        <LucideArrowUp className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-green-500">+8%</span>
                      </div>
                    </div>
                    <Progress value={80} className="h-2 bg-gray-100">
                      <div className="h-full bg-Clever School-green rounded-full" style={{ width: "80%" }}></div>
                    </Progress>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Viết</span>
                      <div className="flex items-center gap-1">
                        <LucideArrowDown className="h-3 w-3 text-red-500" />
                        <span className="text-xs text-red-500">-2%</span>
                      </div>
                    </div>
                    <Progress value={60} className="h-2 bg-gray-100">
                      <div className="h-full bg-Clever School-orange rounded-full" style={{ width: "60%" }}></div>
                    </Progress>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="md:col-span-2">
            <Card className="h-full card-kid border-Clever School-orange">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LucideBookOpen className="h-5 w-5 text-Clever School-orange" />
                  Phân tích lộ trình học tập
                </CardTitle>
                <CardDescription>Tiến độ và hiệu quả của lộ trình học tập</CardDescription>
              </CardHeader>
              <CardContent>
                <LearningPathAnalytics />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Detailed Analytics */}
        <div className="mb-8">
          <Card className="card-kid border-Clever School-blue">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LucideUsers className="h-5 w-5 text-Clever School-blue" />
                Phân tích chi tiết
              </CardTitle>
              <CardDescription>Phân tích chi tiết theo từng khóa học và hoạt động</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="courses">
                <TabsList className="mb-4">
                  <TabsTrigger value="courses">Khóa học</TabsTrigger>
                  <TabsTrigger value="activities">Hoạt động</TabsTrigger>
                  <TabsTrigger value="tools">Công cụ tương tác</TabsTrigger>
                </TabsList>

                <TabsContent value="courses">
                  <div className="space-y-6">
                    {courseAnalytics.map((course) => (
                      <div key={course.id} className="border rounded-lg p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                          <div>
                            <h3 className="font-medium">{course.title}</h3>
                            <p className="text-sm text-gray-500">{course.description}</p>
                          </div>
                          <div className="mt-2 md:mt-0 flex flex-wrap gap-2">
                            <Badge variant="outline" className="text-xs">
                              {course.level}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="text-xs bg-Clever School-blue bg-opacity-10 text-Clever School-blue border-Clever School-blue"
                            >
                              {course.subject}
                            </Badge>
                          </div>
                        </div>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Tiến độ</p>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">
                                {course.completedLessons}/{course.totalLessons} bài học
                              </span>
                              <span className="text-sm font-medium">{course.progress}%</span>
                            </div>
                            <Progress value={course.progress} className="h-2 bg-gray-100">
                              <div
                                className="h-full bg-Clever School-blue rounded-full"
                                style={{ width: `${course.progress}%` }}
                              ></div>
                            </Progress>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Điểm trung bình</p>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">{course.averageScore}/100</span>
                              <div className="flex items-center gap-1">
                                {course.scoreChange > 0 ? (
                                  <>
                                    <LucideArrowUp className="h-3 w-3 text-green-500" />
                                    <span className="text-xs text-green-500">+{course.scoreChange}</span>
                                  </>
                                ) : (
                                  <>
                                    <LucideArrowDown className="h-3 w-3 text-red-500" />
                                    <span className="text-xs text-red-500">{course.scoreChange}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <Progress value={course.averageScore} className="h-2 bg-gray-100">
                              <div
                                className="h-full bg-Clever School-green rounded-full"
                                style={{ width: `${course.averageScore}%` }}
                              ></div>
                            </Progress>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Thời gian học</p>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">{course.timeSpent}</span>
                              <div className="flex items-center gap-1">
                                {course.timeChange > 0 ? (
                                  <>
                                    <LucideArrowUp className="h-3 w-3 text-green-500" />
                                    <span className="text-xs text-green-500">+{course.timeChange}</span>
                                  </>
                                ) : (
                                  <>
                                    <LucideArrowDown className="h-3 w-3 text-red-500" />
                                    <span className="text-xs text-red-500">{course.timeChange}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <Progress
                              value={(Number.parseInt(course.timeSpent) / 10) * 100}
                              className="h-2 bg-gray-100"
                            >
                              <div
                                className="h-full bg-Clever School-yellow rounded-full"
                                style={{ width: `${(Number.parseInt(course.timeSpent) / 10) * 100}%` }}
                              ></div>
                            </Progress>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="activities">
                  <div className="space-y-6">
                    {activityAnalytics.map((activity) => (
                      <div key={activity.id} className="border rounded-lg p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                          <div>
                            <h3 className="font-medium">{activity.title}</h3>
                            <p className="text-sm text-gray-500">{activity.type}</p>
                          </div>
                          <div className="mt-2 md:mt-0 flex flex-wrap gap-2">
                            <Badge
                              variant="outline"
                              className={`text-xs bg-Clever School-${activity.color} bg-opacity-10 text-Clever School-${activity.color} border-Clever School-${activity.color}`}
                            >
                              {activity.category}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {activity.completions} lượt hoàn thành
                            </Badge>
                          </div>
                        </div>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Tỷ lệ hoàn thành</p>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">{activity.completionRate}%</span>
                              <div className="flex items-center gap-1">
                                {activity.completionChange > 0 ? (
                                  <>
                                    <LucideArrowUp className="h-3 w-3 text-green-500" />
                                    <span className="text-xs text-green-500">+{activity.completionChange}%</span>
                                  </>
                                ) : (
                                  <>
                                    <LucideArrowDown className="h-3 w-3 text-red-500" />
                                    <span className="text-xs text-red-500">{activity.completionChange}%</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <Progress value={activity.completionRate} className="h-2 bg-gray-100">
                              <div
                                className={`h-full bg-Clever School-${activity.color} rounded-full`}
                                style={{ width: `${activity.completionRate}%` }}
                              ></div>
                            </Progress>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Điểm trung bình</p>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">{activity.averageScore}/100</span>
                              <div className="flex items-center gap-1">
                                {activity.scoreChange > 0 ? (
                                  <>
                                    <LucideArrowUp className="h-3 w-3 text-green-500" />
                                    <span className="text-xs text-green-500">+{activity.scoreChange}</span>
                                  </>
                                ) : (
                                  <>
                                    <LucideArrowDown className="h-3 w-3 text-red-500" />
                                    <span className="text-xs text-red-500">{activity.scoreChange}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <Progress value={activity.averageScore} className="h-2 bg-gray-100">
                              <div
                                className="h-full bg-Clever School-green rounded-full"
                                style={{ width: `${activity.averageScore}%` }}
                              ></div>
                            </Progress>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Thời gian trung bình</p>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">{activity.averageTime}</span>
                              <div className="flex items-center gap-1">
                                {activity.timeChange > 0 ? (
                                  <>
                                    <LucideArrowUp className="h-3 w-3 text-red-500" />
                                    <span className="text-xs text-red-500">+{activity.timeChange}</span>
                                  </>
                                ) : (
                                  <>
                                    <LucideArrowDown className="h-3 w-3 text-green-500" />
                                    <span className="text-xs text-green-500">{activity.timeChange}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <Progress
                              value={(Number.parseInt(activity.averageTime) / 10) * 100}
                              className="h-2 bg-gray-100"
                            >
                              <div
                                className="h-full bg-Clever School-yellow rounded-full"
                                style={{ width: `${(Number.parseInt(activity.averageTime) / 10) * 100}%` }}
                              ></div>
                            </Progress>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="tools">
                  <div className="space-y-6">
                    {toolAnalytics.map((tool) => (
                      <div key={tool.id} className="border rounded-lg p-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                          <div>
                            <h3 className="font-medium">{tool.name}</h3>
                            <p className="text-sm text-gray-500">{tool.description}</p>
                          </div>
                          <div className="mt-2 md:mt-0 flex flex-wrap gap-2">
                            <Badge
                              variant="outline"
                              className={`text-xs bg-Clever School-${tool.color} bg-opacity-10 text-Clever School-${tool.color} border-Clever School-${tool.color}`}
                            >
                              {tool.category}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {tool.usageCount} lượt sử dụng
                            </Badge>
                          </div>
                        </div>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Tỷ lệ tương tác</p>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">{tool.engagementRate}%</span>
                              <div className="flex items-center gap-1">
                                {tool.engagementChange > 0 ? (
                                  <>
                                    <LucideArrowUp className="h-3 w-3 text-green-500" />
                                    <span className="text-xs text-green-500">+{tool.engagementChange}%</span>
                                  </>
                                ) : (
                                  <>
                                    <LucideArrowDown className="h-3 w-3 text-red-500" />
                                    <span className="text-xs text-red-500">{tool.engagementChange}%</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <Progress value={tool.engagementRate} className="h-2 bg-gray-100">
                              <div
                                className={`h-full bg-Clever School-${tool.color} rounded-full`}
                                style={{ width: `${tool.engagementRate}%` }}
                              ></div>
                            </Progress>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Hiệu quả học tập</p>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">{tool.effectivenessRate}%</span>
                              <div className="flex items-center gap-1">
                                {tool.effectivenessChange > 0 ? (
                                  <>
                                    <LucideArrowUp className="h-3 w-3 text-green-500" />
                                    <span className="text-xs text-green-500">+{tool.effectivenessChange}%</span>
                                  </>
                                ) : (
                                  <>
                                    <LucideArrowDown className="h-3 w-3 text-red-500" />
                                    <span className="text-xs text-red-500">{tool.effectivenessChange}%</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <Progress value={tool.effectivenessRate} className="h-2 bg-gray-100">
                              <div
                                className="h-full bg-Clever School-green rounded-full"
                                style={{ width: `${tool.effectivenessRate}%` }}
                              ></div>
                            </Progress>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Thời gian sử dụng</p>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">{tool.averageTime}</span>
                              <div className="flex items-center gap-1">
                                {tool.timeChange > 0 ? (
                                  <>
                                    <LucideArrowUp className="h-3 w-3 text-green-500" />
                                    <span className="text-xs text-green-500">+{tool.timeChange}</span>
                                  </>
                                ) : (
                                  <>
                                    <LucideArrowDown className="h-3 w-3 text-red-500" />
                                    <span className="text-xs text-red-500">{tool.timeChange}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <Progress
                              value={(Number.parseInt(tool.averageTime) / 60) * 100}
                              className="h-2 bg-gray-100"
                            >
                              <div
                                className="h-full bg-Clever School-yellow rounded-full"
                                style={{ width: `${(Number.parseInt(tool.averageTime) / 60) * 100}%` }}
                              ></div>
                            </Progress>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Recommendations */}
        <div>
          <Card className="card-kid border-Clever School-green">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LucideBookOpen className="h-5 w-5 text-Clever School-green" />
                Đề xuất cải thiện
              </CardTitle>
              <CardDescription>Đề xuất dựa trên phân tích dữ liệu học tập</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {recommendations.map((recommendation, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-full bg-Clever School-${recommendation.color} bg-opacity-20 flex-shrink-0`}
                      >
                        {recommendation.icon}
                      </div>
                      <div>
                        <h3 className="font-bold mb-1">{recommendation.title}</h3>
                        <p className="text-gray-600 mb-3">{recommendation.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {recommendation.tags.map((tag, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className={`text-xs bg-Clever School-${recommendation.color} bg-opacity-10 text-Clever School-${recommendation.color} border-Clever School-${recommendation.color}`}
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

function AnalyticsCard({
  title,
  value,
  change,
  changeType,
  description,
  color,
  icon,
}: {
  title: string
  value: string
  change: string
  changeType: "increase" | "decrease" | "neutral"
  description: string
  color: string
  icon: React.ReactNode
}) {
  return (
    <Card className={`card-kid border-Clever School-${color}`}>
      <CardContent className="pt-6">
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-500">{title}</span>
            {icon}
          </div>
          <span className="text-2xl font-bold mt-1">{value}</span>
          <div className="flex items-center mt-2">
            <span
              className={`text-xs ${
                changeType === "increase"
                  ? "text-green-500"
                  : changeType === "decrease"
                    ? "text-red-500"
                    : "text-gray-500"
              }`}
            >
              {change}
            </span>
            <span className="text-xs text-gray-500 ml-1">{description}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Sample data
const courseAnalytics = [
  {
    id: 1,
    title: "Luyện nghe tiếng Anh cơ bản",
    description: "Cải thiện kỹ năng nghe với các bài tập thực tế",
    level: "Sơ cấp",
    subject: "Tiếng Anh",
    completedLessons: 8,
    totalLessons: 12,
    progress: 67,
    averageScore: 85,
    scoreChange: 5,
    timeSpent: "8 giờ 30 phút",
    timeChange: "1 giờ 15 phút",
  },
  {
    id: 2,
    title: "Ngữ pháp tiếng Anh cơ bản",
    description: "Nắm vững các cấu trúc ngữ pháp cơ bản trong tiếng Anh",
    level: "Sơ cấp",
    subject: "Tiếng Anh",
    completedLessons: 10,
    totalLessons: 14,
    progress: 71,
    averageScore: 78,
    scoreChange: -3,
    timeSpent: "6 giờ 45 phút",
    timeChange: "45 phút",
  },
  {
    id: 3,
    title: "Luyện nói giao tiếp hàng ngày",
    description: "Thực hành nói tiếng Anh trong các tình huống hàng ngày",
    level: "Trung cấp",
    subject: "Tiếng Anh",
    completedLessons: 4,
    totalLessons: 15,
    progress: 27,
    averageScore: 82,
    scoreChange: 2,
    timeSpent: "5 giờ 20 phút",
    timeChange: "2 giờ 10 phút",
  },
]

const activityAnalytics = [
  {
    id: 1,
    title: "Từ vựng về động vật",
    type: "Wordwall - Ghép đôi",
    category: "Từ vựng",
    color: "blue",
    completions: 28,
    completionRate: 85,
    completionChange: 5,
    averageScore: 92,
    scoreChange: 3,
    averageTime: "8 phút",
    timeChange: "1 phút",
  },
  {
    id: 2,
    title: "Ngữ pháp: Thì hiện tại đơn",
    type: "Quizizz - Trắc nghiệm",
    category: "Ngữ pháp",
    color: "green",
    completions: 22,
    completionRate: 75,
    completionChange: -3,
    averageScore: 78,
    scoreChange: -2,
    averageTime: "12 phút",
    timeChange: "2 phút",
  },
  {
    id: 3,
    title: "Học chữ cái tiếng Anh",
    type: "TinyTap - Tương tác",
    category: "Từ vựng",
    color: "yellow",
    completions: 35,
    completionRate: 92,
    completionChange: 8,
    averageScore: 95,
    scoreChange: 5,
    averageTime: "6 phút",
    timeChange: "-1 phút",
  },
]

const toolAnalytics = [
  {
    id: 1,
    name: "Wordwall",
    description: "Trò chơi từ vựng và ngữ pháp tương tác",
    category: "Từ vựng",
    color: "blue",
    usageCount: 42,
    engagementRate: 78,
    engagementChange: 5,
    effectivenessRate: 85,
    effectivenessChange: 3,
    averageTime: "10 phút",
    timeChange: "2 phút",
  },
  {
    id: 2,
    name: "Quizizz",
    description: "Bài kiểm tra tương tác và thú vị",
    category: "Kiểm tra",
    color: "yellow",
    usageCount: 35,
    engagementRate: 72,
    engagementChange: -2,
    effectivenessRate: 80,
    effectivenessChange: 0,
    averageTime: "15 phút",
    timeChange: "0 phút",
  },
  {
    id: 3,
    name: "TinyTap",
    description: "Trò chơi học tập tương tác cho người học",
    category: "Tương tác",
    color: "green",
    usageCount: 23,
    engagementRate: 85,
    engagementChange: 10,
    effectivenessRate: 88,
    effectivenessChange: 5,
    averageTime: "8 phút",
    timeChange: "-1 phút",
  },
]

const recommendations = [
  {
    title: "Tăng cường luyện tập kỹ năng viết",
    description:
      "Dựa trên phân tích, kỹ năng viết của bạn đang giảm nhẹ. Hãy dành thêm thời gian cho các bài tập viết và sử dụng các công cụ tương tác để cải thiện.",
    color: "blue",
    icon: <LucideBookOpen className="h-5 w-5 text-Clever School-blue" />,
    tags: ["Kỹ năng viết", "Cần cải thiện", "Ưu tiên cao"],
  },
  {
    title: "Sử dụng thêm Quizizz để luyện tập ngữ pháp",
    description:
      "Điểm ngữ pháp của bạn đang giảm nhẹ. Quizizz có nhiều bài kiểm tra ngữ pháp hiệu quả có thể giúp bạn cải thiện điểm số.",
    color: "yellow",
    icon: <LucideGamepad2 className="h-5 w-5 text-Clever School-yellow" />,
    tags: ["Ngữ pháp", "Quizizz", "Công cụ tương tác"],
  },
  {
    title: "Tăng thời gian học khóa Luyện nói giao tiếp",
    description:
      "Bạn đang tiến bộ tốt trong khóa học này, nhưng tiến độ còn chậm. Tăng thời gian học sẽ giúp bạn hoàn thành khóa học nhanh hơn.",
    color: "green",
    icon: <LucideBarChart2 className="h-5 w-5 text-Clever School-green" />,
    tags: ["Kỹ năng nói", "Tiến độ", "Khóa học"],
  },
]
