"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Edit,
  Trash2,
  ListFilter,
  BookOpen,
  Layers,
  PenTool,
  Shuffle,
  Tag,
  MoveHorizontal,
  GripHorizontal,
  MessageSquare,
  Clock,
  ImageIcon,
  Music,
  Video,
  Check,
  X,
  HelpCircle,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { getQuestionById } from "@/lib/api/questions"
import { useToast } from "@/components/ui/use-toast"

// Định nghĩa các loại câu hỏi
const QUESTION_TYPES = {
  multiple_choice: {
    name: "Trắc nghiệm",
    icon: <ListFilter className="h-5 w-5" />,
    color: "bg-blue-100 text-blue-600",
  },
  fill_in_blanks: {
    name: "Điền vào chỗ trống",
    icon: <PenTool className="h-5 w-5" />,
    color: "bg-purple-100 text-purple-600",
  },
  matching: {
    name: "Ghép cặp",
    icon: <Layers className="h-5 w-5" />,
    color: "bg-green-100 text-green-600",
  },
  ordering: {
    name: "Sắp xếp",
    icon: <Shuffle className="h-5 w-5" />,
    color: "bg-amber-100 text-amber-600",
  },
  drag_drop: {
    name: "Kéo thả",
    icon: <MoveHorizontal className="h-5 w-5" />,
    color: "bg-cyan-100 text-cyan-600",
  },
  labeling: {
    name: "Gắn nhãn",
    icon: <Tag className="h-5 w-5" />,
    color: "bg-pink-100 text-pink-600",
  },
  category: {
    name: "Phân loại",
    icon: <GripHorizontal className="h-5 w-5" />,
    color: "bg-orange-100 text-orange-600",
  },
  writing: {
    name: "Viết",
    icon: <BookOpen className="h-5 w-5" />,
    color: "bg-indigo-100 text-indigo-600",
  },
  speaking: {
    name: "Nói",
    icon: <MessageSquare className="h-5 w-5" />,
    color: "bg-rose-100 text-rose-600",
  },
}

// Định nghĩa các mức độ khó
const DIFFICULTY_LEVELS = {
  easy: {
    name: "Dễ",
    color: "bg-green-100 text-green-600",
  },
  medium: {
    name: "Trung bình",
    color: "bg-yellow-100 text-yellow-600",
  },
  hard: {
    name: "Khó",
    color: "bg-red-100 text-red-600",
  },
}

// Định nghĩa các danh mục
const CATEGORIES = {
  grammar: {
    name: "Ngữ pháp",
    color: "bg-blue-50 text-blue-600",
  },
  vocabulary: {
    name: "Từ vựng",
    color: "bg-green-50 text-green-600",
  },
  listening: {
    name: "Nghe hiểu",
    color: "bg-purple-50 text-purple-600",
  },
  reading: {
    name: "Đọc hiểu",
    color: "bg-amber-50 text-amber-600",
  },
  writing: {
    name: "Viết",
    color: "bg-indigo-50 text-indigo-600",
  },
  speaking: {
    name: "Nói",
    color: "bg-rose-50 text-rose-600",
  },
  "general-knowledge": {
    name: "Kiến thức chung",
    color: "bg-gray-50 text-gray-600",
  },
}

