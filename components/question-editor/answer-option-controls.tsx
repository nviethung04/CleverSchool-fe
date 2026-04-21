"use client"

import { Button } from "@/components/ui/button"
import { LucideImage, LucideTrash2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

interface AnswerOptionControlsProps {
  optionId: number
  isCorrect: boolean
  allowMultiple: boolean
  onToggleCorrect: (id: number) => void
  onAddImage?: () => void
  onDelete?: () => void
  className?: string
}

export function AnswerOptionControls({
  optionId,
  isCorrect,
  allowMultiple,
  onToggleCorrect,
  onAddImage,
  onDelete,
  className = "",
}: AnswerOptionControlsProps) {
  return (
    <div className={`flex justify-between ${className}`}>
      <div className="flex space-x-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-white opacity-70 hover:opacity-100 hover:bg-white/20"
          onClick={onDelete}
        >
          <LucideTrash2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-white opacity-70 hover:opacity-100 hover:bg-white/20"
          onClick={onAddImage}
        >
          <LucideImage className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div>
        {allowMultiple ? (
          <Checkbox
            checked={isCorrect}
            onCheckedChange={() => onToggleCorrect(optionId)}
            className="h-5 w-5 border-white data-[state=checked]:bg-white data-[state=checked]:text-green-600"
          />
        ) : (
          // Custom radio button implementation
          <div
            onClick={() => onToggleCorrect(optionId)}
            className={`h-5 w-5 rounded-full border-2 border-white flex items-center justify-center cursor-pointer ${isCorrect ? "bg-white" : ""}`}
          >
            {isCorrect && <div className="h-2.5 w-2.5 rounded-full bg-green-600"></div>}
          </div>
        )}
      </div>
    </div>
  )
}
