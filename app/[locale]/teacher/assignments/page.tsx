import ExamsPage from "@/app/[locale]/manage/assignments/page"
import { TeacherDashboardHeader } from "@/components/teacher-dashboard-header"

export default function TeacherExamsPage() {
    return (
    <div>
        <TeacherDashboardHeader />
        <ExamsPage/>
    </div>
    )
}