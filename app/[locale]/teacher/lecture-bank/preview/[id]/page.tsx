import PreviewLessonPage from "@/app/[locale]/manage/lecture-bank/preview/[id]/page";
import { TeacherDashboardHeader } from "@/components/teacher-dashboard-header";

export default function TeacherPreviewLecturePage() {
    return (
    <div>
        <TeacherDashboardHeader/>
        <PreviewLessonPage />
    </div>
    )
}