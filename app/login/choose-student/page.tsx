import { Suspense } from "react"
import ChooseStudentPage from "./ChooseStudentPage"

export default function Page() {
  return (
    <Suspense fallback={<div>Đang tải...</div>}>
      <ChooseStudentPage />
    </Suspense>
  )
}