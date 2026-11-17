import { useCallback, useEffect, useRef, useState } from "react";
import type { Dizin } from "../content";
import { kaynakLinki } from "../content";
import type { KartDurum, KartRef } from "../types";
import { karistir, oturumKartlari, siradakiKonu, type OturumTipi } from "../oturum";
import { ayarlariGuncelle, cevapKaydet, gunAnahtari, ilerleme, kartDurumYaz, rozetleriKaydet, seri, useIlerleme, xpEkle } from "../store";
import { Kivilcim, type Duygu } from "../maskot";
import { sonucBasligi, tepki, type Tepki } from "../ovgu";
import { konfeti } from "../konfeti";
import { rutbe, seviyeHesapla, sinEki, yeniRozetler } from "../rutbe";
import { bildir } from "../bildirim";
import { guncelle, sonrakiTekrarGun, sureMetni } from "../srs";
import { hataBildirLinki, meydanLinki, paylas } from "../araclar";
import { SoruGovdesi, soruEtiketi, type Cevap } from "../sorular";
import { sesler } from "../ses";
import { DERSLER } from "../subjects";
import { git } from "../router";
import { kursAdi } from "./Dersler";
import { Ikon, IKON } from "../ui";

interface Adim {
  ref: KartRef;
  tekrar: boolean; // bu oturumda yanlış yapılıp yeniden sorulan kart
  onTest?: boolean; // konuya başlamadan önceki ön test sorusu
}

const ON_TEST_SORU = 5;

interface Kutlama {
  baslik: string;
  alt: string;
  duygu: Duygu;
}

const SERI_ESIKLERI = [3, 7, 14, 21, 30, 50, 75, 100, 150, 200, 365];

interface Sonuc {
  kutlamalar: Kutlama[];
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
  const [tep, setTep] = useState<Tepki | null>(null);
  const [ucus, setUcus] = useState<{ id: number; xp: number } | null>(null);
  // Oturum başındaki durum: bitişte kutlanacak eşikler bununla karşılaştırılır
  const [oncesi] = useState(() => {
    const q = ilerleme();
    return { gunXp: q.gunler[gunAnahtari()] ?? 0, seri: seri(q), seviye: seviyeHesapla(q.toplamXp).seviye };
  });
  // Ön test: hiç başlanmamış konuda önce ne bildiğine bak (bilinenler ileri tarihe atılır)
  const yeniKonu = tip.tip === "konu" ? dizin.konular.get(tip.konuId) : undefined;
  const [asama, setAsama] = useState<"secim" | "onTest" | "araSonuc" | "ders">(() =>
    yeniKonu && yeniKonu.kartlar.length >= 6 && yeniKonu.kartlar.every((k) => !ilerleme().kartlar[k.uid]) ? "secim" : "ders",
  );
  const onTestBilinen = useRef(0);

  const onTestBaslat = () => {
    setKuyruk(karistir(yeniKonu!.kartlar).slice(0, ON_TEST_SORU).map((ref) => ({ ref, tekrar: false, onTest: true })));
    setAsama("onTest");
  };
  const dersBaslat = () => {
    // Ön testte bilinenler artık "yeni" değil; ders kalanlarla devam eder
    const ders = oturumKartlari(dizin, ilerleme(), tip).map((ref) => ({ ref, tekrar: false }));
    if (!ders.length) return bitir();
    setKuyruk((q) => [...q, ...ders]);
    setI((x) => x + 1);
    setAsama("ders");
  };

  const adim = kuyruk[i];

