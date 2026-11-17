import type { Dizin } from "./content";
import type { Ilerleme, KartRef, Konu, Kurs } from "./types";
import { hatirlama, vadesiGeldi } from "./srs";
import { alanBilgi, alandaMi } from "./kurslar";

export type OturumTipi =
  | { tip: "konu"; konuId: string }
  | { tip: "tekrar"; kurs?: string }
  | { tip: "karisik"; kurs?: string }
  | { tip: "cikmis"; kurs?: string }
  | { tip: "defter" }
  | { tip: "sonTur" }
  | { tip: "karisan"; setId: string }
  | { tip: "yil"; yil: string; kurs?: string; ders?: string }
  | { tip: "liste"; uids: string[] };

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

  if (o.tip === "defter") return karistir(yanlisDefteri(d, p).slice(0, KARISIK_KART));
  if (o.tip === "sonTur") return sonTurKalan(d, p).slice(0, TEKRAR_KART);
  if (o.tip === "yil") {
    // Bir yılın sınavında sorulan bilgiler: önce görülmeyenler, sonra zayıflar; ders sırası korunur
    const kartlar = yilKartlari(d, p, o.yil, o.kurs).filter((r) => !o.ders || r.kitap.ders === o.ders);
    const yeni = kartlar.filter((r) => !p.kartlar[r.uid]);
    const eski = kartlar
      .filter((r) => p.kartlar[r.uid])
      .sort((a, b) => hatirlama(p.kartlar[a.uid]) - hatirlama(p.kartlar[b.uid]));
    return [...yeni, ...eski].slice(0, TEKRAR_KART);
  }
  if (o.tip === "karisan") {
    // Karıştırılan kavramlar art arda: aynı setin kartları karışık sırayla
    const set = d.karisanlar.find((x) => x.id === o.setId);
    return karistir((set?.kartlar ?? []).map((u) => d.kartlar.get(u)).filter((k): k is KartRef => !!k));
  }
  if (o.tip === "liste") return o.uids.map((u) => d.kartlar.get(u)).filter((k): k is KartRef => !!k);

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

/**
 * Yanlış defteri: en az bir kez yanlış cevaplanmış bilgiler.
 * Önce yanlış sayısı doğruya göre fazla olanlar, sonra hatırlaması en zayıf olanlar.
 */
export function yanlisDefteri(d: Dizin, p: Ilerleme): KartRef[] {
  const simdi = Date.now();
  return Object.entries(p.kartlar)
    .filter(([, k]) => k.no > 0)
    .map(([uid, k]) => ({ ref: d.kartlar.get(uid), puan: k.no * 2 - k.ok + (1 - hatirlama(k, simdi)) * 2 }))
    .filter((x): x is { ref: KartRef; puan: number } => !!x.ref)
    .sort((a, b) => b.puan - a.puan)
    .map((x) => x.ref);
}

/** Son tur: tur başladıktan sonra hiç sorulmamış bilgiler, en zayıf hatırlananlar önce (görülmemişler en sonda) */
export function sonTurKalan(d: Dizin, p: Ilerleme): KartRef[] {
  const bas = p.sonTur?.baslangic ?? Date.now();
  const simdi = Date.now();
  return aktifKurslar(d, p)
    .flatMap((k) => k.kartlar)
    .filter((r) => !p.kartlar[r.uid] || p.kartlar[r.uid].l < bas)
    .sort((a, b) => {
      const da = p.kartlar[a.uid];
      const db = p.kartlar[b.uid];
      return (da ? hatirlama(da, simdi) : 2) - (db ? hatirlama(db, simdi) : 2);
    });
}

export function sonTurDurumu(d: Dizin, p: Ilerleme) {
  const toplam = aktifKurslar(d, p).reduce((t, k) => t + k.kartlar.length, 0);
  const kalan = sonTurKalan(d, p).length;
  return { toplam, tamam: toplam - kalan, kalan };
}

/** Bir sınav yılında ("2023-TYT") sorulmuş bilgiler, ders sırasıyla */
export function yilKartlari(d: Dizin, p: Ilerleme, yil: string, kursId?: string): KartRef[] {
  return aktifKurslar(d, p, kursId)
    .flatMap((k) => k.cikmis)
    .flatMap((k) => k.kartlar)
    .filter((r) => r.kart.yil === yil);
}

export interface YilOzeti {
  yil: string; // "2023-TYT"
  yilSayi: number;
  sinav: "TYT" | "AYT";
  kartlar: KartRef[];
  dersler: { ders: string; kursId: string; adet: number }[];
}

/** Çıkmış bilgilerin yıllara göre dökümü: en yeni yıl önce, aynı yılda TYT önce */
export function yilOzetleri(d: Dizin, p: Ilerleme, kursId?: string): YilOzeti[] {
  const harita = new Map<string, YilOzeti>();
  for (const kurs of aktifKurslar(d, p, kursId)) {
    for (const konu of kurs.cikmis) {
      for (const r of konu.kartlar) {
        const yil = r.kart.yil;
        if (!yil) continue;
        let o = harita.get(yil);
        if (!o) {
          const [ys, sinav] = yil.split("-");
          o = { yil, yilSayi: Number(ys), sinav: sinav as "TYT" | "AYT", kartlar: [], dersler: [] };
          harita.set(yil, o);
        }
        o.kartlar.push(r);
        const dk = o.dersler.find((x) => x.kursId === kurs.id);
        if (dk) dk.adet++;
        else o.dersler.push({ ders: kurs.ders, kursId: kurs.id, adet: 1 });
      }
    }
  }
  return [...harita.values()].sort((a, b) => b.yilSayi - a.yilSayi || b.sinav.localeCompare(a.sinav));
}
