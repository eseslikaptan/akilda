import { useState, type CSSProperties } from "react";
import type { Dizin } from "../content";
import { kaynakLinki } from "../content";
import type { Konu, Kurs } from "../types";
import { aktifKurslar, kartlarOzet, konuOzet } from "../oturum";
import { useIlerleme } from "../store";
import { hatirlama, seviye } from "../srs";
import { DERSLER } from "../subjects";
import { alanBilgi, type Sinav } from "../kurslar";
import { SORU_SAYISI } from "../yks";
import { geri, git } from "../router";
import { DersRozeti, HafizaCubugu, Ikon, IKON, UstBar, yuzde } from "../ui";

export function kursAdi(k: Pick<Kurs, "sinav" | "ders">): string {
  return `${k.sinav} ${DERSLER[k.ders].kisa}`;
}

const SINAV_ACIKLAMA: Record<Sinav, string> = {
  TYT: "Temel Yeterlilik Testi",
  AYT: "Alan Yeterlilik Testleri",
};

export function DersListesi({ dizin }: { dizin: Dizin }) {
  const p = useIlerleme();
  const aktif = new Set(aktifKurslar(dizin, p).map((k) => k.id));
  const alan = alanBilgi(p.ayarlar.alan);

  return (
    <div className="sayfa">
      <h1 className="baslik-buyuk">Dersler</h1>
      <p className="soluk-metin alt-baslik">
        Alanın: <strong>{alan.ad}</strong> · Sorular MEB'in güncel ders kitaplarından hazırlandı.
      </p>
      {(["TYT", "AYT"] as Sinav[]).map((sinav) => {
        const kurslar = dizin.kurslar.filter((k) => k.sinav === sinav);
        if (!kurslar.length) return null;
        return (
          <section key={sinav} className="sinav-bolum">
            <header className="sinav-baslik">
              <span className={`sinav-rozet ${sinav.toLowerCase()}`}>{sinav}</span>
              <span className="soluk-metin">{SINAV_ACIKLAMA[sinav]}</span>
            </header>
            <div className="ders-liste">
              {kurslar.map((k) => {
                const b = DERSLER[k.ders];
                const o = kartlarOzet(k.kartlar, p);
                return (
                  <button
                    key={k.id}
                    className={`ders-satir ${aktif.has(k.id) ? "" : "alan-disi"}`}
                    style={{ "--hue": b.hue } as CSSProperties}
                    onClick={() => git(`/kurs/${k.id}`)}
                  >
                    <DersRozeti hue={b.hue} ikon={b.ikon} />
                    <span className="ders-satir-metin">
                      <strong>{b.ad}</strong>
                      <span className="soluk-metin">
                        {SORU_SAYISI[k.sinav][k.ders] ? `Sınavda ${SORU_SAYISI[k.sinav][k.ders]} soru · ` : ""}
                        {k.konular.length} konu · {o.toplam} bilgi
                        {!aktif.has(k.id) && " · alanın dışında"}
                      </span>
                      <HafizaCubugu hafiza={o.hafiza} gorulen={o.gorulen} toplam={o.toplam} />
                    </span>
                    <Ikon d={IKON.ileri} />
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function KursDetay({ dizin, kursId }: { dizin: Dizin; kursId: string }) {
  const p = useIlerleme();
  const kurs = dizin.kurs.get(kursId);
  if (!kurs) return null;
  const b = DERSLER[kurs.ders];
  const o = kartlarOzet(kurs.kartlar, p);
  const [sekme, setSekme] = useState<"konular" | "osym">(kurs.konular.length ? "konular" : "osym");

  return (
    <div className="sayfa" style={{ "--hue": b.hue } as CSSProperties}>
      <UstBar
        onGeri={() => geri("/dersler")}
        baslik={kursAdi(kurs)}
        sag={
          o.vadeli > 0 ? (
            <button className="metin-dugme" onClick={() => git(`/oturum?tekrar=1&kurs=${kurs.id}`)}>
              <Ikon d={IKON.tekrar} boyut={16} /> {o.vadeli}
            </button>
          ) : undefined
        }
      />

      <section className="ders-kapak">
        <DersRozeti hue={b.hue} ikon={b.ikon} boyut={56} />
        <div>
          <span className={`sinav-rozet ${kurs.sinav.toLowerCase()}`}>{kurs.sinav}</span>
          <h1>{b.ad}</h1>
          <p className="soluk-metin">
            {SORU_SAYISI[kurs.sinav][kurs.ders] ? `${kurs.sinav}'de ${SORU_SAYISI[kurs.sinav][kurs.ders]} soru · ` : ""}
            Hafıza {yuzde(o.hafiza)} · {o.gorulen}/{o.toplam} bilgi görüldü
          </p>
        </div>
      </section>

      {kurs.cikmis.length > 0 && kurs.konular.length > 0 && (
        <div className="sekmeler" role="tablist">
          <button role="tab" aria-selected={sekme === "konular"} className={sekme === "konular" ? "aktif" : ""} onClick={() => setSekme("konular")}>
            Konular
          </button>
          <button role="tab" aria-selected={sekme === "osym"} className={sekme === "osym" ? "aktif" : ""} onClick={() => setSekme("osym")}>
            ÖSYM'de çıkanlar
          </button>
        </div>
      )}

      {sekme === "osym" ? <OsymBolumu kurs={kurs} /> : <>
      <button className="karisik-satir" onClick={() => git(`/oturum?karisik=1&kurs=${kurs.id}`)}>
        <Ikon d={IKON.karisik} boyut={18} />
        <span>
          <strong>Karışık test</strong>
          <span className="soluk-metin">Bu dersin {o.gorulen >= 6 ? "gördüğün" : "tüm"} konularından rastgele 12 soru</span>
        </span>
        <Ikon d={IKON.ileri} boyut={18} />
      </button>

      {kurs.uniteler.map((unite) => (
        <section key={unite.sira} className="unite">
          <header className="unite-baslik">
            <span className="unite-no">{unite.sira}. Ünite</span>
            <h2>{unite.ad}</h2>
          </header>
          <ol className="konu-yolu">
            {unite.konular.map((konu) => {
              const ko = konuOzet(konu, p);
              const tamam = ko.gorulen === ko.toplam;
              const durum = ko.gorulen === 0 ? "yeni" : tamam ? (ko.vadeli ? "solmus" : "tamam") : "yarim";
              return (
                <li key={konu.id} className={`konu ${durum}`}>
                  <span className="konu-nokta" aria-hidden="true">
                    {durum === "tamam" ? <Ikon d={IKON.tik} boyut={16} kalin={2.4} /> : konu.konuSira}
                  </span>
                  <div className="konu-govde">
                    <button className="konu-ana" onClick={() => git(`/oturum?konu=${encodeURIComponent(konu.id)}`)}>
                      <strong>
                        {konu.ad}
                        {!!konu.osymSoru && <span className="osym-rozet" title="Bu konuyla eşleşen 2018–2026 çıkmış soru sayısı">ÖSYM {konu.osymSoru}</span>}
                      </strong>
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

      <p className="kaynak-not">Kaynak: MEB {b.ad} ders kitapları</p>
      </>}
    </div>
  );
}

/** Dersin ÖSYM çıkmış sorularından çıkarılmış bilgileri: en çok soru çıkan başlıklar önce */
function OsymBolumu({ kurs }: { kurs: Kurs }) {
  const p = useIlerleme();
  const kitap = kurs.cikmisKitap!;
  const enCok = Math.max(1, ...kurs.cikmis.map((k) => k.soruSayisi ?? 0));
  const sirali = [...kurs.cikmis].sort((a, b) => (b.soruSayisi ?? 0) - (a.soruSayisi ?? 0));
  const kartSayisi = kurs.cikmis.reduce((t, k) => t + k.kartlar.length, 0);
  return (
    <>
      <section className="osym-kapak">
        <div className="osym-sayi">
          <strong>{kurs.cikmisSoru}</strong>
          <span>soru</span>
        </div>
        <div>
          <h2>2018–2026 {kurs.sinav} sınavlarında</h2>
          <p className="soluk-metin">
            ÖSYM'nin bu dersten sorduğu bilgilerden {kartSayisi} kart. Her kart, asıl sorunun MEB'in resmî çıkmış
            sorular kitabındaki sayfasına bağlı.
          </p>
        </div>
      </section>
      <div className="dugme-satir">
        <button className="dugme birincil" onClick={() => git(`/oturum?cikmis=1&kurs=${kurs.id}`)}>
          Çıkmış bilgileri çalış
        </button>
      </div>
      <div className="osym-baglantilar">
        <a href={kitap.pdfUrl} target="_blank" rel="noreferrer">
          MEB çıkmış soru kitabı (PDF) <Ikon d={IKON.dis} boyut={14} />
        </a>
        {kitap.testUrl && (
          <a href={kitap.testUrl} target="_blank" rel="noreferrer">
            MEB'de çevrim içi çöz <Ikon d={IKON.dis} boyut={14} />
          </a>
        )}
      </div>
      <h2 className="bolum-baslik">En çok soru çıkan konular</h2>
      <ul className="osym-liste">
        {sirali.map((konu) => (
          <OsymSatir key={konu.id} konu={konu} enCok={enCok} hafiza={konuOzet(konu, p).hafiza} />
        ))}
      </ul>
    </>
  );
}

function OsymSatir({ konu, enCok, hafiza }: { konu: Konu; enCok: number; hafiza: number }) {
  const n = konu.soruSayisi ?? 0;
  return (
    <li className="osym-satir">
      <button className="osym-ana" onClick={() => git(`/oturum?konu=${encodeURIComponent(konu.id)}`)}>
        <span className="osym-ust">
          <strong>{konu.ad}</strong>
          <span className="osym-adet">{n} soru</span>
        </span>
        <span className="osym-cubuk" aria-hidden="true">
          <span style={{ width: `${(n / enCok) * 100}%` }} />
        </span>
        <span className="soluk-metin">
          {konu.uniteAd} · {konu.kartlar.length} bilgi{hafiza > 0 ? ` · hafıza ${yuzde(hafiza)}` : ""}
        </span>
      </button>
      <button className="konu-ozet" onClick={() => git(`/ozet/${encodeURIComponent(konu.id)}`)} aria-label={`${konu.ad} özetini aç`}>
        <Ikon d={IKON.liste} boyut={18} />
      </button>
    </li>
  );
}

const SEVIYE_AD = ["Yeni", "Öğreniliyor", "Pekişiyor", "Kalıcı"];

export function KonuOzeti({ dizin, konuId }: { dizin: Dizin; konuId: string }) {
  const p = useIlerleme();
  const konu = dizin.konular.get(konuId);
  if (!konu) return null;
  const kurs = dizin.kurs.get(konu.kursId)!;
  const b = DERSLER[kurs.ders];
  return (
    <div className="sayfa" style={{ "--hue": b.hue } as CSSProperties}>
      <UstBar onGeri={() => geri(`/kurs/${kurs.id}`)} baslik={konu.cikmis ? "ÖSYM'de çıkanlar" : "Konu özeti"} />
      <p className="ust-etiket">
        {kursAdi(kurs)} · {konu.cikmis ? `${konu.soruSayisi} çıkmış soru` : `${konu.uniteSira}. Ünite`}
      </p>
      <h1 className="baslik-buyuk">{konu.ad}</h1>
      <p className="soluk-metin alt-baslik">Önce oku, sonra kendini sına. Her bilgi MEB ders kitabının ilgili sayfasına bağlı.</p>
      <ul className="ozet-liste">
        {konu.kartlar.map((r) => {
          const d = p.kartlar[r.uid];
          const sv = seviye(d);
          return (
            <li key={r.uid} className={`ozet-madde sv${sv}`}>
              <p>{r.kart.bilgi}</p>
              {r.kart.yil && <span className="yil-rozet">{r.kart.yil.replace("-", " ")}'de soruldu</span>}
              <div className="ozet-alt">
                <span className="seviye-etiket" title={d ? `Hatırlama ${yuzde(hatirlama(d))}` : undefined}>
                  {SEVIYE_AD[sv]}
                </span>
                <a href={kaynakLinki(r.kitap, r.kart.sayfa)} target="_blank" rel="noreferrer" title={r.kitap.baslik}>
                  {r.kart.yil ? "Asıl soru" : "MEB"} · s. {r.kart.sayfa} <Ikon d={IKON.dis} boyut={12} />
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
