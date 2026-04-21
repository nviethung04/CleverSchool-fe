import CreateLecturePage from "@/app/[locale]/manage/lecture-bank/create/page";
import { TeacherDashboardHeader } from "@/components/teacher-dashboard-header";

export default function TeacherCreateLecturePage() {
    return (
    <div>
        <TeacherDashboardHeader/>
        <CreateLecturePage/>
    </div>
    )
}