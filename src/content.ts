import type { KartRef, KitapJson, Konu, Kurs } from "./types";
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
  kitaplar.sort((a, b) => DERS_SIRASI.indexOf(a.ders) - DERS_SIRASI.indexOf(b.ders) || a.sinif - b.sinif);

  const kurs = new Map<string, Kurs>();
  const konular = new Map<string, Konu>();
  const kartlar = new Map<string, KartRef>();
  const kitapKursu = new Map<string, Kurs>();

  for (const kitap of kitaplar) {
    const sinav = kitabinSinavi(kitap);
    const id = kursId(sinav, kitap.ders);
    let k = kurs.get(id);
    if (!k) {
      k = { id, sinav, ders: kitap.ders, kitaplar: [], uniteler: [], konular: [], kartlar: [] };
      kurs.set(id, k);
    }
    k.kitaplar.push(kitap);
    kitapKursu.set(kitap.kitap, k);

    for (const u of kitap.uniteler) {
      const unite = { sira: k.uniteler.length + 1, ad: u.ad, konular: [] as Konu[] };
      k.uniteler.push(unite);
      u.konular.forEach((kj, i) => {
        const konuId = `${kitap.kitap}/${kj.no}`;
        const konu: Konu = {
          id: konuId,
          no: kj.no,
          ad: kj.ad,
          uniteAd: u.ad,
          kitap,
          kartlar: [],
          kursId: id,
          uniteSira: unite.sira,
          konuSira: i + 1,
        };
        for (const kart of kj.kartlar) {
          const ref: KartRef = { uid: `${kitap.kitap}/${kart.id}`, kart, konuId, kitap };
          konu.kartlar.push(ref);
          kartlar.set(ref.uid, ref);
          k.kartlar.push(ref);
        }
        unite.konular.push(konu);
        k.konular.push(konu);
        konular.set(konuId, konu);
      });
    }
  }

  const kurslar = [...kurs.values()].sort(
    (a, b) => SINAV_SIRASI.indexOf(a.sinav) - SINAV_SIRASI.indexOf(b.sinav) || DERS_SIRASI.indexOf(a.ders) - DERS_SIRASI.indexOf(b.ders),
  );
  return { kitaplar, kurslar, kurs, konular, kartlar, kitapKursu };
}

export function kaynakLinki(kitap: KitapJson, sayfa: number): string {
  return `${kitap.pdfUrl}#page=${sayfa}`;
}
