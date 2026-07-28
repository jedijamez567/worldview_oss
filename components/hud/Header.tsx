"use client";

export default function Header() {
  return (
    <div className="panel-section">
      <h1 className="text-base font-mono font-bold tracking-[0.25em] text-green-400 leading-none hud-glow">
        Awesome Worldview OSS
      </h1>
      <span className="text-[7px] font-mono text-green-600/60 tracking-[0.2em] mt-0.5 block">
        NO PUBLICATION AGREED
      </span>
      <div className="mt-2 space-y-0.5">
        <div className="text-[8px] font-mono text-green-500/50">
          ANTI-SIAM EPS-0117
        </div>
        <div className="text-[8px] font-mono text-amber-500/70 font-bold">
          NV0
        </div>
      </div>
    </div>
  );
}
