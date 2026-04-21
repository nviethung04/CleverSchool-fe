import EditExamPage from "@/app/[locale]/manage/assignments/edit/[id]/page";
import { TeacherDashboardHeader } from "@/components/teacher-dashboard-header";

export default function TeacherEditExamPage() {
    return (
    <div>
        <TeacherDashboardHeader/>
        <EditExamPage/>
    </div>
    )
}