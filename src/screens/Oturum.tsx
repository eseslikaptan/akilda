import { useCallback, useEffect, useRef, useState } from "react";
import type { Dizin } from "../content";
import { kaynakLinki } from "../content";
import type { KartDurum, KartRef } from "../types";
import { oturumKartlari, siradakiKonu, type OturumTipi } from "../oturum";
import { cevapKaydet, ilerleme, kartDurumYaz, useIlerleme, xpEkle } from "../store";
import { guncelle, sureMetni } from "../srs";
import { hataBildirLinki, meydanLinki, paylas } from "../araclar";
import { SoruGovdesi, soruEtiketi, type Cevap } from "../sorular";
import { sesler } from "../ses";
import { DERSLER } from "../subjects";
import { git } from "../router";
import { kursAdi } from "./Dersler";
import { Ikon, IKON, yuzde } from "../ui";

interface Adim {
  ref: KartRef;
  tekrar: boolean; // bu oturumda yanlış yapılıp yeniden sorulan kart
}

interface Sonuc {
  uids: string[];
  xp: number;
  dogru: number;
  toplam: number;
  yeni: number;
  sureSn: number;
  kacanlar: KartRef[];
}

const XP_DOGRU = 10;
const XP_TEKRAR_DOGRU = 4;
const XP_KUSURSUZ = 15;

export interface Meydan {
  ad: string;
  skor: string; // "9/12"
}

