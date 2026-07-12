"use client";

import React, { useRef } from "react";
import { motion } from "framer-motion";
import { Paintbrush, Eraser, Trash2, Download, HelpCircle, ChevronDown } from "lucide-react";

interface ControlRibbonProps {
  color: string;
  setColor: (color: string) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  isEraser: boolean;
  setIsEraser: (isEraser: boolean) => void;
  onClear: () => void;
  onDownload: () => void;
  onOpenHelp: () => void;
}

const PRESET_COLORS = [
  { name: "Red", value: "#ef4444" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#22c55e" },
  { name: "Yellow", value: "#eab308" },
  { name: "White", value: "#ffffff" },
];

export default function ControlRibbon({
  color,
  setColor,
  brushSize,
  setBrushSize,
  isEraser,
  setIsEraser,
  onClear,
  onDownload,
  onOpenHelp,
}: ControlRibbonProps) {
  const customColorInputRef = useRef<HTMLInputElement>(null);

  // Check if current color is one of the presets
  const isPreset = PRESET_COLORS.some((c) => c.value.toLowerCase() === color.toLowerCase());

  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-4xl px-4 md:px-0"
    >
      <div className="relative overflow-hidden rounded-2xl border border-slate-700/30 bg-slate-900/50 p-4 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
        
        {/* Colors Panel */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase select-none">
            Palette
          </span>
          <div className="flex items-center gap-2">
            {PRESET_COLORS.map((preset) => {
              const active = preset.value.toLowerCase() === color.toLowerCase() && !isEraser;
              return (
                <button
                  key={preset.value}
                  onClick={() => {
                    setColor(preset.value);
                    setIsEraser(false);
                  }}
                  className="relative group flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-110 active:scale-95 focus:outline-none"
                  style={{ backgroundColor: preset.value }}
                  title={preset.name}
                >
                  {active && (
                    <span className="absolute inset-0 rounded-full border-2 border-slate-900 scale-75 dark:border-slate-800" />
                  )}
                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 rounded bg-slate-950 px-1.5 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    {preset.name}
                  </span>
                </button>
              );
            })}

            {/* Custom Color Selector */}
            <div className="relative group flex items-center">
              <button
                onClick={() => customColorInputRef.current?.click()}
                className="relative flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 hover:scale-110 active:scale-95 transition-transform overflow-hidden"
                title="Custom Color"
              >
                {!isPreset && !isEraser && (
                  <span
                    className="absolute inset-1 rounded-full border-2 border-slate-900 dark:border-slate-800"
                    style={{ backgroundColor: color }}
                  />
                )}
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 rounded bg-slate-950 px-1.5 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  Custom
                </span>
              </button>
              <input
                ref={customColorInputRef}
                type="color"
                value={isPreset ? "#8b5cf6" : color}
                onChange={(e) => {
                  setColor(e.target.value);
                  setIsEraser(false);
                }}
                className="absolute inset-0 opacity-0 w-0 h-0 pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="hidden md:block h-8 w-px bg-slate-800" />

        {/* Brush Size Panel */}
        <div className="flex items-center gap-3 w-full md:w-auto flex-1 max-w-sm">
          <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase select-none whitespace-nowrap">
            Size
          </span>
          <div className="flex items-center gap-3 w-full">
            <input
              type="range"
              min="1"
              max="50"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-violet-500 focus:outline-none"
            />
            {/* Live brush indicator */}
            <div className="flex items-center justify-center min-w-[32px] h-8 w-8 rounded bg-slate-950/45 border border-slate-850">
              <span
                className="rounded-full transition-all duration-75"
                style={{
                  width: `${Math.max(2, brushSize)}px`,
                  height: `${Math.max(2, brushSize)}px`,
                  backgroundColor: isEraser ? "#ffffff" : color,
                  opacity: isEraser ? 0.3 : 1,
                  boxShadow: isEraser ? "none" : `0 0 8px ${color}80`,
                }}
              />
            </div>
            <span className="text-xs text-slate-400 font-mono w-6 text-right">
              {brushSize}px
            </span>
          </div>
        </div>

        {/* Separator */}
        <div className="hidden md:block h-8 w-px bg-slate-800" />

        {/* Actions Panel */}
        <div className="flex items-center gap-2">
          {/* Brush/Eraser Toggle */}
          <button
            onClick={() => setIsEraser(!isEraser)}
            className={`group relative p-2.5 rounded-xl border transition-all ${
              !isEraser
                ? "bg-violet-500/20 text-violet-400 border-violet-500/30 shadow-inner"
                : "bg-slate-850 text-slate-400 border-slate-700/30 hover:text-white"
            }`}
            title="Brush Mode"
          >
            <Paintbrush size={18} />
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 rounded bg-slate-950 px-1.5 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              Brush
            </span>
          </button>

          <button
            onClick={() => setIsEraser(!isEraser)}
            className={`group relative p-2.5 rounded-xl border transition-all ${
              isEraser
                ? "bg-violet-500/20 text-violet-400 border-violet-500/30 shadow-inner"
                : "bg-slate-850 text-slate-400 border-slate-700/30 hover:text-white"
            }`}
            title="Eraser Mode"
          >
            <Eraser size={18} />
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 rounded bg-slate-950 px-1.5 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              Eraser
            </span>
          </button>

          {/* Clear Canvas */}
          <button
            onClick={onClear}
            className="group relative p-2.5 rounded-xl border border-slate-700/30 bg-slate-850 text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Clear Canvas"
          >
            <Trash2 size={18} />
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 rounded bg-slate-950 px-1.5 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              Clear
            </span>
          </button>

          {/* Download Drawing */}
          <button
            onClick={onDownload}
            className="group relative p-2.5 rounded-xl border border-slate-700/30 bg-slate-850 text-emerald-400 hover:bg-emerald-500/10 transition-colors"
            title="Download Drawing"
          >
            <Download size={18} />
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 rounded bg-slate-950 px-1.5 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              Save PNG
            </span>
          </button>

          {/* Info Button */}
          <button
            onClick={onOpenHelp}
            className="group relative p-2.5 rounded-xl border border-slate-700/30 bg-slate-850 text-slate-400 hover:text-white transition-colors"
            title="Help / Gestures"
          >
            <HelpCircle size={18} />
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 rounded bg-slate-950 px-1.5 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 font-medium">
              Instructions
            </span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
