"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { LucideChevronDown, LucideCheck } from "lucide-react"
import { cn } from "@/lib/utils"

interface Option {
  value: string
  label: React.ReactNode
}

interface CustomSelectProps {
  options: Option[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function CustomSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select an option",
  className,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((option) => option.value === value)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <div className={cn("relative", className)} ref={selectRef}>
      <Button
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={isOpen}
        className="w-full justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedOption ? selectedOption.label : placeholder}
        <LucideChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          {options.map((option) => (
            <div
              key={option.value}
              className={cn(
                "relative cursor-default select-none py-2 pl-10 pr-4",
                value === option.value ? "bg-purple-600 text-white" : "text-gray-900 hover:bg-gray-100",
              )}
              onClick={() => {
                onValueChange(option.value)
                setIsOpen(false)
              }}
            >
              <span className={cn("block truncate", value === option.value ? "font-medium" : "font-normal")}>
                {option.label}
              </span>
              {value === option.value ? (
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-white">
                  <LucideCheck className="h-5 w-5" aria-hidden="true" />
                </span>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
