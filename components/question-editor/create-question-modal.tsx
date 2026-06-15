"use client";
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomSelect } from "@/components/question-editor/custom-select";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  setQuestionType,
  setPoints,
  resetState,
} from "@/lib/redux/question-slice";
import { OrderingQuestion } from "@/components/question-editor/ordering-question";
import { MatchingQuestion } from "@/components/question-editor/matching-question";
import { MultipleChoiceQuestion } from "@/components/question-editor/multiple-choice-question";
import { FillInBlankQuestion } from "@/components/question-editor/fill-in-blank-question";
import { DragDropQuestion } from "@/components/question-editor/drag-drop-question";
import { DefaultQuestion } from "@/components/question-editor/default-question";
import { LabelingQuestion } from "@/components/question-editor/labeling-question";
import { CategoryQuestion } from "@/components/question-editor/category-question";
import { WritingQuestion } from "@/components/question-editor/writing-question";
import { SpeakingQuestion } from "@/components/question-editor/speaking-question";
import {
  createQuestion,
  convertMultipleChoiceToApiFormat,
  convertFillInBlankToApiFormat,
  convertOrderingToApiFormat,
  convertMatchingToApiFormat,
  convertDragDropToApiFormat,
  convertLabelingToApiFormat,
  convertWritingToApiFormat,
  convertSpeakingToApiFormat,
  convertCategoryToApiFormat,
  type QuestionAttributePayload,
} from "@/lib/api/questions";
import { useToast } from "@/components/ui/use-toast";
import {
  LucideCheckSquare,
  LucideType,
  LucideArrowUpDown,
  LucideArrowLeftRight,
  LucideCheck,
  LucideMessageSquare,
  LucideFileText,
  LucideMic,
  LucideLoader2,
  LucideArrowLeft,
} from "lucide-react";
import { EditableMathField } from "react-mathquill";
import { useTranslations } from "next-intl";
import {
  useQuestionMetadata,
  validateQuestionMetadata,
} from "@/hooks/use-question-metadata";
import { QuestionMetadataFields } from "@/components/question-editor/question-metadata-fields";

