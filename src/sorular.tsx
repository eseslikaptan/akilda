import { useEffect, useMemo, useState } from "react";
import type { BoslukKart, DYKart, EslestirKart, Kart, SecmeliKart } from "./types";
import { karistir } from "./oturum";
import { Ikon, IKON } from "./ui";

/** null: henüz cevap yok. dogru=false & secim=undefined: "Bilmiyorum" */
export interface Cevap {
  dogru: boolean;
  secim?: string;
}

interface Props<K extends Kart> {
  kart: K;
  cevap: Cevap | null;
  onCevap: (c: Cevap) => void;
}

export function SoruGovdesi(props: Props<Kart>) {
  const { kart } = props;
  switch (kart.tur) {
    case "secmeli":
      return <Secmeli {...(props as Props<SecmeliKart>)} />;
    case "dy":
      return <DogruYanlis {...(props as Props<DYKart>)} />;
    case "bosluk":
      return <Bosluk {...(props as Props<BoslukKart>)} />;
    case "eslestir":
      return <Eslestir {...(props as Props<EslestirKart>)} />;
  }
}

export function soruEtiketi(k: Kart): string {
  return { secmeli: "Doğru cevabı seç", dy: "Doğru mu, yanlış mı?", bosluk: "Boşluğu doldur", eslestir: "Eşleştir" }[k.tur];
}

export const HARFLER = ["A", "B", "C", "D", "E"];

