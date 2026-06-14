"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { adminPrimaryButtonClass } from "@/components/admin/admin-list-header";
import { useTranslations } from "next-intl";

export interface SubjectFormData {
  name: string;
  description: string;
  status: boolean;
}

interface SubjectFormProps {
  initialData?: SubjectFormData;
  onSubmit: (data: SubjectFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitButtonText?: string;
}

export default function SubjectForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitButtonText = "Lưu",
}: SubjectFormProps) {
  const t = useTranslations('manageSubject')
  const [formData, setFormData] = useState<SubjectFormData>({
    name: "",
    description: "",
    status: true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
        status: initialData.status !== undefined ? initialData.status : true,
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      return;
    }

    await onSubmit({
      name: formData.name.trim(),
      description: formData.description.trim(),
      status: formData.status,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">
          {t("form.nameLabel")} <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          placeholder={t("form.namePlaceholder")}
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t("form.descriptionLabel")}</Label>
        <Textarea
          id="description"
          placeholder={t("form.descriptionPlaceholder")}
          rows={4}
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          disabled={isSubmitting}
        />
      </div>

      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="space-y-0.5">
          <Label htmlFor="status">{t("form.statusLabel")}</Label>
          <p className="text-sm text-gray-500">
            {formData.status
              ? t("form.statusActiveDesc")
              : t("form.statusInactiveDesc")}
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
          {t("form.cancel")}
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