export function Oturum({ dizin, tip, meydan }: { dizin: Dizin; tip: OturumTipi; meydan?: Meydan }) {
  const p = useIlerleme();
  // Oturum kartları başta bir kez belirlenir
  const [kuyruk, setKuyruk] = useState<Adim[]>(() =>
    oturumKartlari(dizin, ilerleme(), tip).map((ref) => ({ ref, tekrar: false })),
  );
  const [i, setI] = useState(0);
  const [cevap, setCevap] = useState<Cevap | null>(null);
  const [sonDurumS, setSonDurumS] = useState<number | null>(null);
  const ilkDeneme = useRef(new Map<string, boolean>());
  const yeniKartlar = useRef(new Set<string>());
  const xp = useRef(0);
  const baslangic = useRef(Date.now());
  const [sonuc, setSonuc] = useState<Sonuc | null>(null);
  const [kombo, setKombo] = useState(0);
  const oncekiDurum = useRef<KartDurum | undefined>(undefined);
  const [tahmin, setTahmin] = useState(false);

  const adim = kuyruk[i];

  const cevapla = useCallback(
    (c: Cevap) => {
      if (!adim || cevap) return;
      setCevap(c);
      const uid = adim.ref.uid;
      if (!ilkDeneme.current.has(uid)) {
        ilkDeneme.current.set(uid, c.dogru);
        oncekiDurum.current = ilerleme().kartlar[uid];
        if (!oncekiDurum.current) yeniKartlar.current.add(uid);
        const yeni = cevapKaydet(uid, c.dogru);
        setSonDurumS(yeni.s);
        if (c.dogru) xp.current += XP_DOGRU;
      } else {
        setSonDurumS(null);
        if (c.dogru) xp.current += XP_TEKRAR_DOGRU;
      }
      if (c.dogru) {
        setKombo((k) => k + 1);
      } else {
        setKombo(0);
        // Yanlış cevaplanan kart birkaç soru sonra tekrar gelir (bir oturumda en fazla 2 kez)
        const tekrarSayisi = kuyruk.filter((a) => a.tekrar && a.ref.uid === uid).length;
        if (tekrarSayisi < 2) {
          setKuyruk((q) => {
            const yeni = [...q];
            yeni.splice(Math.min(q.length, i + 3), 0, { ref: adim.ref, tekrar: true });
            return yeni;
          });
        }
        navigator.vibrate?.(60);
      }
      if (ilerleme().ayarlar.ses) (c.dogru ? sesler.dogru : sesler.yanlis)();
    },
    [adim, cevap, i, kuyruk],
  );

  const bitir = useCallback(() => {
    const dogrular = [...ilkDeneme.current.values()].filter(Boolean).length;
    const toplam = ilkDeneme.current.size;
    if (toplam > 0 && dogrular === toplam && toplam >= 5) xp.current += XP_KUSURSUZ;
    const konuId = tip.tip === "konu" ? tip.konuId : undefined;
    if (xp.current > 0 || konuId) xpEkle(xp.current, konuId);
    if (ilerleme().ayarlar.ses) sesler.bitis();
    setSonuc({
      uids: [...ilkDeneme.current.keys()],
      xp: xp.current,
      dogru: dogrular,
      toplam,
      yeni: yeniKartlar.current.size,
      sureSn: Math.round((Date.now() - baslangic.current) / 1000),
      kacanlar: [...ilkDeneme.current.entries()].filter(([, d]) => !d).map(([uid]) => dizin.kartlar.get(uid)!),
    });
  }, [dizin, tip]);

  const devam = useCallback(() => {
    if (!cevap) return;
    setCevap(null);
    setSonDurumS(null);
    setTahmin(false);
    if (i + 1 >= kuyruk.length) bitir();
    else setI(i + 1);
  }, [cevap, i, kuyruk.length, bitir]);

  // Cevaptan sonra doğru cevap panelin altında kalmasın
  useEffect(() => {
    if (!cevap) return;
    const hedef = document.querySelector(".secenek.dogru, .bosluk-yer.dogru, .eslesme-cozum, .eslestir");
    hedef?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [cevap]);

  // Enter / boşluk ile devam
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if ((e.key === "Enter" || e.key === " ") && cevap) {
        e.preventDefault();
        devam();
      }
      if (e.key === "Escape") cik();
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  });

  const cik = () => {
    if (!sonuc && xp.current > 0) xpEkle(xp.current, tip.tip === "konu" ? tip.konuId : undefined);
    git("/", true);
  };

  if (sonuc) return <SonucEkrani sonuc={sonuc} dizin={dizin} tip={tip} meydan={meydan} />;

  // Doğru ama tahminle bulunduysa kart daha erken tekrar gelsin
  const tahminEttim = () => {
    if (!adim) return;
    const yeni = guncelle(oncekiDurum.current, "tahmin");
    kartDurumYaz(adim.ref.uid, yeni);
    setSonDurumS(yeni.s);
    xp.current = Math.max(0, xp.current - 5);
    setTahmin(true);
  };

  if (!adim) {
    return (
      <div className="oturum bos-oturum">
        <div className="bos-durum">
          <Ikon d={IKON.tik} boyut={40} />
          <h2>{tip.tip === "tekrar" ? "Tekrar edilecek kart yok" : "Burada soru yok"}</h2>
          <p>
            {tip.tip === "tekrar"
              ? "Hafızan şu an taze. Yeni bir konu öğren; zamanı gelen kartlar burada birikecek."
              : "Bu bölüm için henüz kart eklenmemiş."}
          </p>
          <button className="dugme birincil" onClick={() => git("/", true)}>
            Ana sayfaya dön
          </button>
        </div>
      </div>
    );
  }

  const kart = adim.ref.kart;
  const ders = DERSLER[adim.ref.kitap.ders];
  // İlerleme: kuyrukta kalan adımlara göre (yanlışlar kuyruğu uzatır)
  const oran = (i + (cevap ? 1 : 0)) / Math.max(1, kuyruk.length);

  return (
    <div className="oturum" style={{ "--hue": ders.hue } as React.CSSProperties}>
      <div className="oturum-ust">
        <button className="ikon-dugme" onClick={cik} aria-label="Oturumdan çık">
          <Ikon d={IKON.kapat} />
        </button>
        <div className="ilerleme-cubugu" role="progressbar" aria-valuenow={Math.round(oran * 100)} aria-valuemin={0} aria-valuemax={100}>
          <span style={{ width: `${Math.max(oran * 100, 2)}%` }} />
        </div>
        <span className={`kombo ${kombo >= 3 ? "gorunur" : ""}`} aria-live="polite">
          <Ikon d={IKON.alev} boyut={16} /> {kombo}
        </span>
      </div>

      {meydan && i === 0 && !cevap && (
        <p className="meydan-serit">
          <strong>{meydan.ad}</strong> sana meydan okudu: aynı soruları {meydan.skor} bildi.
        </p>
      )}
      <main className={`soru-alani ${cevap ? "cevaplandi" : ""}`} key={i}>
        <div className="soru-ust">
          <span className="soru-etiket">{soruEtiketi(kart)}</span>
          {adim.tekrar && <span className="rozet uyari">Tekrar</span>}
          {!adim.tekrar && !p.kartlar[adim.ref.uid] && !cevap && <span className="rozet yeni">Yeni bilgi</span>}
          {kart.yil && <span className="yil-rozet">{kart.yil.replace("-", " ")}</span>}
        </div>
        <SoruGovdesi kart={kart} cevap={cevap} onCevap={cevapla} />
        <p className="soru-kaynak">
          {kursAdi(dizin.kitapKursu.get(adim.ref.kitap.kitap)!)} · {dizin.konular.get(adim.ref.konuId)?.ad}
        </p>
      </main>

      {!cevap ? (
        <footer className="oturum-alt">
          <button className="dugme hayalet" onClick={() => cevapla({ dogru: false })}>
            Bilmiyorum
          </button>
        </footer>
      ) : (
        <footer className={`geri-bildirim ${cevap.dogru ? "iyi" : "kotu"}`} role="status">
          <div className="gb-ust">
            <strong>{cevap.dogru ? ovgu() : cevap.secim === undefined ? "Şimdi öğren" : "Bir dahakine!"}</strong>
            {sonDurumS !== null && (
              <span className="gb-sonraki">Sonraki tekrar: {sureMetni(sonDurumS)}</span>
            )}
          </div>
          {cevap.dogru && sonDurumS !== null && (
            <button className={`tahmin-dugme ${tahmin ? "secili" : ""}`} onClick={tahminEttim} disabled={tahmin}>
              {tahmin ? "Tamam, bu bilgi daha sık gelecek" : "Aslında tahmin ettim"}
            </button>
          )}
          <p className="gb-bilgi">{kart.bilgi}</p>
          <a className="gb-kaynak" href={kaynakLinki(adim.ref.kitap, kart.sayfa)} target="_blank" rel="noreferrer" title={adim.ref.kitap.baslik}>
            {kart.yil
              ? `Bu bilgi ${kart.yil.replace("-", " ")}'de soruldu · asıl soruyu gör (MEB, s. ${kart.sayfa})`
              : `Kaynak: MEB ${ders.ad} ders kitabı · s. ${kart.sayfa}`}
            <Ikon d={IKON.dis} boyut={14} />
          </a>
          <button className="dugme birincil genis" onClick={devam} ref={(b) => b?.focus({ preventScroll: true })}>
            Devam
          </button>
          <a className="hata-bildir" href={hataBildirLinki(adim.ref)} target="_blank" rel="noreferrer">
            Bu kartta hata mı var? Bildir
          </a>
        </footer>
      )}
    </div>
  );
}