/** 1-9 tuşlarıyla (harfli şıklarda A-E ile de) seçim */
function useRakamTuslari(aktif: boolean, adet: number, sec: (i: number) => void, harfli = false) {
  useEffect(() => {
    if (!aktif) return;
    const f = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const harf = harfli ? HARFLER.indexOf(e.key.toLocaleUpperCase("tr")) : -1;
      const n = harf >= 0 ? harf + 1 : Number(e.key);
      if (n >= 1 && n <= adet) {
        e.preventDefault();
        sec(n - 1);
      }
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [aktif, adet, sec, harfli]);
}

function Secmeli({ kart, cevap, onCevap }: Props<SecmeliKart>) {
  const dogruMetin = kart.secenekler[kart.dogru];
  const secenekler = useMemo(() => karistir(kart.secenekler), [kart]);
  const sec = (i: number) => onCevap({ dogru: secenekler[i] === dogruMetin, secim: secenekler[i] });
  useRakamTuslari(!cevap, secenekler.length, sec, true);

  return (
    <>
      <p className="soru-metni">{kart.soru}</p>
      <div className="secenekler">
        {secenekler.map((s, i) => {
          let durum = "";
          if (cevap) {
            if (s === dogruMetin) durum = "dogru";
            else if (s === cevap.secim) durum = "yanlis";
            else durum = "soluk";
          }
          return (
            <button key={s} className={`secenek ${durum}`} disabled={!!cevap} onClick={() => sec(i)}>
              <span className="sik-harf">{HARFLER[i]}</span>
              <span>{s}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function DogruYanlis({ kart, cevap, onCevap }: Props<DYKart>) {
  useEffect(() => {
    if (cevap) return;
    const f = (e: KeyboardEvent) => {
      const k = e.key.toLocaleLowerCase("tr");
      if (k === "d" || k === "1") onCevap({ dogru: kart.dogru === true, secim: "Doğru" });
      if (k === "y" || k === "2") onCevap({ dogru: kart.dogru === false, secim: "Yanlış" });
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [cevap, kart, onCevap]);

  const durum = (deger: boolean) => {
    if (!cevap) return "";
    if (kart.dogru === deger) return "dogru";
    return cevap.secim === (deger ? "Doğru" : "Yanlış") ? "yanlis" : "soluk";
  };

  return (
    <>
      <blockquote className="ifade">{kart.ifade}</blockquote>
      <div className="dy-dugmeler">
        <button className={`secenek dy ${durum(true)}`} disabled={!!cevap} onClick={() => onCevap({ dogru: kart.dogru, secim: "Doğru" })}>
          <Ikon d={IKON.tik} />
          <span>Doğru</span>
        </button>
        <button
          className={`secenek dy ${durum(false)}`}
          disabled={!!cevap}
          onClick={() => onCevap({ dogru: !kart.dogru, secim: "Yanlış" })}
        >
          <Ikon d={IKON.kapat} />
          <span>Yanlış</span>
        </button>
      </div>
    </>
  );
}

function Bosluk({ kart, cevap, onCevap }: Props<BoslukKart>) {
  const secenekler = useMemo(() => karistir([kart.cevap, ...kart.celdiriciler]), [kart]);
  const [once, sonra] = kart.cumle.split("___");
  const sec = (i: number) => onCevap({ dogru: secenekler[i] === kart.cevap, secim: secenekler[i] });
  useRakamTuslari(!cevap, secenekler.length, sec);

  let bosluk = <span className="bosluk-yer bos">&nbsp;</span>;
  if (cevap) {
    bosluk = cevap.dogru ? (
      <span className="bosluk-yer dogru">{kart.cevap}</span>
    ) : (
      <>
        {cevap.secim && <span className="bosluk-yer yanlis">{cevap.secim}</span>}
        <span className="bosluk-yer dogru">{kart.cevap}</span>
      </>
    );
  }

  return (
    <>
      <p className="soru-metni bosluk-cumle">
        {once}
        {bosluk}
        {sonra}
      </p>
      <div className="cipler">
        {secenekler.map((s, i) => (
          <button
            key={s}
            className={`cip ${cevap ? (s === kart.cevap ? "dogru" : s === cevap.secim ? "yanlis" : "soluk") : ""}`}
            disabled={!!cevap}
            onClick={() => sec(i)}
          >
            <kbd>{i + 1}</kbd>
            {s}
          </button>
        ))}
      </div>
    </>
  );
}

function Eslestir({ kart, cevap, onCevap }: Props<EslestirKart>) {
  const sol = kart.ciftler.map((c) => c[0]);
  const sag = useMemo(() => karistir(kart.ciftler.map((c) => c[1])), [kart]);
  const esi = useMemo(() => new Map(kart.ciftler), [kart]);
  const [seciliSol, setSeciliSol] = useState<string | null>(null);
  const [seciliSag, setSeciliSag] = useState<string | null>(null);
  const [eslenen, setEslenen] = useState<Set<string>>(new Set());
  const [hata, setHata] = useState(0);
  const [titrek, setTitrek] = useState<string | null>(null);

  useEffect(() => {
    if (seciliSol === null || seciliSag === null) return;
    if (esi.get(seciliSol) === seciliSag) {
      const yeni = new Set(eslenen).add(seciliSol);
      setEslenen(yeni);
      if (yeni.size === sol.length) onCevap({ dogru: hata === 0, secim: hata ? `${hata} hata` : undefined });
    } else {
      setHata((h) => h + 1);
      setTitrek(`${seciliSol}|${seciliSag}`);
      setTimeout(() => setTitrek(null), 450);
    }
    setSeciliSol(null);
    setSeciliSag(null);
  }, [seciliSol, seciliSag]); // eslint-disable-line react-hooks/exhaustive-deps

  const bitti = !!cevap;
  const solDurum = (s: string) =>
    eslenen.has(s) || bitti ? "eslendi" : seciliSol === s ? "secili" : titrek?.startsWith(`${s}|`) ? "yanlis titre" : "";
  const sagEslendi = (s: string) => [...eslenen].some((l) => esi.get(l) === s);
  const sagDurum = (s: string) =>
    sagEslendi(s) || bitti ? "eslendi" : seciliSag === s ? "secili" : titrek?.endsWith(`|${s}`) ? "yanlis titre" : "";

  return (
    <>
      <p className="soru-metni">{kart.yonerge}</p>
      {bitti && !cevap?.dogru ? (
        <ul className="eslesme-cozum">
          {kart.ciftler.map(([a, b]) => (
            <li key={a}>
              <strong>{a}</strong>
              <span aria-hidden="true">→</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="eslestir">
          <div className="eslestir-sutun">
            {sol.map((s) => (
              <button key={s} className={`eslesme ${solDurum(s)}`} disabled={bitti || eslenen.has(s)} onClick={() => setSeciliSol(s)}>
                {s}
              </button>
            ))}
          </div>
          <div className="eslestir-sutun">
            {sag.map((s) => (
              <button key={s} className={`eslesme ${sagDurum(s)}`} disabled={bitti || sagEslendi(s)} onClick={() => setSeciliSag(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
      {!bitti && hata > 0 && <p className="eslestir-hata">{hata} hatalı eşleştirme</p>}
    </>
  );
}
