// Aralıklı tekrar: her kart için bir "kararlılık" (s, gün) tutulur.
// Hatırlama olasılığı R(t) = 0.9^(t / s) — t gün sonra.
// t = s olduğunda R %90'a iner ve kart tekrar zamanı gelmiş sayılır.
import type { KartDurum } from "./types";

const GUN = 86_400_000;

export const HEDEF_R = 0.9;

export function hatirlama(d: KartDurum | undefined, simdi = Date.now()): number {
  if (!d) return 0;
  const t = Math.max(0, simdi - d.l) / GUN;
  return Math.pow(HEDEF_R, t / Math.max(d.s, 0.01));
}

export function vadesi(d: KartDurum): number {
  return d.l + d.s * GUN;
}

export function vadesiGeldi(d: KartDurum | undefined, simdi = Date.now()): boolean {
  return !!d && vadesi(d) <= simdi;
}

/**
 * Cevaptan sonra kartın yeni durumu.
 * Doğru: kararlılık büyür — unutmaya yakınken hatırlamak daha çok büyütür.
 * Yanlış: kararlılık sert düşer, kart kısa sürede tekrar gelir.
 */
export type Kalite = "yanlis" | "tahmin" | "dogru";

export function guncelle(d: KartDurum | undefined, sonuc: boolean | Kalite, simdi = Date.now()): KartDurum {
  const kalite: Kalite = sonuc === true ? "dogru" : sonuc === false ? "yanlis" : sonuc;
  const dogru = kalite !== "yanlis";
  if (kalite === "tahmin") {
    // Doğru ama tahminle: bilgi henüz oturmamış, yakında tekrar gelsin
    if (!d) return { s: 0.5, l: simdi, ok: 1, no: 0 };
    return { s: Math.max(0.5, Math.min(d.s * 1.2, d.s + 1)), l: simdi, ok: d.ok + 1, no: d.no };
  }
  if (!d) {
    return dogru ? { s: 1, l: simdi, ok: 1, no: 0 } : { s: 0.25, l: simdi, ok: 0, no: 1 };
  }
  const r = hatirlama(d, simdi);
  if (dogru) {
    // R düşükken (zor hatırlanan) büyüme daha fazla; aynı gün tekrarında çok az.
    // R=0.9 (tam vaktinde) → ×2.2, R=0.5 (gecikmiş) → ×3.6, R≈1 (aynı gün) → ~×1.2
    const carpan = (r > 0.97 ? 1 : 1.3) + 3.5 * Math.pow(1 - r, 0.6);
    const s = Math.min(365, Math.max(d.s * carpan, d.s + 0.5));
    return { s, l: simdi, ok: d.ok + 1, no: d.no };
  }
  return { s: Math.max(0.2, d.s * 0.3), l: simdi, ok: d.ok, no: d.no + 1 };
}

/** Kartın ne kadar oturduğu: 0 yeni, 1 öğreniliyor, 2 pekişiyor, 3 kalıcı */
export function seviye(d: KartDurum | undefined): 0 | 1 | 2 | 3 {
  if (!d) return 0;
  if (d.s < 3) return 1;
  if (d.s < 21) return 2;
  return 3;
}

export function sureMetni(gun: number): string {
  if (gun < 1 / 24) return "birazdan";
  if (gun < 1) return `${Math.round(gun * 24)} saat`;
  if (gun < 30) return `${Math.round(gun)} gün`;
  if (gun < 365) return `${Math.round(gun / 30)} ay`;
  return "1 yıl+";
}
