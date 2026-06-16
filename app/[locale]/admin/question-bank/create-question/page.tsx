"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  LucideArrowLeft,
  LucideCheckSquare,
  LucideType,
  LucideArrowUpDown,
  LucideArrowLeftRight,
  LucideCheck,
  LucideLoader2,
} from "lucide-react"
import Link from "next/link"
import { CustomSelect } from "@/components/question-editor/custom-select"
import { ReduxProvider } from "@/components/providers/redux-provider"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { setQuestionType, setPoints, setTimeLimit, resetState } from "@/lib/redux/question-slice"
import { OrderingQuestion } from "@/components/question-editor/ordering-question"
import { MatchingQuestion } from "@/components/question-editor/matching-question"
import { MultipleChoiceQuestion } from "@/components/question-editor/multiple-choice-question"
import { FillInBlankQuestion } from "@/components/question-editor/fill-in-blank-question"
import { DragDropQuestion } from "@/components/question-editor/drag-drop-question"
import { DefaultQuestion } from "@/components/question-editor/default-question"
import {
  createQuestion,
  convertMultipleChoiceToApiFormat,
  convertFillInBlankToApiFormat,
  convertOrderingToApiFormat,
  convertMatchingToApiFormat,
  convertDragDropToApiFormat,
} from "@/lib/api/questions"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

