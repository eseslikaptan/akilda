import { useEffect, useMemo, useState } from "react";
import type { BoslukKart, DYKart, EslestirKart, Kart, SecmeliKart } from "./types";
import { karistir } from "./oturum";
import { Ikon, IKON } from "./ui";

/** null: henüz cevap yok. dogru=false & secim=undefined: "Bilmiyorum" */
export interface Cevap {
  dogru: boolean;
  secim?: string;
  /** Yazarak cevapta küçük yazım farkıyla doğru sayıldı */
  yakin?: boolean;
}

interface Props<K extends Kart> {
  kart: K;
  cevap: Cevap | null;
  onCevap: (c: Cevap) => void;
  /** Boşluğu yazarak cevapla; çoktan seçmelide şıkları önce gizle */
  yazarak?: boolean;
}

/** Türkçe karşılaştırma için sadeleştir: küçük harf, şapkasız, noktalama ve fazla boşluksuz */
export function sadelestir(s: string): string {
  return s
    .toLocaleLowerCase("tr")
    .replace(/[âäà]/g, "a")
    .replace(/[îï]/g, "i")
    .replace(/[ûü]/g, (h) => (h === "ü" ? "ü" : "u"))
    .replace(/[’'`"().,;:!?-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mesafe(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

/** Yazılan cevap doğru sayılır mı? Uzun cevaplarda 1-2 harf hatası tolere edilir. */
export function yazimKabul(yazilan: string, cevap: string): "tam" | "yakin" | "yanlis" {
  const a = sadelestir(yazilan);
  const b = sadelestir(cevap);
  if (!a) return "yanlis";
  if (a === b) return "tam";
  const tolerans = b.length >= 9 ? 2 : b.length >= 5 ? 1 : 0;
  return mesafe(a, b) <= tolerans ? "yakin" : "yanlis";
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

/** Öncüllü ve sayısal sorularda şıklar sabit sırada kalır (Yalnız I, I ve II…); diğerlerinde karıştırılır */
export function sikSirasi(k: SecmeliKart): string[] {
  return k.oncul?.length || k.sirali ? k.secenekler : karistir(k.secenekler);
}

const ROMA = ["I", "II", "III", "IV", "V"];

// ÖSYM'deki gibi olumsuz soru köklerinin altı çizilir
const OLUMSUZ = new Set(
  "değildir değil yanlıştır yanlış söylenemez söylenemeyeceği ulaşılamaz ulaşılamayacağı çıkarılamaz yoktur olamaz gösterilemez verilemez getirilemez bulunmaz bulunmamaktadır beklenmez sayılamaz sayılmaz yapılamaz oluşmaz gerçekleşmez görülmez görülemez kullanılmamıştır değinilmemiştir yararlanılmamıştır verilmemiştir".split(" "),
);
function kokYaz(s: string) {
  return s.split(/(\s+)/).map((w, i) => {
    const sade = w.replace(/[.,;:?!"'’()]/g, "").toLocaleLowerCase("tr");
    return OLUMSUZ.has(sade) ? <u key={i}>{w}</u> : w;
  });
}

/** Soru metni: parça/durum paragrafları, tablo, grafik, öncüller ve kalın soru kökü */
export function SoruMetni({ kart }: { kart: SecmeliKart }) {
  const paragraflar = kart.soru.split("\n").map((s) => s.trim()).filter(Boolean);
  const oncullu = !!kart.oncul?.length;
  const kok = oncullu ? kart.kok ?? "" : paragraflar.pop() ?? "";
  const zengin = paragraflar.length > 0 || oncullu || !!kart.tablo || !!kart.grafik;
  if (!zengin) return <p className={`soru-metni ${kok.length > 150 ? "uzun" : ""}`}>{kokYaz(kok)}</p>;
  // Öncüllü tablolu/grafikli soruda "Buna göre," gibi son giriş paragrafı, ÖSYM'deki gibi görselin altına gelir
  const gorselli = !!kart.tablo || !!kart.grafik;
  const oncGiris = oncullu && gorselli && paragraflar.length >= 2 ? paragraflar.pop() : undefined;
  return (
    <div className="soru-govde">
      {paragraflar.map((p, i) => (
        <p key={i} className="soru-parca">
          {p}
        </p>
      ))}
      {kart.tablo && <SoruTablo satirlar={kart.tablo} />}
      {kart.grafik && <SoruGrafik g={kart.grafik} />}
      {oncGiris && <p className="soru-parca">{oncGiris}</p>}
      {oncullu && (
        <ol className="onculler">
          {kart.oncul!.map((o, i) => (
            <li key={i}>
              <span className="oncul-no">{ROMA[i]}.</span>
              <span>{o}</span>
            </li>
          ))}
        </ol>
      )}
      {kok && <p className="soru-kok">{kokYaz(kok)}</p>}
    </div>
  );
}

function SoruTablo({ satirlar }: { satirlar: string[][] }) {
  const [bas, ...govde] = satirlar;
  return (
    <div className="soru-tablo-kap">
      <table className="soru-tablo">
        <thead>
          <tr>
            {bas.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {govde.map((r, i) => (
            <tr key={i}>
              {r.map((h, j) => (j === 0 ? <th key={j}>{h}</th> : <td key={j}>{h}</td>))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const SERI_RENK = ["var(--ders)", "var(--ink)", "var(--lila)", "var(--gok)"];
const SERI_CIZGI = ["", "6 4", "2 3", "8 3 2 3"];

/** Basit çizgi grafiği: eksenler, kesikli kılavuz çizgileri ve seriler */
function SoruGrafik({ g }: { g: NonNullable<SecmeliKart["grafik"]> }) {
  const W = 320,
    H = 222,
    sol = 44,
    sag = 22,
    ust = 22,
    alt = 42;
  const xs = g.seriler.flatMap((s) => s.n.map((p) => p[0]));
  const ys = g.seriler.flatMap((s) => s.n.map((p) => p[1]));
  const x0 = Math.min(0, ...xs),
    x1 = Math.max(...xs, ...(g.xIsaret ?? []).map((t) => t[0]));
  const y0 = Math.min(0, ...ys),
    y1 = Math.max(...ys, ...(g.yIsaret ?? []).map((t) => t[0]));
  const px = (x: number) => sol + ((x - x0) / (x1 - x0 || 1)) * (W - sol - sag);
  const py = (y: number) => H - alt - ((y - y0) / (y1 - y0 || 1)) * (H - ust - alt);
  const benzersiz = (a: number[]) => [...new Set(a)].filter((v) => v !== 0).sort((a, b) => a - b);
  const xT: [number, string][] = g.xIsaret ?? benzersiz(xs).map((v) => [v, String(v)]);
  const yT: [number, string][] = g.yIsaret ?? benzersiz(ys).map((v) => [v, String(v)]);
  const etiketler: number[][] = [];
  return (
    <svg className="soru-grafik" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${g.y} – ${g.x} grafiği`}>
      {xT.map(([v]) => (
        <line key={`gx${v}`} x1={px(v)} x2={px(v)} y1={py(y0)} y2={py(y1)} className="kilavuz" />
      ))}
      {yT.map(([v]) => (
        <line key={`gy${v}`} x1={px(x0)} x2={px(x1)} y1={py(v)} y2={py(v)} className="kilavuz" />
      ))}
      <line x1={px(x0)} x2={px(x1) + 12} y1={py(0)} y2={py(0)} className="eksen" />
      <line x1={px(0)} x2={px(0)} y1={py(y0)} y2={py(y1) - 12} className="eksen" />
      {g.seriler.map((s, i) => {
        // Seri adı çizginin üzerinde, diğer adlarla çakışmayan bir noktaya yazılır
        const yer = (f: number) => {
          const t = f * (s.n.length - 1);
          const a = s.n[Math.floor(t)],
            b = s.n[Math.min(s.n.length - 1, Math.floor(t) + 1)],
            k = t - Math.floor(t);
          // çizgiye dik, yukarı bakan yönde 13 px öteye
          let nx = py(b[1]) - py(a[1]),
            ny = -(px(b[0]) - px(a[0]));
          const u = Math.hypot(nx, ny) || 1;
          if (ny > 0) (nx = -nx), (ny = -ny);
          return [px(a[0] + (b[0] - a[0]) * k) + (nx / u) * 13, py(a[1] + (b[1] - a[1]) * k) + (ny / u) * 13 + 4];
        };
        let ad = yer(0.55);
        for (const f of [0.3, 0.8, 0.15, 0.95]) {
          if (!etiketler.some(([x, y]) => Math.hypot(x - ad[0], y - ad[1]) < 18)) break;
          ad = yer(f);
        }
        etiketler.push(ad);
        return (
          <g key={i}>
            <polyline
              points={s.n.map(([x, y]) => `${px(x)},${py(y)}`).join(" ")}
              fill="none"
              stroke={SERI_RENK[i % 4]}
              strokeWidth={2.6}
              strokeDasharray={SERI_CIZGI[i % 4]}
              strokeLinejoin="round"
            />
            {s.ad && (
              <text x={ad[0]} y={ad[1]} className="seri-ad" fill={SERI_RENK[i % 4]} textAnchor="middle">
                {s.ad}
              </text>
            )}
          </g>
        );
      })}
      <text x={W - 6} y={H - 6} className="eksen-ad" textAnchor="end">
        {g.x}
      </text>
      <text x={px(0) + 8} y={py(y1) - 6} className="eksen-ad">
        {g.y}
      </text>
      {xT.map(([v, t]) => (
        <text key={`tx${v}`} x={px(v)} y={py(0) + 16} textAnchor="middle" className="isaret">
          {t}
        </text>
      ))}
      {yT.map(([v, t]) => (
        <text key={`ty${v}`} x={px(0) - 6} y={py(v) + 4} textAnchor="end" className="isaret">
          {t}
        </text>
      ))}
    </svg>
  );
}

function Secmeli({ kart, cevap, onCevap, yazarak }: Props<SecmeliKart>) {
  const dogruMetin = kart.secenekler[kart.dogru];
  const secenekler = useMemo(() => sikSirasi(kart), [kart]);
  // Öncüllü ya da tablolu/grafikli sorularda şıkları gizlemek anlamsız
  const [goster, setGoster] = useState(!yazarak || !!kart.oncul?.length || !!kart.tablo || !!kart.grafik);
  const sec = (i: number) => onCevap({ dogru: secenekler[i] === dogruMetin, secim: secenekler[i] });
  useRakamTuslari(!cevap && goster, secenekler.length, sec, true);

  if (!goster && !cevap)
    return (
      <>
        <SoruMetni kart={kart} />
        <div className="sik-gizli">
          <p>Önce cevabı aklından söyle, sonra şıklardan seç.</p>
          <button className="dugme ikincil" onClick={() => setGoster(true)} autoFocus>
            Şıkları göster
          </button>
        </div>
      </>
    );

  return (
    <>
      <SoruMetni kart={kart} />
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

function Bosluk({ kart, cevap, onCevap, yazarak }: Props<BoslukKart>) {
  const secenekler = useMemo(() => karistir([kart.cevap, ...kart.celdiriciler]), [kart]);
  const [once, sonra] = kart.cumle.split("___");
  const [yazi, setYazi] = useState("");
  const sec = (i: number) => onCevap({ dogru: secenekler[i] === kart.cevap, secim: secenekler[i] });
  useRakamTuslari(!cevap && !yazarak, secenekler.length, sec);

  if (yazarak) {
    const kontrol = () => {
      const k = yazimKabul(yazi, kart.cevap);
      onCevap({ dogru: k !== "yanlis", secim: yazi.trim() || undefined, yakin: k === "yakin" });
    };
    return (
      <>
        <p className="soru-metni bosluk-cumle">
          {once}
          {cevap ? (
            cevap.dogru ? (
              <span className="bosluk-yer dogru">{kart.cevap}</span>
            ) : (
              <>
                {cevap.secim && <span className="bosluk-yer yanlis">{cevap.secim}</span>}
                <span className="bosluk-yer dogru">{kart.cevap}</span>
              </>
            )
          ) : (
            <span className="bosluk-yer bos">&nbsp;</span>
          )}
          {sonra}
        </p>
        {!cevap && (
          <form
            className="yazi-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (yazi.trim()) kontrol();
            }}
          >
            <input
              id="yazili-cevap"
              value={yazi}
              onChange={(e) => setYazi(e.target.value)}
              placeholder="Cevabını yaz"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              autoFocus
            />
            <button className="dugme birincil" type="submit" disabled={!yazi.trim()}>
              Kontrol et
            </button>
          </form>
        )}
        {cevap?.yakin && <p className="yazim-not">Küçük bir yazım farkıyla doğru sayıldı. Doğru yazımı: {kart.cevap}</p>}
      </>
    );
  }

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
