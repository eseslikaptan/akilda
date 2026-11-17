// Haftalık karne: son 7 günün özeti, paylaşılabilir görsel olarak (sunucusuz, canvas ile).
import { useEffect, useMemo, useRef, useState } from "react";
import type { Dizin } from "../content";
import type { Ilerleme } from "../types";
import { gunAnahtari, seri, useIlerleme } from "../store";
import { DERSLER } from "../subjects";
import { gunKaldi } from "../yks";
import { geri } from "../router";
import { kursAdi } from "./Dersler";
import { UstBar } from "../ui";
import { dosyaPaylas, yerelMi } from "../yerel";

const GUN_ADI = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

interface Ozet {
  gunler: { ad: string; xp: number; bugun: boolean }[];
  xp: number;
  calisilanGun: number;
  dogru: number;
  yanlis: number;
  yeni: number;
  seri: number;
  kalanGun: number;
  dersler: { ad: string; hue: number; adet: number }[];
  cikmis: number;
}

export function haftaOzeti(d: Dizin, p: Ilerleme): Ozet {
  const gunler: Ozet["gunler"] = [];
  let xp = 0,
    dogru = 0,
    yanlis = 0,
    yeni = 0,
    calisilanGun = 0;
  const simdi = new Date();
  for (let i = 6; i >= 0; i--) {
    const t = new Date(simdi.getFullYear(), simdi.getMonth(), simdi.getDate() - i);
    const k = gunAnahtari(t);
    const gx = p.gunler[k] ?? 0;
    gunler.push({ ad: GUN_ADI[t.getDay()], xp: gx, bugun: i === 0 });
    xp += gx;
    if (gx > 0) calisilanGun++;
    const [dd, yy] = p.cevaplar[k] ?? [0, 0];
    dogru += dd;
    yanlis += yy;
    yeni += p.yeniler[k] ?? 0;
  }
  // Bu hafta tekrar edilen bilgilerin derslere dağılımı
  const haftaBasi = new Date(simdi.getFullYear(), simdi.getMonth(), simdi.getDate() - 6).getTime();
  const sayac = new Map<string, number>();
  let cikmis = 0;
  for (const [uid, k] of Object.entries(p.kartlar)) {
    if (k.l < haftaBasi) continue;
    const ref = d.kartlar.get(uid);
    if (!ref) continue;
    const kurs = d.kitapKursu.get(ref.kitap.kitap);
    if (kurs) sayac.set(kurs.id, (sayac.get(kurs.id) ?? 0) + 1);
    if (ref.kart.yil) cikmis++;
  }
  const dersler = [...sayac.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, adet]) => {
      const k = d.kurs.get(id)!;
      return { ad: kursAdi(k), hue: DERSLER[k.ders].hue, adet };
    });
  return { gunler, xp, calisilanGun, dogru, yanlis, yeni, seri: seri(p), kalanGun: gunKaldi(), dersler, cikmis };
}