  const cevapla = useCallback(
    (c: Cevap) => {
      if (!adim || cevap) return;
      setCevap(c);
      const uid = adim.ref.uid;
      if (adim.onTest) {
        // Ön test: bilinen bilgi "kolay" sayılır ve ileri tarihe atılır; bilinmeyen kaydedilmez, derste öğrenilir
        if (c.dogru) {
          onTestBilinen.current++;
          xp.current += XP_DOGRU;
          setUcus({ id: Date.now(), xp: XP_DOGRU });
          setSonDurumS(sonrakiTekrarGun(cevapKaydet(uid, "kolay")));
        } else setSonDurumS(null);
        setTep(tepki({ dogru: c.dogru, bilmiyorum: c.secim === undefined, kombo: 0, tekrar: false, onTest: true, yakin: false }));
        if (ilerleme().ayarlar.ses) (c.dogru ? sesler.dogru : sesler.yanlis)();
        return;
      }
      let gecenGun: number | undefined;
      let kazanilan = 0;
      if (!ilkDeneme.current.has(uid)) {
        ilkDeneme.current.set(uid, c.dogru);
        oncekiDurum.current = ilerleme().kartlar[uid];
        if (!oncekiDurum.current) yeniKartlar.current.add(uid);
        else gecenGun = (Date.now() - oncekiDurum.current.l) / 86_400_000;
        const yeni = cevapKaydet(uid, c.dogru);
        setSonDurumS(sonrakiTekrarGun(yeni));
        if (c.dogru) kazanilan = XP_DOGRU;
      } else {
        setSonDurumS(null);
        if (c.dogru) kazanilan = XP_TEKRAR_DOGRU;
      }
      xp.current += kazanilan;
      if (kazanilan) setUcus({ id: Date.now(), xp: kazanilan });
      setTep(
        tepki({
          dogru: c.dogru,
          bilmiyorum: c.secim === undefined,
          kombo: c.dogru ? kombo + 1 : 0,
          tekrar: adim.tekrar,
          onTest: false,
          yakin: !!c.yakin,
          yil: adim.ref.kart.yil,
          gecenGun,
        }),
      );
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
    [adim, cevap, i, kuyruk, kombo],
  );

  const bitir = useCallback(() => {
    const dogrular = [...ilkDeneme.current.values()].filter(Boolean).length;
    const toplam = ilkDeneme.current.size;
    if (toplam > 0 && dogrular === toplam && toplam >= 5) xp.current += XP_KUSURSUZ;
    const konuId = tip.tip === "konu" ? tip.konuId : undefined;
    if (xp.current > 0 || konuId) xpEkle(xp.current, konuId);
    if (ilerleme().ayarlar.ses) sesler.bitis();

    // Kutlamalar: günlük hedef, seri eşiği, seviye atlama
    const q = ilerleme();
    const kutlamalar: Kutlama[] = [];
    const hedef = q.ayarlar.gunlukHedef;
    const gunXp = q.gunler[gunAnahtari()] ?? 0;
    if (oncesi.gunXp < hedef && gunXp >= hedef)
      kutlamalar.push({ baslik: "Günlük hedef tamam!", alt: `Bugün ${gunXp} XP topladın. Yarın da bekliyorum.`, duygu: "coskulu" });
    const yeniSeri = seri(q);
    if (yeniSeri > oncesi.seri && SERI_ESIKLERI.includes(yeniSeri))
      kutlamalar.push({ baslik: `${yeniSeri} günlük seri!`, alt: "Her gün biraz, sınavda çok. Helal olsun.", duygu: "coskulu" });
    const sv = seviyeHesapla(q.toplamXp).seviye;
    if (sv > oncesi.seviye)
      kutlamalar.push({
        baslik: `Seviye ${sv}!`,
        alt: rutbe(sv) !== rutbe(oncesi.seviye) ? `Artık bir ${sinEki(rutbe(sv))}.` : `${rutbe(sv)} rütbesinde yükseliyorsun.`,
        duygu: "coskulu",
      });
    // Rozetler
    const kusursuz = toplam >= 5 && dogrular === toplam;
    const rozetler = yeniRozetler(q, dizin, { saat: new Date().getHours(), kusursuz, karisanTam: tip.tip === "karisan" && kusursuz });
    rozetleriKaydet(rozetler.map((r) => r.id));
    rozetler.forEach((r, j) => setTimeout(() => bildir({ baslik: `Yeni rozet: ${r.ad}`, alt: r.aciklama, simge: r.simge }), 600 + j * 900));

    setSonuc({
      kutlamalar,
      uids: [...ilkDeneme.current.keys()],
      xp: xp.current,
      dogru: dogrular,
      toplam,
      yeni: yeniKartlar.current.size,
      sureSn: Math.round((Date.now() - baslangic.current) / 1000),
      kacanlar: [...ilkDeneme.current.entries()].filter(([, d]) => !d).map(([uid]) => dizin.kartlar.get(uid)!),
    });
  }, [dizin, tip, oncesi]);

  const devam = useCallback(() => {
    if (!cevap) return;
    setCevap(null);
    setSonDurumS(null);
    setTahmin(false);
    setTep(null);
    if (asama === "onTest" && i + 1 >= kuyruk.length) setAsama("araSonuc");
    else if (i + 1 >= kuyruk.length) bitir();
    else setI(i + 1);
  }, [cevap, i, kuyruk.length, bitir, asama]);

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
    setSonDurumS(sonrakiTekrarGun(yeni));
    xp.current = Math.max(0, xp.current - 5);
    setTahmin(true);
  };

