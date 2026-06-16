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
  GetSemesterDetail,
  UpdateSemester,
  CreateSemesterRequest,
  Holiday,
  CreateSemesterHoliday,
} from "@/lib/api/semesters";
import { useToast } from "@/hooks/use-toast";
import Loading from "@/app/loading";
import SemesterForm, { SemesterFormData } from "../../components/semester-form";
import { useTranslations } from "next-intl";

export default function EditSemesterPage() {
  const t = useTranslations("manageSemester");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string;
  const id = params?.id as string;
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [initialData, setInitialData] = useState<
    SemesterFormData | undefined
  >();
  const [existingHolidays, setExistingHolidays] = useState<Holiday[]>([]);

  useEffect(() => {
    const fetchSemester = async () => {
      try {
        setInitializing(true);
        const response = await GetSemesterDetail(id);

        if (response?.data) {
          const semester = response.data;

          // Format dates for input
          const formatDateForInput = (dateString: string) => {
            if (!dateString || dateString === "0001-01-01") return "";
            try {
              const date = new Date(dateString);
              return date.toISOString().split("T")[0];
            } catch {
              return "";
            }
          };

          // Parse week_id values, ensuring they are numbers
          const parseWeekId = (value: string | number | undefined): number => {
            if (!value && value !== 0) return 0;
            if (typeof value === "number") return value;
            const parsed = parseInt(String(value), 10);
            return isNaN(parsed) ? 0 : parsed;
          };

          setExistingHolidays(semester.holidays || []);

          setInitialData({
            name: semester.name || "",
            description: semester.description || "",
            start_date: formatDateForInput(semester.start_date),
            end_date: formatDateForInput(semester.end_date),
            start_week_id: parseWeekId(semester.start_week_id),
            end_week_id: parseWeekId(semester.end_week_id),
            previous_semester_id: parseWeekId(semester.previous_semester_id),
            status: semester.status !== undefined ? semester.status : true,
          });
        } else {
          toast({
            title: tCommon("error"),
            description: "Không tìm thấy học kỳ",
            variant: "destructive",
          });
          router.push(`/${locale}/admin/semesters`);
        }
      } catch (error: any) {
        console.error("Error fetching semester:", error);
        toast({
          title: tCommon("error"),
          description:
            error?.response?.data?.message ||
            error?.message ||
            "Không thể tải thông tin học kỳ",
          variant: "destructive",
        });
        router.push(`/${locale}/admin/semesters`);
      } finally {
        setInitializing(false);
      }
    };

    if (id) {
      fetchSemester();
    }
  }, [id, locale, router, toast, tCommon]);

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

      const semesterData: CreateSemesterRequest = {
        name: data.name.trim(),
        description: data.description.trim(),
        start_date: data.start_date,
        end_date: data.end_date,
        start_week_id: data.start_week_id,
        end_week_id: data.end_week_id,
        previous_semester_id: data.previous_semester_id,
        sort_order: 0,
        status: data.status,
        holidays: existingHolidays.map(
          (holiday): CreateSemesterHoliday & { id?: number } => ({
            ...(holiday.id ? { id: Number(holiday.id) } : {}),
            name: holiday.name || "",
            description: holiday.description || "",
            start_date: holiday.start_date || "",
            end_date: holiday.end_date || "",
            week_id:
              typeof holiday.week_id === "string"
                ? parseInt(holiday.week_id, 10) || 0
                : holiday.week_id || 0,
            sort_order: holiday.sort_order || 0,
            status: holiday.status ?? true,
          })
        ),
      };

      const semesterResponse = await UpdateSemester(id, semesterData);

      if (semesterResponse?.code === 200) {
        toast({
          title: tCommon("success"),
          description: "Cập nhật học kỳ thành công",
        });
        router.push(`/${locale}/admin/semesters`);
      } else {
        throw new Error(semesterResponse?.message || "Có lỗi xảy ra");
      }
    } catch (error: any) {
      console.error("Error updating semester:", error);
      toast({
        title: tCommon("error"),
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Không thể cập nhật học kỳ",
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
          Quay lại
        </Button>

        <Card className="max-w-8xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Chỉnh sửa học kỳ</CardTitle>
            <CardDescription>
              Cập nhật thông tin học kỳ trong hệ thống
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SemesterForm
              initialData={initialData}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={loading}
              submitButtonText="Cập nhật"
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
