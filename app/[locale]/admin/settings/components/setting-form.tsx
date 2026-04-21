"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SettingKVPair, SettingItem } from "@/lib/api/settings";
import { useTranslations } from "next-intl";

interface SettingFormProps {
  initialData?: SettingItem;
  onSubmit: (data: {
    key: string;
    name: string;
    values: SettingKVPair[];
    is_active: boolean;
  }) => Promise<void>;
  submitting?: boolean;
  submitButtonLabel?: string;
  title?: string;
  onCancel?: () => void;
}

export function SettingForm({
  initialData,
  onSubmit,
  submitting = false,
  submitButtonLabel = "Tạo mới",
  title = "Tạo cài đặt",
  onCancel,
}: SettingFormProps) {
  const t = useTranslations('manageSetting')
  const [name, setName] = useState("");
  const [keyStr, setKeyStr] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [values, setValues] = useState<SettingKVPair[]>([
    { key: "", value: "" },
  ]);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setKeyStr(initialData.key || "");
      setIsActive(initialData.is_active ?? true);
      setValues(
        initialData.values && initialData.values.length > 0
          ? initialData.values
          : [{ key: "", value: "" }]
      );
    }
  }, [initialData]);

  const updateValueRow = (
    index: number,
    field: "key" | "value",
    val: string
  ) => {
    setValues((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: val } : row))
    );
  };

  const addRow = () => {
    setValues((prev) => [...prev, { key: "", value: "" }]);
  };

  const removeRow = (index: number) => {
    setValues((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !keyStr.trim()) {
      alert(t("form.required"));
      return;
    }
    const cleaned = values
      .map((r) => ({ key: r.key.trim(), value: r.value.trim() }))
      .filter((r) => r.key !== "");
    await onSubmit({
      key: keyStr.trim(),
      name: name.trim(),
      values: cleaned,
      is_active: isActive,
    });
  };

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl font-semibold mb-4">{title}</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t("form.nameLabel")}</label>
            <Input
              placeholder={t("form.namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Key</label>
            <Input
              placeholder={t("form.keyPlaceholder")}
              value={keyStr}
              onChange={(e) => setKeyStr(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="block text-sm font-medium"> {t("form.statusLabel")}</label>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium">
              {t("form.valuesLabel")}
            </label>
            <Button type="button" variant="outline" onClick={addRow}>
              {t("form.addValue")}
            </Button>
          </div>
          <div className="space-y-3">
            {values.map((row, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center"
              >
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium mb-1">Key</label>
                  <Input
                    placeholder="Key"
                    value={row.key}
                    onChange={(e) => updateValueRow(idx, "key", e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium mb-1">
                    Value
                  </label>
                  <Input
                    placeholder="Value"
                    value={row.value}
                    onChange={(e) =>
                      updateValueRow(idx, "value", e.target.value)
                    }
                  />
                </div>
                <div className="flex md:justify-end">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => removeRow(idx)}
                    disabled={values.length === 1}
                  >
                    {t("form.removeValue")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? t("form.submitting") : submitButtonLabel}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={submitting}
            >
              {t("form.cancel")}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
