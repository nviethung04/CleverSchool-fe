"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { getWeeks, Week } from "@/lib/api/students";
import { GetSemestersList, Semester } from "@/lib/api/semesters";
import { CreateHoliday, Holiday } from "@/lib/api/holidays";

export interface HolidayFormData {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  week_id: number;
  sort_order: number;
  status: boolean;
}

export interface SemesterFormData {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  start_week_id: number;
  end_week_id: number;
  previous_semester_id: number;
  status: boolean;
  holidays: HolidayFormData[];
}

interface SemesterFormProps {
  initialData?: SemesterFormData;
  onSubmit: (data: SemesterFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitButtonText?: string;
}

export default function SemesterForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitButtonText = "Lưu",
}: SemesterFormProps) {
  const t = useTranslations("manageSemester");
  const tCommon = useTranslations("common");
  const [formData, setFormData] = useState<SemesterFormData>({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    start_week_id: 0,
    end_week_id: 0,
    previous_semester_id: 0,
    status: true,
    holidays: [],
  });

  const [weeks, setWeeks] = useState<Week[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loadingWeeks, setLoadingWeeks] = useState(false);
  const [loadingSemesters, setLoadingSemesters] = useState(false);

  // Load weeks
  useEffect(() => {
    const fetchWeeks = async () => {
      try {
        setLoadingWeeks(true);
        const response = await getWeeks();
        if (response?.data?.weeks) {
          setWeeks(response.data.weeks);
        }
      } catch (error) {
        console.error("Error fetching weeks:", error);
      } finally {
        setLoadingWeeks(false);
      }
    };
    fetchWeeks();
  }, []);

  // Load semesters for previous_semester_id
  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        setLoadingSemesters(true);
        const response = await GetSemestersList();
        if (response?.data?.semesters) {
          setSemesters(response.data.semesters);
        }
      } catch (error) {
        console.error("Error fetching semesters:", error);
      } finally {
        setLoadingSemesters(false);
      }
    };
    fetchSemesters();
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
        start_date: initialData.start_date || "",
        end_date: initialData.end_date || "",
        start_week_id: initialData.start_week_id ?? 0,
        end_week_id: initialData.end_week_id ?? 0,
        previous_semester_id: initialData.previous_semester_id ?? 0,
        status: initialData.status !== undefined ? initialData.status : true,
        holidays: initialData.holidays || [],
      });
    }
  }, [initialData]);

  const formatDateForInput = (dateString: string) => {
    if (!dateString || dateString === "0001-01-01") return "";
    try {
      const date = new Date(dateString);
      return date.toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      return;
    }

    await onSubmit(formData);
  };

  const addHoliday = () => {
    setFormData({
      ...formData,
      holidays: [
        ...formData.holidays,
        {
          id: "",
          name: "",
          description: "",
          start_date: "",
          end_date: "",
          week_id: 0,
          sort_order: formData.holidays.length,
          status: true,
        },
      ],
    });
  };

  const removeHoliday = (index: number) => {
    setFormData({
      ...formData,
      holidays: formData.holidays.filter((_, i) => i !== index),
    });
  };

  const updateHoliday = (
    index: number,
    field: keyof HolidayFormData,
    value: any
  ) => {
    const updatedHolidays = [...formData.holidays];
    updatedHolidays[index] = {
      ...updatedHolidays[index],
      [field]: value,
    };
    setFormData({
      ...formData,
      holidays: updatedHolidays,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">
          Tên học kỳ <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          placeholder="Nhập tên học kỳ"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Mô tả</Label>
        <Textarea
          id="description"
          placeholder="Nhập mô tả học kỳ"
          rows={4}
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">
            Ngày bắt đầu <span className="text-red-500">*</span>
          </Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) =>
              setFormData({ ...formData, start_date: e.target.value })
            }
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_date">
            Ngày kết thúc <span className="text-red-500">*</span>
          </Label>
          <Input
            id="end_date"
            type="date"
            value={formData.end_date}
            onChange={(e) =>
              setFormData({ ...formData, end_date: e.target.value })
            }
            required
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_week_id">
            Tuần bắt đầu <span className="text-red-500">*</span>
          </Label>
          <Select
            key={`start_week_${weeks.length}_${formData.start_week_id}`}
            value={formData.start_week_id ? String(formData.start_week_id) : "0"}
            onValueChange={(value) =>
              setFormData({ ...formData, start_week_id: parseInt(value) || 0 })
            }
            disabled={isSubmitting || loadingWeeks}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn tuần bắt đầu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Không chọn</SelectItem>
              {weeks.map((week) => (
                <SelectItem key={week.id} value={String(week.id)}>
                  Tuần {week.week_number} ({week.year}) -{" "}
                  {new Date(week.start_date).toLocaleDateString("vi-VN")} đến{" "}
                  {new Date(week.end_date).toLocaleDateString("vi-VN")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_week_id">
            Tuần kết thúc <span className="text-red-500">*</span>
          </Label>
          <Select
            key={`end_week_${weeks.length}_${formData.end_week_id}`}
            value={formData.end_week_id ? String(formData.end_week_id) : "0"}
            onValueChange={(value) =>
              setFormData({ ...formData, end_week_id: parseInt(value) || 0 })
            }
            disabled={isSubmitting || loadingWeeks}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn tuần kết thúc" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Không chọn</SelectItem>
              {weeks.map((week) => (
                <SelectItem key={week.id} value={String(week.id)}>
                  Tuần {week.week_number} ({week.year}) -{" "}
                  {new Date(week.start_date).toLocaleDateString("vi-VN")} đến{" "}
                  {new Date(week.end_date).toLocaleDateString("vi-VN")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="previous_semester_id">Học kỳ trước</Label>
        <Select
          key={`previous_semester_${semesters.length}_${formData.previous_semester_id}`}
          value={formData.previous_semester_id ? String(formData.previous_semester_id) : "0"}
          onValueChange={(value) =>
            setFormData({
              ...formData,
              previous_semester_id: parseInt(value) || 0,
            })
          }
          disabled={isSubmitting || loadingSemesters}
        >
          <SelectTrigger>
            <SelectValue placeholder="Chọn học kỳ trước (nếu có)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Không có</SelectItem>
            {semesters.map((semester) => (
              <SelectItem key={semester.id} value={String(semester.id)}>
                {semester.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="space-y-0.5">
          <Label htmlFor="status">Trạng thái</Label>
          <p className="text-sm text-gray-500">
            {formData.status
              ? "Học kỳ sẽ được hiển thị và sử dụng"
              : "Học kỳ sẽ bị ẩn"}
          </p>
        </div>
        <Switch
          id="status"
          checked={formData.status}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, status: checked })
          }
          disabled={isSubmitting}
        />
      </div>

      {/* Holidays Section */}
      <div className="space-y-4 border-t pt-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Label className="text-lg font-semibold">Ngày nghỉ</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addHoliday}
            disabled={isSubmitting}
          >
            <Plus className="mr-2 h-4 w-4" />
            Thêm ngày nghỉ
          </Button>
        </div>

        {formData.holidays.map((holiday, index) => (
          <div
            key={index}
            className="p-4 border rounded-lg space-y-4 bg-gray-50"
          >
            <div className="flex items-center justify-between mb-2">
              <Label className="text-base">Ngày nghỉ #{index + 1}</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeHoliday(index)}
                disabled={isSubmitting}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Tên ngày nghỉ <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={holiday.name}
                  onChange={(e) => updateHoliday(index, "name", e.target.value)}
                  placeholder="Nhập tên ngày nghỉ"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Input
                  value={holiday.description}
                  onChange={(e) =>
                    updateHoliday(index, "description", e.target.value)
                  }
                  placeholder="Nhập mô tả"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Ngày bắt đầu <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={holiday.start_date}
                  onChange={(e) =>
                    updateHoliday(index, "start_date", e.target.value)
                  }
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Ngày kết thúc <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={holiday.end_date}
                  onChange={(e) =>
                    updateHoliday(index, "end_date", e.target.value)
                  }
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tuần</Label>
              <Select
                value={holiday.week_id ? String(holiday.week_id) : "0"}
                onValueChange={(value) =>
                  updateHoliday(index, "week_id", parseInt(value) || 0)
                }
                disabled={isSubmitting || loadingWeeks}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn tuần" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Không chọn</SelectItem>
                  {weeks.map((week) => (
                    <SelectItem key={week.id} value={String(week.id)}>
                  Tuần {week.week_number} ({week.year}) -{" "}
                  {new Date(week.start_date).toLocaleDateString("vi-VN")} đến{" "}
                  {new Date(week.end_date).toLocaleDateString("vi-VN")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-2 border rounded">
              <Label>Trạng thái</Label>
              <Switch
                checked={holiday.status}
                onCheckedChange={(checked) =>
                  updateHoliday(index, "status", checked)
                }
                disabled={isSubmitting}
              />
            </div>
          </div>
        ))}

        {formData.holidays.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            Chưa có ngày nghỉ nào. Nhấn "Thêm ngày nghỉ" để thêm.
          </p>
        )}
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Hủy
        </Button>
        <Button
          type="submit"
          className="bg-Clever School-green text-white hover:bg-opacity-90"
          disabled={isSubmitting}
        >
          <Save className="mr-2 h-4 w-4" />
          {submitButtonText}
        </Button>
      </div>
    </form>
  );
}
