import FeedbackPage from "@/app/[locale]/manage/feedback/page";
import { TeacherDashboardHeader } from "@/components/teacher-dashboard-header"

export default function TeacherFeedbackPage() {
    return (
    <div>
        <TeacherDashboardHeader/>
        <FeedbackPage/>
    </div>
    )
}