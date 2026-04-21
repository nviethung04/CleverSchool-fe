"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { GradeItem } from "@/lib/api/grade";

interface ClassModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: () => void;
  formData: any;
  setFormData: (data: any) => void;
  selectedClass: any;
  schoolId?: string;
  schoolName?: string;
  isLoading?: boolean;
  grades?: GradeItem[];
}

export default function ClassModal({
  show,
  onClose,
  onSubmit,
  formData,
  setFormData,
  selectedClass,
  schoolId,
  schoolName,
  isLoading = false,
  grades = [],
}: ClassModalProps) {
  const t = useTranslations("classes");
  const handleInputChange = (field: string, value: any) => {
    // If creating new and schoolId is available, set school_id
    if (!selectedClass && schoolId) {
      setFormData({
        ...formData,
        [field]: value,
        school_id: Number.parseInt(schoolId),
      });
    } else {
      setFormData({ ...formData, [field]: value });
    }
  };

  const handleTeacherInfoChange = (field: string, value: string) => {
    const currentTeacherInfo = formData.teacher_info || {};
    const updatedTeacherInfo = {
      ...currentTeacherInfo,
      [field]: value,
    };

    if (!selectedClass && schoolId) {
      setFormData({
        ...formData,
        teacher_info: updatedTeacherInfo,
        school_id: Number.parseInt(schoolId),
      });
    } else {
      setFormData({
        ...formData,
        teacher_info: updatedTeacherInfo,
      });
    }
  };

  const handleGradeChange = (value: string) => {
    if (!value) {
      handleInputChange("grade_id", undefined);
      return;
    }

    const numericValue = Number(value);
    handleInputChange(
      "grade_id",
      Number.isNaN(numericValue) ? value : numericValue
    );
  };

  const selectedGradeValue =
    formData?.grade_id !== undefined && formData?.grade_id !== null
      ? String(formData.grade_id)
      : undefined;

  return (
    <Dialog open={show} onOpenChange={isLoading ? undefined : onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {selectedClass ? t("editClass") : t("addNewClass")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">{t("className")}</Label>
            <Input
              id="name"
              value={formData.name || ""}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder={t("enterClassName")}
              required
            />
          </div>

          <div>
            <Label htmlFor="max_students">{t("maxStudents")}</Label>
            <Input
              id="max_students"
              type="number"
              value={formData.max_students || ""}
              onChange={(e) =>
                handleInputChange(
                  "max_students",
                  Number.parseInt(e.target.value)
                )
              }
              placeholder={t("enterMaxStudents")}
            />
          </div>

          <div>
            <Label htmlFor="grade_id">{t("grade")}</Label>
            <Select
              value={selectedGradeValue}
              onValueChange={handleGradeChange}
              disabled={grades.length === 0 || isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("selectGrade")} />
              </SelectTrigger>
              <SelectContent>
                {grades.map((grade) => (
                  <SelectItem key={grade.id} value={String(grade.id)}>
                    {grade.name_vn || grade.name_en || `Grade ${grade.number}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="status">{t("status")}</Label>
            <Select
              value={
                formData.status === true
                  ? "true"
                  : formData.status === false
                  ? "false"
                  : ""
              }
              onValueChange={(value) =>
                handleInputChange("status", value === "true")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("selectStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">{t("statusOpen")}</SelectItem>
                <SelectItem value="false">{t("statusClosed")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Thông tin giáo viên chủ nhiệm */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              {t("homeRoomTeacherInfo")}
            </h4>

            <div className="space-y-3">
              <div>
                <Label htmlFor="teacher_name">{t("teacherName")}</Label>
                <Input
                  id="teacher_name"
                  value={formData.teacher_info?.name || ""}
                  onChange={(e) =>
                    handleTeacherInfoChange("name", e.target.value)
                  }
                  placeholder={t("enterTeacherName")}
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="teacher_phone">{t("phoneNumber")}</Label>
                  <Input
                    id="teacher_phone"
                    value={formData.teacher_info?.phone || ""}
                    onChange={(e) =>
                      handleTeacherInfoChange("phone", e.target.value)
                    }
                    placeholder={t("enterPhoneNumber")}
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="teacher_email">{t("email")}</Label>
                  <Input
                    id="teacher_email"
                    type="email"
                    value={formData.teacher_info?.email || ""}
                    onChange={(e) =>
                      handleTeacherInfoChange("email", e.target.value)
                    }
                    placeholder={t("enterTeacherEmail")}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button onClick={onSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang cập nhật...
              </>
            ) : selectedClass ? (
              "Cập nhật"
            ) : (
              "Thêm mới"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
