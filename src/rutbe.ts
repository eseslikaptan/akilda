// Seviye, rütbe ve rozetler. Rütbeler esnaf geleneğinden: çıraktan bilgeye.
import type { Dizin } from "./content";
import type { Ilerleme } from "./types";

/** L. seviyeye ulaşmak için gereken toplam XP: 40·(L−1)·L → 2: 80, 5: 800, 10: 3.600, 20: 15.200 */
export function seviyeXp(l: number): number {
  return 40 * (l - 1) * l;
}

export function seviyeHesapla(xp: number): { seviye: number; buSeviye: number; sonraki: number; oran: number } {
  let l = 1;
  while (seviyeXp(l + 1) <= xp) l++;
  const buSeviye = seviyeXp(l);
  const sonraki = seviyeXp(l + 1);
  return { seviye: l, buSeviye, sonraki, oran: (xp - buSeviye) / (sonraki - buSeviye) };
}

const RUTBELER: [number, string][] = [
  [1, "Çırak"],
  [5, "Kalfa"],
  [10, "Usta"],
  [15, "Üstat"],
  [20, "Bilge"],
  [30, "Allâme"],
];

export function rutbe(seviye: number): string {
  let ad = RUTBELER[0][1];
  for (const [l, r] of RUTBELER) if (seviye >= l) ad = r;
  return ad;
}

/** "Usta" → "Ustasın", "Bilge" → "Bilgesin" (ünlü uyumu) */
export function sinEki(kelime: string): string {
  const son = [...kelime.toLocaleLowerCase("tr")].reverse().find((h) => "aâıoueiöü".includes(h)) ?? "a";
  const ek = "aâı".includes(son) ? "sın" : "ei".includes(son) ? "sin" : "ou".includes(son) ? "sun" : "sün";
  return kelime + ek;
}

// ---- Rozetler ----

export interface RozetBaglam {
  saat: number;
  kusursuz?: boolean; // biten oturum hatasızdı
  karisanTam?: boolean; // karıştırılanlar seti hatasız bitti
}

export interface Rozet {
  id: string;
  ad: string;
  aciklama: string;
  simge: string; // tek karakterlik amblem
  kazanildi: (p: Ilerleme, d: Dizin, b: RozetBaglam) => boolean;
}

const gorulen = (p: Ilerleme) => Object.keys(p.kartlar).length;

export const ROZETLER: Rozet[] = [
  { id: "ilk-adim", ad: "İlk adım", aciklama: "İlk dersini bitirdin.", simge: "1", kazanildi: (p) => p.toplamXp > 0 },
  { id: "yuz-bilgi", ad: "Yüzlük", aciklama: "100 bilgi gördün.", simge: "C", kazanildi: (p) => gorulen(p) >= 100 },
  { id: "bes-yuz", ad: "Bilgi küpü", aciklama: "500 bilgi gördün.", simge: "D", kazanildi: (p) => gorulen(p) >= 500 },
  { id: "bin-bilgi", ad: "Ansiklopedi", aciklama: "1.000 bilgi gördün.", simge: "M", kazanildi: (p) => gorulen(p) >= 1000 },
  { id: "seri-3", ad: "Isınma turu", aciklama: "3 gün üst üste çalıştın.", simge: "3", kazanildi: (p) => p.enUzunSeri >= 3 },
  { id: "seri-7", ad: "Bir hafta", aciklama: "7 günlük seri.", simge: "7", kazanildi: (p) => p.enUzunSeri >= 7 },
  { id: "seri-30", ad: "Bir ay", aciklama: "30 günlük seri.", simge: "30", kazanildi: (p) => p.enUzunSeri >= 30 },
  { id: "seri-100", ad: "Yüz gün", aciklama: "100 günlük seri.", simge: "100", kazanildi: (p) => p.enUzunSeri >= 100 },
  { id: "kusursuz", ad: "Kusursuz", aciklama: "Bir dersi hatasız bitirdin.", simge: "✓", kazanildi: (_p, _d, b) => !!b.kusursuz },
  {
    id: "osym-avcisi",
    ad: "ÖSYM avcısı",
    aciklama: "ÖSYM'de çıkmış 50 bilgiyi doğru cevapladın.",
    simge: "Ö",
    kazanildi: (p, d) => Object.entries(p.kartlar).filter(([u, k]) => k.ok > 0 && d.kartlar.get(u)?.kart.yil).length >= 50,
  },
  {
    id: "kalici",
    ad: "Kalıcı hafıza",
    aciklama: "100 bilgi kalıcı hâle geldi (3 haftadan uzun aralık).",
    simge: "K",
    kazanildi: (p) => Object.values(p.kartlar).filter((k) => k.s >= 21).length >= 100,
  },
  { id: "erkenci", ad: "Erkenci kuş", aciklama: "Sabah 7'den önce çalıştın.", simge: "☀", kazanildi: (_p, _d, b) => b.saat < 7 && b.saat >= 4 },
  { id: "gece-kusu", ad: "Gece kuşu", aciklama: "Gece 11'den sonra çalıştın.", simge: "☾", kazanildi: (_p, _d, b) => b.saat >= 23 },
  { id: "ilk-deneme", ad: "İlk deneme", aciklama: "İlk YKS bilgi denemeni bitirdin.", simge: "D", kazanildi: (p) => p.denemeler.length > 0 },
  {
    id: "net-avcisi",
    ad: "Net avcısı",
    aciklama: "Bir denemede soruların %75'i kadar net yaptın.",
    simge: "N",
    kazanildi: (p) =>
      p.denemeler.some((k) => {
        const t = Object.values(k.dersler).reduce((a, x) => ({ d: a.d + x!.d, y: a.y + x!.y, n: a.n + x!.d + x!.y + x!.b }), { d: 0, y: 0, n: 0 });
        return t.n >= 10 && t.d - t.y / 4 >= 0.75 * t.n;
      }),
  },
  {
    id: "cok-yonlu",
    ad: "Çok yönlü",
    aciklama: "5 farklı dersten bilgi gördün.",
    simge: "5",
    kazanildi: (p, d) => new Set(Object.keys(p.kartlar).map((u) => d.kartlar.get(u)?.kitap.ders).filter(Boolean)).size >= 5,
  },
  { id: "ayirt-edici", ad: "Ayırt edici", aciklama: "Bir karıştırılanlar setini hatasız bitirdin.", simge: "≠", kazanildi: (_p, _d, b) => !!b.karisanTam },
  { id: "son-tur", ad: "Son düzlük", aciklama: "Son turu başlattın.", simge: "S", kazanildi: (p) => !!p.sonTur },
];

/** Bu durumda yeni kazanılan rozetler */
export function yeniRozetler(p: Ilerleme, d: Dizin, b: RozetBaglam): Rozet[] {
  return ROZETLER.filter((r) => !p.rozetler[r.id] && r.kazanildi(p, d, b));
}
