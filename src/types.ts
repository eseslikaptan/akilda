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
  id: string; // "<kitap>/<konu no>" — ilerleme kayıtları bu kimliğe bağlı
  no: string;
  ad: string;
  uniteAd: string;
  kitap: KitapJson;
  kartlar: KartRef[];
  kursId: string; // "tyt-tarih"
  uniteSira: number; // YKS dersi içinde kesintisiz ünite numarası
  konuSira: number; // ünite içindeki sıra (1'den)
}

export interface KursUnite {
  sira: number;
  ad: string;
  konular: Konu[];
}

/** Bir YKS dersi: ör. TYT Tarih. Birden çok MEB kitabını tek bir yolda birleştirir. */
export interface Kurs {
  id: string;
  sinav: "TYT" | "AYT";
  ders: DersKey;
  kitaplar: KitapJson[];
  uniteler: KursUnite[];
  konular: Konu[];
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
  alan: "TYT" | "SAY" | "EA" | "SOZ" | "HEPSI";
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
