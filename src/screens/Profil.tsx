import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Dizin } from "../content";
import { aktifKurslar, kartlarOzet } from "../oturum";
import { ALANLAR, alanBilgi, alandaMi, type AlanKey } from "../kurslar";
import { kursAdi } from "./Dersler";
import { ayarlariGuncelle, disaAktar, gunAnahtari, iceAktar, seri, sifirla, sonTurBaslat, useIlerleme, yedekAlindi } from "../store";
import { dosyaIndir, kaliciDepolamaIste, kaliciMi, takvimDosyasi, uygulamaAdresi } from "../araclar";
import { net, netYaz } from "../yks";
import { ROZETLER, rutbe, seviyeHesapla } from "../rutbe";
import { dosyaPaylas, hatirlatmaKaldir, hatirlatmaKur, hatirlatmaVarMi, yerelMi } from "../yerel";
import { Kivilcim } from "../maskot";
import { seviye } from "../srs";
import { DERSLER } from "../subjects";
import { geri, git } from "../router";
import { DersRozeti, HafizaCubugu, Ikon, IKON, UstBar, yuzde } from "../ui";

export const HEDEFLER = [
  { xp: 50, ad: "Hafif", aciklama: "Günde ~5 dk" },
  { xp: 100, ad: "Düzenli", aciklama: "Günde ~10 dk" },
  { xp: 200, ad: "Yoğun", aciklama: "Günde ~20 dk" },
  { xp: 300, ad: "Sınav modu", aciklama: "Günde ~30 dk" },
];

function Isi({ gunler }: { gunler: Record<string, number> }) {
  // Son 16 hafta, pazartesiden başlayan sütunlar
  const bugun = new Date();
  const bas = new Date(bugun);
  bas.setDate(bas.getDate() - 7 * 15 - ((bugun.getDay() + 6) % 7));
  const hucreler: { k: string; xp: number; gelecek: boolean }[] = [];
  for (let d = new Date(bas); hucreler.length < 16 * 7; d.setDate(d.getDate() + 1)) {
    const k = gunAnahtari(d);
    hucreler.push({ k, xp: gunler[k] ?? 0, gelecek: d > bugun });
  }
  const seviyeAl = (xp: number) => (xp === 0 ? 0 : xp < 50 ? 1 : xp < 120 ? 2 : xp < 250 ? 3 : 4);
  return (
    <div className="isi" role="img" aria-label="Son 16 haftanın çalışma takvimi">
      {hucreler.map((h) => (
        <span key={h.k} className={`isi-hucre s${seviyeAl(h.xp)} ${h.gelecek ? "gelecek" : ""}`} title={`${h.k}: ${h.xp} XP`} />
      ))}
    </div>
  );
}

