"use client";

import React, { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { Video, VideoOff, Loader2 } from "lucide-react";
import ControlRibbon from "./ControlRibbon";
import GesturePanel from "./GesturePanel";
import InstructionModal from "./InstructionModal";

export default function AirDrawApp() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);

  // Drawing config states
  const [color, setColor] = useState("#ef4444");
  const [brushSize, setBrushSize] = useState(10);
  const [isEraser, setIsEraser] = useState(false);

  // Application flow states
  const [modelLoaded, setModelLoaded] = useState(false);
  const [cameraState, setCameraState] = useState<"loading" | "active" | "denied">("loading");
  const [trackingState, setTrackingState] = useState<
    "loading" | "searching" | "drawing" | "hovering" | "paused" | "error"
  >("loading");
  const [handsCount, setHandsCount] = useState(0);
  const [isHelpOpen, setIsHelpOpen] = useState(true);

  // Drawing coordinate buffer to perform smooth quadratic curves
  const pointsRef = useRef<{ x: number; y: number }[]>([]);
  const isDrawingRef = useRef(false);

  // Sync ref values for access inside the render loop without triggering re-renders
  const colorRef = useRef(color);
  const brushSizeRef = useRef(brushSize);
  const isEraserRef = useRef(isEraser);

  useEffect(() => {
    colorRef.current = color;
  }, [color]);

  useEffect(() => {
    brushSizeRef.current = brushSize;
  }, [brushSize]);

  useEffect(() => {
    isEraserRef.current = isEraser;
  }, [isEraser]);

  // 1. Initialize MediaPipe Hand Landmarker
  useEffect(() => {
    let landmarkerInstance: HandLandmarker | null = null;
    let isActive = true;

    async function loadMediaPipe() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm"
        );
        
        if (!isActive) return;

        landmarkerInstance = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 1,
        });

        if (isActive) {
          landmarkerRef.current = landmarkerInstance;
          setModelLoaded(true);
          setTrackingState("searching");
        }
      } catch (err) {
        console.error("Failed to load MediaPipe Hands:", err);
        setTrackingState("error");
      }
    }

    loadMediaPipe();

    return () => {
      isActive = false;
      if (landmarkerInstance) {
        landmarkerInstance.close();
      }
    };
  }, []);

  // 2. Initialize and Manage Webcam Stream
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    let isActive = true;

    async function startCamera() {
      setCameraState("loading");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
          audio: false,
        });

        if (!isActive) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        activeStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              videoRef.current.play();
              setCameraState("active");
            }
          };
        }
      } catch (err) {
        console.error("Webcam access denied:", err);
        if (isActive) {
          setCameraState("denied");
          setTrackingState("error");
        }
      }
    }

    startCamera();

    return () => {
      isActive = false;
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // 3. Keep Canvas Aspect Ratio and Size synchronized with Viewport
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      const width = parent.clientWidth;
      const height = parent.clientHeight;

      if (canvas.width !== width || canvas.height !== height) {
        // Backup canvas content before resizing to prevent drawing loss
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext("2d");
        if (tempCtx) {
          tempCtx.drawImage(canvas, 0, 0);
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (ctx && tempCanvas.width > 0) {
          ctx.drawImage(tempCanvas, 0, 0, width, height);
        }
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  // 4. Transform raw normalized hand coordinates into cover-scaled screen coordinates
  const getCanvasCoordinates = (
    xNorm: number,
    yNorm: number,
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement
  ) => {
    const W_elem = canvas.clientWidth;
    const H_elem = canvas.clientHeight;
    const W_video = video.videoWidth;
    const H_video = video.videoHeight;

    if (!W_video || !H_video) {
      return { x: xNorm * W_elem, y: yNorm * H_elem };
    }

    // Determine scale parameter representing object-cover fitting
    const scale = Math.max(W_elem / W_video, H_elem / H_video);

    // Mirror the X coordinate because the camera feed layout is mirrored visually
    const xMirrored = 1 - xNorm;

    const x = W_elem / 2 + (xMirrored - 0.5) * W_video * scale;
    const y = H_elem / 2 + (yNorm - 0.5) * H_video * scale;

    return { x, y };
  };

  // 5. Main Hand Tracking Loop
  useEffect(() => {
    let animId: number;
    let lastVideoTime = -1;

    const detectLoop = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const landmarker = landmarkerRef.current;

      if (
        video &&
        canvas &&
        landmarker &&
        cameraState === "active" &&
        video.readyState >= 2
      ) {
        const currentTime = video.currentTime;

        if (currentTime !== lastVideoTime) {
          lastVideoTime = currentTime;

          try {
            const results = landmarker.detectForVideo(video, performance.now());
            setHandsCount(results.landmarks.length);

            if (results.landmarks && results.landmarks.length > 0) {
              const hand = results.landmarks[0];

              // Check if fingers are extended relative to their PIP joints
              // y coordinate is 0 at top and 1 at bottom, so y_tip < y_joint means it is extended
              const isIndexExtended = hand[8].y < hand[6].y;
              const isMiddleExtended = hand[12].y < hand[10].y;
              const isRingExtended = hand[16].y < hand[14].y;

              let currentGesture: "drawing" | "hovering" | "paused" | "searching" = "searching";

              if (isIndexExtended && !isMiddleExtended) {
                currentGesture = "drawing";
              } else if (isIndexExtended && isMiddleExtended && !isRingExtended) {
                currentGesture = "hovering";
              } else if (isIndexExtended && isMiddleExtended && isRingExtended) {
                currentGesture = "paused";
              }

              setTrackingState(currentGesture);

              // Get actual mapped screen coordinates
              const tip = hand[8]; // Index tip
              const { x, y } = getCanvasCoordinates(tip.x, tip.y, video, canvas);

              // Update visual overlay cursor
              if (cursorRef.current && (currentGesture === "drawing" || currentGesture === "hovering")) {
                cursorRef.current.style.display = "block";
                cursorRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-55%, -55%)`;
                cursorRef.current.style.width = `${brushSizeRef.current}px`;
                cursorRef.current.style.height = `${brushSizeRef.current}px`;

                if (currentGesture === "drawing") {
                  if (isEraserRef.current) {
                    cursorRef.current.className =
                      "absolute rounded-full border border-dashed border-white bg-white/20 pointer-events-none z-50 transition-[width,height] duration-75 shadow-[0_0_8px_rgba(255,255,255,0.4)]";
                    cursorRef.current.style.borderColor = "#ffffff";
                    cursorRef.current.style.backgroundColor = "rgba(255,255,255,0.2)";
                  } else {
                    cursorRef.current.className =
                      "absolute rounded-full border pointer-events-none z-50 transition-[width,height] duration-75 shadow-lg";
                    cursorRef.current.style.borderColor = colorRef.current;
                    cursorRef.current.style.backgroundColor = `${colorRef.current}33`;
                  }
                } else {
                  // Hovering
                  cursorRef.current.className =
                    "absolute rounded-full border border-sky-400 bg-sky-400/20 pointer-events-none z-50 transition-[width,height] duration-75 shadow-[0_0_12px_#38bdf8]";
                  cursorRef.current.style.borderColor = "#38bdf8";
                  cursorRef.current.style.backgroundColor = "rgba(56,189,248,0.2)";
                }
              } else if (cursorRef.current) {
                cursorRef.current.style.display = "none";
              }

              // Run Drawing State Machine
              const ctx = canvas.getContext("2d");
              if (ctx) {
                if (currentGesture === "drawing") {
                  if (!isDrawingRef.current) {
                    // Start new stroke path
                    isDrawingRef.current = true;
                    pointsRef.current = [{ x, y }];
                    
                    // Draw start dot
                    ctx.save();
                    ctx.beginPath();
                    if (isEraserRef.current) {
                      ctx.globalCompositeOperation = "destination-out";
                    } else {
                      ctx.globalCompositeOperation = "source-over";
                    }
                    ctx.fillStyle = colorRef.current;
                    ctx.arc(x, y, brushSizeRef.current / 2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                  } else {
                    // Append coordinate and draw smooth curve segment
                    const points = pointsRef.current;
                    points.push({ x, y });

                    ctx.save();
                    ctx.beginPath();
                    if (isEraserRef.current) {
                      ctx.globalCompositeOperation = "destination-out";
                    } else {
                      ctx.globalCompositeOperation = "source-over";
                    }
                    ctx.strokeStyle = colorRef.current;
                    ctx.lineWidth = brushSizeRef.current;
                    ctx.lineCap = "round";
                    ctx.lineJoin = "round";

                    if (points.length === 2) {
                      // Straight line for the first segment
                      ctx.moveTo(points[0].x, points[0].y);
                      ctx.lineTo(points[1].x, points[1].y);
                      ctx.stroke();
                    } else if (points.length >= 3) {
                      // Quadratic curve from midpoints
                      const p_prev2 = points[points.length - 3];
                      const p_prev1 = points[points.length - 2];
                      const p_curr = points[points.length - 1];

                      const m1 = {
                        x: (p_prev2.x + p_prev1.x) / 2,
                        y: (p_prev2.y + p_prev1.y) / 2,
                      };
                      const m2 = {
                        x: (p_prev1.x + p_curr.x) / 2,
                        y: (p_prev1.y + p_curr.y) / 2,
                      };

                      ctx.moveTo(m1.x, m1.y);
                      ctx.quadraticCurveTo(p_prev1.x, p_prev1.y, m2.x, m2.y);
                      ctx.stroke();
                    }
                    ctx.restore();
                  }
                } else {
                  // Finalize active stroke if gesture transitioned to non-drawing
                  finalizeStroke(ctx);
                }
              }
            } else {
              // No hands seen: reset cursor and finalize stroke
              setTrackingState("searching");
              if (cursorRef.current) {
                cursorRef.current.style.display = "none";
              }
              const ctx = canvas.getContext("2d");
              if (ctx) finalizeStroke(ctx);
            }
          } catch (e) {
            console.error("Landmarker tracking loop error:", e);
          }
        }
      }

      animId = requestAnimationFrame(detectLoop);
    };

    const finalizeStroke = (ctx: CanvasRenderingContext2D) => {
      if (isDrawingRef.current) {
        const points = pointsRef.current;
        if (points.length >= 2) {
          ctx.save();
          ctx.beginPath();
          if (isEraserRef.current) {
            ctx.globalCompositeOperation = "destination-out";
          } else {
            ctx.globalCompositeOperation = "source-over";
          }
          ctx.strokeStyle = colorRef.current;
          ctx.lineWidth = brushSizeRef.current;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";

          const p_last = points[points.length - 1];
          const p_prev = points[points.length - 2];
          const m = {
            x: (p_prev.x + p_last.x) / 2,
            y: (p_prev.y + p_last.y) / 2,
          };
          ctx.moveTo(m.x, m.y);
          ctx.lineTo(p_last.x, p_last.y);
          ctx.stroke();
          ctx.restore();
        }
        isDrawingRef.current = false;
        pointsRef.current = [];
      }
    };

    animId = requestAnimationFrame(detectLoop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [cameraState]);

  // Actions
  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Left and right visual burst
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 60,
      origin: { x: 0, y: 0.8 },
      colors: ["#8b5cf6", "#3b82f6", "#ec4899"],
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 60,
      origin: { x: 1, y: 0.8 },
      colors: ["#8b5cf6", "#3b82f6", "#ec4899"],
    });
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create solid background download canvas so it reads beautifully as an image
    const downloadCanvas = document.createElement("canvas");
    downloadCanvas.width = canvas.width;
    downloadCanvas.height = canvas.height;
    const dCtx = downloadCanvas.getContext("2d");
    if (!dCtx) return;

    // Premium dark drawing board background
    dCtx.fillStyle = "#0f172a"; // deep slate-900
    dCtx.fillRect(0, 0, downloadCanvas.width, downloadCanvas.height);

    // Draw coordinate system lines for an extra blueprint vibe (optional but very cool!)
    dCtx.strokeStyle = "rgba(148, 163, 184, 0.05)"; // slate-400 with 5% alpha
    dCtx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < downloadCanvas.width; x += gridSize) {
      dCtx.beginPath();
      dCtx.moveTo(x, 0);
      dCtx.lineTo(x, downloadCanvas.height);
      dCtx.stroke();
    }
    for (let y = 0; y < downloadCanvas.height; y += gridSize) {
      dCtx.beginPath();
      dCtx.moveTo(0, y);
      dCtx.lineTo(downloadCanvas.width, y);
      dCtx.stroke();
    }

    // Overlay drawing
    dCtx.drawImage(canvas, 0, 0);

    // Trigger download
    const link = document.createElement("a");
    link.download = `air-draw-sketch-${Date.now()}.png`;
    link.href = downloadCanvas.toDataURL("image/png");
    link.click();

    // Blast celebration confetti
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.8 },
      colors: ["#10b981", "#3b82f6", "#8b5cf6"],
    });
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col items-center">
      {/* 1. Mirrored Webcam Video Feed Layer (Bottom) */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover scale-x-[-1] pointer-events-none select-none z-0"
        playsInline
        muted
      />

      {/* Camera status block overlays */}
      {cameraState === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 z-10 backdrop-blur-sm">
          <Loader2 className="animate-spin text-indigo-500 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-slate-200">Initializing Webcam Feed...</h3>
          <p className="text-xs text-slate-400 mt-1">Please allow camera access when prompted</p>
        </div>
      )}

      {cameraState === "denied" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 z-10 backdrop-blur-md px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 mb-4 animate-pulse">
            <VideoOff size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-100">Camera Access Blocked</h3>
          <p className="max-w-md text-sm text-slate-400 mt-2 leading-relaxed">
            Air Draw requires camera access to recognize hand gestures. Please check your browser permission settings, allow camera access, and refresh the page.
          </p>
        </div>
      )}

      {/* 2. Transparent Drawing Canvas Layer (Top) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full z-20 pointer-events-none"
      />

      {/* 3. Real-time Cursor indicator */}
      <div
        ref={cursorRef}
        style={{ display: "none" }}
      />

      {/* 4. Top control Ribbon (Glassmorphic) */}
      <div className="absolute top-6 left-0 right-0 z-30 flex justify-center pointer-events-auto">
        <ControlRibbon
          color={color}
          setColor={setColor}
          brushSize={brushSize}
          setBrushSize={setBrushSize}
          isEraser={isEraser}
          setIsEraser={setIsEraser}
          onClear={handleClear}
          onDownload={handleDownload}
          onOpenHelp={() => setIsHelpOpen(true)}
        />
      </div>

      {/* 5. Left visual Tracking feedback details card */}
      {cameraState === "active" && (
        <div className="pointer-events-auto">
          <GesturePanel
            modelLoaded={modelLoaded}
            trackingState={
              !modelLoaded
                ? "loading"
                : trackingState === "error"
                ? "error"
                : trackingState
            }
            handsCount={handsCount}
          />
        </div>
      )}

      {/* 6. Onboarding help popups */}
      <InstructionModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
