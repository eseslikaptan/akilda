import { useSyncExternalStore } from "react";
import type { Ayarlar, DenemeKaydi, Ilerleme, KartDurum } from "./types";
import { guncelle, type Kalite } from "./srs";

const ANAHTAR = "akilda:v1";

const BOS: Ilerleme = {
  v: 1,
  kurulum: false,
  ayarlar: { ad: "", gunlukHedef: 100, alan: "HEPSI", ses: true, yazarak: false },
  kartlar: {},
  gunler: {},
  yeniler: {},
  toplamXp: 0,
  enUzunSeri: 0,
  dondurma: { hak: 1, gunler: [] },
  denemeler: [],
  cevaplar: {},
};

function oku(): Ilerleme {
  try {
    const ham = localStorage.getItem(ANAHTAR);
    if (!ham) return structuredClone(BOS);
    const veri = JSON.parse(ham) as Ilerleme;
    return {
      ...structuredClone(BOS),
      ...veri,
      ayarlar: { ...BOS.ayarlar, ...veri.ayarlar },
      dondurma: veri.dondurma ?? structuredClone(BOS.dondurma),
    };
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

function sonrakiGun(anahtar: string): string {
  const [y, m, d] = anahtar.split("-").map(Number);
  return gunAnahtari(new Date(y, m - 1, d + 1));
}

const aktifMi = (p: Ilerleme, gun: string) => !!p.gunler[gun] || p.dondurma.gunler.includes(gun);

/** Bugün ya da dün biten ardışık çalışma günleri (dondurulan günler seriyi bozmaz) */
export function seri(p: Ilerleme, bugun = gunAnahtari()): number {
  let gun = aktifMi(p, bugun) ? bugun : oncekiGun(bugun);
  let n = 0;
  while (aktifMi(p, gun)) {
    if (p.gunler[gun]) n++;
    gun = oncekiGun(gun);
  }
  return n;
}

/** Seri bugün çalışılmazsa bozulur mu? (dün aktif, bugün henüz değil) */
export function seriTehlikede(p: Ilerleme): boolean {
  const bugun = gunAnahtari();
  return !p.gunler[bugun] && seri(p) > 0;
}

// ---- eylemler ----

export function kurulumuTamamla(ayarlar: Partial<Ayarlar>) {
  yaz({ ...durum, kurulum: true, ayarlar: { ...durum.ayarlar, ...ayarlar } });
}

export function ayarlariGuncelle(ayarlar: Partial<Ayarlar>) {
  yaz({ ...durum, ayarlar: { ...durum.ayarlar, ...ayarlar } });
}

export function cevapKaydet(uid: string, sonuc: boolean | Kalite): KartDurum {
  const onceki = durum.kartlar[uid];
  const yeni = guncelle(onceki, sonuc);
  const bugun = gunAnahtari();
  const yeniler = onceki ? durum.yeniler : { ...durum.yeniler, [bugun]: (durum.yeniler[bugun] ?? 0) + 1 };
  const [d, y] = durum.cevaplar[bugun] ?? [0, 0];
  const dogru = sonuc !== false && sonuc !== "yanlis";
  const cevaplar = { ...durum.cevaplar, [bugun]: (dogru ? [d + 1, y] : [d, y + 1]) as [number, number] };
  yaz({ ...durum, kartlar: { ...durum.kartlar, [uid]: yeni }, yeniler, cevaplar });
  return yeni;
}

/** "Tahmin ettim" gibi düzeltmeler için kartın durumunu doğrudan yaz */
export function kartDurumYaz(uid: string, d: KartDurum) {
  yaz({ ...durum, kartlar: { ...durum.kartlar, [uid]: d } });
}

export function xpEkle(xp: number, sonKonu?: string) {
  const bugun = gunAnahtari();
  let { hak, gunler: donmus } = durum.dondurma;
  const ilkBugun = !durum.gunler[bugun];
  if (ilkBugun) {
    // Bugünden önceki son aktif günden bu yana boş kalan günler varsa ve hak yetiyorsa dondur
    const oncekiler = [...Object.keys(durum.gunler), ...donmus].filter((g) => g < bugun).sort();
    const son = oncekiler[oncekiler.length - 1];
    if (son) {
      const bos: string[] = [];
      for (let g = sonrakiGun(son); g < bugun; g = sonrakiGun(g)) bos.push(g);
      if (bos.length > 0 && bos.length <= hak) {
        donmus = [...donmus, ...bos];
        hak -= bos.length;
      }
    }
  }
  const gunler = { ...durum.gunler, [bugun]: (durum.gunler[bugun] ?? 0) + xp };
  const sonraki: Ilerleme = {
    ...durum,
    gunler,
    toplamXp: durum.toplamXp + xp,
    sonKonu: sonKonu ?? durum.sonKonu,
    dondurma: { hak, gunler: donmus },
  };
  const s = seri(sonraki, bugun);
  if (ilkBugun && s > 0 && s % 7 === 0) sonraki.dondurma = { hak: Math.min(2, hak + 1), gunler: donmus };
  sonraki.enUzunSeri = Math.max(durum.enUzunSeri, s);
  yaz(sonraki);
}

export function denemeKaydet(k: DenemeKaydi) {
  yaz({ ...durum, denemeler: [...durum.denemeler, k].slice(-50) });
}

export function sonTurBaslat(baslat: boolean) {
  yaz({ ...durum, sonTur: baslat ? { baslangic: Date.now() } : undefined });
}

export function yedekAlindi() {
  yaz({ ...durum, sonYedek: Date.now() });
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
