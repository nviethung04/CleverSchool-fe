"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ExpandableDescriptionProps {
  description: string;
  maxLines?: number;
  className?: string;
}

export function ExpandableDescription({
  description,
  maxLines = 3,
  className = "",
}: ExpandableDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Chuyển đổi \n thành <br> để hiển thị xuống dòng
  const formatDescription = (text: string) => {
    return text.split("\n").map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < text.split("\n").length - 1 && <br />}
      </React.Fragment>
    ));
  };

  // Tính toán số dòng thực tế
  const lines = description.split("\n");
  const shouldShowToggle = lines.length > maxLines;

  return (
    <div className={className}>
      <div
        className={`text-sm text-gray-600 leading-relaxed ${
          !isExpanded && shouldShowToggle ? `line-clamp-${maxLines}` : ""
        }`}
      >
        {formatDescription(description)}
      </div>

      {shouldShowToggle && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 p-0 h-auto text-blue-600 hover:text-blue-700 hover:bg-transparent"
        >
          {isExpanded ? (
            <>
              Thu gọn
              <ChevronUp className="h-3 w-3 ml-1" />
            </>
          ) : (
            <>
              Xem thêm
              <ChevronDown className="h-3 w-3 ml-1" />
            </>
          )}
        </Button>
      )}
    </div>
  );
}
