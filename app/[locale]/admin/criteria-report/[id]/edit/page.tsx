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
  GetStudyReportCriteriaDetail,
  UpdateStudyReportCriteria,
  StudyReportCriteria,
} from "@/lib/api/report-criteria";
import { GetSubjectsList } from "@/lib/api/subjects";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/app/loading";
import CriteriaForm from "../../components/criteria-form";
import { useTranslations } from "next-intl";
import { CreateStudyReportCriteriaRequest } from "@/lib/api/report-criteria";
import { sortAlphabetGeneric } from "@/lib/utils";

export default function EditCriteriaReportPage() {
  const t = useTranslations("criteriaReport");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string;
  const id = params?.id as string;
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [initialData, setInitialData] = useState<
    StudyReportCriteria | undefined
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

  // Fetch criteria detail
  useEffect(() => {
    const fetchCriteria = async () => {
      try {
        setInitializing(true);
        const response = await GetStudyReportCriteriaDetail(id);

        if (response?.code === 200 && response?.data) {
          console.log("Edit page: API response data", response.data);
          // Create a new object to ensure React detects the change in production
          setInitialData({
            ...response.data,
            notes: response.data.notes ? [...response.data.notes] : [],
            star_skills: response.data.star_skills
              ? response.data.star_skills.map((s: any) => ({
                  ...s,
                  types: s.types ? [...s.types] : [],
                }))
              : [],
            check_skills: response.data.check_skills
              ? response.data.check_skills.map((s: any) => ({
                  ...s,
                  types: s.types ? [...s.types] : [],
                }))
              : [],
          });
        } else {
          toast({
            title: tCommon("error"),
            description: t("edit.notFound") || "Không tìm thấy tiêu chí",
            variant: "destructive",
          });
          router.push(`/${locale}/admin/criteria-report`);
        }
      } catch (error: any) {
        console.error("Error fetching criteria:", error);
        toast({
          title: tCommon("error"),
          description:
            error?.response?.data?.message ||
            error?.message ||
            t("edit.loadError") ||
            "Không thể tải thông tin tiêu chí",
          variant: "destructive",
        });
        router.push(`/${locale}/admin/criteria-report`);
      } finally {
        setInitializing(false);
      }
    };

    if (id) {
      fetchCriteria();
    }
  }, [id, locale, router, toast, tCommon, t]);

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
      const response = await UpdateStudyReportCriteria(id, data);

      if (response?.code === 200) {
        toast({
          title: tCommon("success"),
          description: t("edit.success") || "Cập nhật tiêu chí thành công",
        });
        router.push(`/${locale}/admin/criteria-report`);
      } else {
        throw new Error(response?.message || "Có lỗi xảy ra");
      }
    } catch (error: any) {
      console.error("Error updating criteria:", error);
      toast({
        title: tCommon("error"),
        description:
          error?.response?.data?.message ||
          error?.message ||
          t("edit.error") ||
          "Không thể cập nhật tiêu chí",
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
          {t("edit.backButton") || tCommon("back")}
        </Button>

        <Card className="max-w-8xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">
              {t("edit.title") || "Chỉnh sửa tiêu chí báo cáo học tập"}
            </CardTitle>
            <CardDescription>
              {t("edit.description") ||
                "Cập nhật thông tin tiêu chí đánh giá báo cáo học tập"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {initialData && (
              <CriteriaForm
                key={initialData.id}
                initialData={initialData}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isSubmitting={loading}
                submitButtonText={t("edit.submitButton") || "Cập nhật"}
                subjects={sortAlphabetGeneric(subjects, item => item.name, true)}
              />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
