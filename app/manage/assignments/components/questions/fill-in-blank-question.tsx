"use client";
import React, { useEffect, useRef, useState } from "react";
import { MediaDisplay } from "../media-display";
import type { QuestionType } from "@/lib/api/questions";
import { AudioEffects, isAudioExcludedKey } from "@/lib/utils/audio-utils";

interface FillInBlankQuestionProps {
  question: QuestionType;
  userAnswers?: any;
  onAnswerUpdate: (answer: any) => void;
  isSubmitted: boolean;
  correctAnswer?: any;
}

export function FillInBlankQuestion({
  question,
  userAnswers,
  onAnswerUpdate,
  isSubmitted,
  correctAnswer,
}: FillInBlankQuestionProps) {
  const BLANK_PLACEHOLDER = "___BLANK___";
  const htmlWithPlaceholders = question.content.text.replace(
    /\[blank\]/g,
    BLANK_PLACEHOLDER
  );
  const blanksCount = (
    htmlWithPlaceholders.match(new RegExp(BLANK_PLACEHOLDER, "g")) || []
  ).length;

  const [answers, setAnswers] = useState<string[]>(() => {
    if (correctAnswer && correctAnswer.list) {
      return Array.from(
        { length: blanksCount },
        (_, i) => correctAnswer.list[i + 1] || ""
      );
    }
    if (userAnswers?.answers && Array.isArray(userAnswers.answers)) {
      return userAnswers.answers.map((a: any) => a.text || "");
    }
    return Array(blanksCount).fill("");
  });

  // Ref để luôn giữ giá trị mới nhất của answers
  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
    console.log("answers state updated:", answers);
  }, [answers]);

  // Reset answers khi sang câu mới
  useEffect(() => {
    if (correctAnswer && correctAnswer.list) {
      setAnswers(
        Array.from(
          { length: blanksCount },
          (_, i) => correctAnswer.list[i + 1] || ""
        )
      );
    } else if (userAnswers?.answers && Array.isArray(userAnswers.answers)) {
      setAnswers(userAnswers.answers.map((a: any) => a.text || ""));
    } else {
      setAnswers(Array(blanksCount).fill(""));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id, blanksCount]);

  // Khi answers thay đổi, gọi onAnswerUpdate
  useEffect(() => {
    onAnswerUpdate({
      isAnswered: answers.some((a) => a.trim() !== ""),
      answers: answers.map((text, idx) => ({
        id: question.options.answers?.[idx]?.id?.toString() ?? idx.toString(),
        text,
      })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers]);

  // Ref cho vùng nội dung
  const contentRef = useRef<HTMLDivElement>(null);

  // Effect để chèn input vào đúng vị trí placeholder (chỉ khi sang câu mới)
  useEffect(() => {
    if (!contentRef.current) return;
    contentRef.current.innerHTML = htmlWithPlaceholders;
    let blankIndex = 0;
    const inputs: HTMLInputElement[] = [];
    const handlers: Array<(e: Event) => void> = [];
    const keydownHandlers: Array<(e: KeyboardEvent) => void> = [];
    const walker = document.createTreeWalker(
      contentRef.current,
      NodeFilter.SHOW_TEXT,
      null
    );
    const textNodes: Text[] = [];
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      if (node.nodeValue?.includes(BLANK_PLACEHOLDER)) {
        textNodes.push(node);
      }
    }
    textNodes.forEach((textNode) => {
      const parts = textNode.nodeValue!.split(BLANK_PLACEHOLDER);
      const fragment = document.createDocumentFragment();
      parts.forEach((part, idx) => {
        if (part) fragment.appendChild(document.createTextNode(part));
        if (idx < parts.length - 1) {
          const input = document.createElement("input");
          input.type = "text";
          input.value = answersRef.current[blankIndex] || "";
          input.disabled = isSubmitted || !!correctAnswer;
          input.placeholder = "__";
          input.setAttribute("autocapitalize", "none");
          input.setAttribute("autocorrect", "off");
          input.setAttribute("spellcheck", "false");
          input.setAttribute("data-blank-idx", blankIndex.toString());
          input.className =
            (answersRef.current[blankIndex] &&
              answersRef.current[blankIndex].length > 0
              ? "text-[#FF8800]"
              : "text-gray-400") +
            " placeholder-transparent bg-white text-left font-medium leading-tight mx-0.5 " +
            "text-base landscape:text-lg lg:text-xl xl:text-2xl";

          // Border bottom để thay underline
          input.style.borderBottom =
            answersRef.current[blankIndex] &&
              answersRef.current[blankIndex].length > 0
              ? "2px solid #FF8800"
              : "2px solid #ccc";
          input.style.background = "transparent";
          // input.style.padding = "0 2px";
          // Đo width thực tế của text
          const getTextWidth = (text: string, font: string) => {
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            if (!context) return 40;
            context.font = font;
            return context.measureText(text).width;
          };
          // Lấy font thực tế từ parent text
          const parent = input.parentElement;
          if (parent) {
            input.style.fontSize = window.getComputedStyle(parent).fontSize;
            input.style.fontFamily = window.getComputedStyle(parent).fontFamily;
            input.style.fontWeight = window.getComputedStyle(parent).fontWeight;
            input.style.lineHeight = window.getComputedStyle(parent).lineHeight;
          }
          const font = window.getComputedStyle(input).font;
          const textWidth = getTextWidth(
            answersRef.current[blankIndex] || input.placeholder,
            font
          );
          // Increase width by 1.5x on mobile for better visibility
          const isMobile = window.innerWidth < 768;
          const multiplier = isMobile ? 1.5 : 1;
          const minWidth = isMobile ? 60 : 40;
          input.style.width = `${Math.max(Math.ceil(textWidth * multiplier), minWidth)}px`;
          input.style.display = "inline-block";
          input.style.verticalAlign = "baseline";
          input.style.position = "relative";
          input.style.top = "-1px";
          // Use a local variable to capture the correct index
          const thisIndex = blankIndex;
          const handler = (e: Event) => {
            const newAnswers = [...answersRef.current];
            newAnswers[thisIndex] = (e.target as HTMLInputElement).value;
            console.log("input event:", {
              blankIndex: thisIndex,
              value: (e.target as HTMLInputElement).value,
              newAnswers,
            });
            setAnswers(newAnswers);
          };

          // Handle typing audio feedback
          const keydownHandler = (e: KeyboardEvent) => {
            if (isSubmitted || !!correctAnswer) return;

            // Play type audio feedback on key press (except for some special keys)
            if (!isAudioExcludedKey(e.key)) {
              AudioEffects.type();
            }
          };

          input.addEventListener("input", handler);
          input.addEventListener("keydown", keydownHandler);
          inputs.push(input);
          handlers.push(handler);
          keydownHandlers.push(keydownHandler);
          fragment.appendChild(input);
          blankIndex++;
        }
      });
      textNode.parentNode?.replaceChild(fragment, textNode);
    });
    // Cleanup: remove all event listeners when effect cleanup
    return () => {
      inputs.forEach((input, idx) => {
        input.removeEventListener("input", handlers[idx]);
        input.removeEventListener("keydown", keydownHandlers[idx]);
      });
    };
    // eslint-disable-next-line
  }, [
    question.id,
    blanksCount,
    htmlWithPlaceholders,
    isSubmitted,
    correctAnswer,
  ]);

  // Effect để update value và style của input khi answers đổi (KHÔNG render lại HTML)
  useEffect(() => {
    if (!contentRef.current) return;
    for (let i = 0; i < blanksCount; i++) {
      const input = contentRef.current.querySelector(
        `input[data-blank-idx='${i}']`
      ) as HTMLInputElement | null;
      if (input) {
        input.value = answers[i] || "";
        // Đảm bảo các thuộc tính touch-friendly được áp dụng
        input.setAttribute("autocapitalize", "none");
        input.setAttribute("autocorrect", "off");
        input.setAttribute("spellcheck", "false");
        input.className =
          (answers[i] && answers[i].length > 0
            ? "text-[#FF8800]"
            : "text-gray-400") +
          " placeholder-transparent bg-white text-left font-medium leading-tight mx-0.5 " +
          "text-base landscape:text-lg lg:text-xl xl:text-2xl";

        // Border bottom để thay underline
        input.style.borderBottom =
          answers[i] && answers[i].length > 0
            ? "2px solid #FF8800"
            : "2px solid #ccc";
        input.style.background = "transparent";
        // input.style.padding = "0 2px";
        // Đo width thực tế của text
        const getTextWidth = (text: string, font: string) => {
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          if (!context) return 40;
          context.font = font;
          return context.measureText(text).width;
        };
        // Lấy font thực tế từ parent text
        const parent = input.parentElement;
        if (parent) {
          input.style.fontSize = window.getComputedStyle(parent).fontSize;
          input.style.fontFamily = window.getComputedStyle(parent).fontFamily;
          input.style.fontWeight = window.getComputedStyle(parent).fontWeight;
          input.style.lineHeight = window.getComputedStyle(parent).lineHeight;
        }
        const font = window.getComputedStyle(input).font;
        const textWidth = getTextWidth(answers[i] || input.placeholder, font);
        // Increase width by 1.5x on mobile for better visibility
        const isMobile = window.innerWidth < 768;
        const multiplier = isMobile ? 1.5 : 1;
        const minWidth = isMobile ? 60 : 40;
        input.style.width = `${Math.max(Math.ceil(textWidth * multiplier), minWidth)}px`;
        input.style.display = "inline-block";
        input.style.verticalAlign = "baseline";
        input.style.position = "relative";
        input.style.top = "-1px";
      }
    }
  }, [answers, blanksCount]);

  return (
    <div className="w-full h-full flex items-center justify-center p-6 landscape:p-3">
      <div className="w-full max-w-5xl mx-auto">
        {question.content.media &&
          question.content.media.url &&
          question.content.media.type !== "text" ? (
          <div className="flex flex-row items-center gap-4 md:gap-6 landscape:gap-4">
            {/* Ảnh bên trái - chiếm ít không gian hơn */}
            <div className="flex-shrink-0 w-1/3 flex justify-center md:justify-start">
              <MediaDisplay
                media={question.content.media}
                alt="Hình ảnh câu hỏi"
                className="max-h-full max-w-48 md:max-w-56 lg:max-w-64 object-contain rounded-xl shadow-lg"
              />
            </div>
            {/* Text bên phải - chiếm nhiều không gian hơn và gần ảnh hơn */}
            <div className="flex-1 w-2/3 flex items-center justify-center md:justify-start min-h-[224px] md:min-h-[288px] lg:min-h-[320px] landscape:min-h-[160px]">
              <div className="w-full text-center md:text-left">
                <div
                  ref={contentRef}
                  className="text-[#32428D] font-medium leading-relaxed text-center text-lg sm:text-xl lg:text-2xl whitespace-normal break-words"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div
                ref={contentRef}
                className="text-[#32428D] font-medium leading-relaxed text-center text-lg sm:text-xl lg:text-2xl xl:text-3xl whitespace-normal break-words"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}