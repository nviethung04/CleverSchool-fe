import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Mic, PenTool } from "lucide-react";
import { TiptapMathViewer } from "@/components/question-editor/tiptap-math-viewer";
import MediaContent, {
  RenderAnswerOptionContent,
  isMcOptionCorrect,
  isMcOptionSelected,
} from "@/components/ui/media-content";

export interface ExerciseQuestionDisplayProps {
  question: any;
  index: number;
  showFeedback?: boolean;
}

const  ExerciseQuestionDisplay: React.FC<ExerciseQuestionDisplayProps> = ({
  question,
  index,
  showFeedback,
}) => {
  const renderStudentAnswer = () => {
    switch (question.questionType) {
      case "multiple_choice":
        return (
          <div className="space-y-3">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">Các lựa chọn:</p>
              <div className="grid grid-cols-2 gap-3">
                {question.options?.map((option: any, idx: number) => {
                  const isSelected = isMcOptionSelected(
                    question.studentAnswer,
                    option
                  );
                  const isCorrect = isMcOptionCorrect(
                    {
                      correctAnswerIds:
                        question.studentAnswer.correctAnswerIds,
                      correctAnswers: question.studentAnswer.correctAnswers,
                      correctFileUrls: question.studentAnswer.correctFileUrls,
                    },
                    option
                  );
                  let bgColor = "bg-white border-gray-300";
                  if (isSelected && isCorrect) {
                    bgColor = "bg-green-200 border-green-400 font-medium";
                  } else if (isSelected && !isCorrect) {
                    bgColor = "bg-red-200 border-red-400 font-medium";
                  } else if (!isSelected && isCorrect) {
                    bgColor = "bg-green-100 border-green-300";
                  }
                  return (
                    <div
                      key={idx}
                      className={`flex items-center space-x-3 px-3 py-2 rounded border text-sm ${bgColor}`}
                    >
                      <span className="font-medium">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      <RenderAnswerOptionContent option={option} />
                      {isSelected && (
                        <Badge variant="outline" className="ml-auto">
                          {isCorrect === true ? "✓" : "✗"}
                        </Badge>
                      )}
                      {!isSelected && isCorrect === true && (
                        <Badge
                          variant="outline"
                          className="ml-auto text-green-600"
                        >
                          ✓
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      case "category":
        const categoryStats =
          question.studentAnswer.correctCount &&
          question.studentAnswer.totalCount
            ? `${question.studentAnswer.correctCount}/${question.studentAnswer.totalCount} đúng`
            : "";
        return (
          <div className="space-y-3 p-3 rounded border bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600">
                Phân loại của bạn:
              </p>
              {categoryStats && (
                <Badge variant="outline" className="text-xs">
                  {categoryStats}
                </Badge>
              )}
            </div>
            <div className="space-y-3">
              {Object.entries(question.studentAnswer.groups || {}).map(
                ([groupName, items]: [string, any]) => (
                  <div key={groupName}>
                    <h4 className="font-medium text-gray-700 mb-1">
                      {groupName}:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(items) &&
                        items.map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className={`px-2 py-1 rounded text-sm flex items-center space-x-1 ${
                              item.isCorrect === true
                                ? "bg-green-100 border border-green-300"
                                : "bg-red-100 border-red-300"
                            }`}
                          >
                            <span>{item.content}</span>
                            <Badge
                              variant={
                                item.isCorrect === true
                                  ? "default"
                                  : "destructive"
                              }
                              className="text-xs"
                            >
                              {item.isCorrect === true ? "✓" : "✗"}
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        );
      case "fill_in_blanks":
        return (
          <div
            className={`space-y-2 p-3 rounded border ${
              typeof question.studentAnswer.is_all_correct !== "undefined"
                ? question.studentAnswer.is_all_correct === true
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
                : question.is_all_correct === true
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <p className="text-sm font-medium text-gray-600">
              Câu trả lời của bạn:
            </p>
            <div className="flex flex-wrap gap-2">
              {Array.isArray(question.studentAnswer.blanks) ? (
                question.studentAnswer.blanks.map((blank: any, idx: number) => (
                  <div key={idx} className="flex items-center space-x-1">
                    <span className="text-sm text-gray-500">{idx + 1}:</span>
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        blank.isCorrect === true ? "bg-green-100" : "bg-red-100"
                      }`}
                    >
                      {blank.answer || "(Trống)"}{" "}
                      {blank.isCorrect === true ? "✓" : "✗"}
                    </span>
                    {blank.correctAnswer &&
                      blank.answer !== blank.correctAnswer && (
                        <span className="text-xs text-gray-500">
                          (Đáp án: {blank.correctAnswer})
                        </span>
                      )}
                  </div>
                ))
              ) : (
                <span className="px-2 py-1 bg-blue-100 rounded text-sm">
                  {typeof question.studentAnswer.text === "string"
                    ? question.studentAnswer.text
                    : "(Trống)"}
                </span>
              )}
            </div>
          </div>
        );
      case "drag_drop":
        const dragStats =
          question.studentAnswer.correctCount &&
          question.studentAnswer.totalCount
            ? `${question.studentAnswer.correctCount}/${question.studentAnswer.totalCount} đúng`
            : "";
        return (
          <div className="space-y-3 p-3 rounded border bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600">
                Các đáp án đã kéo thả:
              </p>
              {dragStats && (
                <Badge variant="outline" className="text-xs">
                  {dragStats}
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {question.studentAnswer.positions?.map(
                (item: any, idx: number) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-2 rounded text-sm ${
                      item.isCorrect === true
                        ? "bg-green-100 border border-green-300"
                        : "bg-red-100 border-red-300"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-blue-600">
                        Vị trí {item.position}:
                      </span>
                      <span>{item.content}</span>
                      {item.file_url && (
                        <img
                          src={item.file_url || "/placeholder.svg"}
                          alt="Drag drop item"
                          className="max-h-6 max-w-12 object-contain"
                        />
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          item.isCorrect === true ? "default" : "destructive"
                        }
                        className="text-xs"
                      >
                        {item.isCorrect === true ? "✓" : "✗"}
                      </Badge>
                      {!item.isCorrect && item.correctAnswer && (
                        <span className="text-xs text-gray-500">
                          (Đáp án: {item.correctAnswer})
                        </span>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        );
      case "ordering":
        const orderStats =
          question.studentAnswer.correctCount &&
          question.studentAnswer.totalCount
            ? `${question.studentAnswer.correctCount}/${question.studentAnswer.totalCount} đúng`
            : "";
        return (
          <div className="space-y-3 p-3 rounded border bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600">
                Thứ tự sắp xếp của bạn:
              </p>
              {orderStats && (
                <Badge variant="outline" className="text-xs">
                  {orderStats}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {question.studentAnswer.positions?.map(
                (item: any, idx: number) => (
                  <div
                    key={idx}
                    className={`flex items-center space-x-1 px-3 py-1 rounded text-sm ${
                      item.isCorrect === true
                        ? "bg-green-100 border border-green-300"
                        : "bg-red-100 border-red-300"
                    }`}
                  >
                    <span className="font-medium text-blue-600">
                      {item.position}.
                    </span>
                    <span>{item.content}</span>
                    <Badge
                      variant={
                        item.isCorrect === true ? "default" : "destructive"
                      }
                      className="text-xs ml-1"
                    >
                      {item.isCorrect === true ? "✓" : "✗"}
                    </Badge>
                  </div>
                )
              )}
            </div>
          </div>
        );
      case "labeling":
        const labelStats =
          question.studentAnswer.correctCount &&
          question.studentAnswer.totalCount
            ? `${question.studentAnswer.correctCount}/${question.studentAnswer.totalCount} đúng`
            : "";
        return (
          <div className="space-y-3 p-3 rounded border bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600">
                Nhãn đã đánh dấu:
              </p>
              {labelStats && (
                <Badge variant="outline" className="text-xs">
                  {labelStats}
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {question.studentAnswer.labels?.map((label: any, idx: number) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-2 rounded text-sm ${
                    label.is_correct === true
                      ? "bg-green-100 border border-green-300"
                      : "bg-red-100 border-red-300"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Vị trí {idx + 1}:</span>
                    <span>{label.answer_content}</span>
                    {label.answer_file_url && (
                      <img
                        src={label.answer_file_url || "/placeholder.svg"}
                        alt="Label content"
                        className="max-h-6 max-w-12 object-contain"
                      />
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={
                        label.is_correct === true ? "default" : "destructive"
                      }
                      className="text-xs"
                    >
                      {label.is_correct === true ? "✓" : "✗"}
                    </Badge>
                    {!label.is_correct && (
                      <span className="text-xs text-gray-500">
                        (Đáp án: {label.true_blank_content})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case "matching":
        const matchStats =
          question.studentAnswer.correctCount &&
          question.studentAnswer.totalCount
            ? `${question.studentAnswer.correctCount}/${question.studentAnswer.totalCount} đúng`
            : "";
        return (
          <div className="space-y-3 p-3 rounded border bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600">
                Kết quả ghép đôi:
              </p>
              {matchStats && (
                <Badge variant="outline" className="text-xs">
                  {matchStats}
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {question.studentAnswer.matches?.map(
                (match: any, idx: number) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded text-sm ${
                      match.isCorrect === true
                        ? "bg-green-100 border border-green-300"
                        : "bg-red-100 border-red-300"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <RenderAnswerOptionContent option={match.firstItem} />
                      <span className="text-gray-400">↔</span>
                      <RenderAnswerOptionContent option={match.secondItem} />
                    </div>
                    <Badge
                      variant={
                        match.isCorrect === true ? "default" : "destructive"
                      }
                      className="text-xs"
                    >
                      {match.isCorrect === true ? "✓" : "✗"}
                    </Badge>
                  </div>
                )
              )}
            </div>
          </div>
        );
      case "writing":
        return (
          <div className="p-3 rounded border bg-blue-50 border-blue-200">
            <p className="text-sm font-medium text-gray-600 mb-2">
              Bài viết của bạn:
            </p>
            <div className="bg-white p-3 rounded border">
              <p className="whitespace-pre-wrap text-sm">
                {question.studentAnswer.text || "(Chưa viết)"}
              </p>
            </div>
            {question.studentAnswer.isScored === true && (
              <div className="mt-2 flex items-center space-x-2">
                <Badge
                  variant="default"
                  className="bg-green-100 text-green-800"
                >
                  Đã chấm: {question.studentAnswer.score} điểm
                </Badge>
              </div>
            )}
            <div className="mt-2 text-xs text-gray-500">
              <strong>Lưu ý:</strong> Câu hỏi tự luận cần giáo viên chấm điểm
              thủ công.
            </div>
          </div>
        );
      case "speaking":
        return (
          <div className="p-3 rounded border bg-blue-50 border-blue-200">
            <p className="text-sm font-medium text-gray-600 mb-2">
              Bài ghi âm của bạn:
            </p>
            {question.studentAnswer.fileUrl ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3 bg-white p-3 rounded border">
                  <audio
                    controls
                    src={question.studentAnswer.fileUrl}
                    className="flex-1"
                  />
                </div>
              </div>
            ) : (
              <div className="bg-white p-3 rounded border text-center text-gray-500 text-sm">
                (Chưa ghi âm)
              </div>
            )}
            {question.studentAnswer.isScored === true && (
              <div className="mt-2 flex items-center space-x-2">
                <Badge
                  variant="default"
                  className="bg-green-100 text-green-800"
                >
                  Đã chấm: {question.studentAnswer.score} điểm
                </Badge>
              </div>
            )}
            <div className="mt-2 text-xs text-gray-500">
              <strong>Lưu ý:</strong> Câu hỏi nói cần giáo viên chấm điểm thủ
              công.
            </div>
          </div>
        );
      default:
        return (
          <div className="p-3 rounded border bg-blue-50 border-blue-200">
            <pre className="whitespace-pre-wrap text-sm">
              {JSON.stringify(question.studentAnswer, null, 2)}
            </pre>
          </div>
        );
    }
  };

  const getQuestionIcon = (type: string) => {
    switch (type) {
      case "speaking":
        return <Mic className="h-4 w-4" />;
      case "writing":
        return <PenTool className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gray-50 py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg">
            {getQuestionIcon(question.questionType)}
            <span className="ml-2">Câu {index + 1}</span>
            <Badge variant="outline" className="ml-2 capitalize">
              {question.questionType.replace("_", " ")}
            </Badge>
          </CardTitle>
          <div className="flex items-center space-x-2">
            {typeof question.is_all_correct !== "undefined" &&
            question.questionType !== "writing" &&
            question.questionType !== "speaking" ? (
              <Badge
                variant={question.is_all_correct ? "default" : "destructive"}
              >
                {question.is_all_correct ? "Đúng" : "Sai"}
              </Badge>
            ) : question.questionType === "writing" ||
              question.questionType === "speaking" ? (
              question.studentAnswer.isScored === true ? (
                <Badge
                  variant="default"
                  className="bg-green-100 text-green-800"
                >
                  Đã chấm
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-yellow-100 text-yellow-800"
                >
                  Chưa chấm
                </Badge>
              )
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {/* Question */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Câu hỏi:</h4>
          <div className="text-gray-700 space-y-2">
            <TiptapMathViewer value={question.questionText} />
            {question.questionMedia && (
              <MediaContent media={question.questionMedia} />
            )}
          </div>
        </div>
        {/* Student Answer */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">
            Câu trả lời của bạn:
          </h4>
          <div className="text-gray-700">{renderStudentAnswer()}</div>
        </div>
        {/* Feedback */}
        {showFeedback && question.feedback && (
          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
              <FileText className="h-4 w-4 mr-2 text-yellow-600" />
              Nhận xét của giáo viên:
            </h4>
            <p className="text-gray-700 text-sm">{question.feedback}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExerciseQuestionDisplay;
