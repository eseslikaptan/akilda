import type { CSSProperties, ReactNode } from "react";

export function Ikon({ d, boyut = 22, kalin = 1.8, className }: { d: string; boyut?: number; kalin?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={boyut}
      height={boyut}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={kalin}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

export const IKON = {
  ev: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z",
  kitap: "M4 19.5V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zm0 0A2 2 0 0 0 6 21h13",
  tekrar: "M3 12a9 9 0 0 1 15.5-6.2L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.2L3 16m0 5v-5h5",
  profil: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  geri: "M15 18l-6-6 6-6",
  ileri: "M9 18l6-6-6-6",
  kapat: "M18 6 6 18M6 6l12 12",
  tik: "M20 6 9 17l-5-5",
  alev: "M12 22c4 0 7-3 7-7 0-3-2-5.5-3.5-7-.4 2-1.5 3-2.5 3 .5-3-1-6.5-4-8 0 3-2 5-3.5 7A7.6 7.6 0 0 0 5 15c0 4 3 7 7 7z",
  yildiz: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z",
  dis: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
  karisik: "M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5",
  liste: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  kilit: "M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4",
  beyin: "M9 4a3 3 0 0 0-3 3v.2A3 3 0 0 0 4 10a3 3 0 0 0 1 2.2A3 3 0 0 0 6 17a3 3 0 0 0 3 3 3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zM15 4a3 3 0 0 1 3 3v.2a3 3 0 0 1 2 2.8 3 3 0 0 1-1 2.2 3 3 0 0 1-1 4.8 3 3 0 0 1-3 3 3 3 0 0 1-3-3",
  hedef: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01",
  ayar: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
};

export function Halka({
  oran,
  boyut = 64,
  kalinlik = 7,
  children,
  renk = "var(--accent)",
}: {
  oran: number;
  boyut?: number;
  kalinlik?: number;
  children?: ReactNode;
  renk?: string;
}) {
  const r = (boyut - kalinlik) / 2;
  const c = 2 * Math.PI * r;
  const o = Math.max(0, Math.min(1, oran));
  return (
    <div className="halka" style={{ width: boyut, height: boyut }}>
      <svg width={boyut} height={boyut} aria-hidden="true">
        <circle cx={boyut / 2} cy={boyut / 2} r={r} stroke="var(--line)" strokeWidth={kalinlik} fill="none" />
        <circle
          cx={boyut / 2}
          cy={boyut / 2}
          r={r}
          stroke={renk}
          strokeWidth={kalinlik}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - o)}
          transform={`rotate(-90 ${boyut / 2} ${boyut / 2})`}
          style={{ transition: "stroke-dashoffset .6s ease" }}
        />
      </svg>
      <div className="halka-ic">{children}</div>
    </div>
  );
}

/** Hafıza çubuğu: dolu kısım hatırlama gücü, açık kısım görülen ama zayıflayan */
export function HafizaCubugu({ hafiza, gorulen, toplam }: { hafiza: number; gorulen: number; toplam: number }) {
  const g = toplam ? gorulen / toplam : 0;
  return (
    <div
      className="hafiza-cubugu"
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(hafiza * 100)}
      aria-label="Hafıza gücü"
    >
      <span className="hc-gorulen" style={{ width: `${g * 100}%` }} />
      <span className="hc-hafiza" style={{ width: `${hafiza * 100}%` }} />
    </div>
  );
}

export function DersRozeti({ hue, ikon, boyut = 44 }: { hue: number; ikon: string; boyut?: number }) {
  return (
    <span className="ders-rozet" style={{ "--hue": hue, width: boyut, height: boyut } as CSSProperties}>
      <Ikon d={ikon} boyut={boyut * 0.5} />
    </span>
  );
}

export function UstBar({ baslik, onGeri, sag }: { baslik?: ReactNode; onGeri?: () => void; sag?: ReactNode }) {
  return (
    <header className="ust-bar">
      {onGeri ? (
        <button className="ikon-dugme" onClick={onGeri} aria-label="Geri">
          <Ikon d={IKON.geri} />
        </button>
      ) : (
        <span />
      )}
      <div className="ust-bar-baslik">{baslik}</div>
      <div className="ust-bar-sag">{sag}</div>
    </header>
  );
}

export function yuzde(x: number) {
  return `%${Math.round(x * 100)}`;
}
