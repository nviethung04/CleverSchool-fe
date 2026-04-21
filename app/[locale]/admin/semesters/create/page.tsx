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
import { CreateSemester, CreateSemesterRequest } from "@/lib/api/semesters";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/app/loading";
import SemesterForm, {
  SemesterFormData,
  HolidayFormData,
} from "../components/semester-form";
import { useTranslations } from "next-intl";

export default function CreateSemesterPage() {
  const t = useTranslations("manageSemester");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string;
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: SemesterFormData) => {
    if (!data.name.trim()) {
      toast({
        title: tCommon("error"),
        description: "Vui lòng nhập tên học kỳ",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Format dates to ISO string
      const formatDateToISO = (dateString: string) => {
        if (!dateString) return new Date().toISOString();
        return new Date(dateString).toISOString();
      };

      // Prepare semester data với holidays đầy đủ thông tin
      const semesterData: CreateSemesterRequest = {
        name: data.name.trim(),
        description: data.description.trim(),
        start_date: formatDateToISO(data.start_date),
        end_date: formatDateToISO(data.end_date),
        start_week_id: data.start_week_id,
        end_week_id: data.end_week_id,
        previous_semester_id: data.previous_semester_id,
        sort_order: 0,
        status: data.status,
        holidays: data.holidays.map((holiday: HolidayFormData) => ({
          name: holiday.name.trim(),
          description: holiday.description.trim(),
          start_date: formatDateToISO(holiday.start_date),
          end_date: formatDateToISO(holiday.end_date),
          week_id: holiday.week_id,
          sort_order: holiday.sort_order,
          status: holiday.status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })),
      };

      // Tạo semester (holidays sẽ được tạo cùng với semester)
      const semesterResponse = await CreateSemester(semesterData);

      if (semesterResponse?.code === 200) {
        toast({
          title: tCommon("success"),
          description: "Tạo học kỳ thành công",
        });
        router.push(`/${locale}/admin/semesters`);
      } else {
        throw new Error(semesterResponse?.message || "Có lỗi xảy ra");
      }
    } catch (error: any) {
      console.error("Error creating semester:", error);
      toast({
        title: tCommon("error"),
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể tạo học kỳ",
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
          Quay lại
        </Button>

        <Card className="max-w-8xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Tạo học kỳ mới</CardTitle>
            <CardDescription>
              Điền thông tin để tạo học kỳ mới trong hệ thống
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SemesterForm
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={loading}
              submitButtonText="Tạo học kỳ"
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
