import CreateFeedbackPage from "@/app/[locale]/manage/feedback/create/page";
import { TeacherDashboardHeader } from "@/components/teacher-dashboard-header"

export default function TeacherCreateFeedbackPage() {
    return (
    <div>
        <TeacherDashboardHeader/>
        <CreateFeedbackPage/>
    </div>
    )
}