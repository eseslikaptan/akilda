import { useState, type CSSProperties } from "react";
import type { Dizin } from "../content";
import { kaynakLinki } from "../content";
import type { DersKey } from "../types";
import { dersKartlari, kartlarOzet, konuOzet } from "../oturum";
import { useIlerleme } from "../store";
import { hatirlama, seviye } from "../srs";
import { DERSLER } from "../subjects";
import { geri, git } from "../router";
import { DersRozeti, HafizaCubugu, Ikon, IKON, UstBar, yuzde } from "../ui";

export function DersListesi({ dizin }: { dizin: Dizin }) {
  const p = useIlerleme();
  return (
    <div className="sayfa">
      <h1 className="baslik-buyuk">Dersler</h1>
      <p className="soluk-metin alt-baslik">Sorular MEB'in güncel ders kitaplarından hazırlandı.</p>
      <div className="ders-liste">
        {dizin.dersler.map((d) => {
          const b = DERSLER[d];
          const o = kartlarOzet(dersKartlari(dizin, d), p);
          const kitaplar = dizin.kitaplarByDers.get(d) ?? [];
          return (
            <button key={d} className="ders-satir" style={{ "--hue": b.hue } as CSSProperties} onClick={() => git(`/ders/${d}`)}>
              <DersRozeti hue={b.hue} ikon={b.ikon} />
              <span className="ders-satir-metin">
                <strong>{b.ad}</strong>
                <span className="soluk-metin">
                  {kitaplar.map((k) => `${k.sinif}.`).join(", ")} sınıf · {o.toplam} bilgi
                </span>
                <HafizaCubugu hafiza={o.hafiza} gorulen={o.gorulen} toplam={o.toplam} />
              </span>
              <Ikon d={IKON.ileri} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DersDetay({ dizin, ders }: { dizin: Dizin; ders: DersKey }) {
  const p = useIlerleme();
  const b = DERSLER[ders];
  const kitaplar = dizin.kitaplarByDers.get(ders) ?? [];
  const [sinif, setSinif] = useState(() => {
    // en son çalışılan kitabın sınıfı ya da ilk kitap
    const son = p.sonKonu ? dizin.konular.get(p.sonKonu) : undefined;
    return son?.kitap.ders === ders ? son.kitap.sinif : kitaplar[0]?.sinif;
  });
  const kitap = kitaplar.find((k) => k.sinif === sinif) ?? kitaplar[0];
  if (!kitap) return null;
  const konular = dizin.konularByKitap.get(kitap.kitap) ?? [];
  const o = kartlarOzet(dersKartlari(dizin, ders), p);

  const uniteler = new Map<number, typeof konular>();
  konular.forEach((k) => uniteler.set(k.uniteNo, [...(uniteler.get(k.uniteNo) ?? []), k]));

  return (
    <div className="sayfa" style={{ "--hue": b.hue } as CSSProperties}>
      <UstBar onGeri={() => geri("/dersler")} baslik={b.kisa} sag={o.vadeli > 0 ? (
        <button className="metin-dugme" onClick={() => git(`/oturum?tekrar=1&ders=${ders}`)}>
          <Ikon d={IKON.tekrar} boyut={16} /> {o.vadeli}
        </button>
      ) : undefined} />

      <section className="ders-kapak">
        <DersRozeti hue={b.hue} ikon={b.ikon} boyut={56} />
        <div>
          <h1>{b.ad}</h1>
          <p className="soluk-metin">
            Hafıza {yuzde(o.hafiza)} · {o.gorulen}/{o.toplam} bilgi görüldü
          </p>
        </div>
      </section>

      {kitaplar.length > 1 && (
        <div className="sekmeler" role="tablist">
          {kitaplar.map((k) => (
            <button key={k.kitap} role="tab" aria-selected={k.sinif === kitap.sinif} className={k.sinif === kitap.sinif ? "aktif" : ""} onClick={() => setSinif(k.sinif)}>
              {k.sinif}. sınıf
            </button>
          ))}
        </div>
      )}

      {[...uniteler.entries()].map(([no, liste]) => (
        <section key={no} className="unite">
          <header className="unite-baslik">
            <span className="unite-no">{no}. Ünite</span>
            <h2>{liste[0].uniteAd}</h2>
          </header>
          <ol className="konu-yolu">
            {liste.map((konu) => {
              const ko = konuOzet(konu, p);
              const tamam = ko.gorulen === ko.toplam;
              const durum = ko.gorulen === 0 ? "yeni" : tamam ? (ko.vadeli ? "solmus" : "tamam") : "yarim";
              return (
                <li key={konu.id} className={`konu ${durum}`}>
                  <span className="konu-nokta" aria-hidden="true">
                    {durum === "tamam" ? <Ikon d={IKON.tik} boyut={16} kalin={2.4} /> : konu.no.split(".").pop()}
                  </span>
                  <div className="konu-govde">
                    <button className="konu-ana" onClick={() => git(`/oturum?konu=${encodeURIComponent(konu.id)}`)}>
                      <strong>{konu.ad}</strong>
                      <span className="soluk-metin">
                        {ko.gorulen === 0
                          ? `${ko.toplam} bilgi · başla`
                          : ko.vadeli
                            ? `${ko.vadeli} bilgi tekrar bekliyor`
                            : `${ko.gorulen}/${ko.toplam} · hafıza ${yuzde(ko.hafiza)}`}
                      </span>
                      <HafizaCubugu hafiza={ko.hafiza} gorulen={ko.gorulen} toplam={ko.toplam} />
                    </button>
                    <button className="konu-ozet" onClick={() => git(`/ozet/${encodeURIComponent(konu.id)}`)} aria-label={`${konu.ad} özetini aç`}>
                      <Ikon d={IKON.liste} boyut={18} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ))}

      <a className="kaynak-not" href={kitap.sayfaUrl} target="_blank" rel="noreferrer">
        Kaynak: MEB {kitap.baslik} <Ikon d={IKON.dis} boyut={14} />
      </a>
    </div>
  );
}

const SEVIYE_AD = ["Yeni", "Öğreniliyor", "Pekişiyor", "Kalıcı"];

export function KonuOzeti({ dizin, konuId }: { dizin: Dizin; konuId: string }) {
  const p = useIlerleme();
  const konu = dizin.konular.get(konuId);
  if (!konu) return null;
  const b = DERSLER[konu.kitap.ders];
  return (
    <div className="sayfa" style={{ "--hue": b.hue } as CSSProperties}>
      <UstBar onGeri={() => geri(`/ders/${konu.kitap.ders}`)} baslik="Konu özeti" />
      <p className="ust-etiket">
        {b.kisa} {konu.kitap.sinif} · {konu.uniteNo}. Ünite
      </p>
      <h1 className="baslik-buyuk">{konu.ad}</h1>
      <p className="soluk-metin alt-baslik">Önce oku, sonra kendini sına. Her bilgi kitabın ilgili sayfasına bağlı.</p>
      <ul className="ozet-liste">
        {konu.kartlar.map((r) => {
          const d = p.kartlar[r.uid];
          const sv = seviye(d);
          return (
            <li key={r.uid} className={`ozet-madde sv${sv}`}>
              <p>{r.kart.bilgi}</p>
              <div className="ozet-alt">
                <span className="seviye-etiket" title={d ? `Hatırlama ${yuzde(hatirlama(d))}` : undefined}>
                  {SEVIYE_AD[sv]}
                </span>
                <a href={kaynakLinki(r.kitap, r.kart.sayfa)} target="_blank" rel="noreferrer">
                  s. {r.kart.sayfa} <Ikon d={IKON.dis} boyut={12} />
                </a>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="yapiskan-alt">
        <button className="dugme birincil genis" onClick={() => git(`/oturum?konu=${encodeURIComponent(konu.id)}`)}>
          Kendini sına
        </button>
      </div>
    </div>
  );
}
