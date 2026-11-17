import type { KartRef, KitapJson, Konu, KonuJson, Kurs } from "./types";
import { DERS_SIRASI } from "./subjects";
import { kitabinSinavi, kursId, type Sinav } from "./kurslar";

export interface Dizin {
  kitaplar: KitapJson[];
  /** YKS dersleri sırayla: önce TYT, sonra AYT */
  kurslar: Kurs[];
  kurs: Map<string, Kurs>;
  konular: Map<string, Konu>;
  kartlar: Map<string, KartRef>;
  kitapKursu: Map<string, Kurs>; // kitap anahtarı -> YKS dersi
}

// Her kitap ayrı bir parça olarak yüklenir (service worker önbelleğe alır).
const yukleyiciler = import.meta.glob<KitapJson>("../content/*.json", { import: "default" });

export async function icerikYukle(): Promise<Dizin> {
  const kitaplar = await Promise.all(Object.values(yukleyiciler).map((f) => f()));
  return dizinKur(kitaplar);
}

const SINAV_SIRASI: Sinav[] = ["TYT", "AYT"];

export function dizinKur(kitaplar: KitapJson[]): Dizin {
  // Dersler uygulamadaki sırayla, her derste kitaplar müfredat sırasıyla
  kitaplar.sort((a, b) => DERS_SIRASI.indexOf(a.ders) - DERS_SIRASI.indexOf(b.ders) || (a.sinif ?? 0) - (b.sinif ?? 0));

  const kurs = new Map<string, Kurs>();
  const konular = new Map<string, Konu>();
  const kartlar = new Map<string, KartRef>();
  const kitapKursu = new Map<string, Kurs>();

  for (const kitap of kitaplar) {
    const sinav = kitabinSinavi(kitap);
    const id = kursId(sinav, kitap.ders);
    let k = kurs.get(id);
    if (!k) {
      k = { id, sinav, ders: kitap.ders, kitaplar: [], uniteler: [], konular: [], kartlar: [], cikmis: [], cikmisSoru: 0 };
      kurs.set(id, k);
    }
    kitapKursu.set(kitap.kitap, k);

    if (kitap.tip === "cikmis") {
      // Çıkmış soru bilgileri ders yolunun içine girmez; dersin ayrı "ÖSYM'de çıkanlar" bölümünde durur
      k.cikmisKitap = kitap;
      for (const u of kitap.uniteler) {
        u.konular.forEach((kj, i) => {
          const konu = konuKur(kitap, u.ad, kj, id, u.no, i + 1, kartlar, k!);
          konu.cikmis = true;
          konu.soruSayisi = kj.soruSayisi ?? kj.kartlar.length;
          k!.cikmisSoru += konu.soruSayisi;
          k!.cikmis.push(konu);
          konular.set(konu.id, konu);
        });
      }
      continue;
    }
    k.kitaplar.push(kitap);

    for (const u of kitap.uniteler) {
      const unite = { sira: k.uniteler.length + 1, ad: u.ad, konular: [] as Konu[] };
      k.uniteler.push(unite);
      u.konular.forEach((kj, i) => {
        const konu = konuKur(kitap, u.ad, kj, id, unite.sira, i + 1, kartlar, k!);
        unite.konular.push(konu);
        k!.konular.push(konu);
        konular.set(konu.id, konu);
      });
    }
  }

  // Çıkmış başlıkların soru sayılarını eşleştikleri ders kitabı konularına yansıt
  for (const k of kurs.values()) {
    for (const ck of k.cikmis) {
      const kj = ck.kitap.uniteler.flatMap((u) => u.konular).find((x) => `${ck.kitap.kitap}/${x.no}` === ck.id);
      for (const hedef of kj?.eslesen ?? []) {
        const tk = konular.get(hedef);
        if (!tk) continue;
        tk.osymSoru = (tk.osymSoru ?? 0) + (ck.soruSayisi ?? 0);
        (tk.osymKonular ??= []).push(ck.id);
      }
    }
  }

  const kurslar = [...kurs.values()].sort(
    (a, b) => SINAV_SIRASI.indexOf(a.sinav) - SINAV_SIRASI.indexOf(b.sinav) || DERS_SIRASI.indexOf(a.ders) - DERS_SIRASI.indexOf(b.ders),
  );
  return { kitaplar, kurslar, kurs, konular, kartlar, kitapKursu };
}

function konuKur(
  kitap: KitapJson,
  uniteAd: string,
  kj: KonuJson,
  kursId: string,
  uniteSira: number,
  konuSira: number,
  kartlar: Map<string, KartRef>,
  kurs: Kurs,
): Konu {
  const konuId = `${kitap.kitap}/${kj.no}`;
  const konu: Konu = { id: konuId, no: kj.no, ad: kj.ad, uniteAd, kitap, kartlar: [], kursId, uniteSira, konuSira };
  for (const kart of kj.kartlar) {
    const ref: KartRef = { uid: `${kitap.kitap}/${kart.id}`, kart, konuId, kitap };
    konu.kartlar.push(ref);
    kartlar.set(ref.uid, ref);
    kurs.kartlar.push(ref);
  }
  return konu;
}

export function kaynakLinki(kitap: KitapJson, sayfa: number): string {
  return `${kitap.pdfUrl}#page=${sayfa}`;
}
