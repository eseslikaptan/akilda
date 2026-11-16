import type { DersKey } from "./types";

export interface DersBilgi {
  key: DersKey;
  ad: string;
  kisa: string;
  /** açık / koyu tema renk çifti (hue). Renkler styles.css'te --hue ile türetilir. */
  hue: number;
  ikon: string; // 24x24 SVG path
}

export const DERSLER: Record<DersKey, DersBilgi> = {
  tarih: {
    key: "tarih",
    ad: "Tarih",
    kisa: "Tarih",
    hue: 32,
    ikon: "M4 20h16M6 20V9m4 11V9m4 11V9m4 11V9M3 9l9-5 9 5H3z",
  },
  cografya: {
    key: "cografya",
    ad: "Coğrafya",
    kisa: "Coğrafya",
    hue: 175,
    ikon: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3.6 9h16.8M3.6 15h16.8M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z",
  },
  biyoloji: {
    key: "biyoloji",
    ad: "Biyoloji",
    kisa: "Biyoloji",
    hue: 135,
    ikon: "M7 3c0 6 10 6 10 12 0 3-2 6-5 6M17 3c0 6-10 6-10 12 0 3 2 6 5 6M8.5 7h7M8.5 17h7",
  },
  kimya: {
    key: "kimya",
    ad: "Kimya",
    kisa: "Kimya",
    hue: 280,
    ikon: "M9 3h6M10 3v6L4.5 18.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3M7 15h10",
  },
  fizik: {
    key: "fizik",
    ad: "Fizik",
    kisa: "Fizik",
    hue: 215,
    ikon: "M12 13a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM12 21c4 0 7-4 7-9.5S16 2 12 2 5 6 5 11.5 8 21 12 21zM3 7.5c3.5-2 14.5-2 18 4.5M3 16c3.5 2 14.5 2 18-4.5",
  },
  edebiyat: {
    key: "edebiyat",
    ad: "Türk Dili ve Edebiyatı",
    kisa: "Edebiyat",
    hue: 350,
    ikon: "M4 19.5V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zm0 0A2 2 0 0 0 6 21h13M9 7h6M9 11h4",
  },
  felsefe: {
    key: "felsefe",
    ad: "Felsefe",
    kisa: "Felsefe",
    hue: 250,
    ikon: "M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z",
  },
  din: {
    key: "din",
    ad: "Din Kültürü ve Ahlak Bilgisi",
    kisa: "Din Kültürü",
    hue: 155,
    ikon: "M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5zM17 4l.8 1.7L19.5 6l-1.7.8L17 8.5l-.8-1.7L14.5 6l1.7-.3L17 4z",
  },
  inkilap: {
    key: "inkilap",
    ad: "T.C. İnkılap Tarihi ve Atatürkçülük",
    kisa: "İnkılap",
    hue: 5,
    ikon: "M5 21V4m0 0h11l-2 4 2 4H5",
  },
  matematik: {
    key: "matematik",
    ad: "Matematik",
    kisa: "Matematik",
    hue: 200,
    ikon: "M5 5h14v14H5zM8 9h3M9.5 7.5v3M13 9h3M8 15h3M13 14h3M13 16h3",
  },
};

export const DERS_SIRASI: DersKey[] = [
  "tarih",
  "cografya",
  "edebiyat",
  "felsefe",
  "din",
  "biyoloji",
  "kimya",
  "fizik",
  "inkilap",
  "matematik",
];
