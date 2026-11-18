// YKS bilgi denemesi: ÖSYM'nin ders dağılımında, süreli, boş bırakılabilen, net hesaplı mini deneme.
// Sorular yalnızca çoktan seçmeli kartlardan seçilir; geri bildirim sınav bitince verilir.
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { Dizin } from "../content";
import { kaynakLinki } from "../content";
import type { DersKey, KartRef, SecmeliKart } from "../types";
import { aktifKurslar, karistir } from "../oturum";
import { cevapKaydet, denemeKaydet, ilerleme, rozetleriKaydet, useIlerleme, xpEkle } from "../store";
import { yeniRozetler } from "../rutbe";
import { bildir } from "../bildirim";
import { Kivilcim } from "../maskot";
import { konfeti } from "../konfeti";
import { DERSLER } from "../subjects";
import { SORU_SAYISI, net, netYaz } from "../yks";
import type { Sinav } from "../kurslar";
import { git } from "../router";
import { HARFLER, SoruMetni, sikSirasi } from "../sorular";
import { Ikon, IKON } from "../ui";
import { kursAdi } from "./Dersler";

const SN_SORU = 82; // TYT: 165 dk / 120 soru ≈ 82 sn; sorular YKS biçiminde

interface DenemeSoru {
  ref: KartRef;
  ders: DersKey;
  secenekler: string[];
  dogruMetin: string;
}

export function denemeSorulari(d: Dizin, sinav: Sinav, olcek: number): DenemeSoru[] {
  const p = ilerleme();
  const kurslar = aktifKurslar(d, p).filter((k) => k.sinav === sinav);
  const sorular: DenemeSoru[] = [];
  for (const k of kurslar) {
    const adet = Math.max(2, Math.round((SORU_SAYISI[sinav][k.ders] ?? 4) * olcek));
    const havuz = karistir(k.kartlar.filter((r) => r.kart.tur === "secmeli"));
    for (const ref of havuz.slice(0, adet)) {
      const kart = ref.kart as SecmeliKart;
      sorular.push({ ref, ders: k.ders, secenekler: sikSirasi(kart), dogruMetin: kart.secenekler[kart.dogru] });
    }
  }
  return sorular; // ders sırasıyla, gerçek kitapçıktaki gibi
}

