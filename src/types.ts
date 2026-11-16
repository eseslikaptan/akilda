// ---- İçerik (content/*.json) ----

export type DersKey =
  | "edebiyat"
  | "fizik"
  | "kimya"
  | "biyoloji"
  | "cografya"
  | "felsefe"
  | "tarih"
  | "inkilap"
  | "din"
  | "matematik";

interface KartOrtak {
  id: string;
  bilgi: string;
  sayfa: number;
}

export interface SecmeliKart extends KartOrtak {
  tur: "secmeli";
  soru: string;
  secenekler: string[];
  dogru: number;
}

export interface DYKart extends KartOrtak {
  tur: "dy";
  ifade: string;
  dogru: boolean;
}

export interface BoslukKart extends KartOrtak {
  tur: "bosluk";
  cumle: string;
  cevap: string;
  celdiriciler: string[];
}

export interface EslestirKart extends KartOrtak {
  tur: "eslestir";
  yonerge: string;
  ciftler: [string, string][];
}

export type Kart = SecmeliKart | DYKart | BoslukKart | EslestirKart;

export interface KonuJson {
  no: string;
  ad: string;
  kartlar: Kart[];
}

export interface UniteJson {
  no: number;
  ad: string;
  konular: KonuJson[];
}

export interface KitapJson {
  kitap: string;
  ders: DersKey;
  sinif: number;
  baslik: string;
  sayfaUrl: string;
  pdfUrl: string;
  uniteler: UniteJson[];
}

// ---- Uygulama içi dizin ----

/** Kart + nereden geldiği. `uid` = "<kitap>/<kart id>" */
export interface KartRef {
  uid: string;
  kart: Kart;
  konuId: string;
  kitap: KitapJson;
}

export interface Konu {
  id: string; // "<kitap>/<konu no>"
  no: string;
  ad: string;
  uniteNo: number;
  uniteAd: string;
  kitap: KitapJson;
  kartlar: KartRef[];
}

// ---- İlerleme (localStorage) ----

export interface KartDurum {
  /** kararlılık (gün): hatırlama olasılığının %90'a düştüğü süre */
  s: number;
  /** son tekrar zamanı (ms) */
  l: number;
  /** toplam doğru / yanlış */
  ok: number;
  no: number;
}

export interface Ayarlar {
  ad: string;
  gunlukHedef: number; // XP
  dersler: DersKey[]; // seçili dersler (boşsa hepsi)
  ses: boolean;
}

export interface Ilerleme {
  v: 1;
  kurulum: boolean;
  ayarlar: Ayarlar;
  kartlar: Record<string, KartDurum>;
  /** "YYYY-MM-DD" -> o gün kazanılan XP */
  gunler: Record<string, number>;
  toplamXp: number;
  /** en uzun seri */
  enUzunSeri: number;
  sonKonu?: string;
}
