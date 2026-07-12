"use client";

import { motion } from "framer-motion";
import { Sparkles, Eye, AlertCircle, RefreshCw } from "lucide-react";

interface GesturePanelProps {
  modelLoaded: boolean;
  trackingState: "loading" | "searching" | "drawing" | "hovering" | "paused" | "error";
  handsCount: number;
}

export default function GesturePanel({
  modelLoaded,
  trackingState,
  handsCount,
}: GesturePanelProps) {
  // Determine helper texts and visual state indicators
  const getStatusDetails = () => {
    switch (trackingState) {
      case "loading":
        return {
          icon: <RefreshCw className="text-violet-400 animate-spin" size={16} />,
          title: "Initializing AI",
          desc: "Loading MediaPipe WebAssembly model...",
          colorClass: "border-violet-500/20 bg-violet-500/5 text-violet-400",
          badgeClass: "bg-violet-400",
        };
      case "searching":
        return {
          icon: <Eye className="text-amber-400 animate-pulse" size={16} />,
          title: "Searching for Hands",
          desc: "Show your hand to the camera feed",
          colorClass: "border-amber-500/20 bg-amber-500/5 text-amber-400",
          badgeClass: "bg-amber-400",
        };
      case "drawing":
        return {
          icon: <Sparkles className="text-emerald-400 animate-bounce" size={16} />,
          title: "☝️ Active Paint",
          desc: "Painting on canvas (Index finger up)",
          colorClass: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",
          badgeClass: "bg-emerald-400",
        };
      case "hovering":
        return {
          icon: <Sparkles className="text-sky-400" size={16} />,
          title: "✌️ Pointer Hover",
          desc: "Positioning brush (Index & Middle up)",
          colorClass: "border-sky-500/20 bg-sky-500/5 text-sky-400",
          badgeClass: "bg-sky-400",
        };
      case "paused":
        return {
          icon: <AlertCircle className="text-purple-400" size={16} />,
          title: "🖐️ Tracking Paused",
          desc: "Open hand detected (Drawing paused)",
          colorClass: "border-purple-500/20 bg-purple-500/5 text-purple-400",
          badgeClass: "bg-purple-400",
        };
      case "error":
        return {
          icon: <AlertCircle className="text-rose-400" size={16} />,
          title: "Camera Access Error",
          desc: "Ensure camera is permitted and not in use",
          colorClass: "border-rose-500/20 bg-rose-500/5 text-rose-400",
          badgeClass: "bg-rose-400",
        };
    }
  };

  const status = getStatusDetails();

  return (
    <motion.div
      initial={{ x: -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="fixed bottom-6 left-6 z-40 w-80 overflow-hidden rounded-2xl border border-slate-700/30 bg-slate-900/50 p-4 shadow-2xl backdrop-blur-xl"
    >
      <div className="flex flex-col gap-3">
        {/* Header with connection light */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status.badgeClass}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${status.badgeClass}`} />
            </span>
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider select-none">
              Tracking Status
            </span>
          </div>

          <div className="rounded-full bg-slate-950/45 px-2 py-0.5 text-[10px] font-mono text-slate-400 border border-slate-800">
            {handsCount} hand{handsCount !== 1 && "s"} seen
          </div>
        </div>

        {/* Status Indicator Card */}
        <div className={`flex items-start gap-3 rounded-xl border p-3 ${status.colorClass} transition-colors duration-300`}>
          <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-lg bg-slate-950/40 border border-slate-850">
            {status.icon}
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-xs uppercase tracking-wide">{status.title}</h4>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-normal font-medium">{status.desc}</p>
          </div>
        </div>

        {/* Dynamic Help tips overlay */}
        <div className="rounded-lg bg-slate-950/20 border border-slate-800/40 p-2.5 text-[10px] text-slate-400">
          <div className="flex items-center gap-1.5 font-semibold text-slate-300 mb-1 select-none">
            <span>Quick Guide:</span>
          </div>
          <ul className="space-y-1 font-mono">
            <li className={trackingState === "drawing" ? "text-emerald-400 font-bold" : ""}>
              ☝️ Index ONLY: Paint
            </li>
            <li className={trackingState === "hovering" ? "text-sky-400 font-bold" : ""}>
              ✌️ Index + Middle: Move Cursor
            </li>
            <li className={trackingState === "paused" ? "text-purple-400 font-bold" : ""}>
              🖐️ All extended: Pause
            </li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
