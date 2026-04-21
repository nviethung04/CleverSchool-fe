"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SettingForm } from "../components/setting-form";
import { CreateSetting } from "@/lib/api/settings";
import { useTranslations } from "next-intl";

export default function AdminSettingCreatePage() {
  const t = useTranslations('manageSetting')
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "vi";
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (data: {
    key: string;
    name: string;
    values: { key: string; value: string }[];
    is_active: boolean;
  }) => {
    setSubmitting(true);
    try {
      await CreateSetting(data);
      router.push(`/${locale}/admin/settings`);
    } catch (err) {
      console.error(err);
      alert(t("create.error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SettingForm
      onSubmit={handleSubmit}
      submitting={submitting}
      submitButtonLabel={t("create.submitButton")}
      title={t("create.title")}
      onCancel={() => router.back()}
    />
  );
}
