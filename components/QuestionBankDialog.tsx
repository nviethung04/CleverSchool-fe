import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LucideSearch,
  LucideChevronLeft,
  LucideChevronRight,
  LucideBookOpen,
  LucideLoader2,
  LucideAlertCircle,
  LucideEye,
  LucideX,
} from "lucide-react";
import { TiptapMathViewer } from "@/components/question-editor/tiptap-math-viewer";
import { LatexText } from "@/components/latex-text";
import { Badge } from "@/components/ui/badge";

// Props for the shared dialog
export interface QuestionBankDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questions: any[];
  questionLoading: boolean;
  questionError: string | null;
  questionFilters: any;
  hasMoreQuestions: boolean;
  selectedQuestions: string[];
  handleQuestionToggle: (id: string, defaultPoints?: number) => void;
  handleQuestionPageChange: (page: number) => void;
  handleQuestionFilterChange: (key: string, value: string) => void;
  handleQuestionSearch: (e: React.FormEvent) => void;
  getCurrentPageQuestions: () => any[];
  handleClose: () => void;
  formatQuestionType: (type: string) => string;
  questionScores: Record<string, number>;
  handleScoreChange: (id: string, score: number) => void;
  handleViewQuestionDetail: (id: string | number) => void;
}

export const QuestionBankDialog: React.FC<QuestionBankDialogProps> = ({
  open,
  onOpenChange,
  questions,
  questionLoading,
  questionError,
  questionFilters,
  hasMoreQuestions,
  selectedQuestions,
  handleQuestionToggle,
  handleQuestionPageChange,
  handleQuestionFilterChange,
  handleQuestionSearch,
  getCurrentPageQuestions,
  handleClose,
  formatQuestionType,
  questionScores,
  handleScoreChange,
  handleViewQuestionDetail,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col rounded-3xl border-0 shadow-xl">
        <DialogHeader className="pb-4 border-b border-gray-100">
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Ngân hàng câu hỏi
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            Chọn câu hỏi để thêm vào bài kiểm tra
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 mb-6">
          <form onSubmit={handleQuestionSearch} className="relative flex-1">
            <LucideSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              className="pl-12 rounded-2xl border-gray-200 focus:border-emerald-300 focus:ring-emerald-200 py-3"
              placeholder="Tìm kiếm câu hỏi..."
              value={questionFilters.search}
              onChange={(e) =>
                handleQuestionFilterChange("search", e.target.value)
              }
            />
          </form>
          <Select
            value={questionFilters.type}
            onValueChange={(value) => handleQuestionFilterChange("type", value)}
          >
            <SelectTrigger className="w-[200px] rounded-2xl border-gray-200 focus:border-emerald-300 focus:ring-emerald-200">
              <SelectValue placeholder="Loại câu hỏi" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-gray-200">
              <SelectItem value="all" className="rounded-xl">
                Tất cả loại
              </SelectItem>
              <SelectItem value="multiple_choice" className="rounded-xl">
                Multiple Choice
              </SelectItem>
              <SelectItem value="fill_in_blanks" className="rounded-xl">
                Fill in Blanks
              </SelectItem>
              <SelectItem value="matching" className="rounded-xl">
                Matching
              </SelectItem>
              <SelectItem value="ordering" className="rounded-xl">
                Ordering
              </SelectItem>
              <SelectItem value="writing" className="rounded-xl">
                Writing
              </SelectItem>
              <SelectItem value="speaking" className="rounded-xl">
                Speaking
              </SelectItem>
              <SelectItem value="category" className="rounded-xl">
                Category
              </SelectItem>
              <SelectItem value="labeling" className="rounded-xl">
                Labeling
              </SelectItem>
              <SelectItem value="drag_drop" className="rounded-xl">
                Drag & Drop
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 overflow-auto border border-gray-200 rounded-2xl bg-gray-50">
          {questionLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <LucideLoader2 className="h-6 w-6 animate-spin text-emerald-600" />
                </div>
                <span className="text-gray-600 font-medium">
                  Đang tải câu hỏi...
                </span>
              </div>
            </div>
          ) : questionError ? (
            <div className="flex justify-center items-center h-full">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <LucideAlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <span className="text-red-600 font-medium">
                  {questionError}
                </span>
              </div>
            </div>
          ) : questions.length === 0 ? (
            <div className="flex justify-center items-center h-full">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <LucideBookOpen className="h-6 w-6 text-gray-400" />
                </div>
                <span className="text-gray-500 font-medium">
                  Không tìm thấy câu hỏi nào
                </span>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {getCurrentPageQuestions().map((question) => (
                <div
                  key={question.id}
                  className="p-4 flex items-center justify-between hover:bg-white transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      id={`question-bank-${question.id}`}
                      checked={selectedQuestions.includes(
                        question.id.toString()
                      )}
                      onChange={() =>
                        handleQuestionToggle(
                          question.id.toString(),
                          question.metadata?.points || 0
                        )
                      }
                      className="mt-1 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={`question-bank-${question.id}`}
                        className="font-medium text-gray-900 cursor-pointer block mb-2"
                      >
                        <TiptapMathViewer
                          value={question.content.text
                            .split("\n")
                            .join("<br />")}
                          isHtml
                        />
                      </label>
                      {/* Media */}
                      {question.content?.media && (
                        <div className="mb-2">
                          {/* TODO: Replace with renderMediaContent if available */}
                          <span className="text-xs text-gray-500">[Media]</span>
                        </div>
                      )}
                      {/* Multiple Choice */}
                      {question.type === "multiple_choice" &&
                        question.options?.answers && (
                          <div className="mb-2">
                            <div className="flex flex-wrap gap-1">
                              {question.options.answers
                                .slice(0, 4)
                                .map((answer, idx) => {
                                  const isCorrect =
                                    question.correct_answers?.ids?.includes(
                                      idx
                                    );
                                  return (
                                    <span
                                      key={idx}
                                      className={`text-xs px-2 py-1 rounded ${
                                        isCorrect
                                          ? "bg-green-100 text-green-700 border border-green-200"
                                          : "bg-gray-100 text-gray-600"
                                      }`}
                                    >
                                      {String.fromCharCode(65 + idx)}:{" "}
                                      <LatexText value={answer.text} />
                                    </span>
                                  );
                                })}
                            </div>
                          </div>
                        )}
                      {/* Fill in Blanks */}
                      {question.type === "fill_in_blanks" &&
                        question.correct_answers?.list && (
                          <div className="mb-2">
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(question.correct_answers.list)
                                .slice(0, 2)
                                .map(([key, value], idx) => (
                                  <span
                                    key={idx}
                                    className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 border border-blue-200"
                                  >
                                    {key}: <LatexText value={String(value)} />
                                  </span>
                                ))}
                              {Object.keys(question.correct_answers.list)
                                .length > 2 && (
                                <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                                  +
                                  {Object.keys(question.correct_answers.list)
                                    .length - 2}{" "}
                                  more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      {/* Matching */}
                      {question.type === "matching" &&
                        question.options?.sources &&
                        question.options?.targets && (
                          <div className="mb-2">
                            <div className="flex flex-wrap gap-1">
                              {question.options.sources
                                .slice(0, 2)
                                .map((source, idx) => (
                                  <span
                                    key={`src-${idx}`}
                                    className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700 border border-purple-200"
                                  >
                                    <LatexText value={source.content?.text} />
                                  </span>
                                ))}
                              <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                                ↔
                              </span>
                              {question.options.targets
                                .slice(0, 2)
                                .map((target, idx) => (
                                  <span
                                    key={`tgt-${idx}`}
                                    className="text-xs px-2 py-1 rounded bg-pink-100 text-pink-700 border border-pink-200"
                                  >
                                    <LatexText value={target.content?.text} />
                                  </span>
                                ))}
                              {(question.options.sources.length > 2 ||
                                question.options.targets.length > 2) && (
                                <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                                  +
                                  {Math.max(
                                    question.options.sources.length - 2,
                                    question.options.targets.length - 2
                                  )}{" "}
                                  more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      {/* Ordering */}
                      {question.type === "ordering" &&
                        question.options?.answers && (
                          <div className="mb-2">
                            <div className="flex flex-wrap gap-1">
                              {question.options.answers
                                .slice(0, 3)
                                .map((answer, idx) => (
                                  <span
                                    key={idx}
                                    className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-700 border border-orange-200"
                                  >
                                    {idx + 1}. <LatexText value={answer.text} />
                                  </span>
                                ))}
                              {question.options.answers.length > 3 && (
                                <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                                  +{question.options.answers.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      {/* Writing/Speaking */}
                      {(question.type === "writing" ||
                        question.type === "speaking") && (
                        <div className="mb-2">
                          <span className="text-xs px-2 py-1 rounded bg-indigo-100 text-indigo-700 border border-indigo-200">
                            Open-ended {question.type}
                          </span>
                        </div>
                      )}
                      {/* Labeling */}
                      {question.type === "labeling" &&
                        question.options?.labels && (
                          <div className="mb-2">
                            <div className="flex flex-wrap gap-1">
                              {question.options.labels
                                .slice(0, 3)
                                .map((label, idx) => (
                                  <span
                                    key={idx}
                                    className="text-xs px-2 py-1 rounded bg-cyan-100 text-cyan-700 border border-cyan-200"
                                  >
                                    <LatexText value={label.text} />
                                  </span>
                                ))}
                              {question.options.labels.length > 3 && (
                                <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                                  +{question.options.labels.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      {/* Category */}
                      {question.type === "category" &&
                        question.options?.categories &&
                        question.options?.items && (
                          <div className="mb-2">
                            <div className="flex flex-wrap gap-1">
                              {question.options.categories
                                .slice(0, question.options.categories.length)
                                .map((category, idx) => (
                                  <span
                                    key={`cat-${idx}`}
                                    className="text-xs px-2 py-1 rounded bg-teal-100 text-teal-700 border border-teal-200"
                                  >
                                    <LatexText value={category.name} />
                                  </span>
                                ))}
                              <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                                ←
                              </span>
                              {question.options.items
                                .slice(0, 3)
                                .map((item, idx) => (
                                  <span
                                    key={`item-${idx}`}
                                    className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700 border border-emerald-200"
                                  >
                                    <LatexText value={item.text} />
                                  </span>
                                ))}
                              {(question.options.categories.length > 2 ||
                                question.options.items.length > 2) && (
                                <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                                  +
                                  {Math.max(
                                    question.options.categories.length - 2,
                                    question.options.items.length - 2
                                  )}{" "}
                                  more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      {/* Drag & Drop */}
                      {question.type === "drag_drop" &&
                        question.options?.answers && (
                          <div className="mb-2">
                            <div className="flex flex-wrap gap-1">
                              {question.options.answers
                                .slice(0, 3)
                                .map((answer, idx) => {
                                  const correctPosition =
                                    answer.correct_position || 0;
                                  return (
                                    <span
                                      key={idx}
                                      className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700 border border-yellow-200"
                                    >
                                      {answer.text?.slice(0, 8)}
                                      {answer.text?.length > 8 ? "..." : ""}
                                      {correctPosition > 0 && (
                                        <span className="ml-1 text-blue-600">
                                          ({correctPosition})
                                        </span>
                                      )}
                                    </span>
                                  );
                                })}
                              {question.options.answers.length > 3 && (
                                <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                                  +{question.options.answers.length - 3} more
                                </span>
                              )}
                              <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                {question.content?.text?.match(/\[blank\d*\]/g)
                                  ?.length || 0}{" "}
                                zones
                              </span>
                            </div>
                          </div>
                        )}
                      {/* Type Badge */}
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-1 rounded-full text-xs font-medium">
                          {formatQuestionType(question.type)}
                        </Badge>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {question.metadata?.points || 0} điểm
                        </span>
                        {question.level && (
                          <Badge
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              question.level === "easy"
                                ? "bg-green-100 text-green-700 border border-green-200"
                                : question.level === "medium"
                                ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                                : "bg-red-100 text-red-700 border border-red-200"
                            }`}
                          >
                            {question.level.charAt(0).toUpperCase() +
                              question.level.slice(1)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 p-0 rounded-2xl hover:bg-blue-50"
                    onClick={() => handleViewQuestionDetail(question.id)}
                  >
                    <LucideEye className="h-4 w-4 text-blue-600" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-center md:justify-between items-center mt-2 md:mt-6 pt-2 md:pt-4 border-t border-gray-100 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="rounded-2xl border-gray-200 hover:border-gray-300 bg-transparent"
              onClick={() => handleQuestionPageChange(questionFilters.page - 1)}
              disabled={questionFilters.page <= 1 || questionLoading}
            >
              <LucideChevronLeft className="h-4 w-4" />
            </Button>{" "}
            <span className="text-sm font-medium text-gray-700 px-3">
              Trang {questionFilters.page}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="rounded-2xl border-gray-200 hover:border-gray-300 bg-transparent"
              onClick={() => handleQuestionPageChange(questionFilters.page + 1)}
              disabled={!hasMoreQuestions || questionLoading}
            >
              <LucideChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-2xl">
              Đã chọn {selectedQuestions.length} câu hỏi
            </span>
            <div className="flex gap-3">
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl"
                onClick={handleClose}
              >
                Xác nhận
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};