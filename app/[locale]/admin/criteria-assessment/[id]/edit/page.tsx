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
import { ArrowLeft } from "lucide-react";
import {
  GetGroupDetail,
  UpdateGroupWithCriteria,
  AssessmentCriteriaGroup,
} from "@/lib/api/group-criteria";
import { GetSubjectsList } from "@/lib/api/subjects";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/app/loading";
import CriteriaAssessmentForm from "../../components/criteria-assessment-form";
import { CreateGroupWithCriteriaRequest } from "@/lib/api/group-criteria";
import { sortAlphabetGeneric } from "@/lib/utils";

export default function EditCriteriaAssessmentPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string;
  const id = params?.id as string;
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [initialData, setInitialData] = useState<
    AssessmentCriteriaGroup | undefined
  >();
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  // Fetch subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoadingSubjects(true);
        const response = await GetSubjectsList();
        // Response structure: { code, message, data: { subjects: [...] }, error }
        if (response?.data?.subjects && Array.isArray(response.data.subjects)) {
          setSubjects(
            response.data.subjects.map((s: any) => ({
              id: String(s.id),
              name: s.name,
            }))
          );
        } else {
          setSubjects([]);
        }
      } catch (error: any) {
        console.error("Error fetching subjects:", error);
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách môn học",
          variant: "destructive",
        });
        setSubjects([]);
      } finally {
        setLoadingSubjects(false);
      }
    };
    fetchSubjects();
  }, [toast]);

  // Fetch group detail
  useEffect(() => {
    const fetchGroupDetail = async () => {
      try {
        setInitializing(true);
        const response = await GetGroupDetail(id);

        if (response) {
          // Create a new object to ensure React detects the change in production
          setInitialData({
            ...response,
            criteria: response.criteria
              ? response.criteria.map((c: any) => ({
                  ...c,
                  subcriteria: c.subcriteria
                    ? c.subcriteria.map((s: any) => ({ ...s }))
                    : [],
                }))
              : [],
          });
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

  const handleSubmit = async (data: CreateGroupWithCriteriaRequest) => {
    if (!data.group.name.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tên nhóm",
        variant: "destructive",
      });
      return;
    }

    if (!data.group.subject_id) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn môn học",
        variant: "destructive",
      });
      return;
    }

    if (data.criteria.length === 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng thêm ít nhất một tiêu chí",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await UpdateGroupWithCriteria(id, data);

      if (response) {
        toast({
          title: "Thành công",
          description: "Cập nhật nhóm tiêu chí đánh giá thành công",
        });
        router.push(`/${locale}/admin/criteria-assessment`);
      }
    } catch (error: any) {
      console.error("Error updating group:", error);
      toast({
        title: "Lỗi",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể cập nhật nhóm tiêu chí đánh giá",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (initializing || loadingSubjects) {
    return <Loading />;
  }

  if (!initialData) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <Button variant="ghost" onClick={handleCancel} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>

        <Card className="max-w-8xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">
              Chỉnh sửa bảng tiêu chí đánh giá điểm
            </CardTitle>
            <CardDescription>
              Cập nhật thông tin bảng tiêu chí đánh giá điểm
            </CardDescription>
          </CardHeader>
          <CardContent>
            {initialData && (
              <CriteriaAssessmentForm
                key={initialData.id}
                initialData={initialData}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isSubmitting={loading}
                submitButtonText="Cập nhật"
                subjects={sortAlphabetGeneric(subjects, item => item.name, true)}
              />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