  if (asama === "secim" && yeniKonu)
    return (
      <div className="oturum bos-oturum">
        <div className="bos-durum on-test-secim">
          <Ikon d={IKON.hedef} boyut={40} />
          <h2>{yeniKonu.ad}</h2>
          <p>
            Yeni bir konu. İstersen önce {ON_TEST_SORU} soruluk kısa bir ön testle ne bildiğine bakalım: bildiğin bilgiler
            ileri tarihe atılır, bilmediklerin derste gelir. Yanlış yapsan bile ön test sonraki öğrenmeyi güçlendirir.
          </p>
          <div className="dugme-satir">
            <button className="dugme ikincil" onClick={() => setAsama("ders")}>
              Doğrudan öğren
            </button>
            <button className="dugme birincil" onClick={onTestBaslat}>
              Ön teste başla
            </button>
          </div>
        </div>
      </div>
    );

  if (asama === "araSonuc")
    return (
      <div className="oturum bos-oturum">
        <div className="bos-durum on-test-secim">
          <div className="osym-sayi">
            <strong>
              {onTestBilinen.current}/{kuyruk.length}
            </strong>
            <span>biliyordun</span>
          </div>
          <h2>{onTestBilinen.current === kuyruk.length ? "Bu konuya hâkimsin" : "Ön test bitti"}</h2>
          <p>
            {onTestBilinen.current > 0
              ? `Bildiğin ${onTestBilinen.current} bilgi birkaç gün sonraya atıldı. `
              : ""}
            Şimdi konunun geri kalanını öğrenelim.
          </p>
          <button className="dugme birincil" onClick={dersBaslat}>
            Konuyu öğren
          </button>
        </div>
      </div>
    );

  if (!adim) {
    return (
      <div className="oturum bos-oturum">
        <div className="bos-durum">
          <Kivilcim duygu={tip.tip === "tekrar" ? "uykulu" : "dusunceli"} boyut={96} />
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
        {ucus && (
          <span className="xp-ucus" key={ucus.id} aria-hidden="true">
            +{ucus.xp} XP
          </span>
        )}
        <button
          className={`yaz-dugme ${p.ayarlar.yazarak ? "acik" : ""}`}
          onClick={() => ayarlariGuncelle({ yazarak: !p.ayarlar.yazarak })}
          aria-pressed={p.ayarlar.yazarak}
          title="Yazarak cevapla: boşlukları yaz, şıkları önce gizle"
        >
          Yaz
        </button>
      </div>

      {tip.tip === "karisan" && (
        <p className="meydan-serit karisan-serit">
          <strong>Ayırt et:</strong> {dizin.karisanlar.find((x) => x.id === tip.setId)?.ad}
        </p>
      )}
      {meydan && i === 0 && !cevap && (
        <p className="meydan-serit">
          <strong>{meydan.ad}</strong> sana meydan okudu: aynı soruları {meydan.skor} bildi.
        </p>
      )}
      <main className={`soru-alani ${cevap ? "cevaplandi" : ""}`} key={i}>
        <div className="soru-ust">
          <span className="soru-etiket">{soruEtiketi(kart)}</span>
          {adim.onTest && <span className="rozet yeni">Ön test</span>}
          {adim.tekrar && <span className="rozet uyari">Tekrar</span>}
          {!adim.onTest && !adim.tekrar && !p.kartlar[adim.ref.uid] && !cevap && <span className="rozet yeni">Yeni bilgi</span>}
          {kart.yil && <span className="yil-rozet">{kart.yil.replace("-", " ")}</span>}
        </div>
        <SoruGovdesi kart={kart} cevap={cevap} onCevap={cevapla} yazarak={p.ayarlar.yazarak} key={`${i}-${p.ayarlar.yazarak}`} />
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
            <Kivilcim duygu={tep?.duygu ?? (cevap.dogru ? "mutlu" : "uzgun")} boyut={46} className={cevap.dogru ? "zipla" : "salla"} />
            <div className="gb-baslik">
              <strong>{tep?.baslik ?? (cevap.dogru ? "Doğru!" : "Bir dahakine!")}</strong>
              {tep?.alt && <span className="gb-alt">{tep.alt}</span>}
            </div>
            {sonDurumS !== null && <span className="gb-sonraki">Sonraki tekrar: {sureMetni(sonDurumS)}</span>}
          </div>
          {cevap.dogru && sonDurumS !== null && !adim.onTest && (
            <button className={`tahmin-dugme ${tahmin ? "secili" : ""}`} onClick={tahminEttim} disabled={tahmin}>
              {tahmin ? "Tamam, bu bilgi daha sık gelecek" : "Aslında tahmin ettim"}
            </button>
          )}
          <p className="gb-bilgi">{kart.bilgi}</p>
          {tip.tip === "karisan" && !cevap.dogru && (
            <p className="gb-fark">Fark: {dizin.karisanlar.find((x) => x.id === tip.setId)?.fark}</p>
          )}
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

/** 0'dan hedefe sayarak artan sayı */
function useSayac(hedef: number, sure = 900): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return setN(hedef);
    const bas = performance.now();
    let r = 0;
    const kare = (t: number) => {
      const o = Math.min(1, (t - bas) / sure);
      setN(Math.round(hedef * (1 - Math.pow(1 - o, 3))));
      if (o < 1) r = requestAnimationFrame(kare);
    };
    r = requestAnimationFrame(kare);
    return () => cancelAnimationFrame(r);
  }, [hedef, sure]);
  return n;
}

