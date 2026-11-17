// Küçük, bağımlılıksız konfeti. Hareket azaltma tercihi varsa hiç çalışmaz.
const RENKLER = ["#f29a45", "#ffd27a", "#e0602a", "#4cc38a", "#5b6ad0", "#b0418a", "#3f8fd2"];

export function konfeti(adet = 140, sure = 2200) {
  if (typeof window === "undefined" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const c = document.createElement("canvas");
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  c.width = innerWidth * dpr;
  c.height = innerHeight * dpr;
  Object.assign(c.style, { position: "fixed", inset: "0", width: "100%", height: "100%", pointerEvents: "none", zIndex: "50" });
  document.body.appendChild(c);
  const g = c.getContext("2d")!;
  g.scale(dpr, dpr);
  const parcalar = Array.from({ length: adet }, () => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * innerWidth * 0.3,
    y: innerHeight * 0.35,
    vx: (Math.random() - 0.5) * 13,
    vy: -Math.random() * 13 - 4,
    a: Math.random() * Math.PI,
    va: (Math.random() - 0.5) * 0.3,
    w: 6 + Math.random() * 6,
    h: 8 + Math.random() * 8,
    renk: RENKLER[Math.floor(Math.random() * RENKLER.length)],
  }));
  const bas = performance.now();
  const kare = (t: number) => {
    const gecen = t - bas;
    g.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of parcalar) {
      p.vy += 0.35;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.a += p.va;
      g.save();
      g.globalAlpha = Math.max(0, 1 - gecen / sure);
      g.translate(p.x, p.y);
      g.rotate(p.a);
      g.fillStyle = p.renk;
      g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.a * 2)));
      g.restore();
    }
    if (gecen < sure) requestAnimationFrame(kare);
    else c.remove();
  };
  requestAnimationFrame(kare);
}
