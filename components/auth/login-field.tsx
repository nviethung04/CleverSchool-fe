"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const loginInputClassName =
  "h-full w-full outline-none pt-4 font-normal not-italic text-sm leading-4_5 text-text-2 bg-transparent disabled:cursor-not-allowed disabled:opacity-50";

type LoginFieldProps = {
  id: string;
  name: string;
  label: string;
  testId: string;
  type?: React.HTMLInputTypeAttribute;
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  disabled?: boolean;
  autoComplete?: string;
  enterKeyHint?: "next" | "done" | "go" | "search" | "send";
  className?: string;
  suffix?: React.ReactNode;
};

export function LoginField({
  id,
  name,
  label,
  testId,
  type = "text",
  value,
  onChange,
  disabled,
  autoComplete,
  enterKeyHint,
  className,
  suffix,
}: LoginFieldProps) {
  return (
    <div
      className={cn(
        "relative h-14 w-full rounded-md border border-input bg-background px-3 transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ring-offset-background",
        suffix && "pr-10",
        className
      )}
    >
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-3 top-1.5 text-xs font-normal not-italic leading-4 text-muted-foreground"
      >
        {label}
      </label>
      <input
        data-testid={testId}
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder=""
        autoComplete={autoComplete}
        enterKeyHint={enterKeyHint}
        className={loginInputClassName}
      />
      {suffix}
    </div>
  );
}