function QuestionEditor() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [hasToken, setHasToken] = useState(false)
  const questionState = useAppSelector((state) => state.question)
  const { questionType, points, timeLimit } = questionState

  // Kiểm tra token khi component mount và reset state
  useEffect(() => {
    const token = localStorage.getItem("token")
    setHasToken(!!token)

    if (!token) {
      toast({
        title: "Cảnh báo",
        description: "Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
        variant: "destructive",
      })
    }

    // Reset state khi component mount để xóa dữ liệu câu hỏi cũ
    dispatch(resetState())
  }, [dispatch, toast])

  // Question type options
  const questionTypes = [
    {
      value: "multiple-choice",
      label: (
        <div className="flex items-center">
          <LucideCheckSquare className="h-4 w-4 mr-2" />
          <span>Multiple choice</span>
        </div>
      ),
    },
    {
      value: "fill-in-blank",
      label: (
        <div className="flex items-center">
          <LucideType className="h-4 w-4 mr-2" />
          <span>Fill in blank</span>
        </div>
      ),
    },
    {
      value: "ordering",
      label: (
        <div className="flex items-center">
          <LucideArrowUpDown className="h-4 w-4 mr-2" />
          <span>Ordering</span>
        </div>
      ),
    },
    {
      value: "matching",
      label: (
        <div className="flex items-center">
          <LucideArrowLeftRight className="h-4 w-4 mr-2" />
          <span>Matching</span>
        </div>
      ),
    },
    {
      value: "drag-drop",
      label: (
        <div className="flex items-center">
          <LucideCheck className="h-4 w-4 mr-2" />
          <span>Drag and drop</span>
        </div>
      ),
    },
  ]

  const renderQuestionEditor = () => {
    switch (questionType) {
      case "multiple-choice":
        return <MultipleChoiceQuestion />
      case "fill-in-blank":
        return <FillInBlankQuestion />
      case "ordering":
        return <OrderingQuestion />
      case "matching":
        return <MatchingQuestion />
      case "drag-drop":
        return <DragDropQuestion />
      default:
        return <DefaultQuestion />
    }
  }

  // Validate question data before saving
  const validateQuestion = () => {
    // Kiểm tra đã đăng nhập chưa
    if (!hasToken) {
      toast({
        title: "Lỗi",
        description: "Bạn cần đăng nhập để thực hiện thao tác này",
        variant: "destructive",
      })
      router.push("/login")
      return false
    }

    // Kiểm tra câu hỏi có nội dung không
    if (!questionState.questionText.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập nội dung câu hỏi",
        variant: "destructive",
      })
      return false
    }

    // Kiểm tra dựa trên loại câu hỏi
    if (questionType === "multiple-choice") {
      // Kiểm tra có ít nhất 2 tùy chọn
      if (questionState.answerOptions.length < 2) {
        toast({
          title: "Lỗi",
          description: "Cần ít nhất 2 tùy chọn trả lời",
          variant: "destructive",
        })
        return false
      }

      // Kiểm tra có ít nhất 1 đáp án đúng
      const hasCorrectAnswer = questionState.answerOptions.some((option) => option.isCorrect)
      if (!hasCorrectAnswer) {
        toast({
          title: "Lỗi",
          description: "Vui lòng chọn ít nhất một đáp án đúng",
          variant: "destructive",
        })
        return false
      }

      // Kiểm tra các tùy chọn có nội dung không
      const emptyOptions = questionState.answerOptions.some((option) => !option.text.trim())
      if (emptyOptions) {
        toast({
          title: "Lỗi",
          description: "Vui lòng nhập nội dung cho tất cả các tùy chọn",
          variant: "destructive",
        })
        return false
      }
    } else if (questionType === "fill-in-blank") {
      // Kiểm tra có ít nhất 1 blank
      if (questionState.blankAnswers.length < 1) {
        toast({
          title: "Lỗi",
          description: "Cần ít nhất 1 chỗ trống [blank] trong câu hỏi",
          variant: "destructive",
        })
        return false
      }

      // Kiểm tra các blank có đáp án không
      const emptyAnswers = questionState.blankAnswers.some((answer) => !answer.text.trim())
      if (emptyAnswers) {
        toast({
          title: "Lỗi",
          description: "Vui lòng nhập đáp án cho tất cả các chỗ trống",
          variant: "destructive",
        })
        return false
      }
    } else if (questionType === "ordering") {
      // Kiểm tra có ít nhất 2 mục để sắp xếp
      if (questionState.orderItems.length < 2) {
        toast({
          title: "Lỗi",
          description: "Cần ít nhất 2 mục để sắp xếp",
          variant: "destructive",
        })
        return false
      }

      // Kiểm tra các mục có nội dung không
      const emptyItems = questionState.orderItems.some((item) => !item.text.trim())
      if (emptyItems) {
        toast({
          title: "Lỗi",
          description: "Vui lòng nhập nội dung cho tất cả các mục",
          variant: "destructive",
        })
        return false
      }
    } else if (questionType === "matching") {
      // Kiểm tra có ít nhất 2 cặp ghép
      if (questionState.matchItems.length < 2) {
        toast({
          title: "Lỗi",
          description: "Cần ít nhất 2 cặp ghép",
          variant: "destructive",
        })
        return false
      }

      // Kiểm tra các mục bên trái có nội dung không
      // const emptyLeftItems = questionState.matchItems.some((item) => !item.leftText.trim())
      // if (emptyLeftItems) {
      //   toast({
      //     title: "Lỗi",
      //     description: "Vui lòng nhập nội dung cho tất cả các mục bên trái",
      //     variant: "destructive",
      //   })
      //   return false
      // }

      // Kiểm tra các mục bên phải có nội dung không
      // const emptyRightItems = questionState.matchItems.some((item) => !item.rightText.trim())
      // if (emptyRightItems) {
      //   toast({
      //     title: "Lỗi",
      //     description: "Vui lòng nhập nội dung cho tất cả các mục bên phải",
      //     variant: "destructive",
      //   })
      //   return false
      // }
    } else if (questionType === "drag-drop") {
      // Kiểm tra có ít nhất 1 chỗ trống
      if (questionState.blankCount < 1) {
        toast({
          title: "Lỗi",
          description: "Cần ít nhất 1 chỗ trống [blank] trong câu hỏi",
          variant: "destructive",
        })
        return false
      }

      // Kiểm tra có ít nhất 1 đáp án đúng
      const correctOptions = questionState.dragDropOptions.filter((option) => option.isCorrect)
      if (correctOptions.length < 1) {
        toast({
          title: "Lỗi",
          description: "Cần ít nhất 1 đáp án đúng",
          variant: "destructive",
        })
        return false
      }

      // Kiểm tra số lượng đáp án đúng phải bằng số lượng chỗ trống
      if (correctOptions.length !== questionState.blankCount) {
        toast({
          title: "Lỗi",
          description: `Số lượng đáp án đúng (${correctOptions.length}) phải bằng số lượng chỗ trống (${questionState.blankCount})`,
          variant: "destructive",
        })
        return false
      }

      // Kiểm tra các tùy chọn có nội dung không
      const emptyOptions = questionState.dragDropOptions.some((option) => !option.text.trim())
      if (emptyOptions) {
        toast({
          title: "Lỗi",
          description: "Vui lòng nhập nội dung cho tất cả các tùy chọn",
          variant: "destructive",
        })
        return false
      }
    }

    return true
  }

  // Handle save question
  const handleSaveQuestion = async () => {
    if (!validateQuestion()) return

    setIsSaving(true)
    try {
      let apiData

      // Chuyển đổi dữ liệu dựa trên loại câu hỏi
      if (questionType === "multiple-choice") {
        apiData = convertMultipleChoiceToApiFormat(questionState)
        console.log("API Data:", apiData)
      } else if (questionType === "fill-in-blank") {
        apiData = convertFillInBlankToApiFormat(questionState)
        console.log("API Data:", apiData)
      } else if (questionType === "ordering") {
        apiData = convertOrderingToApiFormat(questionState)
        console.log("API Data:", apiData)
      } else if (questionType === "matching") {
        apiData = convertMatchingToApiFormat(questionState)
        console.log("API Data:", apiData)
      } else if (questionType === "drag-drop") {
        apiData = convertDragDropToApiFormat(questionState)
        console.log("API Data:", apiData)
      } else {
        // Xử lý các loại câu hỏi khác (sẽ triển khai sau)
        toast({
          title: "Thông báo",
          description: "Chức năng lưu cho loại câu hỏi này đang được phát triển",
        })
        setIsSaving(false)
        return
      }

      // Gọi API tạo câu hỏi
      const result = await createQuestion(apiData)
      console.log("API Response:", result)

      toast({
        title: "Thành công",
        description: "Đã lưu câu hỏi thành công",
      })

      // Reset state sau khi lưu thành công
      dispatch(resetState())

      // Chuyển về trang danh sách câu hỏi sau khi lưu thành công
      setTimeout(() => {
        router.push("/admin/question-bank")
      }, 1500)
    } catch (error: any) {
      console.error("Error saving question:", error)

      // Hiển thị thông báo lỗi chi tiết hơn
      let errorMessage = "Không thể lưu câu hỏi. Vui lòng thử lại sau."

      if (error.response) {
        // Nếu có response từ server
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message
        } else if (error.response.status === 401) {
          errorMessage = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
          // Chuyển hướng đến trang đăng nhập
          setTimeout(() => {
            router.push("/login")
          }, 1500)
        } else if (error.response.status === 500) {
          errorMessage = "Lỗi máy chủ nội bộ. Vui lòng liên hệ quản trị viên."
        }
      }

      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        {/* Hiển thị cảnh báo nếu chưa đăng nhập */}
        {!hasToken && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">Cảnh báo!</p>
            <p>Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn. Vui lòng đăng nhập để tiếp tục.</p>
            <Button variant="outline" className="mt-2" onClick={() => router.push("/login")}>
              Đăng nhập
            </Button>
          </div>
        )}

        {/* Header with back button and question type selector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin/question-bank">
                <LucideArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Tạo câu hỏi mới</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <CustomSelect
              options={questionTypes}
              value={questionType}
              onValueChange={(value) => dispatch(setQuestionType(value))}
              placeholder="Chọn loại câu hỏi"
              className="w-[200px]"
            />

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Điểm:</span>
              <Input
                type="number"
                min="1"
                max="10"
                value={points}
                onChange={(e) => dispatch(setPoints(Number.parseInt(e.target.value) || 1))}
                className="w-16 text-center"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Thời gian:</span>
              <Input
                type="number"
                min="0.5"
                max="10"
                step="0.5"
                value={timeLimit}
                onChange={(e) => dispatch(setTimeLimit(Number.parseFloat(e.target.value) || 1.5))}
                className="w-16 text-center"
              />
              <span className="text-sm text-gray-500">phút</span>
            </div>

            <Button
              className="bg-purple-600 text-white hover:bg-purple-700"
              onClick={handleSaveQuestion}
              disabled={isSaving || !hasToken}
            >
              {isSaving ? (
                <>
                  <LucideLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                "Lưu câu hỏi"
              )}
            </Button>
          </div>
        </div>

        {/* Question editor */}
        <div className="bg-white border rounded-lg p-4">{renderQuestionEditor()}</div>
      </main>
    </div>
  )
}

export default function CreateQuestionPage() {
  return (
    <ReduxProvider>
      <QuestionEditor />
    </ReduxProvider>
  )
}
