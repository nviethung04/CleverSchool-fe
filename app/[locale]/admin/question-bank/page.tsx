"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  HelpCircle,
  Check,
  X,
  Clipboard,
  FileText,
  ImageIcon,
  Music,
  Video,
  ListFilter,
  BookOpen,
  Layers,
  PenTool,
  Shuffle,
  Tag,
  MoreHorizontal,
  Copy,
  MoveHorizontal,
  GripHorizontal,
  MessageSquare,
  Clock,
  User,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import Image from "next/image"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getQuestions } from "@/lib/api/questions"
import { useToast } from "@/components/ui/use-toast"

// Định nghĩa các loại câu hỏi
const QUESTION_TYPES = {
  "multiple-choice": {
    name: "Trắc nghiệm",
    icon: <ListFilter className="h-4 w-4" />,
    color: "bg-blue-100 text-blue-600",
  },
  "fill-in-blank": {
    name: "Điền vào chỗ trống",
    icon: <PenTool className="h-4 w-4" />,
    color: "bg-purple-100 text-purple-600",
  },
  matching: {
    name: "Ghép cặp",
    icon: <Layers className="h-4 w-4" />,
    color: "bg-green-100 text-green-600",
  },
  ordering: {
    name: "Sắp xếp",
    icon: <Shuffle className="h-4 w-4" />,
    color: "bg-amber-100 text-amber-600",
  },
  "drag-drop": {
    name: "Kéo thả",
    icon: <MoveHorizontal className="h-4 w-4" />,
    color: "bg-cyan-100 text-cyan-600",
  },
  labeling: {
    name: "Gắn nhãn",
    icon: <Tag className="h-4 w-4" />,
    color: "bg-pink-100 text-pink-600",
  },
  category: {
    name: "Phân loại",
    icon: <GripHorizontal className="h-4 w-4" />,
    color: "bg-orange-100 text-orange-600",
  },
  writing: {
    name: "Viết",
    icon: <BookOpen className="h-4 w-4" />,
    color: "bg-indigo-100 text-indigo-600",
  },
  speaking: {
    name: "Nói",
    icon: <MessageSquare className="h-4 w-4" />,
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

// Hàm chuyển đổi loại câu hỏi từ API sang định dạng hiển thị
const mapQuestionType = (apiType) => {
  const typeMap = {
    multiple_choice: "multiple-choice",
    fill_in_blanks: "fill-in-blank",
    ordering: "ordering",
    matching: "matching",
    drag_drop: "drag-drop",
    labeling: "labeling",
    category: "category",
    speaking: "speaking",
    writing: "writing",
  }
  return typeMap[apiType] || apiType
}

export default function TeacherQuestionBankPage() {
  const { toast } = useToast()
  // State cho phân trang và lọc
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedType, setSelectedType] = useState("all")
  const [selectedDifficulty, setSelectedDifficulty] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)

  // Lấy danh sách câu hỏi từ API
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true)
        const apiQuestions = await getQuestions()

        console.log("Received questions:", apiQuestions)

        // Kiểm tra nếu apiQuestions là mảng
        if (!Array.isArray(apiQuestions)) {
          console.warn("API did not return an array of questions:", apiQuestions)
          setQuestions([])
          return
        }

        // Chuyển đổi dữ liệu từ API sang định dạng hiển thị
        const formattedQuestions = apiQuestions
          .map((question) => {
            try {
              // Xác định loại media
              const hasImage = question.content?.media?.type === "image" && !!question.content?.media?.url
              const hasAudio = question.content?.media?.type === "audio" && !!question.content?.media?.url
              const hasVideo = question.content?.media?.type === "video" && !!question.content?.media?.url

              // Chuyển đổi loại câu hỏi
              const type = mapQuestionType(question.type)

              // Thông tin cơ bản
              const displayQuestion = {
                id: question.id || `temp-${Math.random().toString(36).substring(2, 9)}`,
                question: question.content?.text || "Không có nội dung",
                type,
                difficulty: question.level || "medium",
                category: question.topic || "general-knowledge",
                points: question.metadata?.points || 10,
                timeLimit: question.metadata?.time || 60,
                tags: [question.skill, question.topic].filter(Boolean),
                createdAt: new Date().toLocaleDateString(),
                usedCount: Math.floor(Math.random() * 20),
                creator: {
                  name: "Admin",
                  avatar: "/avatar-kid1.png",
                },
              }

              // Thêm media nếu có
              if (hasImage) displayQuestion.image = question.content.media.url
              if (hasAudio) displayQuestion.audio = question.content.media.url
              if (hasVideo) displayQuestion.video = question.content.media.url

              // Xử lý đáp án dựa trên loại câu hỏi
              switch (question.type) {
                case "multiple_choice":
                  displayQuestion.answers =
                    question.options?.answers?.map((answer) => ({
                      id: answer.id,
                      text: answer.text || "",
                      isCorrect: answer.is_correct || false,
                      image: answer.media?.url || null,
                    })) || []
                  break

                case "fill_in_blanks":
                  displayQuestion.content = question.content?.text || ""
                  displayQuestion.answers =
                    question.options?.answers?.map((answer) => ({
                      id: answer.id,
                      position: answer.correct_position || 0,
                      text: answer.text || "",
                      isCorrect: true,
                    })) || []
                  break

                case "ordering":
                  // Lấy danh sách các mục cần sắp xếp
                  const orderingItems =
                    question.options?.answers?.map((answer) => ({
                      id: answer.id,
                      text: answer.text || "",
                      image: answer.media?.url || null,
                      correctPosition: answer.correct_position || null,
                    })) || []

                  // Lấy thứ tự đ��ng từ correct_answers.ids
                  const correctOrderIds = question.correct_answers?.ids || []

                  // Gán thứ tự đúng cho từng mục
                  orderingItems.forEach((item) => {
                    const index = correctOrderIds.findIndex((id) => id === item.id)
                    if (index !== -1) {
                      item.correctPosition = index + 1
                    }
                  })

                  // Sắp xếp theo thứ tự đúng
                  const sortedOrderingItems = [...orderingItems].sort((a, b) => {
                    if (a.correctPosition && b.correctPosition) {
                      return a.correctPosition - b.correctPosition
                    }
                    return 0
                  })

                  displayQuestion.answers = sortedOrderingItems
                  break

                case "matching":
                  // Lấy danh sách các mục nguồn và đích
                  const sources = question.options?.sources || []
                  const targets = question.options?.targets || []
                  const matchingList = question.correct_answers?.list || {}

                  // Tạo các cặp nối
                  const matchItems = []

                  // Duyệt qua danh sách các mục nguồn
                  for (const source of sources) {
                    const sourceId = source.id
                    const targetId = matchingList[sourceId]

                    if (targetId) {
                      // Tìm mục đích tương ứng
                      const target = targets.find((t) => t.id === targetId || t.content?.correct_position === targetId)

                      if (target) {
                        matchItems.push({
                          leftId: sourceId,
                          leftText: source.content?.text || "",
                          leftImage: source.content?.media?.url || null,
                          rightId: target.id,
                          rightText: target.content?.text || "",
                          rightImage: target.content?.media?.url || null,
                        })
                      }
                    }
                  }

                  displayQuestion.matchItems = matchItems
                  break

                case "drag_drop":
                  // Lấy nội dung câu hỏi
                  displayQuestion.questionText = question.content?.text || ""

                  // Lấy danh sách các lựa chọn
                  const dragDropOptions =
                    question.options?.answers?.map((answer) => {
                      const correctPosition = question.correct_answers?.list?.[answer.id] || 0
                      return {
                        id: answer.id,
                        text: answer.text || "",
                        correctPosition,
                        isCorrect: correctPosition > 0,
                      }
                    }) || []

                  displayQuestion.dragDropOptions = dragDropOptions
                  break

                case "labeling":
                  // Lấy hình ảnh cần gắn nhãn
                  displayQuestion.labelImage = question.content?.media?.url || null

                  // Lấy danh sách nhãn và vị trí
                  const labels = question.options?.labels || []
                  const blanks = question.options?.blanks || []
                  const labelingList = question.correct_answers?.list || {}

                  console.log("Labeling question data:", {
                    labels,
                    blanks,
                    labelingList,
                    content: question.content,
                  })

                  // Lưu danh sách nhãn
                  displayQuestion.labels = labels.map((label) => ({
                    id: label.id,
                    text: label.text || "",
                  }))

                  // Tạo danh sách vị trí nhãn
                  const labelPositions = []

                  // Duyệt qua danh sách các vị trí
                  for (const blank of blanks) {
                    const blankId = blank.id
                    // Tìm nhãn tương ứng từ labelingList hoặc sử dụng vị trí mặc định
                    const labelId = labelingList[blankId]
                    const label = labelId ? labels.find((l) => l.id === labelId) : null

                    // Thêm vị trí vào danh sách, ngay cả khi không có nhãn tương ứng
                    if (blank.coordinates) {
                      labelPositions.push({
                        id: blankId,
                        labelId: labelId,
                        answer: label ? label.text : "",
                        x: blank.coordinates.x || 0,
                        y: blank.coordinates.y || 0,
                        width: blank.coordinates.w || 10,
                        height: blank.coordinates.h || 10,
                      })
                    }
                  }

                  // Nếu không có vị trí nào, tạo vị trí mặc định cho mỗi nhãn
                  if (labelPositions.length === 0 && labels.length > 0) {
                    // Tạo vị trí mặc định cho mỗi nhãn
                    labels.forEach((label, index) => {
                      const yPosition = 20 + index * 20 // Phân bố đều theo chiều dọc
                      labelPositions.push({
                        id: `default-${index}`,
                        labelId: label.id,
                        answer: label.text || "",
                        x: 10, // Vị trí mặc định bên trái
                        y: yPosition,
                        width: 20,
                        height: 15,
                      })
                    })
                  }

                  displayQuestion.labelPositions = labelPositions
                  break

                case "category":
                  // Lấy danh sách các mục và danh mục
                  const items = question.options?.items || []
                  const categories = question.options?.categories || []
                  const categoryList = question.correct_answers?.list || {}

                  // Tạo cấu trúc danh mục
                  const categoryStructure = []

                  // Tạo map các danh mục
                  const categoryMap = {}
                  categories.forEach((cat) => {
                    const catId = cat.id
                    if (!categoryMap[catId]) {
                      categoryMap[catId] = {
                        id: catId,
                        name: cat.name || "",
                        image: cat.media?.url || null,
                        items: [],
                      }
                      categoryStructure.push(categoryMap[catId])
                    }
                  })

                  // Phân loại các mục vào danh mục
                  items.forEach((item) => {
                    const itemId = item.id
                    const categoryId = categoryList[itemId]

                    if (categoryId && categoryMap[categoryId]) {
                      categoryMap[categoryId].items.push({
                        id: itemId,
                        text: item.text || "",
                        image: item.media?.url || null,
                      })
                    }
                  })

                  displayQuestion.categories = categoryStructure
                  break
              }

              return displayQuestion
            } catch (err) {
              console.error("Error processing question:", err, question)
              return null
            }
          })
          .filter(Boolean) // Lọc bỏ các phần tử null

        setQuestions(formattedQuestions)
      } catch (error) {
        console.error("Error fetching questions:", error)
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách câu hỏi. Vui lòng thử lại sau.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [toast])

  // Lọc câu hỏi dựa trên các bộ lọc đã chọn
  const filteredQuestions = questions.filter((question) => {
    // Lọc theo loại câu hỏi
    if (selectedType !== "all" && question.type !== selectedType) return false

    // Lọc theo độ khó
    if (selectedDifficulty !== "all" && question.difficulty !== selectedDifficulty) return false

    // Lọc theo danh mục
    if (selectedCategory !== "all" && question.category !== selectedCategory) return false

    // Lọc theo từ khóa tìm kiếm
    if (searchQuery && !question.question.toLowerCase().includes(searchQuery.toLowerCase())) return false

    return true
  })

  // Phân trang
  const itemsPerPage = 9 // Hiển thị tất cả 9 loại câu hỏi trên 1 trang
  const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage)
  const paginatedQuestions = filteredQuestions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Danh sách loại câu hỏi để lọc
  const questionTypes = [
    { id: "all", name: "Tất cả loại" },
    ...Object.entries(QUESTION_TYPES).map(([id, { name }]) => ({ id, name })),
  ]

  // Danh sách độ khó để lọc
  const difficultyLevels = [
    { id: "all", name: "Tất cả độ khó" },
    ...Object.entries(DIFFICULTY_LEVELS).map(([id, { name }]) => ({ id, name })),
  ]

  // Danh sách danh mục để lọc
  const categories = [
    { id: "all", name: "Tất cả danh mục" },
    ...Object.entries(CATEGORIES).map(([id, { name }]) => ({ id, name })),
  ]

  return (
    <div className="min-h-screen bg-gray-50">

      <main className="container mx-auto px-4 py-8">
        {/* Tiêu đề trang và thanh công cụ */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Ngân hàng câu hỏi</h1>
            <p className="text-gray-600">Quản lý và tạo câu hỏi cho bài tập, bài kiểm tra</p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm câu hỏi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-full focus:outline-none focus:ring-1 focus:ring-Clever School-green"
              />
            </div>
            <Button
              className="rounded-full bg-Clever School-green text-white hover:bg-opacity-90 flex items-center gap-2"
              asChild
            >
              <Link href="/admin/question-bank/create-question">
                <Plus className="h-4 w-4" />
                Tạo câu hỏi mới
              </Link>
            </Button>
          </div>
        </div>

        {/* Bộ lọc */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">Lọc theo:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn loại câu hỏi" />
                </SelectTrigger>
                <SelectContent>
                  {questionTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn độ khó" />
                </SelectTrigger>
                <SelectContent>
                  {difficultyLevels.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      {level.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Danh sách câu hỏi */}
        <Tabs defaultValue="all" className="mb-8">
          <TabsList className="mb-6">
            <TabsTrigger value="all" className="data-[state=active]:bg-Clever School-blue data-[state=active]:text-white">
              <HelpCircle className="h-4 w-4 mr-2" />
              Tất cả câu hỏi
            </TabsTrigger>
            <TabsTrigger value="recent" className="data-[state=active]:bg-Clever School-green data-[state=active]:text-white">
              <Clipboard className="h-4 w-4 mr-2" />
              Gần đây
            </TabsTrigger>
            <TabsTrigger
              value="most-used"
              className="data-[state=active]:bg-Clever School-yellow data-[state=active]:text-white"
            >
              <FileText className="h-4 w-4 mr-2" />
              Sử dụng nhiều
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {loading ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                <Loader2 className="h-12 w-12 text-gray-300 mx-auto mb-3 animate-spin" />
                <h3 className="text-lg font-medium text-gray-600">Đang tải câu hỏi</h3>
                <p className="text-gray-500 mt-1">Vui lòng đợi trong giây lát</p>
              </div>
            ) : paginatedQuestions.length > 0 ? (
              <div className="space-y-4">
                {paginatedQuestions.map((question) => (
                  <QuestionCard key={question.id} question={question} />
                ))}

                {/* Phân trang */}
                {totalPages > 1 && (
                  <div className="mt-6">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink isActive={currentPage === page} onClick={() => setCurrentPage(page)}>
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}

                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
                <HelpCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-600">Không tìm thấy câu hỏi nào</h3>
                <p className="text-gray-500 mt-1">Thử thay đổi bộ lọc hoặc tạo câu hỏi mới</p>
                <Button className="mt-4 bg-Clever School-green" asChild>
                  <Link href="/admin/question-bank/create-question">
                    <Plus className="h-4 w-4 mr-2" />
                    Tạo câu hỏi mới
                  </Link>
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="recent">
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
              <Clipboard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-600">Đang tải câu hỏi gần đây</h3>
              <p className="text-gray-500 mt-1">Vui lòng đợi trong giây lát</p>
            </div>
          </TabsContent>

          <TabsContent value="most-used">
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-600">Đang tải câu hỏi sử dụng nhiều</h3>
              <p className="text-gray-500 mt-1">Vui lòng đợi trong giây lát</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

// Component hiển thị câu hỏi dạng card
function QuestionCard({ question }: { question: any }) {
  // Lấy thông tin loại câu hỏi
  const questionType = QUESTION_TYPES[question.type as keyof typeof QUESTION_TYPES] || {
    name: "Khác",
    icon: <HelpCircle className="h-4 w-4" />,
    color: "bg-gray-100 text-gray-600",
  }

  // Lấy thông tin độ khó
  const difficulty = DIFFICULTY_LEVELS[question.difficulty as keyof typeof DIFFICULTY_LEVELS] || {
    name: "Không xác định",
    color: "bg-gray-100 text-gray-600",
  }

  // Lấy thông tin danh mục
  const category = CATEGORIES[question.category as keyof typeof CATEGORIES] || {
    name: "Khác",
    color: "bg-gray-50 text-gray-600",
  }

  // Xác định nếu câu hỏi có media
  const hasImage = !!question.image
  const hasAudio = !!question.audio
  const hasVideo = !!question.video

  // Định dạng thời gian
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  // Hiển thị đáp án dựa trên loại câu hỏi
  const renderAnswers = () => {
    switch (question.type) {
      case "multiple-choice":
        return (
          <div className="mt-3">
            <div className="flex flex-wrap gap-3">
              {question.answers?.map((answer: any, index: number) => (
                <div
                  key={index}
                  className={`flex flex-col items-center p-2 rounded-lg ${answer.isCorrect ? "bg-green-50 border border-green-200" : "bg-gray-50 border border-gray-200"
                    }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${answer.isCorrect ? "bg-green-100" : "bg-gray-100"
                        }`}
                    >
                      {answer.isCorrect ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <X className="h-3 w-3 text-gray-400" />
                      )}
                    </div>
                    <span className="text-sm">{answer.text}</span>
                  </div>
                  {answer.image && (
                    <div className="w-16 h-16 relative rounded overflow-hidden">
                      <Image
                        src={answer.image || "/placeholder.svg?height=64&width=64&query=image"}
                        alt={answer.text}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )

      case "fill-in-blank":
        return (
          <div className="mt-3">
            <p className="text-sm mb-2">
              {question.content?.split(/(\[blank\d*\])/).map((part, index) => {
                const blankMatch = part.match(/\[blank(\d*)\]/)
                return blankMatch ? (
                  <span key={index} className="inline-block px-2 py-0.5 bg-purple-100 rounded mx-1">
                    ___
                  </span>
                ) : (
                  <span key={index}>{part}</span>
                )
              })}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {question.answers?.map((answer: any, index: number) => (
                <div key={index} className="flex items-center gap-2">
                  <Badge className="bg-purple-100 text-purple-600">Blank {answer.position || index + 1}:</Badge>
                  <span className="text-sm font-medium">{answer.text}</span>
                </div>
              ))}
            </div>
          </div>
        )

      case "ordering":
        return (
          <div className="mt-3">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-gray-700">Thứ tự đúng:</p>
              <div className="flex flex-col gap-1">
                {question.answers?.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-amber-50 rounded-md border border-amber-200"
                  >
                    <span className="w-6 h-6 flex items-center justify-center bg-amber-100 rounded-full text-amber-700 text-xs font-medium">
                      {index + 1}
                    </span>
                    <span className="text-sm">{item.text}</span>
                    {item.image && (
                      <div className="w-8 h-8 relative ml-auto">
                        <Image
                          src={item.image || "/placeholder.svg"}
                          alt={item.text}
                          fill
                          className="object-cover rounded"
                          sizes="32px"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case "matching":
        return (
          <div className="mt-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm font-medium text-gray-700 col-span-2">Các cặp nối:</div>
              {question.matchItems?.map((item: any, index: number) => (
                <div key={index} className="col-span-2 grid grid-cols-2 gap-2">
                  <div className="p-2 bg-green-50 rounded-md border border-green-200 flex items-center">
                    <span className="text-sm">{item.leftText}</span>
                    {item.leftImage && (
                      <div className="w-8 h-8 relative ml-auto">
                        <Image
                          src={item.leftImage || "/placeholder.svg"}
                          alt={item.leftText}
                          fill
                          className="object-cover rounded"
                          sizes="32px"
                        />
                      </div>
                    )}
                  </div>
                  <div className="p-2 bg-blue-50 rounded-md border border-blue-200 flex items-center">
                    <span className="text-sm">{item.rightText}</span>
                    {item.rightImage && (
                      <div className="w-8 h-8 relative ml-auto">
                        <Image
                          src={item.rightImage || "/placeholder.svg"}
                          alt={item.rightText}
                          fill
                          className="object-cover rounded"
                          sizes="32px"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case "drag-drop":
        return (
          <div className="mt-3">
            <p className="text-sm mb-2">
              {question.questionText?.split(/(\[blank\d*\])/).map((part, index) => {
                const blankMatch = part.match(/\[blank(\d*)\]/)
                return blankMatch ? (
                  <span key={index} className="inline-block px-2 py-0.5 bg-cyan-100 rounded mx-1">
                    ___
                  </span>
                ) : (
                  <span key={index}>{part}</span>
                )
              })}
            </p>
            <div className="mt-2">
              <p className="text-sm font-medium text-gray-700 mb-1">Các lựa chọn:</p>
              <div className="flex flex-wrap gap-2">
                {question.dragDropOptions?.map((option: any, index: number) => (
                  <div
                    key={index}
                    className={`px-3 py-1.5 rounded-md text-sm ${option.isCorrect
                      ? "bg-cyan-100 border border-cyan-200 text-cyan-800"
                      : "bg-gray-100 border border-gray-200 text-gray-700"
                      }`}
                  >
                    {option.text}
                    {option.isCorrect && (
                      <span className="ml-2 text-xs text-cyan-600">
                        {option.correctPosition > 0 ? `(Vị trí ${option.correctPosition})` : ""}
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
          <div className="mt-3">
            {/* Hiển thị hình ảnh và các ô trống */}
            <div className="relative w-full max-w-xs h-40 bg-gray-100 rounded-md border border-gray-200 overflow-hidden">
              {question.labelImage ? (
                <div className="relative w-full h-full">
                  <Image
                    src={question.labelImage || "/placeholder.svg"}
                    alt="Labeling image"
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />

                  {/* Hiển thị các ô trống dựa trên tọa độ chính xác */}
                  {question.labelPositions?.map((position: any, index: number) => (
                    <div
                      key={index}
                      className="absolute border-2 border-solid border-pink-500 rounded-md bg-pink-100 bg-opacity-40"
                      style={{
                        left: `${position.x}%`,
                        top: `${position.y}%`,
                        width: `${position.width}%`,
                        height: `${position.height}%`,
                        zIndex: 10,
                      }}
                    >
                      {/* Hiển thị số thứ tự của ô trống */}
                      <div className="absolute -top-6 left-0 text-xs font-medium bg-pink-100 px-1.5 py-0.5 rounded text-pink-800 border border-pink-300">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <ImageIcon className="h-12 w-12 text-gray-300" />
                </div>
              )}
            </div>

            {/* Hiển thị danh sách nhãn */}
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Nhãn:</p>
              <div className="flex flex-wrap gap-2">
                {/* Ưu tiên hiển thị nhãn từ labels nếu có */}
                {question.labels && question.labels.length > 0
                  ? question.labels.map((label: any, index: number) => {
                    // Tìm vị trí tương ứng với nhãn này (nếu có)
                    const position = question.labelPositions?.find((pos) => pos.labelId === label.id)
                    const positionIndex = position
                      ? question.labelPositions.findIndex((pos) => pos.labelId === label.id)
                      : index

                    return (
                      <div
                        key={index}
                        className="px-3 py-1.5 rounded-full bg-pink-100 text-pink-800 text-sm border border-pink-200 flex items-center gap-1"
                      >
                        {/* Hiển thị số thứ tự tương ứng với vị trí trên hình ảnh */}
                        {position && (
                          <span className="w-4 h-4 flex items-center justify-center bg-pink-200 rounded-full text-pink-800 text-xs font-medium">
                            {positionIndex + 1}
                          </span>
                        )}
                        {label.text}
                      </div>
                    )
                  })
                  : // Fallback: hiển thị nhãn từ labelPositions nếu không có labels
                  question.labelPositions?.map((position: any, index: number) => (
                    <div
                      key={index}
                      className="px-3 py-1.5 rounded-full bg-pink-100 text-pink-800 text-sm border border-pink-200 flex items-center gap-1"
                    >
                      <span className="w-4 h-4 flex items-center justify-center bg-pink-200 rounded-full text-pink-800 text-xs font-medium">
                        {index + 1}
                      </span>
                      {position.answer}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )

      case "category":
        return (
          <div className="mt-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {question.categories?.map((category: any, catIndex: number) => (
                <div key={catIndex} className="border rounded-md overflow-hidden">
                  <div className="bg-orange-100 p-2 font-medium text-sm border-b">
                    {category.image && (
                      <div className="w-6 h-6 inline-block mr-2 relative">
                        <Image
                          src={category.image || "/placeholder.svg"}
                          alt={category.name}
                          fill
                          className="object-cover rounded"
                          sizes="24px"
                        />
                      </div>
                    )}
                    {category.name}
                  </div>
                  <div className="p-2 bg-white">
                    {category.items?.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {category.items.map((item: any, itemIndex: number) => (
                          <div
                            key={itemIndex}
                            className="px-2 py-1 bg-orange-50 text-xs rounded border border-orange-200 flex items-center gap-1"
                          >
                            {item.text}
                            {item.image && (
                              <div className="w-4 h-4 relative">
                                <Image
                                  src={item.image || "/placeholder.svg"}
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
              ))}
            </div>
          </div>
        )

      case "writing":
        return (
          <div className="mt-3">
            <div className="p-3 bg-indigo-50 rounded-md border border-indigo-200">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 text-indigo-500" />
                <span className="text-sm font-medium text-indigo-700">Câu hỏi tự luận</span>
              </div>
              <p className="text-sm text-gray-600">
                {question.writingMaxCharacters
                  ? `Giới hạn ${question.writingMaxCharacters} ký tự`
                  : "Không giới hạn số ký tự"}
              </p>
              {question.writingAllowImageUpload && <p className="text-sm text-gray-600">Cho phép tải lên hình ảnh</p>}
            </div>
          </div>
        )

      case "speaking":
        return (
          <div className="mt-3">
            <div className="p-3 bg-rose-50 rounded-md border border-rose-200">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-rose-500" />
                <span className="text-sm font-medium text-rose-700">Câu hỏi nói</span>
              </div>
              <p className="text-sm text-gray-600">
                Thời gian ghi âm tối đa: {question.speakingMaxDuration || 60} giây
              </p>
            </div>
          </div>
        )

      default:
        return (
          <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
            <p className="text-sm italic text-gray-600">Xem chi tiết để biết thêm thông tin</p>
          </div>
        )
    }
  }

  // Cập nhật hàm renderQuestionMedia() để hiển thị media dạng audio và video tốt hơn
  const renderQuestionMedia = () => {
    if (hasImage) {
      return (
        <div className="mt-3 w-full max-w-xs h-40 relative rounded overflow-hidden">
          <Image
            src={question.image || "/placeholder.svg?height=160&width=320&query=question image"}
            alt={question.question}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )
    }

    if (hasAudio) {
      return (
        <div className="mt-3 p-3 bg-purple-50 rounded-md border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Music className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium text-purple-700">Âm thanh</span>
          </div>
          <audio controls className="w-full max-w-xs">
            <source src={question.audio} type="audio/mpeg" />
            Trình duyệt của bạn không hỗ trợ phát âm thanh.
          </audio>
        </div>
      )
    }

    if (hasVideo) {
      return (
        <div className="mt-3 p-3 bg-amber-50 rounded-md border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <Video className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-700">Video</span>
          </div>
          <div className="relative w-full max-w-xs aspect-video rounded overflow-hidden">
            <video controls className="w-full h-full object-cover" poster="/video-thumbnail.png">
              <source src={question.video} type="video/mp4" />
              Trình duyệt của bạn không hỗ trợ phát video.
            </video>
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Phần thông tin câu hỏi */}
          <div className="flex-1">
            <div className="flex items-start gap-3">
              {/* Icon loại câu hỏi */}
              <div className={`p-2 rounded-full ${questionType.color} flex-shrink-0 mt-1`}>{questionType.icon}</div>

              <div className="flex-1">
                {/* Tiêu đề và loại câu hỏi */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge className={questionType.color}>{questionType.name}</Badge>
                  <Badge className={difficulty.color}>
                    {question.difficulty === "easy" ? "Dễ" : question.difficulty === "medium" ? "Trung bình" : "Khó"}
                  </Badge>
                  <Badge variant="outline">{category.name}</Badge>

                  {/* Hiển thị badge cho media */}
                  {hasImage && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-600">
                      <ImageIcon className="h-3 w-3 mr-1" /> Hình ảnh
                    </Badge>
                  )}
                  {hasAudio && (
                    <Badge variant="outline" className="bg-purple-50 text-purple-600">
                      <Music className="h-3 w-3 mr-1" /> Âm thanh
                    </Badge>
                  )}
                  {hasVideo && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-600">
                      <Video className="h-3 w-3 mr-1" /> Video
                    </Badge>
                  )}
                </div>

                {/* Nội dung câu hỏi */}
                <h3 className="font-medium text-lg text-gray-800">{question.question}</h3>

                {/* Hiển thị media của câu hỏi */}
                {renderQuestionMedia()}

                {/* Hiển thị đáp án */}
                {renderAnswers()}

                {/* Tags */}
                {question.tags && question.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {question.tags.map((tag: string, index: number) => (
                      <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Phần thông tin bổ sung và thao tác */}
          <div className="md:w-48 flex flex-row md:flex-col justify-between md:justify-start items-end md:items-stretch flex-shrink-0 mt-3 md:mt-0 gap-2 md:gap-4">
            <div className="space-y-2 w-full">
              <div className="text-sm">
                <span className="text-gray-500">Điểm: </span>
                <span className="font-medium">{question.points}</span>
              </div>

              <div className="text-sm">
                <span className="text-gray-500">Đã sử dụng: </span>
                <span className="font-medium">{question.usedCount} lần</span>
              </div>

              <div className="text-sm">
                <span className="text-gray-500">Ngày tạo: </span>
                <span className="font-medium">{question.createdAt}</span>
              </div>

              <div className="text-sm flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-gray-500">Thời gian làm: </span>
                <span className="font-medium">{formatTime(question.timeLimit || 60)}</span>
              </div>

              <div className="text-sm flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-gray-500">Người tạo: </span>
                <div className="flex items-center gap-1">
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={question.creator?.avatar || "/placeholder.svg?height=16&width=16&query=avatar"} />
                    <AvatarFallback>{question.creator?.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{question.creator?.name}</span>
                </div>
              </div>
            </div>

            <div className="flex md:flex-col gap-1 md:mt-auto">
              <Button size="sm" className="text-white text-xs px-3 h-8 bg-Clever School-blue" asChild>
                <Link href={`/admin/question-bank/${question.id}`}>
                  <Eye className="h-3.5 w-3.5 mr-1.5" />
                  Chi tiết
                </Link>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs px-2 h-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Edit className="h-4 w-4 mr-2" />
                    Chỉnh sửa
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Copy className="h-4 w-4 mr-2" />
                    Sao chép
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Xóa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
