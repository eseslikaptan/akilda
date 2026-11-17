import { useState, type CSSProperties } from "react";
import type { Dizin } from "../content";
import { aktifKurslar, kartlarOzet, siradakiKonu, sonTurDurumu, vadeliKartlar } from "../oturum";
import { kursAdi } from "./Dersler";
import { gunAnahtari, seri, seriTehlikede, sonTurBaslat, useIlerleme } from "../store";
import { gunKaldi, gunlukYeniHedef } from "../yks";
import { anaEkrandaMi, iosMu } from "../araclar";
import { Kivilcim, type Duygu } from "../maskot";
import { rutbe, seviyeHesapla } from "../rutbe";
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
  const cikmisSoru = kurslar.reduce((t, k) => t + (k.cikmis.some((c) => c.kartlar.length) ? k.cikmisSoru : 0), 0);
  const gorulenToplam = Object.keys(p.kartlar).length;
  const kalan = gunKaldi();
  const gorulmemis = kurslar.reduce((t, k) => t + k.kartlar.filter((r) => !p.kartlar[r.uid]).length, 0);
  const yeniHedef = gunlukYeniHedef(gorulmemis, kalan);
  const bugunYeni = p.yeniler[gunAnahtari()] ?? 0;
  const birikti = vadeli.length > 80;
  const sonTur = p.sonTur ? sonTurDurumu(dizin, p) : undefined;
  const sonTurGunluk = sonTur ? Math.ceil(sonTur.kalan / Math.max(1, kalan)) : 0;
  const [iosGizle, setIosGizle] = useState(() => {
    try {
      return localStorage.getItem("akilda:ios-ipucu") === "1";
    } catch {
      return false;
    }
  });
  const iosIpucu = !iosGizle && iosMu() && !anaEkrandaMi();
  const sv = seviyeHesapla(p.toplamXp);
  // Kıvılcım'ın bugünkü sözü: durumun en önemlisi
  const [soz, duygu]: [string, Duygu] =
    seriTehlikede(p) && new Date().getHours() >= 17
      ? [`${gunSeri} günlük serin tehlikede! Kısa bir ders yeter.`, "dusunceli"]
      : bugunXp >= hedef
        ? ["Helal olsun, bugünkü hedef tamam! İstersen biraz daha.", "coskulu"]
        : vadeli.length > 0
          ? [`${vadeli.length} bilgi unutulmak üzere. Hadi kurtaralım!`, "selam"]
          : gunSeri >= 3
            ? [`${gunSeri} gündür buradasın, aferin! Bugün de yapalım.`, "mutlu"]
            : gorulenToplam === 0
              ? ["Merhaba! Ben Kıvılcım. İlk dersin 3 dakika sürer.", "selam"]
              : ["Hadi, bugün birkaç bilgi daha akılda kalsın.", "selam"];
  const yedekGerekli = gorulenToplam >= 50 && (!p.sonYedek || Date.now() - p.sonYedek > 14 * 86_400_000) && !iosIpucu;

  return (
    <div className="sayfa">
      <header className="bugun-ust">
        <div>
          <p className="ust-etiket">{selam()}{p.ayarlar.ad ? `, ${p.ayarlar.ad}` : ""}</p>
          <button className="rutbe-cip" onClick={() => git("/profil")} title={`${sv.sonraki - p.toplamXp} XP sonra seviye ${sv.seviye + 1}`}>
            <strong>{rutbe(sv.seviye)}</strong> · Sv {sv.seviye}
            <span className="rutbe-cip-cubuk">
              <span style={{ width: `${Math.round(sv.oran * 100)}%` }} />
            </span>
          </button>
        </div>
        <div className="seri-rozet" title={`Ardışık çalışma günü · ${p.dondurma.hak} seri dondurma hakkı`}>
          <Ikon d={IKON.alev} boyut={18} />
          <strong>{gunSeri}</strong>
          <span>gün</span>
          {p.dondurma.hak > 0 && <span className="dondurma" aria-label={`${p.dondurma.hak} dondurma hakkı`}>❄{p.dondurma.hak}</span>}
        </div>
      </header>

      <div className="maskot-konusma">
        <Kivilcim duygu={duygu} boyut={64} className="sallan" />
        <p className="balon">{soz}</p>
      </div>

      {iosIpucu && (
        <div className="uyari-serit">
          <p>
            <strong>İlerlemen silinmesin:</strong> Safari'de Paylaş düğmesine dokun, sonra <strong>Ana Ekrana Ekle</strong>. Ana ekrandan açılan
            uygulamanın verileri Safari'nin 7 günlük temizliğine takılmaz.
          </p>
          <button
            className="metin-dugme"
            onClick={() => {
              setIosGizle(true);
              try {
                localStorage.setItem("akilda:ios-ipucu", "1");
              } catch {
                /* önemli değil */
              }
            }}
          >
            Tamam
          </button>
        </div>
      )}
      {yedekGerekli && (
        <button className="uyari-serit" onClick={() => git("/profil")}>
          <p>
            <strong>{gorulenToplam} bilgi</strong> hafızanda ve ilerlemen sadece bu cihazda. Profil'den yedek almayı unutma.
          </p>
        </button>
      )}

      <section className="sayac-kart">
        <div className="sayac-sayi">
          <strong>{kalan}</strong>
          <span>gün</span>
        </div>
        <div className="sayac-metin">
          <h2>2027 YKS'ye</h2>
          <p className="soluk-metin">TYT 19 Haziran, AYT 20 Haziran</p>
          {birikti ? (
            <p className="tempo uyari">Tekrarlar birikti. Bugün yeni konu yerine önce tekrarları erit.</p>
          ) : yeniHedef > 0 ? (
            <p className="tempo">
              Bu tempoyla her şeyi sınavdan 3 hafta önce bitirmek için günde <strong>{yeniHedef} yeni bilgi</strong>. Bugün:{" "}
              <strong className={bugunYeni >= yeniHedef ? "tamam" : ""}>{bugunYeni}</strong>
            </p>
          ) : (
            <p className="tempo">Tüm bilgileri gördün. Artık sadece tekrar.</p>
          )}
        </div>
      </section>

      {sonTur ? (
        <button className="son-tur-kart" onClick={() => git("/oturum?sontur=1")}>
          <span className="son-tur-ust">
            <strong>Son tur</strong>
            <span>
              {sonTur.tamam}/{sonTur.toplam}
            </span>
          </span>
          <span className="son-tur-cubuk" aria-hidden="true">
            <span style={{ width: `${(sonTur.tamam / Math.max(1, sonTur.toplam)) * 100}%` }} />
          </span>
          <span className="soluk-metin">
            {sonTur.kalan === 0
              ? "Her bilgiyi en az bir kez gördün. Artık yalnızca zamanı gelen tekrarlar."
              : `Sınava kadar her bilgiyi bir kez görmek için günde ~${sonTurGunluk} bilgi. En zayıf hatırladıkların önce gelir.`}
          </span>
        </button>
      ) : (
        kalan <= 21 && (
          <div className="uyari-serit">
            <p>
              <strong>Son 3 hafta:</strong> Sınavdan önce her bilgiyi en az bir kez görmek için son turu başlat.
            </p>
            <button className="metin-dugme" onClick={() => sonTurBaslat(true)}>
              Başlat
            </button>
          </div>
        )
      )}

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
          {seriTehlikede(p) && new Date().getHours() >= 18 && (
            <p className="seri-uyari">
              Bugün çalışmazsan {p.dondurma.hak > 0 ? "dondurma hakkın kullanılacak" : `${gunSeri} günlük serin bozulacak`}.
            </p>
          )}
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

      <div className="arac-satir">
        <button className="arac" onClick={() => git("/deneme")}>
          <Ikon d={IKON.hedef} />
          <span>
            <strong>Deneme</strong>
            <span className="soluk-metin">Süreli, netli</span>
          </span>
        </button>
        <button className="arac" onClick={() => git("/defter")}>
          <Ikon d={IKON.liste} />
          <span>
            <strong>Yanlış defteri</strong>
            <span className="soluk-metin">{Object.values(p.kartlar).filter((k) => k.no > 0).length} bilgi</span>
          </span>
        </button>
        {dizin.karisanlar.length > 0 && (
          <button className="arac" onClick={() => git("/karisanlar")}>
            <Ikon d={IKON.karisik} />
            <span>
              <strong>Karıştırılanlar</strong>
              <span className="soluk-metin">{dizin.karisanlar.length} set</span>
            </span>
          </button>
        )}
        <button className="arac" onClick={() => git("/karne")}>
          <Ikon d={IKON.yildiz} />
          <span>
            <strong>Haftalık karne</strong>
            <span className="soluk-metin">Paylaş</span>
          </span>
        </button>
      </div>

      {cikmisSoru > 0 && (
        <button className="osym-kisayol" onClick={() => git("/oturum?cikmis=1")}>
          <span className="osym-sayi kucuk">
            <strong>{cikmisSoru}</strong>
            <span>soru</span>
          </span>
          <span className="tekrar-metin">
            <strong>ÖSYM'de çıkan bilgiler</strong>
            <span className="soluk-metin">2018–2026 YKS'de sorulan bilgilerden 12 soruluk tur</span>
          </span>
          <Ikon d={IKON.ileri} />
        </button>
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
