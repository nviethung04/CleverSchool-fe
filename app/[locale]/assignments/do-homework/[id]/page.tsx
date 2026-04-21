import HomeworkPage from "@/app/[locale]/manage/assignments/do-homework/[id]/page";
import MobileOrientationGuard from "@/components/MobileOrientationGuard";

export default function StudentDoHomeworkPage() {
    return (
        <MobileOrientationGuard requireLandscape={true}>
            <HomeworkPage />
        </MobileOrientationGuard>
    )
}