"use client";

import dynamic from "next/dynamic";

const AirDrawApp = dynamic(() => import("@/components/AirDrawApp"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 text-slate-200">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 mb-4 animate-spin">
        <span className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
      <h2 className="text-sm font-semibold tracking-wider uppercase opacity-80">Loading Air Draw Studio...</h2>
    </div>
  ),
});

export default function Home() {
  return <AirDrawApp />;
}
