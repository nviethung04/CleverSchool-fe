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
import { Save } from "lucide-react";
import { adminPrimaryButtonClass } from "@/components/admin/admin-list-header";
import { getWeeks, Week } from "@/lib/api/students";
import { GetSemestersList, Semester } from "@/lib/api/semesters";

export interface SemesterFormData {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  start_week_id: number;
  end_week_id: number;
  previous_semester_id: number;
  status: boolean;
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
  const [formData, setFormData] = useState<SemesterFormData>({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    start_week_id: 0,
    end_week_id: 0,
    previous_semester_id: 0,
    status: true,
  });

  const [weeks, setWeeks] = useState<Week[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loadingWeeks, setLoadingWeeks] = useState(false);
  const [loadingSemesters, setLoadingSemesters] = useState(false);

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
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      return;
    }

    await onSubmit(formData);
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
          className={adminPrimaryButtonClass}
          disabled={isSubmitting}
        >
          <Save className="mr-2 h-4 w-4" />
          {submitButtonText}
        </Button>
      </div>
    </form>
  );
}
