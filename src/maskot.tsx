// Kıvılcım: Akılda'nın maskotu. Bilgi kıvılcımı; doğru cevapta parlar, yanlışta moral verir.
export type Duygu = "mutlu" | "coskulu" | "uzgun" | "dusunceli" | "selam" | "uykulu";

export function Kivilcim({ duygu = "mutlu", boyut = 72, className = "" }: { duygu?: Duygu; boyut?: number; className?: string }) {
  const goz = (x: number) => {
    if (duygu === "coskulu") return <path d={`M${x - 5} 66 q5 -6 10 0`} stroke="#2a1a12" strokeWidth="3.4" fill="none" strokeLinecap="round" />;
    if (duygu === "uykulu") return <path d={`M${x - 5} 66 q5 4 10 0`} stroke="#2a1a12" strokeWidth="3" fill="none" strokeLinecap="round" />;
    const bakis = duygu === "dusunceli" ? -3 : 0;
    return (
      <g>
        <ellipse cx={x} cy={65} rx={5.2} ry={duygu === "uzgun" ? 5.6 : 6.4} fill="#2a1a12" />
        <circle cx={x + 1.6} cy={62 + bakis} r={1.9} fill="#fff" />
      </g>
    );
  };
  const agiz = {
    mutlu: <path d="M42 78 q8 8 16 0" stroke="#2a1a12" strokeWidth="3.2" fill="none" strokeLinecap="round" />,
    coskulu: <path d="M40 76 q10 14 20 0 z" fill="#2a1a12" />,
    uzgun: <path d="M43 82 q7 -6 14 0" stroke="#2a1a12" strokeWidth="3" fill="none" strokeLinecap="round" />,
    dusunceli: <path d="M45 80 h10" stroke="#2a1a12" strokeWidth="3" strokeLinecap="round" />,
    selam: <path d="M41 77 q9 11 18 0" stroke="#2a1a12" strokeWidth="3.2" fill="#c2412d" strokeLinecap="round" />,
    uykulu: <ellipse cx="50" cy="80" rx="3" ry="3.6" fill="#2a1a12" />,
  }[duygu];

  return (
    <svg
      className={`kivilcim ${duygu} ${className}`}
      width={boyut}
      height={boyut * 1.1}
      viewBox="0 0 100 110"
      role="img"
      aria-label="Kıvılcım"
    >
      <defs>
        <radialGradient id="kv-govde" cx="45%" cy="62%" r="62%">
          <stop offset="0" stopColor="#ffd27a" />
          <stop offset=".55" stopColor="#f6a03c" />
          <stop offset="1" stopColor="#e0602a" />
        </radialGradient>
        <linearGradient id="kv-ic" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff3c4" stopOpacity=".9" />
          <stop offset="1" stopColor="#ffd27a" stopOpacity=".2" />
        </linearGradient>
      </defs>
      {duygu === "coskulu" && (
        <g className="kv-isiltilar" fill="#ffc94d">
          <path d="M10 30l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" />
          <path d="M88 22l2.4 5.6 5.6 2.4-5.6 2.4L88 38l-2.4-5.6L80 30l5.6-2.4z" />
          <path d="M92 70l2 4.4 4.4 2-4.4 2L92 83l-2-4.6-4.4-2 4.4-2z" />
        </g>
      )}
      <path
        className="kv-govde"
        d="M50 4c6 14 22 22 30 38 9 18 4 40-8 52-12 12-32 12-44 0C16 82 11 62 20 46c5-9 11-12 13-22 6 7 6 12 8 16 2-12 5-24 9-36z"
        fill="url(#kv-govde)"
      />
      <path d="M50 40c5 10 15 15 15 30 0 10-7 18-15 18s-15-8-15-18c0-12 9-16 15-30z" fill="url(#kv-ic)" />
      <ellipse cx="33" cy="76" rx="5" ry="3" fill="#ff7d5c" opacity=".45" />
      <ellipse cx="67" cy="76" rx="5" ry="3" fill="#ff7d5c" opacity=".45" />
      {goz(40)}
      {goz(60)}
      {duygu === "uzgun" && (
        <g stroke="#2a1a12" strokeWidth="2.4" strokeLinecap="round">
          <path d="M34 55l9-3" />
          <path d="M66 55l-9-3" />
        </g>
      )}
      {agiz}
      {duygu === "selam" && <path className="kv-el" d="M84 58c6-4 10-2 10 2s-4 8-10 8" stroke="#e0602a" strokeWidth="6" fill="none" strokeLinecap="round" />}
      {duygu === "uykulu" && (
        <text x="74" y="30" fontSize="16" fontWeight="800" fill="#8b85a0" fontFamily="sans-serif">
          z
        </text>
      )}
    </svg>
  );
}
