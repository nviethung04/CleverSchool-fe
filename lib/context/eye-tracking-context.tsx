"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface EyeTrackingContextType {
  isWarning: boolean;
  setWarning: (warning: boolean) => void;
  pauseContent: (contentType?: "video" | "h5p" | "youtube") => void;
  resumeContent: (contentType?: "video" | "h5p" | "youtube") => void;
  registerContentController: (
    type: "video" | "h5p" | "youtube",
    controller: ContentController
  ) => void;
  unregisterContentController: (type: "video" | "h5p" | "youtube") => void;
  setActiveContentType: (type: "video" | "h5p" | "youtube" | null) => void;
}

interface ContentController {
  pause: () => void;
  resume: () => void;
}

const EyeTrackingContext = createContext<EyeTrackingContextType | undefined>(
  undefined
);

export function EyeTrackingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isWarning, setIsWarning] = useState(false);
  const [activeContentType, setActiveContentType] = useState<
    "video" | "h5p" | "youtube" | null
  >(null);
  const [contentControllers, setContentControllers] = useState<{
    video?: ContentController;
    h5p?: ContentController;
    youtube?: ContentController;
  }>({});

  const setWarning = useCallback((warning: boolean) => {
    setIsWarning(warning);

    // Tự động pause/resume content dựa trên trạng thái warning
    if (warning) {
      pauseContent();
    } else {
      resumeContent();
    }
  }, []);

  const pauseContent = useCallback(
    (contentType?: "video" | "h5p" | "youtube") => {
      if (contentType) {
        // Pause specific content type
        if (contentControllers[contentType]) {
          contentControllers[contentType]!.pause();
        }
      } else if (activeContentType) {
        // Pause active content type
        if (contentControllers[activeContentType]) {
          contentControllers[activeContentType]!.pause();
        }
      } else {
        // Pause all available content
        if (contentControllers.video) {
          contentControllers.video.pause();
        }
        if (contentControllers.h5p) {
          contentControllers.h5p.pause();
        }
        if (contentControllers.youtube) {
          contentControllers.youtube.pause();
        }
      }
    },
    [contentControllers, activeContentType]
  );

  const resumeContent = useCallback(
    (contentType?: "video" | "h5p" | "youtube") => {
      if (contentType) {
        // Resume specific content type
        if (contentControllers[contentType]) {
          contentControllers[contentType]!.resume();
        }
      } else if (activeContentType) {
        // Resume active content type
        if (contentControllers[activeContentType]) {
          contentControllers[activeContentType]!.resume();
        }
      } else {
        // Resume all available content
        if (contentControllers.video) {
          contentControllers.video.resume();
        }
        if (contentControllers.h5p) {
          contentControllers.h5p.resume();
        }
        if (contentControllers.youtube) {
          contentControllers.youtube.resume();
        }
      }
    },
    [contentControllers, activeContentType]
  );

  const registerContentController = useCallback(
    (type: "video" | "h5p" | "youtube", controller: ContentController) => {
      setContentControllers((prev) => ({
        ...prev,
        [type]: controller,
      }));
    },
    []
  );

  const unregisterContentController = useCallback(
    (type: "video" | "h5p" | "youtube") => {
      setContentControllers((prev) => {
        const newControllers = { ...prev } as any;
        delete newControllers[type];
        return newControllers;
      });
    },
    []
  );

  return (
    <EyeTrackingContext.Provider
      value={{
        isWarning,
        setWarning,
        pauseContent,
        resumeContent,
        registerContentController,
        unregisterContentController,
        setActiveContentType,
      }}
    >
      {children}
    </EyeTrackingContext.Provider>
  );
}

export function useEyeTracking() {
  const context = useContext(EyeTrackingContext);
  if (context === undefined) {
    throw new Error(
      "useEyeTracking must be used within an EyeTrackingProvider"
    );
  }
  return context;
}
