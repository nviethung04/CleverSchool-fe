"use client";

import { useState } from "react";
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
import { CreateSubject } from "@/lib/api/subjects";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/app/loading";
import SubjectForm, { SubjectFormData } from "../components/subject-form";
import { useTranslations } from "next-intl";

export default function CreateSubjectPage() {
  const t = useTranslations('manageSubject')
  const tCommon = useTranslations('common')
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string;
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: SubjectFormData) => {
    if (!data.name.trim()) {
      toast({
        title: tCommon('error'),
        description: t('create.nameRequired'),
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await CreateSubject(data);

      if (response?.code === 200) {
        toast({
          title: tCommon('success'),
          description: t('create.success'),
        });
        router.push(`/${locale}/admin/subjects`);
      } else {
        throw new Error(response?.message || "Có lỗi xảy ra");
      }
    } catch (error: any) {
      console.error("Error creating subject:", error);
      toast({
        title: tCommon('error'),
        description:
          error?.response?.data?.message ||
          error?.message ||
          t('create.error'),
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

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <Button variant="ghost" onClick={handleCancel} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
            {t('create.backButton')}
        </Button>

        <Card className="max-w-8xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">{t('create.title')}</CardTitle>
            <CardDescription>
              {t('create.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SubjectForm
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={loading}
              submitButtonText={t('create.submitButton')}

            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
