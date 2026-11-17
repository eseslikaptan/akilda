// YKS yapısı: içerik sınıflara göre değil, sınav (TYT / AYT) ve derse göre düzenlenir.
// Her MEB kitabı tek bir YKS dersine bağlanır; ünite numaraları o ders içinde kesintisizdir.
import type { DersKey, KitapJson } from "./types";

export type Sinav = "TYT" | "AYT";

export type AlanKey = "TYT" | "SAY" | "EA" | "SOZ" | "HEPSI";

export interface AlanBilgi {
  key: AlanKey;
  ad: string;
  aciklama: string;
  /** Bu alanda çalışılan AYT dersleri (TYT dersleri her alanda vardır) */
  ayt: DersKey[];
}

export const ALANLAR: AlanBilgi[] = [
  { key: "SAY", ad: "Sayısal", aciklama: "TYT + AYT Fizik, Kimya, Biyoloji", ayt: ["fizik", "kimya", "biyoloji", "matematik"] },
  { key: "EA", ad: "Eşit Ağırlık", aciklama: "TYT + AYT Edebiyat, Tarih, Coğrafya", ayt: ["edebiyat", "tarih", "cografya", "matematik"] },
  {
    key: "SOZ",
    ad: "Sözel",
    aciklama: "TYT + AYT Edebiyat, Tarih, Coğrafya, Felsefe, Din",
    ayt: ["edebiyat", "tarih", "cografya", "felsefe", "din", "inkilap"],
  },
  { key: "TYT", ad: "Sadece TYT", aciklama: "Temel Yeterlilik Testi dersleri", ayt: [] },
  {
    key: "HEPSI",
    ad: "Hepsi",
    aciklama: "TYT ve AYT'nin bütün dersleri",
    ayt: ["edebiyat", "tarih", "cografya", "felsefe", "din", "inkilap", "fizik", "kimya", "biyoloji", "matematik"],
  },
];

export function alanBilgi(key: AlanKey | undefined): AlanBilgi {
  return ALANLAR.find((a) => a.key === key) ?? ALANLAR[ALANLAR.length - 1];
}

/**
 * Kitabın hangi sınava ait olduğu.
 * Edebiyat konuları YKS'de yalnızca AYT'de (Türk Dili ve Edebiyatı testi) sorulur.
 * Diğer derslerde ortak temel konular TYT'de, ileri konular AYT'de yer alır.
 */
export function kitabinSinavi(kitap: KitapJson): Sinav {
  if (kitap.sinav) return kitap.sinav; // çıkmış soru kaynakları sınavını kendisi söyler
  if (kitap.ders === "edebiyat") return "AYT";
  return (kitap.sinif ?? 9) <= 10 ? "TYT" : "AYT";
}

export function kursId(sinav: Sinav, ders: DersKey): string {
  return `${sinav.toLowerCase()}-${ders}`;
}

export function alandaMi(alan: AlanBilgi, sinav: Sinav, ders: DersKey): boolean {
  return sinav === "TYT" || alan.ayt.includes(ders);
}
