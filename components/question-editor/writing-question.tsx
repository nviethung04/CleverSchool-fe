"use client";

import React, { forwardRef } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { useTranslations } from "next-intl";
import {
  setQuestionText,
  setWritingMaxCharacters,
  setWritingAllowImageUpload,
  setWritingInstructions,
} from "@/lib/redux/question-slice";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { QuestionMediaControls } from "./question-media-controls";
import { QuestionMediaPreview } from "./question-media-preview";
import { ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TiptapMathEditor } from "./tiptap-math-editor";

export const WritingQuestion = forwardRef(function WritingQuestion(
  props: {},
  ref
) {
  const dispatch = useAppDispatch();
  const t = useTranslations("questionEditor.writing");
  const {
    questionText,
    questionImage,
    questionAudio,
    questionVideo,
    writingMaxCharacters,
    writingAllowImageUpload,
    writingInstructions,
  } = useAppSelector((state) => state.question);

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
              <Label htmlFor="instructions" className="text-white font-medium">
                {t("instructions")}:
              </Label>
              <Textarea
                id="instructions"
                value={writingInstructions}
                onChange={(e) =>
                  dispatch(setWritingInstructions(e.target.value))
                }
                placeholder={t("instructions")}
                className="bg-purple-800 border-purple-700 text-white placeholder:text-gray-400 min-h-[80px]"
                rows={3}
              />
            </div>

            <div className="space-y-4 max-w-md mx-auto">
              <div className="flex items-center justify-between">
                <Label htmlFor="max-characters" className="text-white">
                  {t("maxCharacters")}:
                </Label>
                <Input
                  id="max-characters"
                  type="number"
                  min={100}
                  max={5000}
                  value={writingMaxCharacters}
                  onChange={(e) =>
                    dispatch(
                      setWritingMaxCharacters(
                        Number.parseInt(e.target.value) || 1000
                      )
                    )
                  }
                  className="w-24 bg-purple-800 border-purple-700 text-white"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="allow-images" className="text-white">
                  {t("allowImageUpload")}
                </Label>
                <Switch
                  id="allow-images"
                  checked={writingAllowImageUpload}
                  onCheckedChange={(checked) =>
                    dispatch(setWritingAllowImageUpload(checked))
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
