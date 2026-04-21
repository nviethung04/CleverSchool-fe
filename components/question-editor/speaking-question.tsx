"use client";
import React, { forwardRef } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { useTranslations } from "next-intl";
import {
  setQuestionText,
  setSpeakingMaxDuration,
  setSpeakingInstructions,
} from "@/lib/redux/question-slice";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { QuestionMediaControls } from "./question-media-controls";
import { QuestionMediaPreview } from "./question-media-preview";
import { Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TiptapMathEditor } from "./tiptap-math-editor";

export const SpeakingQuestion = forwardRef(function SpeakingQuestion(
  props: {},
  ref
) {
  const dispatch = useAppDispatch();
  const t = useTranslations("questionEditor.speaking");
  const {
    questionText,
    questionImage,
    questionAudio,
    questionVideo,
    speakingMaxDuration,
    speakingInstructions,
  } = useAppSelector((state) => state.question);

  const durationOptions = [
    { value: 5, label: `5 ${t("secondsShort")}` },
    { value: 10, label: `10 ${t("secondsShort")}` },
    { value: 30, label: `30 ${t("secondsShort")}` },
    { value: 60, label: "1m" },
    { value: 120, label: "2m" },
  ];

  return (
    <div className="space-y-8">
      {/* Question creator */}
      <div className="space-y-4">
        <div className="bg-purple-900 rounded-lg p-6 text-white">
          <QuestionMediaControls />
          <TiptapMathEditor
            ref={ref}
            value={questionText}
            onChange={(val) => dispatch(setQuestionText(val))}
            placeholder={t("questionText")}
          />
          <QuestionMediaPreview />
        </div>

        <div className="bg-purple-900 rounded-lg p-6 text-white">
          <div className="space-y-6">
            <div className="space-y-4">
              <Label
                htmlFor="speaking-instructions"
                className="text-white font-medium"
              >
                {t("instructions")}:
              </Label>
              <Textarea
                id="speaking-instructions"
                value={speakingInstructions}
                onChange={(e) =>
                  dispatch(setSpeakingInstructions(e.target.value))
                }
                placeholder={t("instructions")}
                className="bg-purple-800 border-purple-700 text-white placeholder:text-gray-400 min-h-[80px]"
                rows={3}
              />
            </div>

            <div className="flex flex-col items-center justify-center gap-4">
              <Video className="h-12 w-12 text-gray-300" />
              <p className="text-center text-gray-300">{t("recordingHint")}</p>
            </div>

            <div className="space-y-4 max-w-md mx-auto">
              <div className="space-y-2">
                <Label className="text-white text-center block">
                  {t("maxDuration")}?
                </Label>

                <RadioGroup
                  value={speakingMaxDuration.toString()}
                  onValueChange={(value) =>
                    dispatch(setSpeakingMaxDuration(Number.parseInt(value)))
                  }
                  className="flex justify-center gap-2 flex-wrap"
                >
                  {durationOptions.map((option) => (
                    <div
                      key={option.value}
                      className="flex items-center space-x-1"
                    >
                      <RadioGroupItem
                        value={option.value.toString()}
                        id={`duration-${option.value}`}
                      />
                      <Label
                        htmlFor={`duration-${option.value}`}
                        className="text-white"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
