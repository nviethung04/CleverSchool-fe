"use client";

import React from "react";
import { createPortal } from "react-dom";
import { useEyeTracking } from "@/lib/context/eye-tracking-context";

type MediaPipeGlobals = {
  FaceMesh: any;
  Camera: any;
  drawConnectors: any;
};

declare global {
  interface Window extends MediaPipeGlobals { }
}

const FACE_MESH_CDN =
  "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js";
const CAMERA_UTILS_CDN =
  "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js";
const DRAWING_UTILS_CDN =
  "https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js";

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.body.appendChild(script);
  });
}

function waitFor<T>(
  check: () => T | null | undefined,
  timeoutMs = 6000,
  intervalMs = 50
): Promise<T> {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const val = check();
      if (val) {
        resolve(val);
        return;
      }
      if (Date.now() - start >= timeoutMs) {
        reject(new Error("Timeout waiting for dependency"));
        return;
      }
      setTimeout(tick, intervalMs);
    };
    tick();
  });
}

interface EyeTrackingWidgetProps {
  width?: number;
  height?: number;
}

export default function EyeTrackingWidget({
  width = 320,
  height = 240,
}: EyeTrackingWidgetProps): React.ReactElement {
  const { setWarning } = useEyeTracking();
  const portalContainerRef = React.useRef<HTMLDivElement | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [statusText, setStatusText] =
    React.useState<string>("Đang khởi động...");
  const [statusColor, setStatusColor] = React.useState<string>("black");

  // Page visibility tracking
  const [isPageVisible, setIsPageVisible] = React.useState<boolean>(true);
  const pageLeaveTimeRef = React.useRef<number | null>(null);

  // Face detection state tracking - Use ref instead of state to persist across renders
  const lastFaceDetectedRef = React.useRef<boolean>(true);
  const lastFaceStateChangeRef = React.useRef<number>(Date.now());

  // Static image warning state tracking
  const lastStaticImageWarningRef = React.useRef<boolean>(false);

  // Static image warning state tracking
  const staticImageWarningShownRef = React.useRef<boolean>(false);

  // Blink detection
  const lastBlinkTimeRef = React.useRef<number>(Date.now());
  const blinkCountRef = React.useRef<number>(0);
  // Audio playback state
  const lastPlayedAudioRef = React.useRef<string>("");
  const lastPlayedAtRef = React.useRef<number>(0);
  const currentAudioRef = React.useRef<HTMLAudioElement | null>(null);

  const playAudio = React.useCallback((audioFile: string, forcePlay: boolean = false) => {
    if (typeof window === "undefined") return;

    // Stop any currently playing audio
    if (currentAudioRef.current) {
      console.log("🔇 Stopping current audio to play new one");
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }

    // Skip throttling if forcePlay is true (for immediate state change audio)
    if (!forcePlay) {
      // Different throttle times for different audio types
      const now = Date.now();
      let throttleTime = 3000; // Default 3 seconds

      // Shorter throttle for eye-tracking warnings to be more responsive
      if (audioFile === 'see.mp3' || audioFile === 'warning.mp3') {
        throttleTime = 2000; // Only 2 seconds for eye tracking warnings
      }

      // Longer throttle for tab switch warnings
      if (audioFile === 'warningwindow.mp3') {
        throttleTime = 4000; // 4 seconds for tab switch warnings
      }

      if (
        audioFile === lastPlayedAudioRef.current &&
        now - lastPlayedAtRef.current < throttleTime
      ) {
        console.log(`🚫 Throttling audio: ${audioFile} (${throttleTime}ms)`);
        return;
      }
    } else {
      console.log(`🎯 Force playing audio: ${audioFile} (bypassing throttle)`);
    }

    const now = Date.now();
    lastPlayedAudioRef.current = audioFile;
    lastPlayedAtRef.current = now;

    try {
      console.log(`🔊 Playing audio: ${audioFile}`);
      const audio = new Audio(`/voice/${audioFile}`);
      currentAudioRef.current = audio;

      // Auto cleanup when audio ends
      audio.addEventListener('ended', () => {
        console.log(`✅ Audio ended: ${audioFile}`);
        if (currentAudioRef.current === audio) {
          currentAudioRef.current = null;
        }
      });

      // Auto cleanup on error
      audio.addEventListener('error', () => {
        console.log(`❌ Audio error: ${audioFile}`);
        if (currentAudioRef.current === audio) {
          currentAudioRef.current = null;
        }
      });

      audio.play().catch((error) => {
        console.log(`❌ Audio play failed: ${audioFile}`, error);
        if (currentAudioRef.current === audio) {
          currentAudioRef.current = null;
        }
      });
    } catch (error) {
      console.log(`❌ Audio creation failed: ${audioFile}`, error);
      currentAudioRef.current = null;
    }
  }, []);  // Drag state
  const [position, setPosition] = React.useState<{
    bottom: number;
    left: number;
  }>({ bottom: 16, left: 16 });
  const dragStateRef = React.useRef<{
    dragging: boolean;
    startX: number;
    startY: number;
    startBottom: number;
    startLeft: number;
  }>({ dragging: false, startX: 0, startY: 0, startBottom: 0, startLeft: 0 });

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragStateRef.current.dragging = true;
    dragStateRef.current.startX = e.clientX;
    dragStateRef.current.startY = e.clientY;
    dragStateRef.current.startBottom = position.bottom;
    dragStateRef.current.startLeft = position.left;
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!dragStateRef.current.dragging) return;
    const deltaX = e.clientX - dragStateRef.current.startX;
    const deltaY = e.clientY - dragStateRef.current.startY;
    // Update bottom and left to follow cursor
    setPosition({
      bottom: Math.max(8, dragStateRef.current.startBottom - deltaY),
      left: Math.max(8, dragStateRef.current.startLeft + deltaX),
    });
  };

  const onMouseUp = () => {
    dragStateRef.current.dragging = false;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

  // Create portal container to avoid parent transforms affecting positioning
  React.useEffect(() => {
    const container = document.createElement("div");
    container.setAttribute("data-eye-tracking-portal", "");
    document.body.appendChild(container);
    portalContainerRef.current = container;
    return () => {
      try {
        document.body.removeChild(container);
      } catch { }

      // Cleanup audio when component unmounts
      if (currentAudioRef.current) {
        console.log("🔇 Stopping audio on component unmount");
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current = null;
      }
    };
  }, []);

  React.useEffect(() => {
    let isCancelled = false;
    let cameraInstance: any | null = null;
    let faceMeshInstance: any | null = null;
    let mediaStream: MediaStream | null = null;

    async function initialize(): Promise<void> {
      try {
        await loadScript(DRAWING_UTILS_CDN);
        await loadScript(CAMERA_UTILS_CDN);
        await loadScript(FACE_MESH_CDN);
        // Ensure globals are available regardless of bundle load order
        const FaceMeshGlobal: any = await waitFor(
          () => (window as any).FaceMesh?.FaceMesh || (window as any).FaceMesh
        );
        const CameraGlobal: any = await waitFor(
          () => (window as any).Camera || (window as any).CameraUtils?.Camera
        );
        const drawConnectorsGlobal: any = await waitFor(
          () => (window as any).drawConnectors
        );
        if (isCancelled) return;

        const videoElement = videoRef.current as HTMLVideoElement | null;
        const canvasElement = canvasRef.current as HTMLCanvasElement | null;
        if (!videoElement || !canvasElement) return;

        const canvasContext = canvasElement.getContext("2d");
        if (!canvasContext) return;

        const onResults = (results: any) => {
          // Always draw to canvas, even if page is not visible
          canvasContext.save();
          canvasContext.clearRect(
            0,
            0,
            canvasElement.width,
            canvasElement.height
          );

          // Always draw the camera feed
          if (results.image) {
            canvasContext.drawImage(
              results.image,
              0,
              0,
              canvasElement.width,
              canvasElement.height
            );
          } else {
            // If no image, fill with dark background to show camera is working
            canvasContext.fillStyle = '#1a1a1a';
            canvasContext.fillRect(0, 0, canvasElement.width, canvasElement.height);
            canvasContext.fillStyle = '#666';
            canvasContext.font = '12px Arial';
            canvasContext.fillText('Đang tải camera...', 10, 20);
          }

          // Chỉ skip eye tracking logic khi page thực sự hidden và user đã chuyển tab
          // Không skip khi user chỉ mở dev tools hoặc dropdown
          const shouldSkipEyeTracking = document.hidden && document.visibilityState === 'hidden';

          if (shouldSkipEyeTracking) {
            console.log("🚫 Skipping eye tracking - user switched tab");
            canvasContext.restore();
            return;
          }

          // Double check: if we lost page visibility state but document says visible, trust document
          if (!isPageVisible && !document.hidden && document.visibilityState === 'visible') {
            console.log("🔄 Correcting page visibility state");
            setIsPageVisible(true);
            if (pageLeaveTimeRef.current) {
              pageLeaveTimeRef.current = null;
              setWarning(false);
              setStatusText("🔵 Đang theo dõi...");
              setStatusColor("#0b5fff");
              lastBlinkTimeRef.current = Date.now();
            }
          }

          if (
            results.multiFaceLandmarks &&
            results.multiFaceLandmarks.length > 0
          ) {
            const hasFaceNow = true;
            console.log("👤 Face detected with landmarks");

            // Check if face detection state changed from no-face to face
            if (!lastFaceDetectedRef.current) {
              console.log("✅ Face detection state changed: NO FACE → FACE");
              lastFaceDetectedRef.current = true;
              lastFaceStateChangeRef.current = Date.now();

              // IMPORTANT: Reset blink timer when face is detected again
              // This prevents immediate "static image" warning
              lastBlinkTimeRef.current = Date.now();
              lastStaticImageWarningRef.current = false; // Reset static warning state
              console.log("🔄 Reset blink timer - face detected again");

              // Reset static image warning when face detected again
              if (staticImageWarningShownRef.current) {
                console.log("🔄 Reset static image warning - face detected again");
                staticImageWarningShownRef.current = false;
              }
            } const landmarks = results.multiFaceLandmarks[0];
            // Draw eyes
            try {
              drawConnectorsGlobal(
                canvasContext,
                landmarks,
                (window as any).FaceMesh.FACEMESH_LEFT_EYE,
                { color: "#00FF00" }
              );
              drawConnectorsGlobal(
                canvasContext,
                landmarks,
                (window as any).FaceMesh.FACEMESH_RIGHT_EYE,
                { color: "#00FF00" }
              );
            } catch { }

            // EAR calculation for anti-spoof blink detection
            const leftIds = [33, 160, 158, 133, 153, 144];
            const rightIds = [362, 385, 387, 263, 373, 380];
            const dist = (a: number, b: number) => {
              const pa = landmarks[a];
              const pb = landmarks[b];
              return Math.hypot(pa.x - pb.x, pa.y - pb.y);
            };
            const getEAR = (ids: number[]) => {
              const vertical1 = dist(ids[1], ids[5]);
              const vertical2 = dist(ids[2], ids[4]);
              const horizontal = dist(ids[0], ids[3]);
              return (vertical1 + vertical2) / (2.0 * (horizontal || 1e-6));
            };
            const leftEAR = getEAR(leftIds);
            const rightEAR = getEAR(rightIds);
            const avgEAR = (leftEAR + rightEAR) / 2.0;

            if (avgEAR < 0.2) {
              if (Date.now() - lastBlinkTimeRef.current > 300) {
                blinkCountRef.current += 1;
                lastBlinkTimeRef.current = Date.now();
              }
            }

            if (Date.now() - lastBlinkTimeRef.current > 20000) { // Tăng từ 10 giây lên 20 giây
              // Chỉ show eye tracking warning nếu page thực sự visible và không có page leave warning
              if (isPageVisible && !pageLeaveTimeRef.current) {
                // Chỉ phát audio khi lần đầu detect static image
                if (!staticImageWarningShownRef.current) {
                  console.log("⚠️ First time showing static image warning - play audio");
                  staticImageWarningShownRef.current = true;
                  playAudio("warning.mp3", true); // Force play
                } else {
                  console.log("⚠️ Static image warning already shown - no audio");
                }

                console.log("⚠️ Showing static image warning");
                const txt = "⚠️ Phát hiện ảnh tĩnh";
                setStatusText(txt);
                setStatusColor("red");
                setWarning(true); // Gửi cảnh báo
              }
            } else {
              // Reset static image warning when user blinks/moves
              if (staticImageWarningShownRef.current) {
                console.log("✅ Resetting static image warning - user is active");
                staticImageWarningShownRef.current = false;
              }

              // Chỉ clear warning nếu page visible và không có page leave warning
              if (isPageVisible && !pageLeaveTimeRef.current) {
                console.log("✅ Face detected, setting good learning status");
                setStatusText("✅ Bạn đang học rất tốt");
                setStatusColor("green");
                setWarning(false); // Không có cảnh báo
              }
            }
          } else {
            const hasFaceNow = false;
            console.log("❌ No face detected - should show distraction warning");

            // Check if face detection state changed from face to no-face
            if (lastFaceDetectedRef.current) {
              console.log("🚨 Face detection state changed: FACE → NO FACE");
              lastFaceDetectedRef.current = false;
              lastFaceStateChangeRef.current = Date.now();

              // Reset blink timer when face is lost to prevent static image warnings
              // during the time when no face is detected
              lastBlinkTimeRef.current = Date.now();
              console.log("🔄 Reset blink timer - face lost");

              // Play audio immediately when face is lost (not throttled)
              if (!pageLeaveTimeRef.current) {
                console.log("🔊 Playing see.mp3 immediately - face lost!");
                playAudio("see.mp3", true); // Force play = true
              }
            }            // Show warning but don't play audio again (already played when state changed)
            if (!pageLeaveTimeRef.current) {
              console.log("⚠️ Showing distraction warning (no audio - already played)");
              const txt = "⚠️ Bạn đang mất tập trung";
              setStatusText(txt);
              setStatusColor("red");
              setWarning(true); // Gửi cảnh báo
              // Note: không gọi playAudio("see.mp3") ở đây nữa vì đã play khi state change
            } else {
              console.log("🚫 Skipping distraction warning - user switched tab");
            }
          }
          canvasContext.restore();
        };

        faceMeshInstance = new FaceMeshGlobal({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });
        faceMeshInstance.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5, // Khôi phục về 0.5 như ban đầu
          minTrackingConfidence: 0.5,  // Khôi phục về 0.5 như ban đầu
        });
        faceMeshInstance.onResults(onResults);

        cameraInstance = new CameraGlobal(videoElement, {
          onFrame: async () => {
            if (!faceMeshInstance) {
              console.log("⚠️ FaceMesh instance not available");
              return;
            }
            try {
              await faceMeshInstance!.send({ image: videoElement });
            } catch (error) {
              console.log("❌ Error sending frame to FaceMesh:", error);
            }
          },
          width,
          height,
        });

        console.log("📷 Requesting camera access...");
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width, height },
          audio: false,
        });

        console.log("📷 Camera access granted, setting up video element...");
        videoElement.srcObject = mediaStream;

        // Ensure video is properly loaded before starting camera
        await new Promise((resolve, reject) => {
          videoElement.onloadedmetadata = () => {
            console.log("📷 Video metadata loaded");
            resolve(void 0);
          };
          videoElement.onerror = reject;
          videoElement.play().catch(reject);
        });

        console.log("📷 Starting camera instance...");
        cameraInstance.start();

        // Verify camera is working after a short delay
        setTimeout(() => {
          if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
            console.log("⚠️ Camera may not be working properly - no video dimensions");
            setStatusText("⚠️ Kiểm tra camera");
            setStatusColor("orange");
          } else {
            console.log(`📷 Camera working: ${videoElement.videoWidth}x${videoElement.videoHeight}`);
            setStatusText("🔵 Đang theo dõi...");
            setStatusColor("#0b5fff");
          }
        }, 1000);

        setStatusText("🔵 Đang theo dõi...");
        setStatusColor("#0b5fff");
      } catch (error) {
        setStatusText("❌ Lỗi camera/MediaPipe");
        setStatusColor("crimson");
        // eslint-disable-next-line no-console
        console.error(error);
      }
    }

    initialize();

    return () => {
      isCancelled = true;
      console.log("🔄 Cleaning up eye tracking widget");

      try {
        if (cameraInstance && typeof cameraInstance.stop === "function") {
          console.log("📷 Stopping camera instance");
          cameraInstance.stop();
        }
      } catch (error) {
        console.log("⚠️ Error stopping camera:", error);
      }

      try {
        if (faceMeshInstance && typeof faceMeshInstance.close === "function") {
          console.log("🧠 Closing FaceMesh instance");
          faceMeshInstance.close();
        }
      } catch (error) {
        console.log("⚠️ Error closing FaceMesh:", error);
      }

      try {
        if (mediaStream) {
          console.log("🎥 Stopping media stream tracks");
          mediaStream.getTracks().forEach((track) => {
            console.log(`🛑 Stopping track: ${track.kind} - ${track.label}`);
            track.stop();
          });
        }
      } catch (error) {
        console.log("⚠️ Error stopping media stream:", error);
      }
    };
  }, [width, height]);

  // Page visibility tracking - Cảnh báo khi chuyển tab
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      const isHidden = document.hidden;
      const visibilityState = document.visibilityState;
      console.log("🔄 Visibility changed:", {
        isHidden,
        visibilityState,
        hasFocus: document.hasFocus()
      });

      setIsPageVisible(!isHidden);

      if (isHidden && visibilityState === 'hidden') {
        // User left the page/tab - chỉ khi thực sự hidden
        console.log("👋 User left page - showing warning");
        pageLeaveTimeRef.current = Date.now();
        setWarning(true);
        playAudio("warningwindow.mp3");
        setStatusText("⚠️ Cần quay lại bài học");
        setStatusColor("#ff6b35");
      } else if (!isHidden && visibilityState === 'visible') {
        // User returned to the page/tab - chỉ khi thực sự visible
        console.log("👋 User returned to page");
        if (pageLeaveTimeRef.current) {
          const timeAway = Date.now() - pageLeaveTimeRef.current;
          console.log(`User was away for ${Math.round(timeAway / 1000)} seconds`);
          pageLeaveTimeRef.current = null;

          // Immediately clear warning and reset to normal state
          setWarning(false);
          setStatusText("🔵 Đang theo dõi...");
          setStatusColor("#0b5fff");

          // Reset blink detection timer to prevent immediate static warning
          lastBlinkTimeRef.current = Date.now();
        }
      }
    };

    const handleBlur = () => {
      // Window lost focus (minimize, switch apps, etc.)
      console.log("🟡 Window blur - checking state:", {
        visibilityState: document.visibilityState,
        hidden: document.hidden,
        hasFocus: document.hasFocus()
      });

      // Chỉ trigger warning khi window blur THẬT SỰ (không phải do dev tools hoặc dropdown)
      if (document.visibilityState === 'visible' && document.hidden === false) {
        console.log("🟡 Window blur but page still visible - probably dev tools or dropdown, ignoring");
        return;
      }

      if (document.visibilityState !== 'hidden') {
        setIsPageVisible(false);
        pageLeaveTimeRef.current = Date.now();
        setWarning(true);
        playAudio("warningwindow.mp3");
        setStatusText("⚠️ Cần quay lại bài học");
        setStatusColor("#ff6b35");
      }
    };

    const handleFocus = () => {
      // Window regained focus
      console.log("🟢 Window focus - checking state:", {
        visibilityState: document.visibilityState,
        hidden: document.hidden,
        hasFocus: document.hasFocus()
      });

      if (document.visibilityState !== 'hidden' && !document.hidden) {
        setIsPageVisible(true);
        if (pageLeaveTimeRef.current) {
          const timeAway = Date.now() - pageLeaveTimeRef.current;
          console.log(`User was away for ${Math.round(timeAway / 1000)} seconds`);
          pageLeaveTimeRef.current = null;

          // Immediately clear warning and reset to normal state
          setWarning(false);
          setStatusText("🔵 Đang theo dõi...");
          setStatusColor("#0b5fff");

          // Reset blink detection timer to prevent immediate static warning
          lastBlinkTimeRef.current = Date.now();
        }
      }
    };

    // Listen for visibility change (tab switch)
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Listen for window focus/blur (minimize, app switch)
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [setWarning, playAudio]);

  const content = (
    <div
      style={{
        position: "fixed",
        bottom: position.bottom,
        left: position.left,
        zIndex: 1000,
        width,
        userSelect: "none",
      }}
    >
      <div
        onMouseDown={onMouseDown}
        style={{
          cursor: "move",
          background: "rgba(255, 255, 255, 0.99)",
          color: "white",
          padding: "6px 10px",
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          fontSize: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ color: statusColor }}>{statusText}</span>
      </div>
      <div
        style={{
          background: "#000",
          borderBottomLeftRadius: 8,
          borderBottomRightRadius: 8,
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          width={width}
          height={height}
          style={{ display: "none" }}
        />
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{
            display: "block",
            borderBottomLeftRadius: 8,
            borderBottomRightRadius: 8,
          }}
        />
      </div>
    </div>
  );

  if (portalContainerRef.current) {
    return createPortal(content, portalContainerRef.current);
  }
  return content;
}
