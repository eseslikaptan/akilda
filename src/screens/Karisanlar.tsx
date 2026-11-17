import type { CSSProperties } from "react";
import type { Dizin, KarisanSet } from "../content";
import { aktifKurslar, kartlarOzet } from "../oturum";
import { useIlerleme } from "../store";
import { DERSLER } from "../subjects";
import type { DersKey } from "../types";
import { git } from "../router";
import { HafizaCubugu, Ikon, yuzde } from "../ui";

/** Bir dersin karıştırılan kavram setleri (alan dışı dersler gizlenir) */
export function dersSetleri(d: Dizin, ders: DersKey): KarisanSet[] {
  return d.karisanlar.filter((s) => s.ders === ders);
}

export function KarisanListe({ dizin, setler }: { dizin: Dizin; setler: KarisanSet[] }) {
  const p = useIlerleme();
  return (
    <ul className="karisan-liste">
      {setler.map((s) => {
        const o = kartlarOzet(s.kartlar.map((u) => dizin.kartlar.get(u)!), p);
        return (
          <li key={s.id} style={{ "--hue": DERSLER[s.ders as DersKey]?.hue ?? 30 } as CSSProperties}>
            <button className="karisan" onClick={() => git(`/oturum?karisan=${encodeURIComponent(s.id)}`)}>
              <span className="karisan-ust">
                <strong>{s.ad}</strong>
                <span className="soluk-metin">{s.kartlar.length} soru</span>
              </span>
              <span className="karisan-fark">{s.fark}</span>
              <HafizaCubugu hafiza={o.hafiza} gorulen={o.gorulen} toplam={o.toplam} />
              {o.gorulen > 0 && <span className="soluk-metin">Hafıza {yuzde(o.hafiza)}</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** Karıştırılan kavramlar: benzer kavramları art arda sorarak ayırt etmeyi güçlendirir */
export function Karisanlar({ dizin }: { dizin: Dizin }) {
  const p = useIlerleme();
  const dersler = [...new Set(aktifKurslar(dizin, p).map((k) => k.ders))];
  const gruplar = dersler.map((d) => ({ ders: d, setler: dersSetleri(dizin, d) })).filter((g) => g.setler.length);
  return (
    <div className="sayfa">
      <h1 className="baslik-buyuk">Karıştırılanlar</h1>
      <p className="soluk-metin alt-baslik">
        Birbirine benzeyen kavramlar art arda sorulur. Rastgele karışık çalışmaktan daha etkilidir, çünkü farkı görmeye zorlar.
      </p>
      {gruplar.length === 0 && (
        <div className="bos-durum sol">
          <p>Alanındaki dersler için henüz karıştırılan kavram seti yok.</p>
        </div>
      )}
      {gruplar.map((g) => (
        <section key={g.ders}>
          <h2 className="bolum-baslik">
            <Ikon d={DERSLER[g.ders].ikon} boyut={16} /> {DERSLER[g.ders].ad}
          </h2>
          <KarisanListe dizin={dizin} setler={g.setler} />
        </section>
      ))}
    </div>
  );
}
