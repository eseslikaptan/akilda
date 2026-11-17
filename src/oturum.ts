import type { Dizin } from "./content";
import type { Ilerleme, KartRef, Konu, Kurs } from "./types";
import { hatirlama, vadesiGeldi } from "./srs";
import { alanBilgi, alandaMi } from "./kurslar";

export type OturumTipi =
  | { tip: "konu"; konuId: string }
  | { tip: "tekrar"; kurs?: string }
  | { tip: "karisik"; kurs?: string }
  | { tip: "cikmis"; kurs?: string };

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

/** Kullanıcının alanına göre çalıştığı YKS dersleri (ya da tek bir ders) */
export function aktifKurslar(d: Dizin, p: Ilerleme, kursId?: string): Kurs[] {
  if (kursId) {
    const k = d.kurs.get(kursId);
    return k ? [k] : [];
  }
  const alan = alanBilgi(p.ayarlar.alan);
  return d.kurslar.filter((k) => alandaMi(alan, k.sinav, k.ders));
}

function aktifKitaplar(d: Dizin, p: Ilerleme, kursId?: string): Set<string> {
  return new Set(aktifKurslar(d, p, kursId).flatMap((k) => k.kitaplar.map((b) => b.kitap)));
}

export function vadeliKartlar(d: Dizin, p: Ilerleme, kursId?: string): KartRef[] {
  const kitaplar = aktifKitaplar(d, p, kursId);
  const simdi = Date.now();
  const liste: KartRef[] = [];
  for (const [uid, durum] of Object.entries(p.kartlar)) {
    const ref = d.kartlar.get(uid);
    if (ref && kitaplar.has(ref.kitap.kitap) && vadesiGeldi(durum, simdi)) liste.push(ref);
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
  if (o.tip === "tekrar") return karistir(vadeliKartlar(d, p, o.kurs).slice(0, TEKRAR_KART));

  if (o.tip === "cikmis") {
    // ÖSYM'de çıkan bilgiler: önce hiç görülmeyenler ya da zayıflar, en çok soru çıkan başlıklardan
    const havuz = aktifKurslar(d, p, o.kurs)
      .flatMap((k) => k.cikmis)
      .sort((a, b) => (b.soruSayisi ?? 0) - (a.soruSayisi ?? 0))
      .flatMap((k) => k.kartlar);
    const yeni = havuz.filter((k) => !p.kartlar[k.uid]);
    const zayif = havuz.filter((k) => p.kartlar[k.uid]).sort((a, b) => hatirlama(p.kartlar[a.uid]) - hatirlama(p.kartlar[b.uid]));
    return karistir([...karistir(yeni.slice(0, 40)).slice(0, 8), ...zayif.slice(0, 4)]).slice(0, KARISIK_KART);
  }

  const havuz = aktifKurslar(d, p, o.kurs).flatMap((k) => k.kartlar);
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

/** Sıradaki çalışılacak konu: son çalışılan derste yarım kalan ya da ilk başlanmamış konu */
export function siradakiKonu(d: Dizin, p: Ilerleme, kursId?: string): Konu | undefined {
  const kurslar = aktifKurslar(d, p, kursId);
  const yarim = (k: Konu) => k.kartlar.some((c) => !p.kartlar[c.uid]);
  const son = p.sonKonu ? d.konular.get(p.sonKonu) : undefined;
  const sonKurs = son ? kurslar.find((k) => k.id === son.kursId) : undefined;
  if (son && sonKurs) {
    const sonraki = sonKurs.konular.slice(sonKurs.konular.indexOf(son)).find(yarim);
    if (sonraki) return sonraki;
  }
  for (const k of kurslar) {
    const ilk = k.konular.find(yarim);
    if (ilk) return ilk;
  }
  return undefined;
}
