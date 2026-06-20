import { useState, useEffect } from "react";
import { GetSettingByKey, SettingItem } from "@/lib/api/settings";

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
        const foundSetting = await GetSettingByKey(key);

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
