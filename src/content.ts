import type { DersKey, KartRef, KitapJson, Konu } from "./types";
import { DERS_SIRASI } from "./subjects";

export interface Dizin {
  kitaplar: KitapJson[];
  dersler: DersKey[]; // içeriği olan dersler, sıralı
  kitaplarByDers: Map<DersKey, KitapJson[]>;
  konular: Map<string, Konu>;
  konularByKitap: Map<string, Konu[]>;
  kartlar: Map<string, KartRef>;
}

// Her kitap ayrı bir parça olarak yüklenir (service worker önbelleğe alır).
const yukleyiciler = import.meta.glob<KitapJson>("../content/*.json", { import: "default" });

export async function icerikYukle(): Promise<Dizin> {
  const kitaplar = await Promise.all(Object.values(yukleyiciler).map((f) => f()));
  kitaplar.sort((a, b) => a.ders.localeCompare(b.ders) || a.sinif - b.sinif);
  return dizinKur(kitaplar);
}

export function dizinKur(kitaplar: KitapJson[]): Dizin {
  const kitaplarByDers = new Map<DersKey, KitapJson[]>();
  const konular = new Map<string, Konu>();
  const konularByKitap = new Map<string, Konu[]>();
  const kartlar = new Map<string, KartRef>();

  for (const kitap of kitaplar) {
    const liste = kitaplarByDers.get(kitap.ders) ?? [];
    liste.push(kitap);
    kitaplarByDers.set(kitap.ders, liste);

    const kitapKonulari: Konu[] = [];
    for (const u of kitap.uniteler) {
      for (const k of u.konular) {
        const id = `${kitap.kitap}/${k.no}`;
        const konu: Konu = { id, no: k.no, ad: k.ad, uniteNo: u.no, uniteAd: u.ad, kitap, kartlar: [] };
        for (const kart of k.kartlar) {
          const ref: KartRef = { uid: `${kitap.kitap}/${kart.id}`, kart, konuId: id, kitap };
          konu.kartlar.push(ref);
          kartlar.set(ref.uid, ref);
        }
        konular.set(id, konu);
        kitapKonulari.push(konu);
      }
    }
    konularByKitap.set(kitap.kitap, kitapKonulari);
  }

  const dersler = DERS_SIRASI.filter((d) => kitaplarByDers.has(d));
  return { kitaplar, dersler, kitaplarByDers, konular, konularByKitap, kartlar };
}

export function kaynakLinki(kitap: KitapJson, sayfa: number): string {
  return `${kitap.pdfUrl}#page=${sayfa}`;
}
