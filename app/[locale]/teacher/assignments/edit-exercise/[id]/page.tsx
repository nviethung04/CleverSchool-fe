import EditExercisePage from "@/app/[locale]/manage/assignments/edit-exercise/[id]/page";
import { TeacherDashboardHeader } from "@/components/teacher-dashboard-header";

export default function TeacherEditExercisePage() {
    return (
    <div>
        <TeacherDashboardHeader/>
        <EditExercisePage/>
    </div>
    )
}