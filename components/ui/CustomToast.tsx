import React, { useEffect } from "react";

export interface CustomToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose?: () => void;
  duration?: number;
}

const toastColors = {
  success: "bg-emerald-50 text-emerald-900",
  error: "bg-red-600 text-white",
  info: "bg-blue-600 text-white",
};

export const CustomToast: React.FC<CustomToastProps> = ({
  message,
  type = "info",
  onClose,
  duration = 3000,
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div
      className={`fixed top-8 right-8 z-50 px-6 py-4 rounded-2xl shadow-[0_6px_32px_0_rgba(0,0,0,0.18)] flex items-center gap-3 ${toastColors[type]} animate-fade-in`}
      style={{ minWidth: 240, maxWidth: 400 }}
    >
      <span className="font-semibold text-base">{message}</span>
      <button
        className="ml-4 text-emerald-900 hover:text-emerald-700 text-lg"
        onClick={onClose}
        aria-label="Đóng thông báo"
      >
        ×
      </button>
    </div>
  );
};

export default CustomToast;
