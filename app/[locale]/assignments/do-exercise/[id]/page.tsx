import ExercisePage from "@/app/[locale]/manage/assignments/do-exercise/[id]/page";
import MobileOrientationGuard from "@/components/MobileOrientationGuard";

export default function StudentDoExamPage() {
    return (
        <MobileOrientationGuard requireLandscape={true}>
            <ExercisePage />
        </MobileOrientationGuard>
    )
}