export function DenemeSecim({ dizin }: { dizin: Dizin }) {
  const p = useIlerleme();
  const kurslar = aktifKurslar(dizin, p);
  const sinavlar = (["TYT", "AYT"] as Sinav[]).filter((s) => kurslar.some((k) => k.sinav === s));
  const son = p.denemeler.slice(-5).reverse();
  return (
    <div className="sayfa">
      <h1 className="baslik-buyuk">YKS bilgi denemesi</h1>
      <p className="soluk-metin alt-baslik">
        ÖSYM'nin ders dağılımında, süreli. Boş bırakabilirsin; net = doğru − yanlış ÷ 4. Cevaplar sınav bitince açıklanır.
      </p>
      {sinavlar.map((s) => {
        const dersler = kurslar.filter((k) => k.sinav === s);
        return (
          <section key={s} className="kutu">
            <div className="satir-ust">
              <span className={`sinav-rozet ${s.toLowerCase()}`}>{s}</span>
              <span className="soluk-metin">{dersler.map((k) => `${DERSLER[k.ders].kisa} ${SORU_SAYISI[s][k.ders] ?? "-"}`).join(" · ")}</span>
            </div>
            <div className="dugme-satir">
              <button className="dugme ikincil" onClick={() => git(`/deneme?sinav=${s}&olcek=0.5`)}>
                Yarım deneme
              </button>
              <button className="dugme birincil" onClick={() => git(`/deneme?sinav=${s}&olcek=1`)}>
                Tam deneme
              </button>
            </div>
          </section>
        );
      })}
      {son.length > 0 && (
        <section className="kutu">
          <h2 className="bolum-baslik">Son denemelerin</h2>
          <ul className="deneme-gecmis">
            {son.map((k) => {
              const toplam = Object.values(k.dersler).reduce((t, x) => ({ d: t.d + x!.d, y: t.y + x!.y, b: t.b + x!.b }), { d: 0, y: 0, b: 0 });
              return (
                <li key={k.tarih}>
                  <span className={`sinav-rozet ${k.sinav.toLowerCase()}`}>{k.sinav}</span>
                  <span>{new Date(k.tarih).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}</span>
                  <strong>{netYaz(net(toplam.d, toplam.y))} net</strong>
                  <span className="soluk-metin">
                    {toplam.d}D {toplam.y}Y {toplam.b}B
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

export function Deneme({ dizin, sinav, olcek }: { dizin: Dizin; sinav: Sinav; olcek: number }) {
  const sorular = useMemo(() => denemeSorulari(dizin, sinav, olcek), []); // eslint-disable-line react-hooks/exhaustive-deps
  const sure = sorular.length * SN_SORU;
  const [i, setI] = useState(0);
  const [cevaplar, setCevaplar] = useState<(string | null)[]>(() => sorular.map(() => null));
  const [kalan, setKalan] = useState(sure);
  const [bitti, setBitti] = useState(false);
  const [onay, setOnay] = useState(false);
  const baslangic = useRef(Date.now());

  useEffect(() => {
    if (bitti) return;
    const t = setInterval(() => {
      const k = sure - Math.floor((Date.now() - baslangic.current) / 1000);
      setKalan(k);
      if (k <= 0) bitir();
    }, 1000);
    return () => clearInterval(t);
  });

  function bitir() {
    if (bitti) return;
    setBitti(true);
    const dersler: Partial<Record<DersKey, { d: number; y: number; b: number }>> = {};
    let xp = 0;
    sorular.forEach((s, j) => {
      const c = cevaplar[j];
      const r = (dersler[s.ders] ??= { d: 0, y: 0, b: 0 });
      if (c === null) r.b++;
      else if (c === s.dogruMetin) {
        r.d++;
        xp += 10;
      } else r.y++;
      // Deneme de bir geri çağırma pratiği: sonuçlar hafıza modeline işlenir (boş = bilinmiyor)
      cevapKaydet(s.ref.uid, c === s.dogruMetin);
    });
    denemeKaydet({ tarih: Date.now(), sinav, sureSn: Math.round((Date.now() - baslangic.current) / 1000), dersler });
    xpEkle(xp);
    const rozetler = yeniRozetler(ilerleme(), dizin, { saat: new Date().getHours() });
    rozetleriKaydet(rozetler.map((r) => r.id));
    rozetler.forEach((r, j) => setTimeout(() => bildir({ baslik: `Yeni rozet: ${r.ad}`, alt: r.aciklama, simge: r.simge }), 800 + j * 900));
  }

  if (!sorular.length)
    return (
      <div className="oturum bos-oturum">
        <div className="bos-durum">
          <h2>Bu sınav için soru yok</h2>
          <button className="dugme birincil" onClick={() => git("/deneme", true)}>
            Geri dön
          </button>
        </div>
      </div>
    );

  if (bitti) return <DenemeSonuc sorular={sorular} cevaplar={cevaplar} sinav={sinav} dizin={dizin} />;

  const s = sorular[i];
  const kart = s.ref.kart as SecmeliKart;
  const dk = Math.floor(Math.max(0, kalan) / 60);
  const sn = Math.max(0, kalan) % 60;
  const sec = (metin: string | null) => setCevaplar((c) => c.map((x, j) => (j === i ? metin : x)));

  return (
    <div className="oturum deneme" style={{ "--hue": DERSLER[s.ders].hue } as CSSProperties}>
      <div className="oturum-ust">
        <button className="ikon-dugme" onClick={() => git("/deneme", true)} aria-label="Denemeden çık">
          <Ikon d={IKON.kapat} />
        </button>
        <span className={`deneme-sure ${kalan < 60 ? "az" : ""}`}>
          {dk}:{String(sn).padStart(2, "0")}
        </span>
        <span className="soluk-metin">
          {i + 1}/{sorular.length}
        </span>
        <button className="metin-dugme" onClick={() => setOnay(true)}>
          Bitir
        </button>
      </div>

      <main className="soru-alani" key={i}>
        <div className="soru-ust">
          <span className="soru-etiket">
            {sinav} · {DERSLER[s.ders].kisa}
          </span>
          {kart.yil && <span className="yil-rozet">{kart.yil.replace("-", " ")}</span>}
        </div>
        <SoruMetni kart={kart} />
        <div className="secenekler">
          {s.secenekler.map((m, j) => (
            <button key={m} className={`secenek ${cevaplar[i] === m ? "isaretli" : ""}`} onClick={() => sec(cevaplar[i] === m ? null : m)}>
              <span className="sik-harf">{HARFLER[j]}</span>
              <span>{m}</span>
            </button>
          ))}
        </div>
      </main>

      <footer className="deneme-alt">
        <button className="dugme hayalet" disabled={i === 0} onClick={() => setI(i - 1)}>
          Önceki
        </button>
        {i + 1 < sorular.length ? (
          <button className="dugme birincil" onClick={() => setI(i + 1)}>
            {cevaplar[i] ? "Sonraki" : "Boş bırak"}
          </button>
        ) : (
          <button className="dugme birincil" onClick={() => setOnay(true)}>
            Bitir
          </button>
        )}
      </footer>
      <div className="deneme-palet" aria-label="Soru listesi">
        {sorular.map((_, j) => (
          <button key={j} className={`${j === i ? "aktif" : ""} ${cevaplar[j] ? "dolu" : ""}`} onClick={() => setI(j)} aria-label={`${j + 1}. soru`}>
            {j + 1}
          </button>
        ))}
      </div>

      {onay && (
        <div className="onay-perde" role="dialog" aria-modal="true">
          <div className="onay-kutu">
            <h2>Denemeyi bitir?</h2>
            <p>{cevaplar.filter((c) => c === null).length} soru boş kalacak.</p>
            <div className="dugme-satir">
              <button className="dugme ikincil" onClick={() => setOnay(false)}>
                Devam et
              </button>
              <button className="dugme birincil" onClick={bitir}>
                Bitir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DenemeSonuc({ sorular, cevaplar, sinav, dizin }: { sorular: DenemeSoru[]; cevaplar: (string | null)[]; sinav: Sinav; dizin: Dizin }) {
  const dersler = [...new Set(sorular.map((s) => s.ders))];
  const satir = (ders?: DersKey) => {
    let d = 0,
      y = 0,
      b = 0;
    sorular.forEach((s, j) => {
      if (ders && s.ders !== ders) return;
      const c = cevaplar[j];
      if (c === null) b++;
      else if (c === s.dogruMetin) d++;
      else y++;
    });
    return { d, y, b, n: net(d, y) };
  };
  const toplam = satir();
  const yanlislar = sorular.map((s, j) => ({ s, c: cevaplar[j] })).filter((x) => x.c !== x.s.dogruMetin);
  const oran = toplam.n / Math.max(1, sorular.length);
  useEffect(() => {
    if (oran >= 0.6) konfeti();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="oturum sonuc">
      <div className="sonuc-ust">
        <Kivilcim duygu={oran >= 0.6 ? "coskulu" : oran >= 0.3 ? "mutlu" : "dusunceli"} boyut={96} className="zipla" />
        <span className={`sinav-rozet ${sinav.toLowerCase()}`}>{sinav} bilgi denemesi</span>
        <h1>{netYaz(toplam.n)} net</h1>
        <p>
          {toplam.d} doğru · {toplam.y} yanlış · {toplam.b} boş
        </p>
        <p className="sonuc-alt">
          {oran >= 0.8 ? "Helal olsun, bu netle rahat edersin!" : oran >= 0.6 ? "Güzel iş, eksikleri yanlış defterine attım." : oran >= 0.3 ? "Fena değil. Yanlışları tekrar edelim." : "Moral bozmak yok, bu bilgiler tekrarla oturacak."}
        </p>
      </div>
      <table className="net-tablo">
        <thead>
          <tr>
            <th>Ders</th>
            <th>D</th>
            <th>Y</th>
            <th>B</th>
            <th>Net</th>
          </tr>
        </thead>
        <tbody>
          {dersler.map((d) => {
            const r = satir(d);
            return (
              <tr key={d}>
                <td>{kursAdi({ sinav, ders: d })}</td>
                <td>{r.d}</td>
                <td>{r.y}</td>
                <td>{r.b}</td>
                <td>
                  <strong>{netYaz(r.n)}</strong>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {yanlislar.length > 0 && (
        <section className="kacanlar">
          <h2>Yanlış ve boşların</h2>
          <ul>
            {yanlislar.map(({ s, c }) => (
              <li key={s.ref.uid}>
                <SoruMetni kart={s.ref.kart as SecmeliKart} />
                <p>
                  {c ? <span className="yanlis-metin">Senin cevabın: {c}</span> : <span className="soluk-metin">Boş bıraktın</span>}
                  <br />
                  Doğrusu: <strong>{s.dogruMetin}</strong>
                </p>
                <p className="soluk-metin">{s.ref.kart.bilgi}</p>
                <a href={kaynakLinki(s.ref.kitap, s.ref.kart.sayfa)} target="_blank" rel="noreferrer">
                  {s.ref.kart.yil ? "Asıl soru" : "Kaynak"} · s. {s.ref.kart.sayfa} <Ikon d={IKON.dis} boyut={12} />
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="sonuc-dugmeler">
        <button className="dugme birincil genis" onClick={() => git("/deneme", true)}>
          Denemelere dön
        </button>
        <button className="dugme ikincil genis" onClick={() => git("/", true)}>
          Ana sayfa
        </button>
      </div>
      <p className="soluk-metin" style={{ textAlign: "center" }}>
        {dizin.kartlar.size} bilgilik havuzdan seçildi. Bu sonuçlar tekrar planına da işlendi.
      </p>
    </div>
  );
}
