"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import Image from "next/image";

const HOLIDAY_POPUP_KEY = "maintain_system";
const HOLIDAY_API_CHECK_KEY = "maintain_system_api_checked";

export function HolidayPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [orientation, setOrientation] = useState<"landscape" | "portrait">("landscape");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAndShowPopup = async () => {
      const now = new Date();

      // Kiểm tra xem user đã đóng popup chưa
      const closedData = localStorage.getItem(HOLIDAY_POPUP_KEY);
      if (closedData) {
        // User đã đóng popup rồi, không hiện lại
        setIsLoading(false);
        return;
      }

      // Kiểm tra xem đã gọi API chưa
      const apiChecked = localStorage.getItem(HOLIDAY_API_CHECK_KEY);
      let isActive = false;
      let startDate: Date | null = null;

      if (!apiChecked) {
        // Chưa gọi API, gọi API 1 lần duy nhất (không cần token)
        try {
          const holidayKey = process.env.NEXT_PUBLIC_CHANGE_DOMAIN_KEY || "";
          const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
          
          if (holidayKey && apiBaseUrl) {
            const apiUrl = `${apiBaseUrl}/manage/settings/by-key/${holidayKey}`;
            const response = await fetch(apiUrl, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            });

            if (!response.ok) {
              throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            
            // Parse response để lấy is_active và start date
            if (data.code && Number(data.code) === 200 && data.data) {
              const settingData = data.data;
              isActive = settingData.is_active === true;
              
              // Tìm giá trị start từ values array
              if (settingData.values && Array.isArray(settingData.values)) {
                const startValue = settingData.values.find(
                  (item: { key: string; value: string }) => item.key === "start"
                );
                
                if (startValue && startValue.value) {
                  startDate = new Date(startValue.value);
                }
              }
            } else if (data.is_active !== undefined) {
              // Nếu response trả về trực tiếp object
              isActive = data.is_active === true;
              
              if (data.values && Array.isArray(data.values)) {
                const startValue = data.values.find(
                  (item: { key: string; value: string }) => item.key === "start"
                );
                
                if (startValue && startValue.value) {
                  startDate = new Date(startValue.value);
                }
              }
            }

            // Lưu kết quả vào localStorage để không gọi lại
            localStorage.setItem(HOLIDAY_API_CHECK_KEY, JSON.stringify({
              is_active: isActive,
              start_date: startDate ? startDate.toISOString() : null,
              checked_at: Date.now()
            }));
          }
        } catch (error) {
          // Nếu lỗi, không hiện popup
          setIsLoading(false);
          return;
        }
      } else {
        // Đã gọi API rồi, lấy kết quả từ localStorage
        try {
          const cachedData = JSON.parse(apiChecked);
          isActive = cachedData.is_active === true;
          if (cachedData.start_date) {
            startDate = new Date(cachedData.start_date);
          }
        } catch (error) {
          setIsLoading(false);
          return;
        }
      }

      // Kiểm tra điều kiện hiển thị popup:
      // 1. is_active phải === true
      // 2. Phải có start_date và ngày hiện tại >= start_date
      if (isActive && startDate && now >= startDate) {
        setIsOpen(true);
      }

      setIsLoading(false);
    };

    checkAndShowPopup();

    // Detect orientation
    const updateOrientation = () => {
      setOrientation(window.innerWidth > window.innerHeight ? "landscape" : "portrait");
    };

    updateOrientation();
    window.addEventListener("resize", updateOrientation);

    return () => {
      window.removeEventListener("resize", updateOrientation);
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    // Lưu vào localStorage - đánh dấu user đã đóng popup
    // Lưu timestamp để có thể kiểm tra sau này nếu cần
    localStorage.setItem(HOLIDAY_POPUP_KEY, Date.now().toString());
  };


  if (isLoading || !isOpen) return null;

  if (typeof window !== 'undefined' && !window.location.href.includes(process.env.NEXT_PUBLIC_URL_SHOW_BANNER!)) return null;


  // if (typeof window !== 'undefined' && !window.location.href.includes(process.env.NEXT_PUBLIC_URL_SHOW_BANNER!)) return null;

  const imagePath = orientation === "landscape" 
    ? "/holiday/bg-baotri-ngang.png" 
    : "/holiday/bg-baotri-doc.png";

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div 
        className="relative max-w-[98vw] max-h-[98vh] w-auto h-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={imagePath}
          alt="Chúc mừng năm mới 2026"
          width={orientation === "landscape" ? 3000 : 2000}
          height={orientation === "landscape" ? 1500 : 3000}
          className="w-auto h-auto max-w-[98vw] max-h-[98vh] object-contain rounded-lg cursor-pointer"
          style={{
            width: orientation === "landscape" ? "98vw" : "auto",
            height: orientation === "portrait" ? "98vh" : "auto",
            maxWidth: "98vw",
            maxHeight: "98vh"
          }}
          // onClick={() => window.location.href = "https://www.xlms.vn/"}
          priority
        />
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-50 rounded-full bg-black/50 hover:bg-black/70 text-white p-2 transition-colors"
          aria-label="Đóng"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}

