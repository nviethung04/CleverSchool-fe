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
import { CreateStudyReportCriteria } from "@/lib/api/report-criteria";
import { GetSubjectsList } from "@/lib/api/subjects";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/app/loading";
import CriteriaForm from "../components/criteria-form";
import { useTranslations } from "next-intl";
import { CreateStudyReportCriteriaRequest } from "@/lib/api/report-criteria";
import { sortAlphabetGeneric } from "@/lib/utils";

export default function CreateCriteriaReportPage() {
  const t = useTranslations("criteriaReport");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string;
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoadingSubjects(true);
        const response = await GetSubjectsList();
        if (response?.data?.subjects) {
          setSubjects(
            response.data.subjects.map((s: any) => ({
              id: String(s.id),
              name: s.name,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching subjects:", error);
        toast({
          title: tCommon("error"),
          description: "Không thể tải danh sách môn học",
          variant: "destructive",
        });
      } finally {
        setLoadingSubjects(false);
      }
    };
    fetchSubjects();
  }, [toast, tCommon]);

  const handleSubmit = async (data: CreateStudyReportCriteriaRequest) => {
    if (!data.name.trim()) {
      toast({
        title: tCommon("error"),
        description: "Vui lòng nhập tên tiêu chí",
        variant: "destructive",
      });
      return;
    }

    if (!data.subject_id) {
      toast({
        title: tCommon("error"),
        description: "Vui lòng chọn môn học",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await CreateStudyReportCriteria(data);

      if (response?.code === 200) {
        toast({
          title: tCommon("success"),
          description: t("create.success") || "Tạo tiêu chí thành công",
        });
        router.push(`/${locale}/admin/criteria-report`);
      } else {
        throw new Error(response?.message || "Có lỗi xảy ra");
      }
    } catch (error: any) {
      console.error("Error creating criteria:", error);
      toast({
        title: tCommon("error"),
        description:
          error?.response?.data?.message ||
          error?.message ||
          t("create.error") ||
          "Không thể tạo tiêu chí",
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
          {t("create.backButton") || tCommon("back")}
        </Button>

        <Card className="max-w-8xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">
              {t("create.title") || "Tạo tiêu chí báo cáo học tập mới"}
            </CardTitle>
            <CardDescription>
              {t("create.description") ||
                "Điền thông tin để tạo tiêu chí đánh giá báo cáo học tập mới"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CriteriaForm
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={loading}
              submitButtonText={t("create.submitButton") || "Tạo tiêu chí"}
              subjects={sortAlphabetGeneric(subjects, item => item.name, true)}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