export function Profil({ dizin }: { dizin: Dizin }) {
  const p = useIlerleme();
  const dosya = useRef<HTMLInputElement>(null);
  const [mesaj, setMesaj] = useState("");
  const [sifirOnay, setSifirOnay] = useState(false);
  const seviyeler = [0, 0, 0, 0];
  Object.values(p.kartlar).forEach((d) => seviyeler[seviye(d)]++);
  const toplamKart = dizin.kartlar.size;
  seviyeler[0] = toplamKart - Object.keys(p.kartlar).length;

  const [saat, setSaat] = useState("20:00");
  const [kalici, setKalici] = useState<boolean | null>(null);
  const [bildirimVar, setBildirimVar] = useState(false);
  const [bildirimMesaj, setBildirimMesaj] = useState("");
  useEffect(() => {
    if (!yerelMi) kaliciMi().then(setKalici);
    hatirlatmaVarMi().then(setBildirimVar);
  }, []);

  const yedekIndir = async () => {
    const ad = `akilda-yedek-${gunAnahtari()}.json`;
    if (yerelMi) await dosyaPaylas(disaAktar(), ad);
    else dosyaIndir(disaAktar(), ad, "application/json");
    yedekAlindi();
    setMesaj(yerelMi ? "Yedeği Dosyalar'a kaydedebilir ya da kendine gönderebilirsin." : "Yedek indirildi.");
  };

  const yedekYukle = async (f: File) => {
    try {
      iceAktar(await f.text());
      setMesaj("Yedek yüklendi.");
    } catch (e) {
      setMesaj((e as Error).message);
    }
  };

  const kurslar = aktifKurslar(dizin, p);

  return (
    <div className="sayfa">
      <h1 className="baslik-buyuk">{p.ayarlar.ad || "Profil"}</h1>

      {(() => {
        const sv = seviyeHesapla(p.toplamXp);
        return (
          <section className="rutbe-kart">
            <Kivilcim duygu="mutlu" boyut={70} />
            <div>
              <span className="ust-etiket">Seviye {sv.seviye}</span>
              <h2>{rutbe(sv.seviye)}</h2>
              <span className="seviye-cubugu">
                <span style={{ width: `${Math.round(sv.oran * 100)}%` }} />
              </span>
              <span className="soluk-metin">
                {p.toplamXp - sv.buSeviye}/{sv.sonraki - sv.buSeviye} XP · Rütbeler: Çırak, Kalfa, Usta, Üstat, Bilge, Allâme
              </span>
            </div>
          </section>
        );
      })()}

      <section className="istatistikler">
        <div className="istat">
          <Ikon d={IKON.alev} />
          <strong>{seri(p)}</strong>
          <span>günlük seri</span>
        </div>
        <div className="istat">
          <Ikon d={IKON.yildiz} />
          <strong>{p.toplamXp}</strong>
          <span>toplam XP</span>
        </div>
        <div className="istat">
          <Ikon d={IKON.hedef} />
          <strong>{p.enUzunSeri}</strong>
          <span>en uzun seri</span>
        </div>
      </section>
      <p className="soluk-metin dondurma-bilgi">
        ❄ {p.dondurma.hak} seri dondurma hakkın var. Her 7 günlük seride 1 hak kazanırsın (en fazla 2); çalışamadığın gün
        otomatik kullanılır{p.dondurma.gunler.length ? `, şimdiye kadar ${p.dondurma.gunler.length} gün kurtardı` : ""}.
      </p>

      <section className="kutu">
        <div className="bolum-ust">
          <h2 className="bolum-baslik">Rozetler</h2>
          <span className="soluk-metin">
            {Object.keys(p.rozetler).length}/{ROZETLER.length}
          </span>
        </div>
        <ul className="rozet-izgara">
          {ROZETLER.map((r) => {
            const t = p.rozetler[r.id];
            return (
              <li key={r.id} className={t ? "kazanildi" : "kilitli"} title={r.aciklama}>
                <span className="rozet-simge">{r.simge}</span>
                <strong>{r.ad}</strong>
                <span>{t ? new Date(t).toLocaleDateString("tr-TR", { day: "numeric", month: "short" }) : r.aciklama}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="kutu">
        <h2 className="bolum-baslik">Çalışma takvimi</h2>
        <Isi gunler={p.gunler} />
      </section>

      {p.denemeler.length > 0 && (
        <section className="kutu">
          <div className="bolum-ust">
            <h2 className="bolum-baslik">Deneme netlerin</h2>
            <button className="metin-dugme" onClick={() => git("/deneme")}>
              Yeni deneme
            </button>
          </div>
          <div className="net-grafik" role="img" aria-label="Son denemelerin net yüzdeleri">
            {p.denemeler.slice(-12).map((k) => {
              const t = Object.values(k.dersler).reduce((a, x) => ({ d: a.d + x!.d, y: a.y + x!.y, n: a.n + x!.d + x!.y + x!.b }), { d: 0, y: 0, n: 0 });
              const oran = t.n ? Math.max(0, net(t.d, t.y) / t.n) : 0;
              return (
                <span key={k.tarih} className={`net-sutun ${k.sinav.toLowerCase()}`} title={`${k.sinav}: ${netYaz(net(t.d, t.y))} net / ${t.n} soru`}>
                  <span style={{ height: `${Math.max(4, oran * 100)}%` }} />
                </span>
              );
            })}
          </div>
          <p className="soluk-metin">Sütunlar netin soru sayısına oranı. Koyu: TYT, turuncu: AYT.</p>
        </section>
      )}

      <section className="kutu">
        <h2 className="bolum-baslik">Hafızadaki bilgiler</h2>
        <div className="seviye-cubuk">
          {["Yeni", "Öğreniliyor", "Pekişiyor", "Kalıcı"].map((ad, i) => (
            <div key={ad} className={`sv${i}`} style={{ flexGrow: Math.max(seviyeler[i], 0.0001) }} title={`${ad}: ${seviyeler[i]}`} />
          ))}
        </div>
        <ul className="seviye-aciklama">
          {["Yeni", "Öğreniliyor", "Pekişiyor", "Kalıcı"].map((ad, i) => (
            <li key={ad} className={`sv${i}`}>
              <span />
              {ad} <strong>{seviyeler[i]}</strong>
            </li>
          ))}
        </ul>
        <p className="soluk-metin">Kalıcı: en az 3 hafta aralıkla doğru hatırlanan bilgiler.</p>
      </section>

      <section className="kutu">
        <h2 className="bolum-baslik">Derslere göre</h2>
        <ul className="ders-ozet-liste">
          {kurslar.map((k) => {
            const o = kartlarOzet(k.kartlar, p);
            return (
              <li key={k.id} style={{ "--hue": DERSLER[k.ders].hue } as CSSProperties}>
                <DersRozeti hue={DERSLER[k.ders].hue} ikon={DERSLER[k.ders].ikon} boyut={32} />
                <div>
                  <div className="satir-ust">
                    <strong>{kursAdi(k)}</strong>
                    <span className="soluk-metin">{yuzde(o.hafiza)}</span>
                  </div>
                  <HafizaCubugu hafiza={o.hafiza} gorulen={o.gorulen} toplam={o.toplam} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="kutu">
        <h2 className="bolum-baslik">Ayarlar</h2>
        <label className="alan">
          <span>Adın</span>
          <input value={p.ayarlar.ad} maxLength={24} onChange={(e) => ayarlariGuncelle({ ad: e.target.value })} placeholder="İsteğe bağlı" />
        </label>
        <div className="alan">
          <span>Günlük hedef</span>
          <div className="secim-izgara">
            {HEDEFLER.map((h) => (
              <button key={h.xp} className={`secim ${p.ayarlar.gunlukHedef === h.xp ? "aktif" : ""}`} onClick={() => ayarlariGuncelle({ gunlukHedef: h.xp })}>
                <strong>{h.ad}</strong>
                <span>{h.xp} XP</span>
              </button>
            ))}
          </div>
        </div>
        <div className="alan">
          <span>Alanın</span>
          <AlanSecici dizin={dizin} secili={p.ayarlar.alan} onSec={(alan) => ayarlariGuncelle({ alan })} />
        </div>
        <label className="alan satir">
          <span>Sesler</span>
          <input type="checkbox" checked={p.ayarlar.ses} onChange={(e) => ayarlariGuncelle({ ses: e.target.checked })} />
        </label>
        <label className="alan satir">
          <span>
            Yazarak cevapla
            <small className="soluk-metin ayar-aciklama">Boşlukları yaz; çoktan seçmelide önce aklından cevapla, sonra şıkları gör.</small>
          </span>
          <input type="checkbox" checked={p.ayarlar.yazarak} onChange={(e) => ayarlariGuncelle({ yazarak: e.target.checked })} />
        </label>
        <div className="alan satir">
          <span>
            Son tur
            <small className="soluk-metin ayar-aciklama">
              {p.sonTur
                ? `${new Date(p.sonTur.baslangic).toLocaleDateString("tr-TR")} tarihinde başladı. Her bilgi en az bir kez sorulur.`
                : "Sınava kadar her bilgiyi en az bir kez görmek için. Son 3 haftada önerilir."}
            </small>
          </span>
          <button className="dugme ikincil kucuk" onClick={() => sonTurBaslat(!p.sonTur)}>
            {p.sonTur ? "Bitir" : "Başlat"}
          </button>
        </div>
      </section>

      <section className="kutu">
        <h2 className="bolum-baslik">Hatırlatma</h2>
        <p className="soluk-metin">
          {yerelMi
            ? "Kıvılcım her gün seçtiğin saatte bildirim gönderir."
            : "Takvimine her gün bir tekrar hatırlatması ve 2027 YKS günleri eklenir. Bildirimi telefonunun kendi takvimi gönderir."}
        </p>
        <div className="dugme-satir">
          <label className="saat-alan">
            <span>Saat</span>
            <input id="hatirlatma-saati" type="time" value={saat} onChange={(e) => setSaat(e.target.value || "20:00")} />
          </label>
          {yerelMi ? (
            <button
              className="dugme ikincil"
              onClick={async () => {
                setBildirimMesaj(await hatirlatmaKur(saat));
                setBildirimVar(await hatirlatmaVarMi());
              }}
            >
              {bildirimVar ? "Saati güncelle" : "Bildirimi aç"}
            </button>
          ) : (
            <button className="dugme ikincil" onClick={() => dosyaIndir(takvimDosyasi(saat, uygulamaAdresi()), "akilda-hatirlatma.ics", "text/calendar")}>
              Takvime ekle
            </button>
          )}
        </div>
        {yerelMi && bildirimVar && (
          <button
            className="metin-dugme"
            onClick={async () => {
              await hatirlatmaKaldir();
              setBildirimVar(false);
              setBildirimMesaj("Hatırlatma kapatıldı.");
            }}
          >
            Hatırlatmayı kapat
          </button>
        )}
        {bildirimMesaj && <p className="soluk-metin">{bildirimMesaj}</p>}
      </section>

      <section className="kutu">
        <h2 className="bolum-baslik">Verilerin</h2>
        <p className="soluk-metin">
          İlerlemen yalnızca bu {yerelMi ? "telefonda" : "cihazda"} saklanır. Cihaz değiştirirken yedek al.
          {p.sonYedek ? ` Son yedek: ${new Date(p.sonYedek).toLocaleDateString("tr-TR")}.` : " Henüz yedek almadın."}
        </p>
        <p className="soluk-metin">
          {kalici === true
            ? "Tarayıcı bu verileri kalıcı olarak saklıyor."
            : kalici === false
              ? "Tarayıcı yer açmak için verileri silebilir. "
              : ""}
          {kalici === false && (
            <button className="metin-dugme satir-ici" onClick={() => kaliciDepolamaIste().then((x) => setKalici(!!x))}>
              Kalıcı saklamayı iste
            </button>
          )}
        </p>
        <div className="dugme-satir">
          <button className="dugme ikincil" onClick={yedekIndir}>
            Yedek indir
          </button>
          <button className="dugme ikincil" onClick={() => dosya.current?.click()}>
            Yedek yükle
          </button>
          <input ref={dosya} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && yedekYukle(e.target.files[0])} />
        </div>
        {sifirOnay ? (
          <div className="dugme-satir">
            <button className="dugme ikincil" onClick={() => setSifirOnay(false)}>
              Vazgeç
            </button>
            <button
              className="dugme tehlike"
              onClick={() => {
                sifirla();
                setSifirOnay(false);
                setMesaj("İlerleme sıfırlandı.");
              }}
            >
              Evet, hepsini sil
            </button>
          </div>
        ) : (
          <button className="dugme tehlike" onClick={() => setSifirOnay(true)}>
            İlerlemeyi sıfırla
          </button>
        )}
        {mesaj && <p className="soluk-metin">{mesaj}</p>}
      </section>

      <button className="kaynak-satir" onClick={() => git("/karne")}>
        <Ikon d={IKON.yildiz} />
        <span>Haftalık karne</span>
        <Ikon d={IKON.ileri} />
      </button>
      <button className="kaynak-satir" onClick={() => git("/kaynaklar")}>
        <Ikon d={IKON.kitap} />
        <span>Kaynaklar ve hakkında</span>
        <Ikon d={IKON.ileri} />
      </button>
    </div>
  );
}

export function Kaynaklar({ dizin }: { dizin: Dizin }) {
  return (
    <div className="sayfa">
      <UstBar onGeri={() => geri("/profil")} baslik="Kaynaklar" />
      <h1 className="baslik-buyuk">Akılda hakkında</h1>
      <p>
        Akılda, YKS'ye hazırlanırken okuduğun bilgileri unutmaman için kısa sorularla hatırlatır. Her bilgi, hatırlama
        gücün azalmaya başladığı anda yeniden karşına çıkar (aralıklı tekrar).
      </p>
      <p>
        Sorular, Millî Eğitim Bakanlığının <a href="https://tymm.meb.gov.tr/ders-kitaplari/ortaogretim" target="_blank" rel="noreferrer">tymm.meb.gov.tr</a>{" "}
        adresinde ücretsiz yayımladığı ders kitaplarındaki bilgilere dayanır. Kitapların metinleri uygulamada yer almaz; her
        sorunun altında bilginin geçtiği kitap sayfasına bağlantı bulunur. Ders kitaplarının tüm hakları MEB'e aittir.
      </p>
      <p className="soluk-metin">Bir soruda hata görürsen, kaynak sayfasını kontrol edip bize bildir.</p>
      <h2 className="bolum-baslik">Kullanılan kitaplar</h2>
      <ul className="kaynak-liste">
        {dizin.kitaplar.map((k) => (
          <li key={k.kitap}>
            <a href={k.sayfaUrl} target="_blank" rel="noreferrer">
              {k.baslik} <Ikon d={IKON.dis} boyut={12} />
            </a>
            <span className="soluk-metin">
              {k.uniteler.reduce((s, u) => s + u.konular.reduce((t, x) => t + x.kartlar.length, 0), 0)} kart
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Alan seçimi: her seçeneğin altında hangi YKS derslerinin geleceği yazar */
export function AlanSecici({ dizin, secili, onSec }: { dizin: Dizin; secili: AlanKey; onSec: (a: AlanKey) => void }) {
  return (
    <div className="alan-liste" role="radiogroup">
      {ALANLAR.map((a) => {
        const ayt = dizin.kurslar.filter((k) => k.sinav === "AYT" && alandaMi(alanBilgi(a.key), k.sinav, k.ders));
        return (
          <button key={a.key} role="radio" aria-checked={secili === a.key} className={`alan-secim ${secili === a.key ? "aktif" : ""}`} onClick={() => onSec(a.key)}>
            <strong>{a.ad}</strong>
            <span>{a.key === "TYT" ? "Sadece TYT dersleri" : ayt.length ? `TYT + AYT ${ayt.map((k) => DERSLER[k.ders].kisa).join(", ")}` : a.aciklama}</span>
          </button>
        );
      })}
    </div>
  );
}
