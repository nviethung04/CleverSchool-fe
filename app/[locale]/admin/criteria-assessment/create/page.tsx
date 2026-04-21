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
import { CreateGroupWithCriteria } from "@/lib/api/group-criteria";
import { GetSubjectsList } from "@/lib/api/subjects";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/app/loading";
import CriteriaAssessmentForm from "../components/criteria-assessment-form";
import { CreateGroupWithCriteriaRequest } from "@/lib/api/group-criteria";
import { sortAlphabetGeneric } from "@/lib/utils";

export default function CreateCriteriaAssessmentPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string;
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
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
      const response = await CreateGroupWithCriteria(data);

      if (response) {
        toast({
          title: "Thành công",
          description: "Tạo nhóm tiêu chí đánh giá thành công",
        });
        router.push(`/${locale}/admin/criteria-assessment`);
      }
    } catch (error: any) {
      console.error("Error creating criteria assessment group:", error);
      toast({
        title: "Lỗi",
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể tạo nhóm tiêu chí đánh giá",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (loadingSubjects) {
    return <Loading />;
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
              Tạo bảng tiêu chí đánh giá điểm
            </CardTitle>
            <CardDescription>
              Tạo mới bảng tiêu chí đánh giá điểm với các tiêu chí và tiêu chí
              con
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CriteriaAssessmentForm
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={loading}
              submitButtonText="Tạo mới"
              subjects={sortAlphabetGeneric(subjects, item => item.name, true)}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
