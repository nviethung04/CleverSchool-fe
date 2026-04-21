import CreateHomeworkPage from "@/app/[locale]/manage/assignments/create-homework/page";
import { TeacherDashboardHeader } from "@/components/teacher-dashboard-header";

export default function TeacherCreateHomeworkPage() {
    return (
    <div>
        <TeacherDashboardHeader/>
        <CreateHomeworkPage/>
    </div>
    )
}