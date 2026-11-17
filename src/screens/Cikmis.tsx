// Çıkmış sorular yıl yıl: her sınav yılında ÖSYM'nin sorduğu bilgiler.
import { useState, type CSSProperties } from "react";
import type { Dizin } from "../content";
import { kartlarOzet, yilOzetleri, type YilOzeti } from "../oturum";
import { useIlerleme } from "../store";
import { DERSLER } from "../subjects";
import type { DersKey } from "../types";
import { geri, git } from "../router";
import { HafizaCubugu, Ikon, IKON, UstBar, yuzde } from "../ui";
import { Kivilcim } from "../maskot";
import { kursAdi } from "./Dersler";

type Filtre = "hepsi" | "TYT" | "AYT";

/** Bir yıl satırı: yıl, sınav, ders dağılımı ve ilerleme */
export function YilSatiri({ o, kursId }: { o: YilOzeti; kursId?: string }) {
  const p = useIlerleme();
  const oz = kartlarOzet(o.kartlar, p);
  const hedef = kursId ? `/oturum?yil=${o.yil}&kurs=${kursId}` : `/cikmis/${o.yil}`;
  return (
    <li>
      <button className={`yil-kart ${oz.gorulen === oz.toplam && oz.toplam ? "bitti" : ""}`} onClick={() => git(hedef)}>
        <span className="yil-sol">
          <strong className="yil-sayi">{o.yilSayi}</strong>
          <span className={`sinav-rozet ${o.sinav.toLowerCase()}`}>{o.sinav}</span>
        </span>
        <span className="yil-sag">
          <span className="yil-ust">
            <strong>{o.kartlar.length} bilgi</strong>
            <span className="soluk-metin">
              {oz.gorulen ? `${oz.gorulen}/${oz.toplam} görüldü · hafıza ${yuzde(oz.hafiza)}` : "Henüz başlanmadı"}
            </span>
          </span>
          {!kursId && (
            <span className="yil-dersler">
              {o.dersler.map((x) => (
                <span key={x.kursId} className="yil-ders" style={{ "--hue": DERSLER[x.ders as DersKey].hue } as CSSProperties}>
                  {DERSLER[x.ders as DersKey].kisa} {x.adet}
                </span>
              ))}
            </span>
          )}
          <HafizaCubugu hafiza={oz.hafiza} gorulen={oz.gorulen} toplam={oz.toplam} />
        </span>
        <Ikon d={IKON.ileri} />
      </button>
    </li>
  );
}

export function CikmisYillar({ dizin }: { dizin: Dizin }) {
  const p = useIlerleme();
  const [filtre, setFiltre] = useState<Filtre>("hepsi");
  const tum = yilOzetleri(dizin, p);
  const liste = tum.filter((o) => filtre === "hepsi" || o.sinav === filtre);
  const toplam = tum.reduce((t, o) => t + o.kartlar.length, 0);
  const oz = kartlarOzet(
    tum.flatMap((o) => o.kartlar),
    p,
  );

  return (
    <div className="sayfa">
      <h1 className="baslik-buyuk">Çıkmış sorular</h1>
      <div className="maskot-konusma">
        <Kivilcim duygu="selam" boyut={56} />
        <p className="balon">
          2018'den 2026'ya her YKS'de ÖSYM'nin sorduğu {toplam} bilgi burada. Bir yılı seç, o sınavın bilgileriyle kendini dene.
        </p>
      </div>
      <section className="kutu cikmis-ozet">
        <div className="satir-ust">
          <strong>Toplam ilerleme</strong>
          <span className="soluk-metin">
            {oz.gorulen}/{oz.toplam} · hafıza {yuzde(oz.hafiza)}
          </span>
        </div>
        <HafizaCubugu hafiza={oz.hafiza} gorulen={oz.gorulen} toplam={oz.toplam} />
      </section>
      <div className="sekmeler" role="tablist">
        {(["hepsi", "TYT", "AYT"] as Filtre[]).map((f) => (
          <button key={f} role="tab" aria-selected={filtre === f} className={filtre === f ? "aktif" : ""} onClick={() => setFiltre(f)}>
            {f === "hepsi" ? "Hepsi" : f}
          </button>
        ))}
      </div>
      <ul className="yil-liste">
        {liste.map((o) => (
          <YilSatiri key={o.yil} o={o} />
        ))}
      </ul>
      <p className="kaynak-not">Sorular: MEB YKS Çıkmış Soru Kitapları (2018–2026). Soru metinleri ÖSYM'ye aittir; burada yalnızca ölçülen bilgiler var.</p>
    </div>
  );
}

export function CikmisYil({ dizin, yil }: { dizin: Dizin; yil: string }) {
  const p = useIlerleme();
  const o = yilOzetleri(dizin, p).find((x) => x.yil === yil);
  if (!o) return null;
  const oz = kartlarOzet(o.kartlar, p);
  const kaynak = dizin.kurs.get(o.dersler[0]?.kursId)?.cikmisKitap;
  return (
    <div className="sayfa">
      <UstBar onGeri={() => geri("/cikmis")} baslik={`${o.yilSayi} ${o.sinav}`} />
      <section className="yil-kapak">
        <div className="osym-sayi">
          <strong>{o.yilSayi}</strong>
          <span>{o.sinav}</span>
        </div>
        <div>
          <h1>{o.yilSayi} YKS {o.sinav === "TYT" ? "Temel Yeterlilik Testi" : "Alan Yeterlilik Testleri"}</h1>
          <p className="soluk-metin">
            ÖSYM'nin bu sınavda sorduğu {o.kartlar.length} bilgi · {oz.gorulen}/{oz.toplam} görüldü
          </p>
        </div>
      </section>
      <button className="dugme birincil genis" onClick={() => git(`/oturum?yil=${o.yil}`)}>
        {oz.gorulen === 0 ? "Bu yılı çalış" : oz.gorulen < oz.toplam ? "Kaldığın yerden devam" : "Tekrar et"} (15 soru)
      </button>
      <h2 className="bolum-baslik">Derslere göre</h2>
      <ul className="ozet-liste">
        {o.dersler.map((x) => {
          const kurs = dizin.kurs.get(x.kursId)!;
          const kartlar = o.kartlar.filter((r) => dizin.kitapKursu.get(r.kitap.kitap)?.id === x.kursId);
          const ko = kartlarOzet(kartlar, p);
          return (
            <li key={x.kursId} style={{ "--hue": DERSLER[x.ders as DersKey].hue } as CSSProperties}>
              <button className="yil-ders-satir" onClick={() => git(`/oturum?yil=${o.yil}&kurs=${x.kursId}`)}>
                <span className="satir-ust">
                  <strong>{kursAdi(kurs)}</strong>
                  <span className="soluk-metin">{x.adet} bilgi</span>
                </span>
                <HafizaCubugu hafiza={ko.hafiza} gorulen={ko.gorulen} toplam={ko.toplam} />
              </button>
            </li>
          );
        })}
      </ul>
      {kaynak && (
        <div className="osym-baglantilar">
          <a href={kaynak.pdfUrl} target="_blank" rel="noreferrer">
            MEB çıkmış soru kitabı (PDF) <Ikon d={IKON.dis} boyut={14} />
          </a>
          {kaynak.testUrl && (
            <a href={kaynak.testUrl} target="_blank" rel="noreferrer">
              MEB'de çevrim içi çöz <Ikon d={IKON.dis} boyut={14} />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
