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
import { GetSubjectById, UpdateSubject } from "@/lib/api/subjects";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/app/loading";
import SubjectForm, { SubjectFormData } from "../../components/subject-form";
import { useTranslations } from "next-intl";

export default function EditSubjectPage() {
  const t = useTranslations('manageSubject')
  const tCommon = useTranslations('common')
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string;
  const id = params?.id as string;
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [initialData, setInitialData] = useState<SubjectFormData | undefined>();

  useEffect(() => {
    const fetchSubject = async () => {
      try {
        setInitializing(true);
        const response = await GetSubjectById(id);

        if (response?.data) {
          const subject = response.data;
          setInitialData({
            name: subject.name || "",
            description: subject.description || "",
            status: subject.status !== undefined ? subject.status : true,
          });
        } else {
          toast({
            title: tCommon('error'),
            description: t('edit.notFound'),
            variant: "destructive",
          });
          router.push(`/${locale}/admin/subjects`);
        }
      } catch (error: any) {
        console.error("Error fetching subject:", error);
        toast({
          title: tCommon('error'),
          description:
            error?.response?.data?.message ||
            error?.message ||
            t('edit.loadError'),
          variant: "destructive",
        });
        router.push(`/${locale}/admin/subjects`);
      } finally {
        setInitializing(false);
      }
    };

    if (id) {
      fetchSubject();
    }
  }, [id, locale, router, toast]);

  const handleSubmit = async (data: SubjectFormData) => {
    if (!data.name.trim()) {
      toast({
        title: tCommon('error'),
        description: t('edit.nameRequired'),
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await UpdateSubject(id, data);

      if (response?.code === 200) {
        toast({
          title: tCommon('success'),
          description:  t('edit.success'),
        });
        router.push(`/${locale}/admin/subjects`);
      } else {
        throw new Error(response?.message || "Có lỗi xảy ra");
      }
    } catch (error: any) {
      console.error("Error updating subject:", error);
      toast({
        title: tCommon('error'),
        description:
          error?.response?.data?.message ||
          error?.message ||
          t('edit.error'),
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (initializing || loading) {
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
          {t('edit.backButton')}
        </Button>

        <Card className="max-w-8xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">{t('edit.title')}</CardTitle>
            <CardDescription>
              {t('edit.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SubjectForm
              initialData={initialData}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={loading}
              submitButtonText={t('edit.submitButton')}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
