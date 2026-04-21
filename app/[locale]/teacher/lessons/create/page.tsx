"use client"

import { RoleBasedHeaderSidebar } from "@/components/layout/role-based-header-sidebar";
import { LessonForm } from "@/components/lesson-form";

export default function CreateLessonPage() {
  return (
    <RoleBasedHeaderSidebar>
      <LessonForm mode="create" />
    </RoleBasedHeaderSidebar>
  );
}
