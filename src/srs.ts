// Aralıklı tekrar: FSRS (Free Spaced Repetition Scheduler, ts-fsrs).
// Her kart için kararlılık (s, gün) ve zorluk (d, 1–10) tutulur.
// Kararlılık: hatırlama olasılığının %90'a düştüğü süre. FSRS'in tanımı da budur; bu sayede
// eski (kendi yazdığımız) modelden gelen kayıtlar zorluk = 5 kabul edilerek doğrudan kullanılabilir.
import { createEmptyCard, forgetting_curve, fsrs, generatorParameters, Rating, State, type Card, type Grade } from "ts-fsrs";
import type { KartDurum } from "./types";

const GUN = 86_400_000;

export const HEDEF_R = 0.9;

const PARAMETRELER = generatorParameters({
  request_retention: HEDEF_R,
  maximum_interval: 365,
  enable_fuzz: false,
  enable_short_term: false, // oturum içi tekrarları uygulama kendisi yönetiyor
});
const zamanlayici = fsrs(PARAMETRELER);

/** Bilgi hiç görülmemişse 0; aksi hâlde şu anki hatırlama olasılığı */
export function hatirlama(d: KartDurum | undefined, simdi = Date.now()): number {
  if (!d) return 0;
  const t = Math.max(0, simdi - d.l) / GUN;
  return forgetting_curve(PARAMETRELER.w, t, Math.max(d.s, 0.01));
}

export function vadesi(d: KartDurum): number {
  return d.v ?? d.l + d.s * GUN;
}

export function vadesiGeldi(d: KartDurum | undefined, simdi = Date.now()): boolean {
  return !!d && vadesi(d) <= simdi;
}

/**
 * yanlis: bilemedi · tahmin: doğru ama şansla · dogru: bildi · kolay: hiç zorlanmadan bildi (ön testte bilinen bilgi)
 */
export type Kalite = "yanlis" | "tahmin" | "dogru" | "kolay";

const PUAN: Record<Kalite, Grade> = {
  yanlis: Rating.Again,
  tahmin: Rating.Hard,
  dogru: Rating.Good,
  kolay: Rating.Easy,
};

function fsrsKarti(d: KartDurum | undefined, simdi: Date): Card {
  if (!d) return createEmptyCard(simdi);
  return {
    due: new Date(vadesi(d)),
    stability: Math.max(d.s, 0.01),
    difficulty: d.d ?? 5,
    elapsed_days: 0,
    scheduled_days: Math.max(0, Math.round(d.s)),
    reps: d.ok + d.no,
    lapses: d.no,
    learning_steps: 0,
    state: State.Review,
    last_review: new Date(d.l),
  };
}

/** Cevaptan sonra kartın yeni durumu */
export function guncelle(d: KartDurum | undefined, sonuc: boolean | Kalite, simdi = Date.now()): KartDurum {
  const kalite: Kalite = sonuc === true ? "dogru" : sonuc === false ? "yanlis" : sonuc;
  const an = new Date(simdi);
  const { card } = zamanlayici.next(fsrsKarti(d, an), an, PUAN[kalite]);
  const dogru = kalite !== "yanlis";
  return {
    s: card.stability,
    d: card.difficulty,
    l: simdi,
    v: card.due.getTime(),
    ok: (d?.ok ?? 0) + (dogru ? 1 : 0),
    no: (d?.no ?? 0) + (dogru ? 0 : 1),
  };
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
  if (gun < 0.9) return `${Math.max(1, Math.round(gun * 24))} saat`;
  if (gun < 30) return `${Math.round(gun)} gün`;
  if (gun < 365) return `${Math.round(gun / 30)} ay`;
  return "1 yıl+";
}

/** Bir sonraki tekrara kalan süre (gün) */
export function sonrakiTekrarGun(d: KartDurum, simdi = Date.now()): number {
  return Math.max(0, (vadesi(d) - simdi) / GUN);
}
