import type { CSSProperties } from "react";
import type { Dizin } from "../content";
import { kaynakLinki } from "../content";
import { yanlisDefteri } from "../oturum";
import { useIlerleme } from "../store";
import { hatirlama } from "../srs";
import { DERSLER } from "../subjects";
import { git } from "../router";
import { Ikon, IKON, yuzde } from "../ui";
import { kursAdi } from "./Dersler";

/** Yanlış defteri: öğrencinin en çok zorlandığı bilgiler tek listede */
export function Defter({ dizin }: { dizin: Dizin }) {
  const p = useIlerleme();
  const liste = yanlisDefteri(dizin, p);
  return (
    <div className="sayfa">
      <h1 className="baslik-buyuk">Yanlış defteri</h1>
      <p className="soluk-metin alt-baslik">
        En az bir kez yanlış yaptığın bilgiler, en çok zorlandıkların başta. Doğru cevapladıkça listenin sonuna iner.
      </p>
      {liste.length === 0 ? (
        <div className="bos-durum sol">
          <p>Henüz yanlış yaptığın bir bilgi yok. Çalıştıkça zorlandığın bilgiler burada toplanacak.</p>
        </div>
      ) : (
        <>
          <button className="dugme birincil genis" onClick={() => git("/oturum?defter=1")}>
            Yanlışlarımı çöz ({Math.min(12, liste.length)} soru)
          </button>
          <ul className="ozet-liste">
            {liste.slice(0, 100).map((r) => {
              const d = p.kartlar[r.uid];
              const kurs = dizin.kitapKursu.get(r.kitap.kitap)!;
              return (
                <li key={r.uid} className="ozet-madde defter-madde" style={{ "--hue": DERSLER[kurs.ders].hue } as CSSProperties}>
                  <span className="ust-etiket">
                    {kursAdi(kurs)} · {dizin.konular.get(r.konuId)?.ad}
                  </span>
                  <p>{r.kart.bilgi}</p>
                  <div className="ozet-alt">
                    <span className="defter-sayac">
                      {d.no} yanlış · {d.ok} doğru · hatırlama {yuzde(hatirlama(d))}
                    </span>
                    <a href={kaynakLinki(r.kitap, r.kart.sayfa)} target="_blank" rel="noreferrer">
                      {r.kart.yil ? "Asıl soru" : "MEB"} · s. {r.kart.sayfa} <Ikon d={IKON.dis} boyut={12} />
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
