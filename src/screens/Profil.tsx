import { useRef, useState, type CSSProperties } from "react";
import type { Dizin } from "../content";
import type { DersKey } from "../types";
import { dersKartlari, kartlarOzet } from "../oturum";
import { ayarlariGuncelle, disaAktar, gunAnahtari, iceAktar, seri, sifirla, useIlerleme } from "../store";
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

  const yedekIndir = () => {
    const blob = new Blob([disaAktar()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `akilda-yedek-${gunAnahtari()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const yedekYukle = async (f: File) => {
    try {
      iceAktar(await f.text());
      setMesaj("Yedek yüklendi.");
    } catch (e) {
      setMesaj((e as Error).message);
    }
  };

  const dersSec = (d: DersKey) => {
    const mevcut = p.ayarlar.dersler.length ? p.ayarlar.dersler : dizin.dersler;
    const yeni = mevcut.includes(d) ? mevcut.filter((x) => x !== d) : [...mevcut, d];
    ayarlariGuncelle({ dersler: yeni.length === dizin.dersler.length ? [] : yeni });
  };
  const seciliMi = (d: DersKey) => !p.ayarlar.dersler.length || p.ayarlar.dersler.includes(d);

  return (
    <div className="sayfa">
      <h1 className="baslik-buyuk">{p.ayarlar.ad || "Profil"}</h1>

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

      <section className="kutu">
        <h2 className="bolum-baslik">Çalışma takvimi</h2>
        <Isi gunler={p.gunler} />
      </section>

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
          {dizin.dersler.map((d) => {
            const o = kartlarOzet(dersKartlari(dizin, d), p);
            return (
              <li key={d} style={{ "--hue": DERSLER[d].hue } as CSSProperties}>
                <DersRozeti hue={DERSLER[d].hue} ikon={DERSLER[d].ikon} boyut={32} />
                <div>
                  <div className="satir-ust">
                    <strong>{DERSLER[d].kisa}</strong>
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
          <span>Tekrar ve karışık testlere dahil dersler</span>
          <div className="cipler sol">
            {dizin.dersler.map((d) => (
              <button key={d} className={`cip ${seciliMi(d) ? "secili" : ""}`} aria-pressed={seciliMi(d)} onClick={() => dersSec(d)}>
                {DERSLER[d].kisa}
              </button>
            ))}
          </div>
        </div>
        <label className="alan satir">
          <span>Sesler</span>
          <input type="checkbox" checked={p.ayarlar.ses} onChange={(e) => ayarlariGuncelle({ ses: e.target.checked })} />
        </label>
      </section>

      <section className="kutu">
        <h2 className="bolum-baslik">Verilerin</h2>
        <p className="soluk-metin">İlerlemen yalnızca bu cihazda saklanır. Cihaz değiştirirken yedek al.</p>
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
