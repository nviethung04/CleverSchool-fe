"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/context/auth-context";
import { postH5PContentScore } from "@/lib/api/h5p";

const H5PPlayerUI = dynamic(
  () =>
    import("@lumieducation/h5p-react").then((mod) => ({
      default: mod.H5PPlayerUI,
    })),
  {
    ssr: false,
    loading: () => <div>Loading H5P Player...</div>,
  }
);

export default function Home() {
  const params = useParams();
  const { token } = useAuth();
  const routeId = (params?.id as string) || "";
  
  const loadContentCallback = async (contentId: string) => {
    try {
      const url = `/h5p/${contentId}/play`;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Add bearer token if available
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers,
        // Ensure cookies/credentials flow through the same origin + rewrite
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const playerModel = await response.json();
      return playerModel;
    } catch (error) {
      console.error("Failed to load H5P content:", error);
      throw error;
    }
  };

  const handleInitialized = (contentId: string) => {
    console.log(`H5P content ${contentId} đã khởi tạo thành công`);
  };

const parseISODurationToSeconds = (duration: string): number => {
  // duration ví dụ: "PT6.46S", "PT2M30S", "PT1H5M10S"
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?/;
  const match = regex.exec(duration);

  if (!match) return 0;

  const hours = parseFloat(match[1] || "0");
  const minutes = parseFloat(match[2] || "0");
  const seconds = parseFloat(match[3] || "0");

  return hours * 3600 + minutes * 60 + seconds;
};

const handlexAPIStatement = async (statement: any) => {
  console.log("xAPI Statement:", statement);

  if (statement?.verb?.id === "http://adlnet.gov/expapi/verbs/completed") {
    const score = statement?.result?.score?.raw ?? 0;
    const maxScore = statement?.result?.score?.max ?? 0;

    // thời gian hoàn thành (unix 10 số = seconds, integer)
    const finished = Math.floor(Date.now() / 1000);

    // duration tính bằng giây từ ISO 8601
    const durationIso = statement?.result?.duration ?? "PT0S";
    const durationSeconds = parseISODurationToSeconds(durationIso);

    // opened = finished - duration (ép int)
    const opened = Math.floor(finished - durationSeconds);

    try {
      await postH5PContentScore({
        contentId: statement?.object?.id ?? "",
        score: String(score),
        maxScore: String(maxScore),
        opened: String(opened),     // unix timestamp (seconds, int)
        finished: String(finished), // unix timestamp (seconds, int)
      });
    } catch (err) {
      console.error("Lỗi khi gửi content-score:", err);
    }
  }
};


  return (
    <div>
      <H5PPlayerUI
        contentId={routeId || ""}
        loadContentCallback={loadContentCallback}
        onInitialized={handleInitialized}
        onxAPIStatement={handlexAPIStatement}
      />
    </div>
  );
}
