import CreateExercisePage from "@/app/[locale]/manage/assignments/create-exercise/page";
import { TeacherDashboardHeader } from "@/components/teacher-dashboard-header";

export default function TeacherCreateExercisePage() {
    return (
    <div>
        <TeacherDashboardHeader/>
        <CreateExercisePage/>
    </div>
    )
}