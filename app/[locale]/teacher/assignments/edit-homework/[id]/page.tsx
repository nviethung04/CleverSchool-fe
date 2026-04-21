import EditHomeworkPage from "@/app/[locale]/manage/assignments/edit-homework/[id]/page";
import { TeacherDashboardHeader } from "@/components/teacher-dashboard-header";

export default function TeacherEditHomeworkPage() {
    return (
    <div>
        <TeacherDashboardHeader/>
        <EditHomeworkPage/>
    </div>
    )
}