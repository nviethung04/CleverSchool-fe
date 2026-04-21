import CreateExamPage from "@/app/[locale]/manage/assignments/create/page";
import { TeacherDashboardHeader } from "@/components/teacher-dashboard-header";

export default function TeacherCreateExamPage() {
    return (
    <div>
        <TeacherDashboardHeader/>
        <CreateExamPage/>
    </div>
    )
}