"use client"

import { LucideHeading } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { setQuestionText } from "@/lib/redux/question-slice"
import { QuestionMediaControls } from "./question-media-controls"
import { TiptapMathEditor } from "./tiptap-math-editor"

export function DefaultQuestion() {
  const dispatch = useAppDispatch()
  const { questionText } = useAppSelector((state) => state.question)

  return (
    <>
      <div className="bg-purple-900 rounded-lg p-4 mb-4">
        <QuestionMediaControls className="mb-2" />
        <TiptapMathEditor
          value={questionText}
          onChange={(val) => dispatch(setQuestionText(val))}
          placeholder="Nhập câu hỏi vào đây, hỗn hợp text + công thức toán ($...$ hoặc $$...$$)"
        />
      </div>
      <div className="py-12 text-center text-gray-500">
        <LucideHeading className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p className="text-lg">Giao diện cho loại câu hỏi này đang được phát triển</p>
      </div>
    </>
  )
}
