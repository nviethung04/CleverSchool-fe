import ExamPage from "@/app/[locale]/manage/assignments/do/[id]/page";
import MobileOrientationGuard from "@/components/MobileOrientationGuard";

export default function StudentDoExamPage() {
    return (
        <MobileOrientationGuard requireLandscape={true}>
            <ExamPage />
        </MobileOrientationGuard>
    )
}