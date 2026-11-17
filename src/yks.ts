// YKS'ye özgü sabitler: sınav tarihi ve ÖSYM'nin derslere göre soru dağılımı.
// Kaynak: ÖSYM 2027 sınav takvimi (28.10.2026) ve 2026-YKS kılavuzu.
import type { DersKey } from "./types";
import type { Sinav } from "./kurslar";

/** 2027-YKS: TYT 19 Haziran 2027 Cumartesi, AYT 20 Haziran 2027 Pazar (10.15) */
export const YKS_TARIHI = new Date(2027, 5, 19, 10, 15);
export const AYT_TARIHI = new Date(2027, 5, 20, 10, 15);

/** Bir testte dersin soru sayısı (uygulamadaki derslerle sınırlı) */
export const SORU_SAYISI: Record<Sinav, Partial<Record<DersKey, number>>> = {
  TYT: { tarih: 5, cografya: 5, felsefe: 5, din: 5, fizik: 7, kimya: 7, biyoloji: 6 },
  // AYT: Tarih-1 (10) + Tarih-2 (11), Coğrafya-1 (6) + Coğrafya-2 (11), Felsefe Grubu 12, Din 6
  AYT: { edebiyat: 24, tarih: 21, cografya: 17, felsefe: 12, din: 6, fizik: 14, kimya: 13, biyoloji: 13 },
};

const GUN = 86_400_000;

export function gunKaldi(hedef = YKS_TARIHI, simdi = new Date()): number {
  const bugun = new Date(simdi.getFullYear(), simdi.getMonth(), simdi.getDate());
  const gun = new Date(hedef.getFullYear(), hedef.getMonth(), hedef.getDate());
  return Math.max(0, Math.round((gun.getTime() - bugun.getTime()) / GUN));
}

/**
 * Tempo: hiç görülmemiş bilgilerin sınavdan 3 hafta önce bitmesi için günde kaç yeni bilgi gerekir.
 * Son üç hafta tamamen tekrara ayrılır.
 */
export function gunlukYeniHedef(gorulmemis: number, kalanGun: number): number {
  const ogrenmeGunu = Math.max(1, kalanGun - 21);
  return Math.max(0, Math.ceil(gorulmemis / ogrenmeGunu));
}

/** Net = doğru − yanlış / 4 (ÖSYM kuralı) */
export function net(dogru: number, yanlis: number): number {
  return Math.round((dogru - yanlis / 4) * 100) / 100;
}
