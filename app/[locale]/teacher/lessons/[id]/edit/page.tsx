"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { RoleBasedHeaderSidebar } from "@/components/layout/role-based-header-sidebar";
import { LessonForm } from "@/components/lesson-form";

export default function EditLessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: lessonId } = use(params);
  const router = useRouter();

  const handleSuccess = () => {
    // Navigate back after successful update
    router.back();
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <RoleBasedHeaderSidebar>
      <LessonForm 
        mode="edit" 
        lessonId={lessonId}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </RoleBasedHeaderSidebar>
  );
}
                      