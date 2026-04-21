"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit } from "lucide-react";
import {
  GetGroupDetail,
  AssessmentCriteriaGroup,
} from "@/lib/api/group-criteria";
import { GetSubjectsList } from "@/lib/api/subjects";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/app/loading";

export default function CriteriaAssessmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string;
  const id = params?.id as string;
  const { toast } = useToast();
  const [initializing, setInitializing] = useState(true);
  const [groupData, setGroupData] = useState<
    AssessmentCriteriaGroup | undefined
  >();
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>(
    []
  );

  // Fetch subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await GetSubjectsList();
        // Response structure: { code, message, data: { subjects: [...] }, error }
        if (response?.data?.subjects && Array.isArray(response.data.subjects)) {
          setSubjects(
            response.data.subjects.map((s: any) => ({
              id: String(s.id),
              name: s.name,
            }))
          );
        }
      } catch (error: any) {
        console.error("Error fetching subjects:", error);
      }
    };
    fetchSubjects();
  }, []);

  // Fetch group detail
  useEffect(() => {
    const fetchGroupDetail = async () => {
      try {
        setInitializing(true);
        const response = await GetGroupDetail(id);

        if (response) {
          setGroupData(response);
        } else {
          toast({
            title: "Lỗi",
            description: "Không tìm thấy nhóm tiêu chí đánh giá",
            variant: "destructive",
          });
          router.push(`/${locale}/admin/criteria-assessment`);
        }
      } catch (error: any) {
        console.error("Error fetching group detail:", error);
        toast({
          title: "Lỗi",
          description:
            error?.response?.data?.message ||
            error?.message ||
            "Không thể tải thông tin nhóm tiêu chí đánh giá",
          variant: "destructive",
        });
        router.push(`/${locale}/admin/criteria-assessment`);
      } finally {
        setInitializing(false);
      }
    };

    if (id) {
      fetchGroupDetail();
    }
  }, [id, locale, router, toast]);

  const getSubjectName = (subjectId: string | number) => {
    const subject = subjects.find((s) => String(s.id) === String(subjectId));
    return subject?.name || `Môn học ID: ${subjectId}`;
  };

  if (initializing) {
    return <Loading />;
  }

  if (!groupData) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
          <Button
            onClick={() =>
              router.push(`/${locale}/admin/criteria-assessment/${id}/edit`)
            }
            className="bg-[#EB8922] hover:bg-[#d97a1a] text-white"
          >
            <Edit className="mr-2 h-4 w-4" />
            Chỉnh sửa
          </Button>
        </div>

        <Card className="max-w-8xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">
              Chi tiết bảng tiêu chí đánh giá điểm
            </CardTitle>
            <CardDescription>
              Thông tin chi tiết về bảng tiêu chí đánh giá điểm
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Thông tin cơ bản</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Môn học</Label>
                  <div className="mt-1">
                    <Badge variant="outline" className="text-base px-3 py-1">
                      {getSubjectName(groupData.subject_id)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Tên bảng</Label>
                  <div className="mt-1 text-base font-medium">
                    {groupData.name}
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Ngày tạo</Label>
                  <div className="mt-1 text-base">
                    {groupData.created_at
                      ? new Date(
                          Number(groupData.created_at) * 1000
                        ).toLocaleString("vi-VN", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })
                      : "-"}
                  </div>
                </div>
              </div>
            </div>

            {/* Criteria Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Tiêu chí đánh giá</h3>
              {groupData.criteria && groupData.criteria.length > 0 ? (
                <div className="space-y-4">
                  {groupData.criteria.map((criterion, criteriaIndex) => (
                    <Card
                      key={criteriaIndex}
                      className="border-l-4 border-l-blue-500"
                    >
                      <CardHeader className="py-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-4">
                              <div className="flex-1">
                                <Label className="text-sm text-gray-600">
                                  Tên tiêu chí
                                </Label>
                                <div className="mt-1 text-base font-medium">
                                  {criterion.name}
                                </div>
                              </div>
                              <div>
                                <Label className="text-sm text-gray-600">
                                  Điểm tối đa
                                </Label>
                                <div className="mt-1 text-base font-semibold text-blue-600">
                                  {criterion.max_score}
                                </div>
                              </div>
                            </div>
                            {criterion.description && (
                              <div>
                                <Label className="text-sm text-gray-600">
                                  Mô tả
                                </Label>
                                <div className="mt-1 text-base text-gray-700">
                                  {criterion.description}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      {criterion.subcriteria &&
                        criterion.subcriteria.length > 0 && (
                          <CardContent className="pt-0">
                            <div className="space-y-2 pl-4 border-l-2 border-gray-200">
                              <Label className="text-sm font-medium text-gray-700">
                                Tiêu chí con:
                              </Label>
                              {criterion.subcriteria.map(
                                (subcriteria, subcriteriaIndex) => (
                                  <div
                                    key={subcriteriaIndex}
                                    className="space-y-1 py-2"
                                  >
                                    <div className="flex items-center gap-4">
                                      <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-900">
                                          {subcriteria.name}
                                        </div>
                                        {subcriteria.description && (
                                          <div className="text-sm text-gray-600 mt-1">
                                            {subcriteria.description}
                                          </div>
                                        )}
                                      </div>
                                      <div className="text-sm font-semibold text-green-600">
                                        {subcriteria.max_score} điểm
                                      </div>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </CardContent>
                        )}
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  Chưa có tiêu chí nào
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

// Label component for display
function Label({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label
      className={`block text-sm font-medium text-gray-700 ${className || ""}`}
    >
      {children}
    </label>
  );
}
