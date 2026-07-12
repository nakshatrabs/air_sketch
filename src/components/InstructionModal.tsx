"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Hand, Paintbrush, MousePointer, Info, X } from "lucide-react";

interface InstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InstructionModal({ isOpen, onClose }: InstructionModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          {/* Backdrop click to close */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-700/30 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-xl md:p-8"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            {/* Title */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20 text-violet-400 border border-violet-500/30">
                <Info size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-wide">How to Air Draw</h2>
                <p className="text-xs text-slate-400">Master the gesture control language</p>
              </div>
            </div>

            {/* Gestures List */}
            <div className="space-y-4 mb-6">
              {/* Draw Gesture */}
              <div className="flex items-start gap-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 transition-colors hover:bg-emerald-500/10">
                <div className="text-3xl select-none mt-1">☝️</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-emerald-400 text-sm md:text-base">Draw Mode</h3>
                    <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <p className="text-xs md:text-sm text-slate-300 mt-1 leading-relaxed">
                    Extend your <strong>index finger</strong> upwards and fold all other fingers. Move it in the air to paint.
                  </p>
                </div>
              </div>

              {/* Hover/Move Gesture */}
              <div className="flex items-start gap-4 rounded-xl border border-sky-500/20 bg-sky-500/5 p-4 transition-colors hover:bg-sky-500/10">
                <div className="text-3xl select-none mt-1">✌️</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sky-400 text-sm md:text-base">Hover & Position</h3>
                    <span className="flex h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
                  </div>
                  <p className="text-xs md:text-sm text-slate-300 mt-1 leading-relaxed">
                    Extend both your <strong>index and middle fingers</strong> (peace sign). Move them around to position the brush pointer without painting.
                  </p>
                </div>
              </div>

              {/* Pause / Guide Gesture */}
              <div className="flex items-start gap-4 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 transition-colors hover:bg-violet-500/10">
                <div className="text-3xl select-none mt-1">🖐️</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-violet-400 text-sm md:text-base">Pause Tracking</h3>
                  </div>
                  <p className="text-xs md:text-sm text-slate-300 mt-1 leading-relaxed">
                    Show your <strong>open hand</strong> to temporarily pause tracking and hide the cursor.
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Tips */}
            <div className="rounded-lg bg-slate-950/40 border border-slate-800 p-3 text-xs text-slate-400 leading-relaxed">
              <span className="text-amber-400 font-medium">Tip:</span> Ensure you have decent lighting, and keep your hand fully within the camera frame. Keep your movements smooth for zero-latency, high-precision curve generation.
            </div>

            {/* Let's Go Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="mt-6 w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:from-violet-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all"
            >
              Start Air Drawing
            </motion.button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