function KutlamaPerdesi({ k, onKapat }: { k: Kutlama; onKapat: () => void }) {
  useEffect(() => {
    konfeti();
  }, [k]);
  return (
    <div className="kutlama-perde" role="dialog" aria-modal="true" onClick={onKapat}>
      <div className="kutlama-kutu">
        <Kivilcim duygu={k.duygu} boyut={120} className="zipla" />
        <h2>{k.baslik}</h2>
        <p>{k.alt}</p>
        <button className="dugme birincil genis" onClick={onKapat} autoFocus>
          Devam
        </button>
      </div>
    </div>
  );
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
  const baslik = sonucBasligi(isabet, sonuc.toplam);
  const xpSayac = useSayac(sonuc.xp);
  const isabetSayac = useSayac(Math.round(isabet * 100));
  const [kutlamaSira, setKutlamaSira] = useState(0);
  const sv = seviyeHesapla(p.toplamXp);
  useEffect(() => {
    if (!sonuc.kutlamalar.length && isabet >= 0.8 && sonuc.toplam >= 3) konfeti(90, 1800);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="oturum sonuc">
      {kutlamaSira < sonuc.kutlamalar.length && (
        <KutlamaPerdesi k={sonuc.kutlamalar[kutlamaSira]} onKapat={() => setKutlamaSira((x) => x + 1)} />
      )}
      <div className="sonuc-ust">
        <Kivilcim duygu={meydan ? (rakip !== undefined && sonuc.dogru >= rakip ? "coskulu" : "dusunceli") : baslik.duygu} boyut={104} className="zipla" />
        <h1>
          {meydan && rakip !== undefined
            ? sonuc.dogru > rakip
              ? "Meydan okumayı kazandın!"
              : sonuc.dogru === rakip
                ? "Berabere!"
                : `${meydan.ad} bu sefer önde`
            : baslik.baslik}
        </h1>
        {!meydan && baslik.alt && <p className="sonuc-alt">{baslik.alt}</p>}
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
          <strong>+{xpSayac}</strong>
        </div>
        <div className="sonuc-kutu isabet">
          <span>İsabet</span>
          <strong>%{isabetSayac}</strong>
        </div>
        <div className="sonuc-kutu sure">
          <span>Süre</span>
          <strong>
            {dk}:{String(sn).padStart(2, "0")}
          </strong>
        </div>
      </div>

      <div className="seviye-serit">
        <span className="rutbe-rozet">{rutbe(sv.seviye)}</span>
        <span className="seviye-cubugu" aria-label={`Seviye ${sv.seviye}`}>
          <span style={{ width: `${Math.round(sv.oran * 100)}%` }} />
        </span>
        <span className="soluk-metin">
          Sv {sv.seviye} · {sv.sonraki - p.toplamXp} XP kaldı
        </span>
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
