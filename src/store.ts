import { useSyncExternalStore } from "react";
import type { Ayarlar, Ilerleme, KartDurum } from "./types";
import { guncelle } from "./srs";

const ANAHTAR = "akilda:v1";

const BOS: Ilerleme = {
  v: 1,
  kurulum: false,
  ayarlar: { ad: "", gunlukHedef: 100, dersler: [], ses: true },
  kartlar: {},
  gunler: {},
  toplamXp: 0,
  enUzunSeri: 0,
};

function oku(): Ilerleme {
  try {
    const ham = localStorage.getItem(ANAHTAR);
    if (!ham) return structuredClone(BOS);
    const veri = JSON.parse(ham) as Ilerleme;
    return { ...structuredClone(BOS), ...veri, ayarlar: { ...BOS.ayarlar, ...veri.ayarlar } };
  } catch {
    return structuredClone(BOS);
  }
}

let durum: Ilerleme = oku();
const dinleyiciler = new Set<() => void>();

function yaz(yeni: Ilerleme) {
  durum = yeni;
  try {
    localStorage.setItem(ANAHTAR, JSON.stringify(yeni));
  } catch {
    // depolama dolu / kapalı: oturum içinde çalışmaya devam et
  }
  dinleyiciler.forEach((f) => f());
}

// Başka sekmede değişirse senkron kal
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === ANAHTAR) {
      durum = oku();
      dinleyiciler.forEach((f) => f());
    }
  });
}

export function useIlerleme(): Ilerleme {
  return useSyncExternalStore(
    (f) => {
      dinleyiciler.add(f);
      return () => dinleyiciler.delete(f);
    },
    () => durum,
  );
}

export const ilerleme = () => durum;

// ---- tarih yardımcıları ----

export function gunAnahtari(t = new Date()): string {
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function oncekiGun(anahtar: string): string {
  const [y, m, d] = anahtar.split("-").map(Number);
  return gunAnahtari(new Date(y, m - 1, d - 1));
}

/** Bugün ya da dün biten ardışık çalışma günleri */
export function seri(p: Ilerleme, bugun = gunAnahtari()): number {
  let gun = p.gunler[bugun] ? bugun : oncekiGun(bugun);
  let n = 0;
  while (p.gunler[gun]) {
    n++;
    gun = oncekiGun(gun);
  }
  return n;
}

// ---- eylemler ----

export function kurulumuTamamla(ayarlar: Partial<Ayarlar>) {
  yaz({ ...durum, kurulum: true, ayarlar: { ...durum.ayarlar, ...ayarlar } });
}

export function ayarlariGuncelle(ayarlar: Partial<Ayarlar>) {
  yaz({ ...durum, ayarlar: { ...durum.ayarlar, ...ayarlar } });
}

export function cevapKaydet(uid: string, dogru: boolean): KartDurum {
  const yeni = guncelle(durum.kartlar[uid], dogru);
  yaz({ ...durum, kartlar: { ...durum.kartlar, [uid]: yeni } });
  return yeni;
}

export function xpEkle(xp: number, sonKonu?: string) {
  const bugun = gunAnahtari();
  const gunler = { ...durum.gunler, [bugun]: (durum.gunler[bugun] ?? 0) + xp };
  const sonraki = { ...durum, gunler, toplamXp: durum.toplamXp + xp, sonKonu: sonKonu ?? durum.sonKonu };
  sonraki.enUzunSeri = Math.max(durum.enUzunSeri, seri(sonraki, bugun));
  yaz(sonraki);
}

export function disaAktar(): string {
  return JSON.stringify(durum);
}

export function iceAktar(json: string) {
  const veri = JSON.parse(json) as Ilerleme;
  if (veri?.v !== 1 || typeof veri.kartlar !== "object") throw new Error("Geçersiz yedek dosyası");
  yaz({ ...structuredClone(BOS), ...veri });
}

export function sifirla() {
  yaz(structuredClone(BOS));
}
