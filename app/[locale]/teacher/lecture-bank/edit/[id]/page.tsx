import EditLecturePage from "@/app/[locale]/manage/lecture-bank/edit/[id]/page";
import { TeacherDashboardHeader } from "@/components/teacher-dashboard-header";

export default function TeacherEditLecturePage() {
    return (
    <div>
        <TeacherDashboardHeader/>
        <EditLecturePage/>
    </div>
    )
}