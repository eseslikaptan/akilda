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
  /** Yalnızca çıkmış soru kartlarında: bilginin sorulduğu sınav, ör. "2023-TYT" */
  yil?: string;
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
  /** Çıkmış soru kaynaklarında: 2018-2026 arasında bu konudan sorulan soru sayısı */
  soruSayisi?: number;
  /** Çıkmış soru kaynaklarında: bu konuya karşılık gelen ders kitabı konuları ("tarih-9/1.2") */
  eslesen?: string[];
}

export interface UniteJson {
  no: number;
  ad: string;
  konular: KonuJson[];
}

export interface KitapJson {
  kitap: string;
  /** "cikmis": ÖSYM çıkmış sorularından (MEB derlemesi) çıkarılmış bilgiler */
  tip?: "cikmis";
  ders: DersKey;
  /** Ders kitaplarında sınıf; çıkmış soru kaynaklarında yok */
  sinif?: number;
  sinav?: "TYT" | "AYT";
  testUrl?: string;
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
  /** Çıkmış soru konusu mu (MEB'in YKS çıkmış soru kitabındaki bir başlık) */
  cikmis?: boolean;
  /** Çıkmış konu: 2018-2026 arasında bu başlıktan sorulan soru sayısı */
  soruSayisi?: number;
  /** Ders kitabı konusu: eşleşen çıkmış başlıklardaki toplam soru sayısı ve o başlıkların kimlikleri */
  osymSoru?: number;
  osymKonular?: string[];
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
  /** ÖSYM çıkmış sorularından çıkarılmış bilgiler (MEB derlemesi, 2018-2026) */
  cikmis: Konu[];
  cikmisKitap?: KitapJson;
  cikmisSoru: number;
}

// ---- İlerleme (localStorage) ----

export interface KartDurum {
  /** kararlılık (gün): hatırlama olasılığının %90'a düştüğü süre */
  s: number;
  /** FSRS zorluğu (1–10); eski kayıtlarda yok, 5 kabul edilir */
  d?: number;
  /** son tekrar zamanı (ms) */
  l: number;
  /** bir sonraki tekrar zamanı (ms); yoksa l + s gün */
  v?: number;
  /** toplam doğru / yanlış */
  ok: number;
  no: number;
}

export interface Ayarlar {
  ad: string;
  gunlukHedef: number; // XP
  alan: "TYT" | "SAY" | "EA" | "SOZ" | "HEPSI";
  ses: boolean;
  /** Boşlukları yazarak cevapla, çoktan seçmelide şıkları önce gizle */
  yazarak: boolean;
}

export interface DenemeKaydi {
  tarih: number;
  sinav: "TYT" | "AYT";
  sureSn: number;
  /** ders -> doğru / yanlış / boş */
  dersler: Partial<Record<DersKey, { d: number; y: number; b: number }>>;
}

export interface Ilerleme {
  v: 1;
  kurulum: boolean;
  ayarlar: Ayarlar;
  kartlar: Record<string, KartDurum>;
  /** "YYYY-MM-DD" -> o gün kazanılan XP */
  gunler: Record<string, number>;
  /** "YYYY-MM-DD" -> o gün ilk kez görülen bilgi sayısı */
  yeniler: Record<string, number>;
  toplamXp: number;
  /** en uzun seri */
  enUzunSeri: number;
  sonKonu?: string;
  /** Seri dondurma: her 7 günlük seride 1 hak (en fazla 2); çalışılmayan gün otomatik kullanılır */
  dondurma: { hak: number; gunler: string[] };
  denemeler: DenemeKaydi[];
  sonYedek?: number;
  /** "YYYY-MM-DD" -> [doğru, yanlış] (ilk denemeler; karne için) */
  cevaplar: Record<string, [number, number]>;
  /** Son tur: başladığı andan sonra en az bir kez sorulan bilgiler "turu tamamlamış" sayılır */
  sonTur?: { baslangic: number };
  /** rozet kimliği -> kazanıldığı zaman */
  rozetler: Record<string, number>;
}
