"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { LucidePlus } from "lucide-react";
import { cn } from "@/lib/utils";

/** Nút hành động chính (Tạo mới) — màu brand xanh lá */
export const adminPrimaryButtonClass =
  "bg-cs-green text-white hover:bg-cs-green/90 shrink-0";

export function AdminPageHeading({
  title,
  description,
}: {
  title: ReactNode;
  description?: ReactNode;
}) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
        {title}
      </h1>
      {description ? (
        <p className="text-gray-600 mt-2">{description}</p>
      ) : null}
    </div>
  );
}

/** Hàng công cụ trên bảng: tổng số + nút tạo (luôn hiển thị trong vùng card) */
export function AdminListToolbar({
  summary,
  action,
  className,
}: {
  summary?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      {summary ? <div className="text-sm text-gray-600">{summary}</div> : <span />}
      {action ? <div className="w-full sm:w-auto">{action}</div> : null}
    </div>
  );
}

export function AdminCreateButton({
  children,
  onClick,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <Button
      type="button"
      onClick={onClick}
      className={cn("w-full sm:w-auto", adminPrimaryButtonClass, className)}
    >
      <LucidePlus className="mr-2 h-4 w-4" />
      {children}
    </Button>
  );
}
