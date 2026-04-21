import LectureBank from "@/app/[locale]/manage/lecture-bank/page";
import { TeacherDashboardHeader } from "@/components/teacher-dashboard-header";

export default function TeacherPreviewLecturePage() {
    return (
    <div>
      <TeacherDashboardHeader />
      <LectureBank />
    </div>
    )
}