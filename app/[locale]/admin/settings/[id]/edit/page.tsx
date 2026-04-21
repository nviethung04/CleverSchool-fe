"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { SettingForm } from "../../components/setting-form";
import { GetSettingDetail, UpdateSetting } from "@/lib/api/settings";
import { SettingItem } from "@/lib/api/settings";
import { useTranslations } from "next-intl";

export default function AdminSettingEditPage() {
  const t = useTranslations('manageSetting')
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "vi";
  const id = params?.id as string;
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [setting, setSetting] = useState<SettingItem | undefined>(undefined);

  useEffect(() => {
    if (id) {
      setLoading(true);
      GetSettingDetail(id)
        .then((data) => {
          setSetting(data);
        })
        .catch((err) => {
          console.error("Error fetching setting:", err);
          alert(t("edit.loadError"));
          router.push(`/${locale}/admin/settings`);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id, locale, router]);

  const handleSubmit = async (data: {
    key: string;
    name: string;
    values: { key: string; value: string }[];
    is_active: boolean;
  }) => {
    if (!id) return;
    setSubmitting(true);
    try {
      await UpdateSetting(id, data);
      router.push(`/${locale}/admin/settings`);
    } catch (err) {
      console.error(err);
      alert(t("edit.error"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="text-center">{t("edit.loadingMessage")}</div>
      </div>
    );
  }

  if (!setting) {
    return null;
  }

  return (
    <SettingForm
      initialData={setting}
      onSubmit={handleSubmit}
      submitting={submitting}
      submitButtonLabel={t("edit.submitButton")}
      title={t("edit.title")}
      onCancel={() => router.back()}
    />
  );
}