export function CreateQuestionModal({
  onSuccess,
  onCancel,
}: {
  onSuccess: (question: any) => void;
  onCancel: () => void;
}) {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const t = useTranslations("createQuestion");
  const [isSaving, setIsSaving] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [mathquillLatex, setMathquillLatex] = useState("");
  const [mathquillOpen, setMathquillOpen] = useState(false);
  const mathquillPopupRef = useRef<HTMLDivElement>(null);
  const tiptapEditorRef = useRef<any>(null);
  const mathquillFieldRef = useRef<any>(null);
  const mathquillApiRef = useRef<any>(null);

  const questionState = useAppSelector((state) => state.question);
  const { questionType, points } = questionState;
  const metadata = useQuestionMetadata();
  const {
    skillAttr,
    levelAttr,
    cognitionAttr,
    selectedSkillId,
    selectedLevelId,
    selectedCognitionId,
    selectedSubjectId,
  } = metadata;
  const [customInstructions, setCustomInstructions] = useState<string>("");

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    setHasToken(!!token);
    if (!token) {
      toast({
        title: "Cảnh báo",
        description: t("warning.notLoggedIn"),
        variant: "destructive",
      });
    }
    dispatch(resetState());
  }, [dispatch, toast, t]);

  const questionTypes = [
    {
      value: "multiple-choice",
      label: (
        <div className="flex items-center">
          <LucideCheckSquare className="h-4 w-4 mr-2" />
          <span>{t("questionTypes.multipleChoice")}</span>
        </div>
      ),
    },
    {
      value: "fill-in-blank",
      label: (
        <div className="flex items-center">
          <LucideType className="h-4 w-4 mr-2" />
          <span>{t("questionTypes.fillInBlank")}</span>
        </div>
      ),
    },
    {
      value: "ordering",
      label: (
        <div className="flex items-center">
          <LucideArrowUpDown className="h-4 w-4 mr-2" />
          <span>{t("questionTypes.ordering")}</span>
        </div>
      ),
    },
    {
      value: "matching",
      label: (
        <div className="flex items-center">
          <LucideArrowLeftRight className="h-4 w-4 mr-2" />
          <span>{t("questionTypes.matching")}</span>
        </div>
      ),
    },
    {
      value: "drag-drop",
      label: (
        <div className="flex items-center">
          <LucideCheck className="h-4 w-4 mr-2" />
          <span>{t("questionTypes.dragDrop")}</span>
        </div>
      ),
    },
    {
      value: "labeling",
      label: (
        <div className="flex items-center">
          <LucideCheck className="h-4 w-4 mr-2" />
          <span>{t("questionTypes.labeling")}</span>
        </div>
      ),
    },
    {
      value: "category",
      label: (
        <div className="flex items-center">
          <LucideMessageSquare className="h-4 w-4 mr-2" />
          <span>{t("questionTypes.category")}</span>
        </div>
      ),
    },
    {
      value: "writing",
      label: (
        <div className="flex items-center">
          <LucideFileText className="h-4 w-4 mr-2" />
          <span>{t("questionTypes.writing")}</span>
        </div>
      ),
    },
    {
      value: "speaking",
      label: (
        <div className="flex items-center">
          <LucideMic className="h-4 w-4 mr-2" />
          <span>{t("questionTypes.speaking")}</span>
        </div>
      ),
    },
  ];

  const renderQuestionEditor = () => {
    switch (questionType) {
      case "multiple-choice":
        return <MultipleChoiceQuestion ref={tiptapEditorRef} />;
      case "fill-in-blank":
        return <FillInBlankQuestion ref={tiptapEditorRef} />;
      case "ordering":
        return <OrderingQuestion ref={tiptapEditorRef} />;
      case "matching":
        return <MatchingQuestion ref={tiptapEditorRef} />;
      case "drag-drop":
        return <DragDropQuestion ref={tiptapEditorRef} />;
      case "labeling":
        return <LabelingQuestion ref={tiptapEditorRef} />;
      case "category":
        return <CategoryQuestion ref={tiptapEditorRef} />;
      case "writing":
        return <WritingQuestion ref={tiptapEditorRef} />;
      case "speaking":
        return <SpeakingQuestion ref={tiptapEditorRef} />;
      default:
        return <DefaultQuestion />;
    }
  };

  // Validate question data before saving (rút gọn, có thể mở rộng thêm)
  const validateQuestion = () => {

    // Kiểm tra câu hỏi có nội dung không
    // if (!questionState.questionText.trim()) {
    //   toast({
    //     title: "Lỗi",
    //     description: "Vui lòng nhập nội dung câu hỏi",
    //     variant: "destructive",
    //   });
    //   return false;
    // }

    if (!validateQuestionMetadata(metadata, toast, t)) {
      return false;
    }

    // Kiểm tra dựa trên loại câu hỏi
    if (questionType === "multiple-choice") {
      // Kiểm tra có ít nhất 2 tùy chọn
      if (questionState.answerOptions.length < 2) {
        toast({
          title: "Lỗi",
          description: t("validation.atLeastTwoOptions"),
          variant: "destructive",
        });
        return false;
      }

      // Kiểm tra có ít nhất 1 đáp án đúng
      const hasCorrectAnswer = questionState.answerOptions.some(
        (option) => option.isCorrect
      );
      if (!hasCorrectAnswer) {
        toast({
          title: "Lỗi",
          description: t("validation.atLeastOneCorrect"),
          variant: "destructive",
        });
        return false;
      }

      // Kiểm tra các tùy chọn có nội dung không
      // const emptyOptions = questionState.answerOptions.some(
      //   (option) => !option.text.trim()
      // );
      // if (emptyOptions) {
      //   toast({
      //     title: "Lỗi",
      //     description: "Vui lòng nhập nội dung cho tất cả các tùy chọn",
      //     variant: "destructive",
      //   });
      //   return false;
      // }
    } else if (questionType === "fill-in-blank") {
      // Kiểm tra có ít nhất 1 blank
      if (questionState.blankAnswers.length < 1) {
        toast({
          title: "Lỗi",
          description: t("validation.atLeastOneBlank"),
          variant: "destructive",
        });
        return false;
      }

      // Kiểm tra các blank có đáp án không
      const emptyAnswers = questionState.blankAnswers.some(
        (answer) => !answer.text.trim()
      );
      if (emptyAnswers) {
        toast({
          title: "Lỗi",
          description: t("validation.fillAllBlanks"),
          variant: "destructive",
        });
        return false;
      }
    } else if (questionType === "ordering") {
      // Kiểm tra có ít nhất 2 mục để sắp xếp
      if (questionState.orderItems.length < 2) {
        toast({
          title: "Lỗi",
          description: t("validation.atLeastTwoItems"),
          variant: "destructive",
        });
        return false;
      }

      // Kiểm tra các mục có nội dung không
      // const emptyItems = questionState.orderItems.some(
      //   (item) => !item.text.trim()
      // );
      // if (emptyItems) {
      //   toast({
      //     title: "Lỗi",
      //     description: "Vui lòng nhập nội dung cho tất cả các mục",
      //     variant: "destructive",
      //   });
      //   return false;
      // }
    } else if (questionType === "matching") {
      // Kiểm tra có ít nhất 2 cặp ghép
      if (questionState.matchItems.length < 2) {
        toast({
          title: "Lỗi",
          description: t("validation.atLeastTwoPairs"),
          variant: "destructive",
        });
        return false;
      }

      // Kiểm tra các mục bên trái có nội dung không
      // const emptyLeftItems = questionState.matchItems.some(
      //   (item) => !item.leftText.trim()
      // );
      // if (emptyLeftItems) {
      //   toast({
      //     title: "Lỗi",
      //     description: "Vui lòng nhập nội dung cho tất cả các mục bên trái",
      //     variant: "destructive",
      //   });
      //   return false;
      // }

      // Kiểm tra các mục bên phải có nội dung không
      // const emptyRightItems = questionState.matchItems.some(
      //   (item) => !item.rightText.trim()
      // );
      // if (emptyRightItems) {
      //   toast({
      //     title: "Lỗi",
      //     description: "Vui lòng nhập nội dung cho tất cả các mục bên phải",
      //     variant: "destructive",
      //   });
      //   return false;
      // }
    } else if (questionType === "drag-drop") {
      // Kiểm tra có ít nhất 1 chỗ trống
      if (questionState.blankCount < 1) {
        toast({
          title: "Lỗi",
          description: t("validation.atLeastOneBlankDragDrop"),
          variant: "destructive",
        });
        return false;
      }

      // Kiểm tra có ít nhất 1 đáp án đúng
      const correctOptions = questionState.dragDropOptions.filter(
        (option) => option.isCorrect
      );
      if (correctOptions.length < 1) {
        toast({
          title: "Lỗi",
          description: t("validation.atLeastOneCorrect"),
          variant: "destructive",
        });
        return false;
      }

      // Kiểm tra số lượng đáp án đúng phải bằng số lượng chỗ trống
      if (correctOptions.length !== questionState.blankCount) {
        toast({
          title: "Lỗi",
          description: t("validation.correctAnswersMatchBlanks"),
          variant: "destructive",
        });
        return false;
      }

      // Kiểm tra các tùy chọn có nội dung không
      // const emptyOptions = questionState.dragDropOptions.some(
      //   (option) => !option.text.trim()
      // );
      // if (emptyOptions) {
      //   toast({
      //     title: "Lỗi",
      //     description: "Vui lòng nhập nội dung cho tất cả các tùy chọn",
      //     variant: "destructive",
      //   });
      //   return false;
      // }
    } else if (questionType === "labeling") {
      // Kiểm tra có ảnh không
      if (!questionState.labelImage) {
        toast({
          title: "Lỗi",
          description: t("validation.uploadImage"),
          variant: "destructive",
        });
        return false;
      }

      // Kiểm tra có ít nhất 1 vị trí nhãn
      if (questionState.labelPositions.length < 1) {
        toast({
          title: "Lỗi",
          description: t("validation.atLeastOneLabel"),
          variant: "destructive",
        });
        return false;
      }

      // Kiểm tra các vị trí nhãn đã chọn group hợp lệ chưa
      const emptyLabels = questionState.labelPositions.some(
        (position) =>
          typeof position.groupPosition !== "number" ||
          position.groupPosition === null ||
          position.groupPosition === undefined ||
          !questionState.labelGroups[position.groupPosition] ||
          !questionState.labelGroups[position.groupPosition].text.trim()
      );
      if (emptyLabels) {
        toast({
          title: "Lỗi",
          description: t("validation.selectGroupForAllLabels"),
          variant: "destructive",
        });
        return false;
      }
    } else if (questionType === "writing") {
      // Kiểm tra câu hỏi có nội dung không
      // if (!questionState.questionText.trim()) {
      //   toast({
      //     title: "Lỗi",
      //     description: "Vui lòng nhập nội dung câu hỏi",
      //     variant: "destructive",
      //   });
      //   return false;
      // }
      // Kiểm tra câu hỏi có nội dung không
      // if (!questionState.questionText.trim()) {
      //   toast({
      //     title: "Lỗi",
      //     description: "Vui lòng nhập nội dung câu hỏi",
      //     variant: "destructive",
      //   });
      //   return false;
      // }
    } else if (questionType === "category") {
      // Kiểm tra có ít nhất 2 danh mục
      if (questionState.categories.length < 2) {
        toast({
          title: "Lỗi",
          description: t("validation.atLeastTwoCategories"),
          variant: "destructive",
        });
        return false;
      }

      // Kiểm tra các danh mục có tên không
      // const emptyCategories = questionState.categories.some(
      //   (category) => !category.name.trim()
      // );
      // if (emptyCategories) {
      //   toast({
      //     title: "Lỗi",
      //     description: "Vui lòng nhập tên cho tất cả các danh mục",
      //     variant: "destructive",
      //   });
      //   return false;
      // }

      // Kiểm tra có ít nhất 1 mục trong mỗi danh mục
      const emptyCategoryItems = questionState.categories.some(
        (category) => category.items.length === 0
      );
      if (emptyCategoryItems) {
        toast({
          title: "Lỗi",
          description: t("validation.eachCategoryOneItem"),
          variant: "destructive",
        });
        return false;
      }

      // Kiểm tra các mục có nội dung không
      // for (const category of questionState.categories) {
      //   const emptyItems = category.items.some((item) => !item.text.trim());
      //   if (emptyItems) {
      //     toast({
      //       title: "Lỗi",
      //       description: `Vui lòng nhập nội dung cho tất cả các mục trong danh mục "${category.name}"`,
      //       variant: "destructive",
      //     });
      //     return false;
      //   }
      // }
    }

    return true;
  };

  const handleSaveQuestion = async () => {
    if (!validateQuestion()) return;
    setIsSaving(true);
    try {
      let apiData;
      const attributes: QuestionAttributePayload[] = [
        skillAttr && selectedSkillId
          ? {
              id: skillAttr.id,
              name: skillAttr.name,
              value: {
                id: selectedSkillId,
                name:
                  skillAttr.nodes.find((n) => n.id === selectedSkillId)?.name ||
                  "",
              },
            }
          : undefined,
        levelAttr && selectedLevelId
          ? {
              id: levelAttr.id,
              name: levelAttr.name,
              value: {
                id: selectedLevelId,
                name:
                  levelAttr.nodes.find((n) => n.id === selectedLevelId)?.name ||
                  "",
              },
            }
          : undefined,
        cognitionAttr && selectedCognitionId
          ? {
              id: cognitionAttr.id,
              name: cognitionAttr.name,
              value: {
                id: selectedCognitionId,
                name:
                  cognitionAttr.nodes.find((n) => n.id === selectedCognitionId)
                    ?.name || "",
              },
            }
          : undefined,
      ].filter((a): a is QuestionAttributePayload => Boolean(a));
      // Chuyển đổi dữ liệu dựa trên loại câu hỏi
      if (questionType === "multiple-choice") {
        apiData = convertMultipleChoiceToApiFormat(
          questionState,
          attributes,
          true,
          customInstructions
        );
      } else if (questionType === "fill-in-blank") {
        apiData = convertFillInBlankToApiFormat(
          questionState,
          attributes,
          true,
          customInstructions
        );
      } else if (questionType === "ordering") {
        apiData = convertOrderingToApiFormat(
          questionState,
          attributes,
          true,
          customInstructions
        );
      } else if (questionType === "matching") {
        apiData = convertMatchingToApiFormat(
          questionState,
          attributes,
          true,
          customInstructions
        );
      } else if (questionType === "drag-drop") {
        apiData = convertDragDropToApiFormat(
          questionState,
          attributes,
          true,
          customInstructions
        );
      } else if (questionType === "labeling") {
        apiData = convertLabelingToApiFormat(
          questionState,
          attributes,
          true,
          customInstructions
        );
      } else if (questionType === "writing") {
        apiData = convertWritingToApiFormat(
          questionState,
          attributes,
          customInstructions
        );
      } else if (questionType === "speaking") {
        apiData = convertSpeakingToApiFormat(
          questionState,
          attributes,
          customInstructions
        );
      } else if (questionType === "category") {
        apiData = convertCategoryToApiFormat(
          questionState,
          attributes,
          true,
          customInstructions
        );
      } else {
        toast({
          title: "Thông báo",
          description:
            "Chức năng lưu cho loại câu hỏi này đang được phát triển",
        });
        setIsSaving(false);
        return;
      }

      // Add subject_id to the API data
      if (selectedSubjectId) {
        apiData.subject_id = selectedSubjectId;
      }

      const result = await createQuestion(apiData);
      if (result && result.data && result.data.id) {
        toast({
          title: "Thành công",
          description: t("success.questionSaved"),
        });
        dispatch(resetState());
        onSuccess(result.data);
      } else {
        toast({
          title: "Lỗi",
          description: "API không trả về id câu hỏi",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      let errorMessage = t("error.saveFailed");
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      toast({
        title: "Lỗi",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Move popup
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(
    null
  );
  const [popupPos, setPopupPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 80,
  });
  useEffect(() => {
    if (typeof window !== "undefined") {
      setPopupPos({ x: window.innerWidth - 300, y: 80 });
    }
  }, []);
  const handleMouseDown = (e: React.MouseEvent) => {
    if (mathquillPopupRef.current && e.target === mathquillPopupRef.current) {
      setDragOffset({ x: e.clientX - popupPos.x, y: e.clientY - popupPos.y });
    }
  };
  const handleMouseMove = (e: MouseEvent) => {
    if (dragOffset) {
      setPopupPos({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
    }
  };
  const handleMouseUp = () => setDragOffset(null);
  useEffect(() => {
    if (dragOffset) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragOffset]);

  // Insert LaTeX into Tiptap
  const handleInsertLatex = () => {
    if (tiptapEditorRef.current && mathquillLatex) {
      if (typeof tiptapEditorRef.current.insertLatexInline === "function") {
        tiptapEditorRef.current.insertLatexInline(mathquillLatex);
      } else {
        tiptapEditorRef.current.commands.insertContent(mathquillLatex);
      }
      tiptapEditorRef.current.commands.focus();
    }
  };

  return (
    <div className="min-h-screen bg-grey-50">
      <main
        className="container mx-auto px-4 py-8"
        style={{ position: "relative" }}
      >
        {/* Header with back button and question type selector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <LucideArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{t("title")}</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <CustomSelect
              options={questionTypes}
              value={questionType}
              onValueChange={(value) => dispatch(setQuestionType(value))}
              placeholder={t("selectQuestionType")}
              className="w-[200px]"
            />
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{t("points")}:</span>
              <Input
                type="number"
                min="1"
                max="10"
                value={points}
                onChange={(e) =>
                  dispatch(setPoints(Number.parseInt(e.target.value) || 1))
                }
                className="w-16 text-center"
              />
            </div>
            <Button
              className="bg-purple-600 text-white hover:bg-purple-700"
              onClick={handleSaveQuestion}
              disabled={isSaving || !hasToken}
            >
              {isSaving ? (
                <>
                  <LucideLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("saving")}
                </>
              ) : (
                t("saveQuestion")
              )}
            </Button>
          </div>
        </div>
        <QuestionMetadataFields
          subjectLabel={t("subjectLabel")}
          selectSubjectPlaceholder={t("selectSubject")}
          selectSkillPlaceholder={t("selectSkill")}
          selectLevelPlaceholder={t("selectLevel")}
          selectCognitionPlaceholder={t("selectCognition")}
          loadingAttributesText={t("loadingAttributes")}
          attributesNotLoadedText={t("attributesNotLoaded")}
          subjectOptions={metadata.subjectOptions}
          selectedSubjectId={metadata.selectedSubjectId}
          onSubjectChange={metadata.setSelectedSubjectId}
          attributesLoading={metadata.attributesLoading}
          attributesCount={metadata.attributes.length}
          skillAttr={metadata.skillAttr}
          levelAttr={metadata.levelAttr}
          cognitionAttr={metadata.cognitionAttr}
          selectedSkillId={metadata.selectedSkillId}
          onSkillChange={metadata.setSelectedSkillId}
          selectedLevelId={metadata.selectedLevelId}
          onLevelChange={metadata.setSelectedLevelId}
          selectedCognitionId={metadata.selectedCognitionId}
          onCognitionChange={metadata.setSelectedCognitionId}
          toNodeOptions={metadata.toNodeOptions}
        />
        {/* Instructions input */}
        <div className="mb-4">
          <Input
            type="text"
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder={t("customInstructionsPlaceholder")}
            className="w-full max-w-2xl"
          />
        </div>
        {/* Question editor */}
        <div className="bg-white border rounded-lg p-4 relative">
          <div className="flex items-center justify-between mb-3">
            <div></div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMathquillOpen(true)}
            >
              {t("mathButton")}
            </Button>
          </div>
          {renderQuestionEditor()}
        </div>
        {/* MathQuill popup float */}
        {mathquillOpen && (
          <div
            ref={mathquillPopupRef}
            style={{
              position: "fixed",
              left: popupPos.x,
              top: popupPos.y,
              zIndex: 1000,
              minWidth: 220,
              maxWidth: 320,
              background: "#e0f2fe",
              borderRadius: 10,
              padding: "16px 16px 12px 16px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.13)",
              cursor: dragOffset ? "move" : "default",
              userSelect: "none",
            }}
            onMouseDown={handleMouseDown}
          >
            <p className="font-bold">{t("enterExpression")}</p>
            <div
              style={{
                display: "flex",
                gap: 6,
                marginBottom: 8,
                flexWrap: "wrap",
              }}
            >
              {[
                { label: t("fraction"), latex: "\\frac{}{}" },
                { label: t("sqrt"), latex: "\\sqrt{}" },
                { label: t("exponent"), latex: "^{}" },
                { label: t("lessThanOrEqual"), latex: "\\leq" },
                { label: t("greaterThanOrEqual"), latex: "\\geq" },
                { label: t("lessThan"), latex: "<" },
                { label: t("greaterThan"), latex: ">" },
                { label: t("degree"), latex: "^{\\circ}" },
              ].map((btn, i) => (
                <Button
                  key={i}
                  size="sm"
                  variant="secondary"
                  style={{ minWidth: 32, padding: "0 8px", fontSize: 15 }}
                  onClick={(e) => {
                    e.preventDefault();
                    if (
                      mathquillApiRef.current &&
                      typeof mathquillApiRef.current.write === "function"
                    ) {
                      mathquillApiRef.current.write(btn.latex);
                      mathquillApiRef.current.focus();
                      setMathquillLatex(mathquillApiRef.current.latex());
                    } else {
                      setMathquillLatex((latex) => latex + btn.latex);
                    }
                  }}
                >
                  {btn.label}
                </Button>
              ))}
            </div>
            <EditableMathField
              latex={mathquillLatex}
              onChange={(mf) => setMathquillLatex(mf.latex())}
              mathquillDidMount={(mq) => {
                mathquillApiRef.current = mq;
              }}
              style={{
                background: "transparent",
                color: "#222",
                minWidth: 120,
                maxWidth: 220,
                fontSize: 20,
                border: "1.5px solid #9333ea",
                borderRadius: 6,
                outline: "none",
                padding: "6px 10px",
                marginBottom: 2,
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 8,
              }}
            >
              <Button
                size="sm"
                onClick={handleInsertLatex}
                disabled={!mathquillLatex.trim()}
              >
                {t("insertLatex")}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setMathquillOpen(false)}
              >
                {t("close")}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
