import type { Dizin } from "./content";
import type { DersKey, Ilerleme, KartRef, Konu } from "./types";
import { hatirlama, vadesiGeldi } from "./srs";

export type OturumTipi =
  | { tip: "konu"; konuId: string }
  | { tip: "tekrar"; ders?: DersKey }
  | { tip: "karisik"; ders?: DersKey };

const KONU_KART = 10;
const TEKRAR_KART = 15;
const KARISIK_KART = 12;

export function karistir<T>(dizi: T[]): T[] {
  const a = [...dizi];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function seciliDersler(d: Dizin, p: Ilerleme, ders?: DersKey): Set<DersKey> {
  if (ders) return new Set([ders]);
  return new Set(p.ayarlar.dersler.length ? p.ayarlar.dersler : d.dersler);
}

export function vadeliKartlar(d: Dizin, p: Ilerleme, ders?: DersKey): KartRef[] {
  const dersler = seciliDersler(d, p, ders);
  const simdi = Date.now();
  const liste: KartRef[] = [];
  for (const [uid, durum] of Object.entries(p.kartlar)) {
    const ref = d.kartlar.get(uid);
    if (ref && dersler.has(ref.kitap.ders) && vadesiGeldi(durum, simdi)) liste.push(ref);
  }
  return liste.sort((a, b) => hatirlama(p.kartlar[a.uid], simdi) - hatirlama(p.kartlar[b.uid], simdi));
}

export function oturumKartlari(d: Dizin, p: Ilerleme, o: OturumTipi): KartRef[] {
  if (o.tip === "konu") {
    const konu = d.konular.get(o.konuId);
    if (!konu) return [];
    const yeni = konu.kartlar.filter((k) => !p.kartlar[k.uid]);
    const eski = konu.kartlar
      .filter((k) => p.kartlar[k.uid])
      .sort((a, b) => hatirlama(p.kartlar[a.uid]) - hatirlama(p.kartlar[b.uid]));
    // Yeni kartlar kitap sırasıyla gelsin; araya en zayıf eski kartlardan birkaç tane karışsın
    const secilen = yeni.slice(0, yeni.length && eski.length ? KONU_KART - 2 : KONU_KART);
    const tekrar = eski.slice(0, KONU_KART - secilen.length);
    return araya(secilen, tekrar);
  }
  if (o.tip === "tekrar") return karistir(vadeliKartlar(d, p, o.ders).slice(0, TEKRAR_KART));

  const dersler = seciliDersler(d, p, o.ders);
  const havuz = [...d.kartlar.values()].filter((k) => dersler.has(k.kitap.ders));
  const gorulen = havuz.filter((k) => p.kartlar[k.uid]);
  return karistir(gorulen.length >= 6 ? gorulen : havuz).slice(0, KARISIK_KART);
}

/** b'deki elemanları a'nın arasına eşit aralıklarla yerleştirir */
function araya<T>(a: T[], b: T[]): T[] {
  if (!a.length) return karistir(b);
  const sonuc = [...a];
  b.forEach((x, i) => {
    const yer = Math.min(sonuc.length, Math.round(((i + 1) * sonuc.length) / (b.length + 1)) + i);
    sonuc.splice(yer, 0, x);
  });
  return sonuc;
}

// ---- özet istatistikler ----

export interface Ozet {
  toplam: number;
  gorulen: number;
  /** 0-1: tüm kartların ortalama hatırlama olasılığı (görülmeyen = 0) */
  hafiza: number;
  vadeli: number;
}

export function kartlarOzet(kartlar: KartRef[], p: Ilerleme, simdi = Date.now()): Ozet {
  let gorulen = 0;
  let r = 0;
  let vadeli = 0;
  for (const k of kartlar) {
    const durum = p.kartlar[k.uid];
    if (!durum) continue;
    gorulen++;
    r += hatirlama(durum, simdi);
    if (vadesiGeldi(durum, simdi)) vadeli++;
  }
  return { toplam: kartlar.length, gorulen, hafiza: kartlar.length ? r / kartlar.length : 0, vadeli };
}

export function konuOzet(konu: Konu, p: Ilerleme): Ozet {
  return kartlarOzet(konu.kartlar, p);
}

export function dersKartlari(d: Dizin, ders: DersKey): KartRef[] {
  return [...d.kartlar.values()].filter((k) => k.kitap.ders === ders);
}

/** Sıradaki çalışılacak konu: son çalışılan kitapta yarım kalan ya da ilk başlanmamış konu */
export function siradakiKonu(d: Dizin, p: Ilerleme, ders?: DersKey): Konu | undefined {
  const dersler = seciliDersler(d, p, ders);
  const tumu = [...d.konular.values()].filter((k) => dersler.has(k.kitap.ders));
  const son = p.sonKonu ? d.konular.get(p.sonKonu) : undefined;
  const yarim = (k: Konu) => k.kartlar.some((c) => !p.kartlar[c.uid]);
  if (son && dersler.has(son.kitap.ders)) {
    if (yarim(son)) return son;
    const ayniKitap = d.konularByKitap.get(son.kitap.kitap) ?? [];
    const sonraki = ayniKitap.slice(ayniKitap.indexOf(son) + 1).find(yarim);
    if (sonraki) return sonraki;
  }
  return tumu.find(yarim);
}
