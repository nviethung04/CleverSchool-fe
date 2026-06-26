"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

// react-mathquill touches `window` at module eval time → must be dynamically imported client-side.
const EditableMathField = dynamic(
  () => import("react-mathquill").then((m: any) => m.EditableMathField),
  { ssr: false }
);
const StaticMathField = dynamic(
  () => import("react-mathquill").then((m: any) => m.StaticMathField),
  { ssr: false }
);

interface MathInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  size?: "sm" | "md" | "lg";
  inline?: boolean; // New prop for inline usage
  disabled?: boolean; // New prop for disabled state
}

// Heuristic: determine if a string likely contains LaTeX math
function isLikelyMathLatex(input: string): boolean {
  if (!input) return false;
  // Common LaTeX math markers
  const patterns = [
    /\\frac\b/,
    /\\sqrt\b/,
    /\\sum\b|\\int\b|\\lim\b/,
    /\\leq\b|\\geq\b|\\neq\b|\\approx\b/,
    /\\pi\b|\\infty\b/,
    /\\left\b|\\right\b/,
    /\\over/,
    /\\cdot\b|\\times\b/,
    /\^\{/,
    /_\{/,
  ];
  return patterns.some((re) => re.test(input));
}

export const MathInput: React.FC<MathInputProps> = ({
  value,
  onChange,
  placeholder = "Nhập công thức toán học",
  className = "",
  label,
  size = "md",
  inline = false,
  disabled = false,
}) => {
  const [mathquillLatex, setMathquillLatex] = useState(value);
  const [mathquillOpen, setMathquillOpen] = useState(false);
  const mathquillPopupRef = useRef<HTMLDivElement>(null);
  const mathquillApiRef = useRef<any>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Move popup
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(
    null
  );
  const [popupPos, setPopupPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 80,
  });

  useEffect(() => {
    const updatePopupPosition = () => {
      if (typeof window !== "undefined") {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const popupWidth = 320;
        const margin = 16;
        
        let x: number;
        let y: number;
        
        if (windowWidth < 640) {
          x = margin;
        } else {
          x = Math.max(margin, windowWidth - popupWidth - margin);
        }

        if (windowHeight < 500) {
          y = margin;
        } else {
          y = 80;
        }
        
        setPopupPos({ x, y });
      }
    };

    updatePopupPosition();
    
    // Lắng nghe event
    window.addEventListener('resize', updatePopupPosition);
    window.addEventListener('orientationchange', updatePopupPosition);
    
    return () => {
      window.removeEventListener('resize', updatePopupPosition);
      window.removeEventListener('orientationchange', updatePopupPosition);
    };
  }, []);

  useEffect(() => {
    setMathquillLatex(value);
  }, [value]);

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

  const handleInsertLatex = () => {
    onChange(mathquillLatex);
    setMathquillOpen(false);
  };

  const sizeClasses = {
    sm: "text-sm px-2 py-1",
    md: "text-base px-3 py-2",
    lg: "text-lg px-4 py-3",
  };

  const inlineSizeClasses = {
    sm: "text-sm px-1 py-0.5",
    md: "text-base px-2 py-1",
    lg: "text-lg px-3 py-1.5",
  };

  const buttonSize = {
    sm: "sm",
    md: "default",
    lg: "lg",
  } as const;

  return (
    <div className={`relative ${inline ? "inline-block" : ""} ${className}`}>
      {label && !inline && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      <div className={`flex flex-col xl:flex-row gap-2 ${inline ? "items-center" : ""}`}>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`flex-1 border border-gray-300 rounded-md w-full ${
            inline ? inlineSizeClasses[size] : sizeClasses[size]
          } focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent ${
            disabled ? "bg-gray-100 cursor-not-allowed" : ""
          }`}
        />
        {!inline && (
          <Button
            type="button"
            variant="outline"
            size={buttonSize[size]}
            onClick={() => setMathquillOpen(true)}
            className="whitespace-nowrap w-fit"
            disabled={disabled}
          >
            Math
          </Button>
        )}
        {inline && (
          <button
            type="button"
            onClick={() => setMathquillOpen(true)}
            disabled={disabled}
            className={`px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 ${
              disabled ? "bg-gray-100 cursor-not-allowed" : ""
            }`}
            title="Mở Math Editor"
          >
            ∑
          </button>
        )}
      </div>

      {/* Math preview box - show only when content looks like math (LaTeX) */}
      {!inline && isLikelyMathLatex(value) && (
        <div className="mt-2 border border-gray-200 bg-white rounded-md px-2 py-1 text-sm overflow-x-auto">
          {value && value.trim() !== "" ? (
            <StaticMathField>{value}</StaticMathField>
          ) : (
            <span className="text-gray-400">Xem trước công thức</span>
          )}
        </div>
      )}

      {/* MathQuill popup */}
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
          <p className="font-bold">Nhập biểu thức:</p>

          {/* Math symbol buttons */}
          <div
            style={{
              display: "flex",
              gap: 6,
              marginBottom: 8,
              flexWrap: "wrap",
            }}
          >
            {[
              { label: "Phân số", latex: "\\frac{}{}" },
              { label: "Căn", latex: "\\sqrt{}" },
              { label: "Số mũ", latex: "^{}" },
              // { label: "π", latex: "\\pi" },
              // { label: "∞", latex: "\\infty" },
              // { label: "≈", latex: "\\approx" },
              // { label: "≠", latex: "\\neq" },
              { label: "≤", latex: "\\leq" },
              { label: "≥", latex: "\\geq" },
              { label: "<", latex: "<" },
              { label: ">", latex: ">" },
              { label: "°", latex: "^{\\circ}" },
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
              Áp dụng vào đáp án
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setMathquillOpen(false)}
            >
              Đóng
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// Specialized component for fill-in-blank questions
export const FillInBlankMathInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}> = ({
  value,
  onChange,
  disabled = false,
  placeholder = "__",
  className = "",
}) => {
  const [mathquillLatex, setMathquillLatex] = useState(value);
  const [mathquillOpen, setMathquillOpen] = useState(false);
  const mathquillPopupRef = useRef<HTMLDivElement>(null);
  const mathquillApiRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Move popup
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(
    null
  );
  const [popupPos, setPopupPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 80,
  });

  useEffect(() => {
    const updatePopupPosition = () => {
      if (typeof window !== "undefined") {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const popupWidth = 320;
        const margin = 16;
        
        let x: number;
        let y: number;
        
        if (windowWidth < 640) {
          x = margin;
        } else {
          x = Math.max(margin, windowWidth - popupWidth - margin);
        }

        if (windowHeight < 500) {
          y = margin;
        } else {
          y = 80;
        }
        
        setPopupPos({ x, y });
      }
    };

    updatePopupPosition();
    
    // Lắng nghe event
    window.addEventListener('resize', updatePopupPosition);
    window.addEventListener('orientationchange', updatePopupPosition);
    
    return () => {
      window.removeEventListener('resize', updatePopupPosition);
      window.removeEventListener('orientationchange', updatePopupPosition);
    };
  }, []);

  useEffect(() => {
    setMathquillLatex(value);
  }, [value]);

  // Effect để update input width khi value thay đổi
  useEffect(() => {
    if (inputRef.current) {
      updateInputWidth(inputRef.current, value);
    }
  }, [value, placeholder]);

  // Effect để update width khi component mount và fonts load
  useEffect(() => {
    const updateWidth = () => {
      if (inputRef.current) {
        updateInputWidth(inputRef.current, value);
      }
    };

    // Update ngay lập tức
    updateWidth();

    // Update sau khi fonts load (nếu có)
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(updateWidth);
    }

    // Fallback: update sau 100ms để đảm bảo fonts đã load
    const timeoutId = setTimeout(updateWidth, 100);

    return () => clearTimeout(timeoutId);
  }, [value, placeholder]);

  const updateInputWidth = (input: HTMLInputElement, textValue: string) => {
    // Đo width thực tế của text
    const getTextWidth = (text: string, font: string) => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) return 40;
      context.font = font;
      return context.measureText(text).width;
    };

    // Lấy font thực tế từ input element
    const inputStyle = window.getComputedStyle(input);
    const font = `${inputStyle.fontWeight} ${inputStyle.fontSize} ${inputStyle.fontFamily}`;

    // Sử dụng text hiện tại hoặc placeholder để tính width
    const textToMeasure = textValue || placeholder;
    const textWidth = getTextWidth(textToMeasure, font);

    // Đảm bảo width tối thiểu và thêm padding - giống logic gốc
    const minWidth = 40;
    const padding = 0; // Không thêm padding như logic gốc
    const calculatedWidth = Math.max(minWidth, Math.ceil(textWidth) + padding);

    input.style.setProperty("width", `${calculatedWidth}px`, "important");
  };

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

  const handleInsertLatex = () => {
    onChange(mathquillLatex);
    setMathquillOpen(false);

    // Update width sau khi insert latex
    setTimeout(() => {
      if (inputRef.current) {
        updateInputWidth(inputRef.current, mathquillLatex);
      }
    }, 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Update width ngay lập tức khi user gõ
    if (inputRef.current) {
      updateInputWidth(inputRef.current, newValue);
    }
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`placeholder-transparent text-lg lg:text-xl xl:text-2xl bg-white text-left font-medium leading-tight mx-0.5 border-b-2 ${
            value && value.length > 0
              ? "text-[#FF8800] border-[#FF8800]"
              : "text-gray-400 border-gray-300"
          } focus:outline-none focus:border-purple-400 ${
            disabled ? "bg-gray-100 cursor-not-allowed" : ""
          }`}
          style={{
            background: "transparent",
            display: "inline-block",
            verticalAlign: "baseline",
            position: "relative",
            top: "-1px",
            minWidth: "40px",
            width: "40px",
            flex: "none",
          }}
        />
        <button
          type="button"
          onClick={() => setMathquillOpen(true)}
          disabled={disabled}
          className={`px-1 py-0.5 text-xs border border-gray-300 rounded hover:bg-gray-50 ${
            disabled ? "bg-gray-100 cursor-not-allowed" : ""
          }`}
          title="Mở Math Editor"
          style={{ fontSize: "0.75rem" }}
        >
          ∑
        </button>
      </div>

      {/* Inline preview for fill-in-blank: show only when value looks like LaTeX */}
      {isLikelyMathLatex(value) && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: "100%",
            marginTop: 6,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            padding: "4px 6px",
            zIndex: 20,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <StaticMathField>{value}</StaticMathField>
        </div>
      )}

      {/* MathQuill popup */}
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
          <p className="font-bold">Nhập biểu thức:</p>

          {/* Math symbol buttons */}
          <div
            style={{
              display: "flex",
              gap: 6,
              marginBottom: 8,
              flexWrap: "wrap",
            }}
          >
            {[
              { label: "Phân số", latex: "\\frac{}{}" },
              { label: "Căn", latex: "\\sqrt{}" },
              { label: "Số mũ", latex: "^{}" },
              { label: "≤", latex: "\\leq" },
              { label: "≥", latex: "\\geq" },
              { label: "<", latex: "<" },
              { label: ">", latex: ">" },
              { label: "°", latex: "^{\\circ}" },
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
              Áp dụng vào đáp án
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setMathquillOpen(false)}
            >
              Đóng
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};