/** 1080×1350 karne görseli */
function ciz(c: HTMLCanvasElement, o: Ozet, ad: string) {
  const W = 1080,
    H = 1350;
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  const serif = '"Fredoka Variable", system-ui, sans-serif';
  const sans = '"Nunito Variable", system-ui, sans-serif';

  const zemin = g.createLinearGradient(0, 0, W, H);
  zemin.addColorStop(0, "#1f1b2d");
  zemin.addColorStop(1, "#3a2340");
  g.fillStyle = zemin;
  g.fillRect(0, 0, W, H);

  g.fillStyle = "#f29a45";
  g.font = `700 34px ${sans}`;
  g.fillText("AKILDA · HAFTALIK KARNE", 80, 120);
  g.fillStyle = "#f6f1e7";
  g.font = `600 76px ${serif}`;
  g.fillText(ad ? `${ad} · bu hafta` : "Bu haftam", 80, 215);
  g.font = `500 32px ${sans}`;
  g.fillStyle = "rgba(246,241,231,.7)";
  g.fillText(`2027 YKS'ye ${o.kalanGun} gün`, 80, 270);

  // Günlük XP çubukları
  const enCok = Math.max(50, ...o.gunler.map((x) => x.xp));
  const tabanY = 640,
    yuk = 260,
    gen = 92,
    ara = 38;
  o.gunler.forEach((x, i) => {
    const xx = 80 + i * (gen + ara);
    const h = Math.max(10, (x.xp / enCok) * yuk);
    g.fillStyle = "rgba(246,241,231,.1)";
    g.beginPath();
    g.roundRect(xx, tabanY - yuk, gen, yuk, 18);
    g.fill();
    g.fillStyle = x.xp ? (x.bugun ? "#ffb066" : "#f29a45") : "rgba(246,241,231,.25)";
    g.beginPath();
    g.roundRect(xx, tabanY - h, gen, h, 18);
    g.fill();
    g.fillStyle = "rgba(246,241,231,.8)";
    g.font = `600 28px ${sans}`;
    g.textAlign = "center";
    g.fillText(x.ad, xx + gen / 2, tabanY + 44);
    g.textAlign = "left";
  });

  // Sayılar
  const isabet = o.dogru + o.yanlis ? Math.round((o.dogru / (o.dogru + o.yanlis)) * 100) : 0;
  const kutular = [
    [`${o.xp}`, "XP"],
    [`${o.seri}`, "gün seri"],
    [`%${isabet}`, "isabet"],
    [`${o.yeni}`, "yeni bilgi"],
  ];
  kutular.forEach(([v, e], i) => {
    const xx = 80 + (i % 2) * 470,
      yy = 750 + Math.floor(i / 2) * 170;
    g.fillStyle = "rgba(246,241,231,.08)";
    g.beginPath();
    g.roundRect(xx, yy, 450, 150, 28);
    g.fill();
    g.fillStyle = "#f6f1e7";
    g.font = `700 64px ${serif}`;
    g.fillText(v, xx + 36, yy + 82);
    g.fillStyle = "rgba(246,241,231,.65)";
    g.font = `600 28px ${sans}`;
    g.fillText(e, xx + 36, yy + 124);
  });

  // En çok çalışılan dersler
  g.fillStyle = "rgba(246,241,231,.7)";
  g.font = `600 28px ${sans}`;
  g.fillText(
    o.dersler.length ? `En çok: ${o.dersler.map((x) => x.ad).join(" · ")}` : "Bu hafta henüz ders çalışılmadı",
    80,
    1130,
  );
  if (o.cikmis) g.fillText(`${o.cikmis} ÖSYM'de çıkmış bilgi tekrarlandı`, 80, 1180);
  g.fillStyle = "#f29a45";
  g.font = `600 30px ${sans}`;
  g.fillText(`${o.calisilanGun}/7 gün çalıştı · okuduğun akılda kalsın`, 80, 1270);
}

export function Karne({ dizin }: { dizin: Dizin }) {
  const p = useIlerleme();
  const o = useMemo(() => haftaOzeti(dizin, p), [dizin, p]);
  const tuval = useRef<HTMLCanvasElement>(null);
  const [mesaj, setMesaj] = useState("");

  useEffect(() => {
    // Yazı tipleri yüklendikten sonra çiz ki görsel doğru fontla çıksın
    document.fonts.ready.then(() => tuval.current && ciz(tuval.current, o, p.ayarlar.ad));
  }, [o, p.ayarlar.ad]);

  const paylas = async () => {
    const c = tuval.current;
    if (!c) return;
    if (yerelMi) {
      // iOS: paylaşım menüsü (Instagram, WhatsApp, Fotoğraflar'a kaydet…)
      await dosyaPaylas(c.toDataURL("image/png").split(",")[1], "akilda-karne.png", true);
      return;
    }
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/png"));
    if (!blob) return;
    const dosya = new File([blob], "akilda-karne.png", { type: "image/png" });
    try {
      if (navigator.canShare?.({ files: [dosya] })) {
        await navigator.share({ files: [dosya], title: "Akılda haftalık karne" });
        setMesaj("Paylaşıldı.");
        return;
      }
    } catch {
      /* vazgeçildi: indirmeye geç */
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "akilda-karne.png";
    a.click();
    setMesaj("Görsel indirildi.");
  };

  return (
    <div className="sayfa">
      <UstBar onGeri={() => geri("/profil")} baslik="Haftalık karne" />
      <canvas ref={tuval} className="karne-tuval" aria-label="Haftalık karne görseli" />
      <div className="karne-ozet">
        <span>
          <strong>{o.dogru + o.yanlis}</strong> cevap
        </span>
        <span>
          <strong>{o.calisilanGun}</strong>/7 gün
        </span>
        <span>
          <strong>{o.yeni}</strong> yeni bilgi
        </span>
      </div>
      <button className="dugme birincil genis" onClick={paylas}>
        Karneyi paylaş
      </button>
      {mesaj && <p className="soluk-metin">{mesaj}</p>}
    </div>
  );
}