export default function QuestionDetailPage({ params }: { params: { id: string } }) {
  const { toast } = useToast()
  const [question, setQuestion] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Lấy thông tin chi tiết câu hỏi từ API
  useEffect(() => {
    const fetchQuestionDetail = async () => {
      try {
        setLoading(true)
        const questionData = await getQuestionById(params.id)

        if (!questionData) {
          toast({
            title: "Lỗi",
            description: "Không thể tải thông tin câu hỏi. Vui lòng thử lại sau.",
            variant: "destructive",
          })
          return
        }

        console.log("Question Detail:", questionData)
        setQuestion(questionData)
      } catch (error) {
        console.error("Error fetching question detail:", error)
        toast({
          title: "Lỗi",
          description: "Không thể tải thông tin câu hỏi. Vui lòng thử lại sau.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchQuestionDetail()
  }, [params.id, toast])

  // Lấy thông tin loại câu hỏi
  const questionType = question?.type
    ? QUESTION_TYPES[question.type as keyof typeof QUESTION_TYPES]
    : {
        name: "Không xác định",
        icon: <HelpCircle className="h-5 w-5" />,
        color: "bg-gray-100 text-gray-600",
      }

  // Lấy thông tin độ khó
  const difficulty = question?.level
    ? DIFFICULTY_LEVELS[question.level as keyof typeof DIFFICULTY_LEVELS]
    : {
        name: "Không xác định",
        color: "bg-gray-100 text-gray-600",
      }

  // Lấy thông tin danh mục
  const category = question?.topic
    ? CATEGORIES[question.topic as keyof typeof CATEGORIES]
    : {
        name: "Không xác định",
        color: "bg-gray-50 text-gray-600",
      }

  // Xác định nếu câu hỏi có media
  const hasImage = question?.content?.media?.type === "image" && !!question?.content?.media?.url
  const hasAudio = question?.content?.media?.type === "audio" && !!question?.content?.media?.url
  const hasVideo = question?.content?.media?.type === "video" && !!question?.content?.media?.url

  // Định dạng thời gian
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  // Hiển thị media của câu hỏi
  const renderQuestionMedia = () => {
    if (hasImage) {
      return (
        <div className="mt-4 w-full max-w-md h-60 relative rounded overflow-hidden">
          <Image
            src={question.content.media.url || "/placeholder.svg?height=240&width=480&query=question image"}
            alt={question.content.text || "Question image"}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )
    }

    if (hasAudio) {
      return (
        <div className="mt-4 p-4 bg-purple-50 rounded-md border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Music className="h-5 w-5 text-purple-500" />
            <span className="text-sm font-medium text-purple-700">Âm thanh</span>
          </div>
          <audio controls className="w-full max-w-md">
            <source src={question.content.media.url} type="audio/mpeg" />
            Trình duyệt của bạn không hỗ trợ phát âm thanh.
          </audio>
        </div>
      )
    }

    if (hasVideo) {
      return (
        <div className="mt-4 p-4 bg-amber-50 rounded-md border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <Video className="h-5 w-5 text-amber-500" />
            <span className="text-sm font-medium text-amber-700">Video</span>
          </div>
          <div className="relative w-full max-w-md aspect-video rounded overflow-hidden">
            <video controls className="w-full h-full object-cover" poster="/video-thumbnail.png">
              <source src={question.content.media.url} type="video/mp4" />
              Trình duyệt của bạn không hỗ trợ phát video.
            </video>
          </div>
        </div>
      )
    }

    return null
  }

  // Hiển thị đáp án dựa trên loại câu hỏi
  const renderAnswers = () => {
    if (!question) return null

    switch (question.type) {
      case "multiple_choice":
        return (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-3">Các lựa chọn</h3>
            <div className="space-y-3">
              {question.options?.answers?.map((answer: any, index: number) => (
                <div
                  key={index}
                  className={`flex items-start p-3 rounded-lg ${
                    answer.is_correct ? "bg-green-50 border border-green-200" : "bg-gray-50 border border-gray-200"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center mt-0.5 mr-3 ${
                      answer.is_correct ? "bg-green-100" : "bg-gray-100"
                    }`}
                  >
                    {answer.is_correct ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{answer.text}</p>
                    {answer.media?.url && answer.media.type === "image" && (
                      <div className="mt-2 w-24 h-24 relative rounded overflow-hidden">
                        <Image
                          src={answer.media.url || "/placeholder.svg?height=96&width=96&query=answer image"}
                          alt={answer.text}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case "fill_in_blanks":
        return (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-3">Các chỗ trống</h3>
            <p className="text-base mb-4">
              {question.content?.text?.split(/(\[blank\d*\])/).map((part, index) => {
                const blankMatch = part.match(/\[blank(\d*)\]/)
                return blankMatch ? (
                  <span key={index} className="inline-block px-3 py-1 bg-purple-100 rounded mx-1">
                    ___
                  </span>
                ) : (
                  <span key={index}>{part}</span>
                )
              })}
            </p>
            <div className="space-y-3">
              {question.options?.answers?.map((answer: any, index: number) => (
                <div key={index} className="flex items-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <Badge className="bg-purple-200 text-purple-800 mr-3">
                    Blank {answer.correct_position || index + 1}
                  </Badge>
                  <span className="font-medium">{answer.text}</span>
                  {answer.media?.url && answer.media.type === "image" && (
                    <div className="ml-auto w-12 h-12 relative rounded overflow-hidden">
                      <Image
                        src={answer.media.url || "/placeholder.svg?height=48&width=48&query=answer image"}
                        alt={answer.text}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )

      case "ordering":
        return (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-3">Thứ tự đúng</h3>
            <div className="space-y-2">
              {question.options?.answers?.map((item: any, index: number) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="w-8 h-8 flex items-center justify-center bg-amber-200 rounded-full text-amber-800 font-medium">
                    {index + 1}
                  </div>
                  <span className="font-medium">{item.text}</span>
                  {item.media?.url && item.media.type === "image" && (
                    <div className="ml-auto w-12 h-12 relative rounded overflow-hidden">
                      <Image
                        src={item.media.url || "/placeholder.svg?height=48&width=48&query=item image"}
                        alt={item.text}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )

      case "matching":
        return (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-3">Các cặp nối</h3>
            <div className="space-y-3">
              {question.options?.sources?.map((source: any, index: number) => {
                const target = question.options?.targets?.[index]
                if (!target) return null

                return (
                  <div key={index} className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="font-medium">{source.content?.text}</p>
                      {source.content?.media?.url && source.content.media.type === "image" && (
                        <div className="mt-2 w-20 h-20 relative rounded overflow-hidden">
                          <Image
                            src={source.content.media.url || "/placeholder.svg?height=80&width=80&query=source image"}
                            alt={source.content.text}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="font-medium">{target.content?.text}</p>
                      {target.content?.media?.url && target.content.media.type === "image" && (
                        <div className="mt-2 w-20 h-20 relative rounded overflow-hidden">
                          <Image
                            src={target.content.media.url || "/placeholder.svg?height=80&width=80&query=target image"}
                            alt={target.content.text}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )

      case "drag_drop":
        return (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-3">Kéo thả</h3>
            <p className="text-base mb-4">
              {question.content?.text?.split(/(\[blank\d*\])/).map((part, index) => {
                const blankMatch = part.match(/\[blank(\d*)\]/)
                return blankMatch ? (
                  <span key={index} className="inline-block px-3 py-1 bg-cyan-100 rounded mx-1">
                    ___
                  </span>
                ) : (
                  <span key={index}>{part}</span>
                )
              })}
            </p>
            <div className="mt-4">
              <h4 className="text-base font-medium mb-2">Các lựa chọn:</h4>
              <div className="flex flex-wrap gap-2">
                {question.options?.answers?.map((option: any, index: number) => (
                  <div
                    key={index}
                    className={`px-3 py-2 rounded-md text-sm ${
                      option.correct_position
                        ? "bg-cyan-100 border border-cyan-200 text-cyan-800"
                        : "bg-gray-100 border border-gray-200 text-gray-700"
                    }`}
                  >
                    {option.text}
                    {option.correct_position && (
                      <span className="ml-2 text-xs text-cyan-600">
                        {option.correct_position > 0 ? `(Vị trí ${option.correct_position})` : ""}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case "labeling":
        return (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-3">Gắn nhãn</h3>
            {/* Hiển thị hình ảnh và các ô trống */}
            <div className="relative w-full max-w-md h-60 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden">
              {question.content?.media?.url ? (
                <div className="relative w-full h-full">
                  <Image
                    src={question.content.media.url || "/placeholder.svg?height=240&width=480&query=labeling image"}
                    alt="Labeling image"
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />

                  {/* Hiển thị các ô trống dựa trên tọa độ */}
                  {question.options?.blanks?.map((blank: any, index: number) => {
                    if (!blank.coordinates) return null
                    const { x, y, w, h } = blank.coordinates

                    return (
                      <div
                        key={index}
                        className="absolute border-2 border-solid border-pink-500 rounded-md bg-pink-100 bg-opacity-40"
                        style={{
                          left: `${x / 10}%`,
                          top: `${y / 10}%`,
                          width: `${w / 10}%`,
                          height: `${h / 10}%`,
                          zIndex: 10,
                        }}
                      >
                        <div className="absolute -top-6 left-0 text-xs font-medium bg-pink-100 px-1.5 py-0.5 rounded text-pink-800 border border-pink-300">
                          {index + 1}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <ImageIcon className="h-16 w-16 text-gray-300" />
                </div>
              )}
            </div>

            {/* Hiển thị danh sách nhãn */}
            <div className="mt-4">
              <h4 className="text-base font-medium mb-2">Nhãn:</h4>
              <div className="flex flex-wrap gap-2">
                {question.options?.labels?.map((label: any, index: number) => (
                  <div
                    key={index}
                    className="px-3 py-1.5 rounded-full bg-pink-100 text-pink-800 text-sm border border-pink-200 flex items-center gap-1"
                  >
                    <span className="w-5 h-5 flex items-center justify-center bg-pink-200 rounded-full text-pink-800 text-xs font-medium">
                      {label.correct_position || index + 1}
                    </span>
                    {label.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case "category":
        return (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-3">Phân loại</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {question.options?.categories?.map((category: any, catIndex: number) => {
                // Lấy ID của category
                const categoryId = category.id || `cat-${catIndex + 1}`

                // Tìm các items thuộc về category này dựa vào correct_answers.list
                const categoryItems = question.options?.items?.filter((item: any) => {
                  // Kiểm tra xem item này có thuộc category này không
                  const itemId = item.id
                  const itemCategoryId = question.correct_answers?.list?.[itemId]
                  return itemCategoryId === categoryId
                })

                return (
                  <div key={catIndex} className="border rounded-lg overflow-hidden">
                    <div className="bg-orange-100 p-3 font-medium border-b">
                      {category.media?.url && category.media.type === "image" && (
                        <div className="w-6 h-6 inline-block mr-2 relative">
                          <Image
                            src={category.media.url || "/placeholder.svg?height=24&width=24&query=category image"}
                            alt={category.name}
                            fill
                            className="object-cover rounded"
                            sizes="24px"
                          />
                        </div>
                      )}
                      {category.name}
                    </div>
                    <div className="p-3 bg-white">
                      {categoryItems && categoryItems.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {categoryItems.map((item: any, itemIndex: number) => (
                            <div
                              key={itemIndex}
                              className="px-2 py-1 bg-orange-50 text-sm rounded border border-orange-200 flex items-center gap-1"
                            >
                              {item.text}
                              {item.media?.url && item.media.type === "image" && (
                                <div className="w-4 h-4 relative">
                                  <Image
                                    src={item.media.url || "/placeholder.svg?height=16&width=16&query=item image"}
                                    alt={item.text}
                                    fill
                                    className="object-cover rounded"
                                    sizes="16px"
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 italic">Không có mục nào</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )

      case "writing":
        return (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-3">Câu hỏi tự luận</h3>
            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="h-5 w-5 text-indigo-500" />
                <span className="font-medium text-indigo-700">Hướng dẫn</span>
              </div>
              <p className="text-gray-700 mb-3">{question.metadata?.instructions || "Đọc và trả lời câu hỏi."}</p>
              <div className="flex flex-wrap gap-3 text-sm">
                <div className="px-3 py-1 bg-indigo-100 rounded-full text-indigo-600">
                  <Clock className="h-4 w-4 inline-block mr-1" /> Thời gian: {formatTime(question.metadata?.time || 60)}
                </div>
                {question.metadata?.max_characters && (
                  <div className="px-3 py-1 bg-indigo-100 rounded-full text-indigo-600">
                    Giới hạn {question.metadata.max_characters} ký tự
                  </div>
                )}
                {question.metadata?.allow_image_upload && (
                  <div className="px-3 py-1 bg-indigo-100 rounded-full text-indigo-600">
                    <ImageIcon className="h-4 w-4 inline-block mr-1" /> Cho phép tải lên hình ảnh
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-gray-500 italic text-sm">Học sinh sẽ nhập câu trả lời tại đây</p>
            </div>
          </div>
        )

      case "speaking":
        return (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-3">Câu hỏi nói</h3>
            <div className="p-4 bg-rose-50 rounded-lg border border-rose-200">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="h-5 w-5 text-rose-500" />
                <span className="font-medium text-rose-700">Hướng dẫn</span>
              </div>
              <p className="text-gray-700 mb-3">{question.metadata?.instructions || "Đọc to câu sau đây."}</p>
              <div className="flex flex-wrap gap-3 text-sm">
                <div className="px-3 py-1 bg-rose-100 rounded-full text-rose-600">
                  <Clock className="h-4 w-4 inline-block mr-1" /> Thời gian: {formatTime(question.metadata?.time || 60)}
                </div>
                {question.metadata?.max_recording_time && (
                  <div className="px-3 py-1 bg-rose-100 rounded-full text-rose-600">
                    Thời gian ghi âm tối đa: {question.metadata.max_recording_time} giây
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-gray-500 italic text-sm">Học sinh sẽ ghi âm câu trả lời tại đây</p>
            </div>
          </div>
        )

      default:
        return (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-500 italic">Không có thông tin chi tiết về đáp án cho loại câu hỏi này.</p>
          </div>
        )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">

        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-Clever School-green mx-auto mb-4 animate-spin" />
              <h3 className="text-xl font-medium text-gray-700">Đang tải thông tin câu hỏi</h3>
              <p className="text-gray-500 mt-2">Vui lòng đợi trong giây lát...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-gray-50">

        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-700">Không tìm thấy câu hỏi</h3>
              <p className="text-gray-500 mt-2">Câu hỏi không tồn tại hoặc đã bị xóa.</p>
              <Button className="mt-4 bg-Clever School-green" asChild>
                <Link href="/admin/question-bank">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Quay lại ngân hàng câu hỏi
                </Link>
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <main className="container mx-auto px-4 py-8">
        {/* Tiêu đề trang */}
        <div className="flex items-center gap-2 mb-6">
          <Button variant="outline" className="rounded-full" asChild>
            <Link href="/admin/question-bank">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại ngân hàng câu hỏi
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-800">Chi tiết câu hỏi</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border-Clever School-green">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Thông tin cơ bản</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-full ${questionType.color}`}>{questionType.icon}</div>
                    <span className="font-medium">{questionType.name}</span>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge className={difficulty.color}>
                      {question.level === "easy" ? "Dễ" : question.level === "medium" ? "Trung bình" : "Khó"}
                    </Badge>
                    <Badge variant="outline">{category.name}</Badge>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Kỹ năng</p>
                  <p className="font-medium">{question.skill || "Không xác định"}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Điểm</p>
                  <p className="font-medium">{question.metadata?.points || 10}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Thời gian làm</p>
                  <p className="font-medium">{formatTime(question.metadata?.time || 60)}</p>
                </div>

                <div className="pt-2">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/admin/question-bank/edit/${params.id}`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Chỉnh sửa
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full mt-2 text-red-500 hover:text-red-700">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Xóa
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main content */}
          <div className="lg:col-span-3">
            <Card className="border-Clever School-green">
              <CardHeader>
                <CardTitle>Nội dung câu hỏi</CardTitle>
                <CardDescription>{question.metadata?.instructions || "Hướng dẫn: Chọn đáp án đúng."}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-medium mb-2">Câu hỏi</h2>
                    <p className="text-base">{question.content?.text}</p>
                    {renderQuestionMedia()}
                  </div>

                  {renderAnswers()}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
