"use client";

import dynamic from "next/dynamic";
import Header from "@/components/hud/Header";
import Sidebar from "@/components/hud/Sidebar";
import BottomBar from "@/components/hud/BottomBar";
import InfoPanel from "@/components/hud/InfoPanel";
import ViewModeFilter, { FlirFilterDefs } from "@/components/effects/ViewModeFilter";
import CameraModal from "@/components/ui/Modal";
import MediaModal from "@/components/ui/MediaModal";
import SearchBar from "@/components/hud/SearchBar";
import LandmarkNav from "@/components/hud/LandmarkNav";
import AgentPanel from "@/components/hud/AgentPanel";
import CameraList from "@/components/hud/CameraList";
import ScopeOverlay from "@/components/hud/ScopeOverlay";
import DataFeed from "@/components/hud/DataFeed";
import TimelineSlider from "@/components/hud/TimelineSlider";
import MissionControlModal from "@/components/mission-control/MissionControlModal";
import VoiceGlowOverlay from "@/components/effects/VoiceGlowOverlay";

// CesiumJS must be loaded client-side only (no SSR)
const Globe = dynamic(() => import("@/components/Globe"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#000a00]">
      <div className="flex flex-col items-center gap-4">
        <div className="text-green-500 font-mono text-lg tracking-[0.3em] hud-glow animate-pulse">
          Awesome Worldview OSS
        </div>
        <div className="text-green-700/50 font-mono text-[10px] tracking-widest">
          INITIALIZING SYSTEMS...
        </div>
        <div className="w-48 h-0.5 bg-green-900/30 overflow-hidden">
          <div className="h-full bg-green-500/50 animate-[loading_2s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  ),
});

export default function Dashboard() {
  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-[#000a00]">
      {/* Top Classification Banner */}
      <div className="w-full bg-[#1a0000]/80 border-b border-red-900/50 text-center py-0.5 flex-shrink-0 z-20">
        <span className="text-[10px] tracking-[0.3em] text-red-500/80 font-mono">
          TOP SECRET // SI // TK // NOFORN
        </span>
      </div>

      {/* 3-Column Layout */}
      <div className="flex flex-1 min-h-0">
        {/* LEFT PANEL - Controls */}
        <div className="w-[220px] flex-shrink-0 bg-[#000a00] border-r border-green-900/20 flex flex-col overflow-hidden z-10 panel-left">
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <Header />
            <SearchBar />
            <Sidebar />
            <CameraList />
            <LandmarkNav />
            <AgentPanel />
          </div>
          <BottomBar />
        </div>

        {/* CENTER - Globe in circular viewport */}
        <div className="flex-1 flex flex-col items-center justify-center bg-[#000a00] relative min-w-0">
          <div className="scope-container">
            <div className="scope-viewport">
              <Globe />
              <ViewModeFilter />
            </div>
            <ScopeOverlay />
          </div>
        </div>

        {/* RIGHT PANEL - Data Display */}
        <div className="w-[280px] flex-shrink-0 bg-[#000a00] border-l border-green-900/20 flex flex-col overflow-y-auto overflow-x-hidden z-10 panel-right">
          <InfoPanel />
          <DataFeed />
        </div>
      </div>

      {/* Timeline Command Bar (full-width) */}
      <TimelineSlider />

      {/* Bottom Classification Banner */}
      <div className="w-full bg-[#1a0000]/80 border-t border-red-900/50 text-center py-0.5 flex-shrink-0 z-20">
        <span className="text-[10px] tracking-[0.3em] text-red-500/80 font-mono">
          TOP SECRET // SI // TK // NOFORN
        </span>
      </div>

      {/* SVG filter definitions (must be outside overflow:hidden containers) */}
      <FlirFilterDefs />

      {/* Camera Feed Modal */}
      <CameraModal />

      {/* YouTube Live Stream Modal */}
      <MediaModal />

      {/* Mission Control Modal */}
      <MissionControlModal />

      {/* Voice Assistant glow overlay (recording state) */}
      <VoiceGlowOverlay />
    </div>
  );
}