const OVGULER = ["Doğru!", "Harika!", "Aynen öyle!", "Akılda!", "Tam isabet!", "Süper!"];
function ovgu() {
  return OVGULER[Math.floor(Math.random() * OVGULER.length)];
}

function SonucEkrani({ sonuc, dizin, tip, meydan }: { sonuc: Sonuc; dizin: Dizin; tip: OturumTipi; meydan?: Meydan }) {
  const p = useIlerleme();
  const [paylasimMesaji, setPaylasimMesaji] = useState("");
  const meydanOku = async () => {
    const url = meydanLinki(sonuc.uids, p.ayarlar.ad, sonuc.dogru);
    setPaylasimMesaji(await paylas("Akılda meydan okuması", `Bu ${sonuc.uids.length} YKS sorusunda ${sonuc.dogru} doğru yaptım. Sen kaç yaparsın?`, url));
  };
  const rakip = meydan ? Number(meydan.skor.split("/")[0]) : undefined;
  const isabet = sonuc.toplam ? sonuc.dogru / sonuc.toplam : 0;
  const sonraki = tip.tip === "konu" ? siradakiKonu(dizin, p, dizin.konular.get(tip.konuId)?.kursId) : undefined;
  const dk = Math.floor(sonuc.sureSn / 60);
  const sn = sonuc.sureSn % 60;

  return (
    <div className="oturum sonuc">
      <div className="sonuc-ust">
        <div className="sonuc-madalya">
          <Ikon d={IKON.yildiz} boyut={44} kalin={1.6} />
        </div>
        <h1>
          {meydan && rakip !== undefined
            ? sonuc.dogru > rakip
              ? "Meydan okumayı kazandın!"
              : sonuc.dogru === rakip
                ? "Berabere!"
                : `${meydan.ad} bu sefer önde`
            : isabet === 1
              ? "Kusursuz!"
              : isabet >= 0.7
                ? "Güzel iş!"
                : "Tekrar güçlendirir"}
        </h1>
        {meydan && (
          <p>
            Sen {sonuc.dogru}/{sonuc.toplam} · {meydan.ad} {meydan.skor}
          </p>
        )}
        <p>{sonuc.yeni > 0 ? `${sonuc.yeni} yeni bilgi hafızana eklendi.` : "Hafızan tazelendi."}</p>
      </div>
      <div className="sonuc-kutular">
        <div className="sonuc-kutu xp">
          <span>XP</span>
          <strong>+{sonuc.xp}</strong>
        </div>
        <div className="sonuc-kutu isabet">
          <span>İsabet</span>
          <strong>{yuzde(isabet)}</strong>
        </div>
        <div className="sonuc-kutu sure">
          <span>Süre</span>
          <strong>
            {dk}:{String(sn).padStart(2, "0")}
          </strong>
        </div>
      </div>

      {sonuc.kacanlar.length > 0 && (
        <section className="kacanlar">
          <h2>Bunları akılda tut</h2>
          <ul>
            {sonuc.kacanlar.map((r) => (
              <li key={r.uid}>
                <p>{r.kart.bilgi}</p>
                <a href={kaynakLinki(r.kitap, r.kart.sayfa)} target="_blank" rel="noreferrer" title={r.kitap.baslik}>
                  MEB · s. {r.kart.sayfa} <Ikon d={IKON.dis} boyut={12} />
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="sonuc-dugmeler">
        {sonraki && (
          <button className="dugme birincil genis" onClick={() => git(`/oturum?konu=${encodeURIComponent(sonraki.id)}`, true)}>
            Sıradaki: {sonraki.ad}
          </button>
        )}
        {sonuc.uids.length >= 5 && (
          <button className="dugme ikincil genis" onClick={meydanOku}>
            Arkadaşına meydan oku
          </button>
        )}
        {paylasimMesaji && <p className="soluk-metin paylasim-mesaj">{paylasimMesaji}</p>}
        <button className={`dugme genis ${sonraki ? "ikincil" : "birincil"}`} onClick={() => git("/", true)}>
          Ana sayfa
        </button>
      </div>
    </div>
  );
}
