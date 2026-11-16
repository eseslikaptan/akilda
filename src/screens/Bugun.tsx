import type { CSSProperties } from "react";
import type { Dizin } from "../content";
import { aktifKurslar, kartlarOzet, siradakiKonu, vadeliKartlar } from "../oturum";
import { kursAdi } from "./Dersler";
import { gunAnahtari, seri, useIlerleme } from "../store";
import { DERSLER } from "../subjects";
import { git } from "../router";
import { DersRozeti, HafizaCubugu, Halka, Ikon, IKON, yuzde } from "../ui";

function selam(): string {
  const s = new Date().getHours();
  if (s < 6) return "İyi geceler";
  if (s < 12) return "Günaydın";
  if (s < 18) return "İyi günler";
  return "İyi akşamlar";
}

export function Bugun({ dizin }: { dizin: Dizin }) {
  const p = useIlerleme();
  const bugunXp = p.gunler[gunAnahtari()] ?? 0;
  const hedef = p.ayarlar.gunlukHedef;
  const gunSeri = seri(p);
  const vadeli = vadeliKartlar(dizin, p);
  const sonraki = siradakiKonu(dizin, p);
  const kurslar = aktifKurslar(dizin, p);
  const gorulenToplam = Object.keys(p.kartlar).length;

  return (
    <div className="sayfa">
      <header className="bugun-ust">
        <div>
          <p className="ust-etiket">{selam()}{p.ayarlar.ad ? `, ${p.ayarlar.ad}` : ""}</p>
          <h1 className="baslik-buyuk">Bugün ne hatırlayalım?</h1>
        </div>
        <div className="seri-rozet" title="Ardışık çalışma günü">
          <Ikon d={IKON.alev} boyut={18} />
          <strong>{gunSeri}</strong>
          <span>gün</span>
        </div>
      </header>

      <section className="hedef-kart">
        <Halka oran={bugunXp / hedef} boyut={84} kalinlik={9}>
          <strong>{Math.min(100, Math.round((bugunXp / hedef) * 100))}%</strong>
        </Halka>
        <div>
          <h2>Günlük hedef</h2>
          <p>
            {bugunXp >= hedef ? "Bugünkü hedefi tamamladın." : `${hedef - bugunXp} XP kaldı`} · {bugunXp}/{hedef} XP
          </p>
          <p className="soluk-metin">Toplam {gorulenToplam} bilgi hafızanda</p>
        </div>
      </section>

      <button
        className={`tekrar-kart ${vadeli.length ? "" : "sakin"}`}
        onClick={() => git(vadeli.length ? "/oturum?tekrar=1" : "/dersler")}
      >
        <span className="tekrar-ikon">
          <Ikon d={IKON.tekrar} boyut={26} />
        </span>
        <span className="tekrar-metin">
          <strong>{vadeli.length ? `${vadeli.length} bilgi unutulmak üzere` : "Hafızan taze"}</strong>
          <span>
            {vadeli.length
              ? `Şimdi tekrar edersen kalıcı olur · ~${Math.max(1, Math.round(Math.min(vadeli.length, 15) * 0.25))} dk`
              : "Zamanı gelen kartlar burada birikecek."}
          </span>
        </span>
        <Ikon d={IKON.ileri} />
      </button>

      {sonraki && (
        <section>
          <h2 className="bolum-baslik">Kaldığın yerden</h2>
          <button
            className="devam-kart"
            style={{ "--hue": DERSLER[sonraki.kitap.ders].hue } as CSSProperties}
            onClick={() => git(`/oturum?konu=${encodeURIComponent(sonraki.id)}`)}
          >
            <DersRozeti hue={DERSLER[sonraki.kitap.ders].hue} ikon={DERSLER[sonraki.kitap.ders].ikon} />
            <span className="devam-metin">
              <span className="ust-etiket">
                {kursAdi(dizin.kurs.get(sonraki.kursId)!)} · {sonraki.uniteSira}. Ünite
              </span>
              <strong>{sonraki.ad}</strong>
            </span>
            <span className="dugme birincil kucuk">Başla</span>
          </button>
        </section>
      )}

      <section>
        <div className="bolum-ust">
          <h2 className="bolum-baslik">Hafıza haritası</h2>
          <button className="metin-dugme" onClick={() => git("/oturum?karisik=1")}>
            <Ikon d={IKON.karisik} boyut={16} /> Karışık test
          </button>
        </div>
        {(["TYT", "AYT"] as const).map((sinav) => {
          const grup = kurslar.filter((k) => k.sinav === sinav);
          if (!grup.length) return null;
          return (
            <div key={sinav} className="harita-grup">
              <span className={`sinav-rozet ${sinav.toLowerCase()}`}>{sinav}</span>
              <div className="ders-izgara">
                {grup.map((k) => {
                  const bilgi = DERSLER[k.ders];
                  const o = kartlarOzet(k.kartlar, p);
                  return (
                    <button key={k.id} className="ders-kart" style={{ "--hue": bilgi.hue } as CSSProperties} onClick={() => git(`/kurs/${k.id}`)}>
                      <div className="ders-kart-ust">
                        <DersRozeti hue={bilgi.hue} ikon={bilgi.ikon} boyut={36} />
                        {o.vadeli > 0 && <span className="rozet uyari">{o.vadeli}</span>}
                      </div>
                      <strong>{bilgi.kisa}</strong>
                      <HafizaCubugu hafiza={o.hafiza} gorulen={o.gorulen} toplam={o.toplam} />
                      <span className="soluk-metin">
                        {o.gorulen ? `Hafıza ${yuzde(o.hafiza)} · ${o.gorulen}/${o.toplam}` : `${o.toplam} bilgi`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
