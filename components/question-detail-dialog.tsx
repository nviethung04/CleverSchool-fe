"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getQuestionById, type QuestionType } from "@/lib/api/questions"
import { LucideLoader2, LucideAlertCircle, LucideCheck, LucideX } from "lucide-react"
import Image from "next/image"
import { TiptapMathViewer } from "@/components/question-editor/tiptap-math-viewer"

interface QuestionDetailDialogProps {
  questionId: string | number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuestionDetailDialog({ questionId, open, onOpenChange }: QuestionDetailDialogProps) {
  const [question, setQuestion] = useState<QuestionType | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchQuestionDetails = async () => {
      if (!questionId || !open) return

      setLoading(true)
      setError(null)

      try {
        const response = await getQuestionById(Number(questionId))
        if (response) {
          setQuestion(response)
        } else {
          setError("Failed to fetch question details")
        }
      } catch (err: any) {
        console.error("Error fetching question details:", err)
        setError(err.message || "An error occurred while fetching question details")
      } finally {
        setLoading(false)
      }
    }

    fetchQuestionDetails()
  }, [questionId, open])

  // Format question type for display
  const formatQuestionType = (type: string) => {
    if (!type) return "Unknown"

    // Map of question types to display names
    const typeMap: Record<string, string> = {
      fill_in_blanks: "Fill In Blanks",
      matching: "Matching",
      labeling: "Labeling",
      multiple_choice: "Multiple Choice",
      ordering: "Ordering",
      drag_drop: "Drag & Drop",
      writing: "Writing",
      speaking: "Speaking",
      category: "Category",
    }

    // Return the mapped display name or format the original type if not in the map
    return (
      typeMap[type] ||
      type
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    )
  }

  // Helper function to render media content (image, audio, video)
  const renderMediaContent = (medias: { type: string; url: string }[]) => {
    if (!medias || medias.length === 0) return null

    return medias.map((media, index) => {
      if (media.type === 'image') {
        return (
          <div
            key={media.url || media.type + index}
            className="relative w-full h-48 rounded-md overflow-hidden"
          >
            <Image
              src={media.url || '/icons/placeholder.svg'}
              alt="Question media"
              fill
              className="object-contain"
            />
          </div>
        )
      }
      if (media.type === 'audio') {
        return (
          <div key={media.url || media.type + index} className="w-full">
            <audio controls className="w-full">
              <source src={media.url} />
              Your browser does not support the audio element.
            </audio>
          </div>
        )
      }
      if (media.type === 'video') {
        return (
          <div
            key={media.url || media.type + index}
            className="relative w-full h-48 rounded-md overflow-hidden"
          >
            <video controls className="w-full h-full object-contain">
              <source src={media.url} />
              Your browser does not support the video element.
            </video>
          </div>
        )
      }
    })
  }

  // Helper function to render question content based on type
  const renderQuestionContent = () => {
    if (!question) return null

    switch (question.type) {
      case "multiple_choice":
        return (
          <div className="space-y-4">
            <div className="font-medium">
              <TiptapMathViewer
                value={question.content?.text?.split("\n").join("<br />") || ""}
                isHtml
              />
            </div>
            {question.content?.medias && renderMediaContent(question.content.medias)}
            <div className="space-y-2">
              {question.options?.answers?.map((option, index) => {
                const isCorrect = question.correct_answers?.ids?.includes(index)
                return (
                  <div
                    key={index}
                    className={`p-3 border rounded-md flex items-center ${
                      isCorrect ? "border-green-500 bg-green-50" : "border-gray-200"
                    }`}
                  >
                    <div className="mr-3">
                      {isCorrect ? (
                        <LucideCheck className="h-5 w-5 text-green-500" />
                      ) : (
                        <LucideX className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <div>{option.text}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )

      case "fill_in_blanks":
        return (
          <div className="space-y-4">
            <div className="font-medium">
              <TiptapMathViewer
                value={question.content?.text?.split("\n").join("<br />") || ""}
                isHtml
              />
            </div>
            {question.content?.medias && renderMediaContent(question.content.medias)}
            <div className="space-y-2">
              <div className="p-3 border rounded-md border-green-500 bg-green-50">
                <div className="font-medium text-green-700">Correct Answers:</div>
                <div>
                  {question.correct_answers?.list
                    ? Object.entries(question.correct_answers.list).map(([key, value], index) => (
                        <div key={index}>
                          Blank {key}: {value}
                        </div>
                      ))
                    : "No correct answers provided"}
                </div>
              </div>
            </div>
          </div>
        )

      case "matching":
        const matchingOptions = question.options as any;
        return (
          <div className="space-y-4">
            <div className="font-medium">
              <TiptapMathViewer
                value={question.content?.text?.split("\n").join("<br />") || ""}
                isHtml
              />
            </div>
            {question.content?.medias && renderMediaContent(question.content.medias)}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="font-medium">Sources ({matchingOptions?.sources?.length || 0})</div>
                {matchingOptions?.sources && matchingOptions.sources.length > 0 ? (
                  matchingOptions.sources.map((source: any, index: number) => (
                    <div key={`source-${index}`} className="p-3 border rounded-md border-gray-200">
                      <div className="font-medium">{source.content?.text}</div>
                      {source.content?.media?.url && (
                        <div className="mt-2">
                          {/* Check if it's audio for smaller media items in sources/targets */}
                          {['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'].some(ext => 
                            source.content.media.url.toLowerCase().includes(ext)
                          ) ? (
                            <audio controls className="w-full max-w-48">
                              <source src={source.content.media.url} />
                              Your browser does not support the audio element.
                            </audio>
                          ) : (
                            <div className="relative w-16 h-16 rounded overflow-hidden">
                              <Image
                                src={source.content.media.url || "/placeholder.svg"}
                                alt={`Source ${index + 1}`}
                                fill
                                className="object-contain"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-3 border rounded-md border-gray-200 text-gray-500 italic">
                    No sources available
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="font-medium">Targets ({matchingOptions?.targets?.length || 0})</div>
                {matchingOptions?.targets && matchingOptions.targets.length > 0 ? (
                  matchingOptions.targets.map((target: any, index: number) => (
                    <div key={`target-${index}`} className="p-3 border rounded-md border-green-500 bg-green-50">
                      <div className="font-medium">{target.content?.text}</div>
                      {target.content?.media?.url && (
                        <div className="mt-2">
                          {/* Check if it's audio for smaller media items in sources/targets */}
                          {['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'].some(ext => 
                            target.content.media.url.toLowerCase().includes(ext)
                          ) ? (
                            <audio controls className="w-full max-w-48">
                              <source src={target.content.media.url} />
                              Your browser does not support the audio element.
                            </audio>
                          ) : (
                            <div className="relative w-16 h-16 rounded overflow-hidden">
                              <Image
                                src={target.content.media.url || "/placeholder.svg"}
                                alt={`Target ${index + 1}`}
                                fill
                                className="object-contain"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-3 border rounded-md border-gray-200 text-gray-500 italic">
                    No targets available
                  </div>
                )}
              </div>
            </div>
            
            {/* Debug info - remove in production */}
            <details className="mt-4">
              <summary className="text-sm text-gray-500 cursor-pointer">Debug: Raw question data</summary>
              <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-32">
                {JSON.stringify({
                  sources: matchingOptions?.sources,
                  targets: matchingOptions?.targets,
                  correct_answers: question.correct_answers
                }, null, 2)}
              </pre>
            </details>
          </div>
        )

      case "ordering":
        return (
          <div className="space-y-4">
            <div className="font-medium">
              <TiptapMathViewer
                value={question.content?.text?.split("\n").join("<br />") || ""}
                isHtml
              />
            </div>
            {question.content?.medias && renderMediaContent(question.content.medias)}
            <div className="space-y-2">
              <div className="font-medium">Correct Order:</div>
              {question.options?.answers?.map((answer, index) => (
                <div key={index} className="p-3 border rounded-md border-gray-200 flex items-center">
                  <div className="bg-gray-200 rounded-full w-6 h-6 flex items-center justify-center mr-3">
                    {(answer as any).correct_position || (index + 1)}
                  </div>
                  <div>{answer.text}</div>
                </div>
              ))}
            </div>
          </div>
        )

      case "category":
        return (
          <div className="space-y-4">
            <div className="font-medium">
              <TiptapMathViewer
                value={question.content?.text?.split("\n").join("<br />") || ""}
                isHtml
              />
            </div>
            {question.content?.medias && renderMediaContent(question.content.medias)}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="font-medium">Categories</div>
                {question.options?.categories?.map((category, index) => (
                  <div key={`category-${index}`} className="p-3 border rounded-md border-blue-200 bg-blue-50">
                    {category.text}
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <div className="font-medium">Items</div>
                {question.options?.items?.map((item, index) => (
                  <div key={`item-${index}`} className="p-3 border rounded-md border-gray-200">
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case "writing":
      case "speaking":
        return (
          <div className="space-y-4">
            <div className="font-medium">
              <TiptapMathViewer
                value={question.content?.text?.split("\n").join("<br />") || ""}
                isHtml
              />
            </div>
            {question.content?.medias && renderMediaContent(question.content.medias)}
            <div className="p-3 border rounded-md border-blue-200 bg-blue-50">
              <div className="font-medium text-blue-700">Instructions:</div>
              <div>{question.metadata?.instructions || "No specific instructions provided"}</div>
            </div>
          </div>
        )

      case "labeling":
        return (
          <div className="space-y-4">
            <div className="font-medium">
              <TiptapMathViewer
                value={question.content?.text?.split("\n").join("<br />") || ""}
                isHtml
              />
            </div>
            {question.content?.medias && renderMediaContent(question.content.medias)}
            <div className="space-y-2">
              <div className="font-medium">Labels:</div>
              {question.options?.labels?.map((label, index) => (
                <div key={index} className="p-3 border rounded-md border-gray-200">
                  {label.text}
                </div>
              ))}
            </div>
          </div>
        )

      case "drag_drop":
        return (
          <div className="space-y-4">
            <div className="font-medium">
              <TiptapMathViewer
                value={question.content?.text?.split("\n").join("<br />") || ""}
                isHtml
              />
            </div>
            {question.content?.medias && renderMediaContent(question.content.medias)}
            <div className="space-y-2">
              <div className="font-medium">Items to drag:</div>
              {question.options?.items?.map((item, index) => (
                <div key={index} className="p-3 border rounded-md border-gray-200">
                  {item.text}
                </div>
              ))}
              {question.options?.blanks && question.options.blanks.length > 0 && (
                <div className="mt-4">
                  <div className="font-medium">Drop zones: {question.options.blanks.length}</div>
                  <div className="p-3 border rounded-md border-gray-200 mt-2">
                    <p className="text-sm text-gray-500">
                      This question has {question.options.blanks.length} drop zones defined on the image.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      default:
        return (
          <div className="space-y-4">
            <div className="font-medium">
              <TiptapMathViewer
                value={question.content?.text?.split("\n").join("<br />") || "No question text"}
                isHtml
              />
            </div>
            {question.content?.medias && renderMediaContent(question.content.medias)}
            <div className="p-3 border rounded-md border-amber-200 bg-amber-50">
              <p className="text-amber-700">
                Detailed preview for question type "{question.type}" is not available. Basic information is shown.
              </p>
            </div>
          </div>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-lg max-h-[60vh] overflow-auto z-[1300]"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Chi tiết câu hỏi</DialogTitle>
          <DialogDescription>
            Xem nội dung và metadata của câu hỏi
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LucideLoader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Loading question details...</span>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center py-12 text-red-500">
            <LucideAlertCircle className="h-8 w-8 mr-2" />
            <span>{error}</span>
          </div>
        ) : question ? (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-lg font-semibold leading-none tracking-tight">
                <span>Question Details</span>
                <Badge variant="outline">{question.id}</Badge>
              </div>
              <Badge
                className={
                  question.status === 1
                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                    : "bg-amber-100 text-amber-800 hover:bg-amber-200"
                }
              >
                {question.status === 1 ? "Active" : "Draft"}
              </Badge>
            </div>

            <Tabs defaultValue="question" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="question">Question</TabsTrigger>
                <TabsTrigger value="metadata">Metadata</TabsTrigger>
              </TabsList>

              <TabsContent value="question" className="space-y-4">
                <Card>
                  <CardContent className="pt-6">{renderQuestionContent()}</CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="metadata" className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">Question Type</div>
                        <div className="font-medium">{formatQuestionType(question.type || "")}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Points</div>
                        <div className="font-medium">{question.metadata?.points || 0}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Level</div>
                        <div className="font-medium">
                          {question.level
                            ? question.level.charAt(0).toUpperCase() + question.level.slice(1)
                            : "Unknown"}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Skill</div>
                        <div className="font-medium">{question.skill || "Unknown"}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Topic</div>
                        <div className="font-medium">{question.topic || "Unknown"}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Created At</div>
                        <div className="font-medium">
                          {question.created_at ? new Date(question.created_at).toLocaleDateString() : "Unknown"}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-sm text-gray-500">Instructions</div>
                        <div className="mt-1 text-sm">
                          {question.metadata?.instructions || "No instructions provided"}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </>
        ) : (
          <div className="flex justify-center items-center py-12 text-gray-500">
            <span>No question data available</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
