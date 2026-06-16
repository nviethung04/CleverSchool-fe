"use client";

import { Button } from "@/components/ui/button";
import { LucideCheck, LucideTrash2, LucidePlus } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { useTranslations } from "next-intl";
import {
  setQuestionText,
  setAllowMultipleAnswers,
  updateAnswerOption,
  toggleAnswerCorrect,
  addAnswerOption,
  removeAnswerOption,
  setAnswerOptionImage,
  setAnswerOptionAudio,
  setAnswerOptionVideo,
} from "@/lib/redux/question-slice";
import { QuestionMediaControls } from "./question-media-controls";
import { QuestionMediaPreview } from "./question-media-preview";
import { ItemMediaUpload } from "./item-media-upload";
import { getColorByIndex } from "@/utils/question-colors";
import React, { useState, forwardRef, useEffect } from "react";
import { TiptapMathEditor } from "./tiptap-math-editor";
import { MathInput } from "./math-input";

export const MultipleChoiceQuestion = forwardRef(
  function MultipleChoiceQuestion(props: {}, ref) {
    const dispatch = useAppDispatch();
    const t = useTranslations("questionEditor.multipleChoice");
    const { questionText, allowMultipleAnswers, answerOptions } =
      useAppSelector((state) => state.question);

    useEffect(() => {
      dispatch(setAllowMultipleAnswers(false));
    }, [dispatch]);

    const handleOptionImageSelect = (
      optionId: number,
      url: string,
      previewUrl?: string
    ) => {
      dispatch(setAnswerOptionImage({ id: optionId, url, previewUrl }));
    };

    const handleOptionAudioSelect = (
      optionId: number,
      url: string,
      previewUrl?: string
    ) => {
      dispatch(setAnswerOptionAudio({ id: optionId, url, previewUrl }));
    };

    const handleOptionVideoSelect = (
      optionId: number,
      url: string,
      previewUrl?: string
    ) => {
      dispatch(setAnswerOptionVideo({ id: optionId, url, previewUrl }));
    };

    // Answer option controls component
    type AnswerOptionControlsProps = {
      optionId: number;
      isCorrect: boolean;
      allowMultiple: boolean;
      className?: string;
    };
    const AnswerOptionControls = ({
      optionId,
      isCorrect,
      allowMultiple,
      className = "",
    }: AnswerOptionControlsProps) => (
      <div className={`flex justify-between ${className}`}>
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-white opacity-70 hover:opacity-100 hover:bg-white/20 h-7 w-7"
            onClick={() => dispatch(removeAnswerOption(optionId))}
          >
            <LucideTrash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div
          className={`h-6 w-6 rounded-${allowMultiple ? "sm" : "full"
            } border-2 border-white flex items-center justify-center cursor-pointer`}
          onClick={() => dispatch(toggleAnswerCorrect(optionId))}
        >
          {isCorrect && <LucideCheck className="h-4 w-4 text-white" />}
        </div>
      </div>
    );

    return (
      <>
        <div className="bg-purple-900 rounded-lg p-4 mb-4">
          <QuestionMediaControls className="mb-2" />
          <TiptapMathEditor
            ref={ref}
            value={questionText}
            onChange={(val) => dispatch(setQuestionText(val))}
            placeholder={t("questionText")}
          />
          <QuestionMediaPreview />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {answerOptions.map((option, index) => (
            <div
              key={option.id}
              className={`${getColorByIndex(index)} rounded-lg p-3 relative`}
            >
              <AnswerOptionControls
                optionId={option.id}
                isCorrect={option.isCorrect}
                allowMultiple={allowMultipleAnswers}
                className="mb-2"
              />
              <MathInput
                value={option.text}
                onChange={(value) =>
                  dispatch(updateAnswerOption({ id: option.id, text: value }))
                }
                placeholder={t("option")}
                className="mb-2"
                size="sm"
              />
              <ItemMediaUpload
                onImageSelect={(url: string, previewUrl?: string) =>
                  handleOptionImageSelect(option.id, url, previewUrl)
                }
                onAudioSelect={(url: string, previewUrl?: string) =>
                  handleOptionAudioSelect(option.id, url, previewUrl)
                }
                currentImage={option.image}
                currentImagePreview={option.imagePreview}
                currentAudio={option.audio}
              />
            </div>
          ))}
          {answerOptions.length < 5 && (
            <div
              onClick={() => dispatch(addAnswerOption())}
              className="border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center h-[162px] bg-transparent hover:bg-gray-100 cursor-pointer"
            >
              <LucidePlus className="h-6 w-6" />
            </div>
          )}
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          {t("correctAnswerHint")}
        </p>
      </>
    );
  }
);