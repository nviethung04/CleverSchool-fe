import { useState, useEffect } from "react";
import { GetSettings, SettingItem } from "@/lib/api/settings";

export function useSetting(key: string): {
  isEnabled: boolean;
  loading: boolean;
  setting: SettingItem | null;
} {
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [setting, setSetting] = useState<SettingItem | null>(null);

  useEffect(() => {
    async function fetchSetting() {
      try {
        setLoading(true);
        const result = await GetSettings();

        // Tìm setting có key chính xác
        const foundSetting = result.settings.find((s) => s.key === key);

        if (foundSetting) {
          setSetting(foundSetting);
          setIsEnabled(foundSetting.is_active === true);
        } else {
          // Nếu không tìm thấy setting, mặc định là false (tắt)
          setIsEnabled(false);
          setSetting(null);
        }
      } catch (error) {
        console.error(`Error fetching ${key} setting:`, error);
        // Nếu có lỗi, mặc định là false (tắt)
        setIsEnabled(false);
        setSetting(null);
      } finally {
        setLoading(false);
      }
    }

    fetchSetting();
  }, [key]);

  return { isEnabled, loading, setting };
}
