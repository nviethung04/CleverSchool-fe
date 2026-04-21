import FeedbackDetailPage from "@/app/[locale]/manage/feedback/[id]/detail/page";
import { TeacherDashboardHeader } from "@/components/teacher-dashboard-header"

export default function TeacherFeedbackDetailPage() {
    return (
    <div>
        <TeacherDashboardHeader/>
        <FeedbackDetailPage/>
    </div>
    )
}