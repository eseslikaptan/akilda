// Sunucusuz yardımcılar: kalıcı depolama, takvim hatırlatması, paylaşım, hata bildirimi.
import type { KartRef } from "./types";
import { AYT_TARIHI, YKS_TARIHI } from "./yks";
import { WEB_ADRES, metinPaylas, yerelMi } from "./yerel";

/** Tarayıcıdan verinin kendiliğinden silinmemesini iste (Safari'nin 7 gün kuralına karşı) */
export async function kaliciDepolamaIste(): Promise<boolean | null> {
  try {
    if (!navigator.storage?.persist) return null;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return null;
  }
}

export async function kaliciMi(): Promise<boolean | null> {
  try {
    return navigator.storage?.persisted ? await navigator.storage.persisted() : null;
  } catch {
    return null;
  }
}

/** Uygulama ana ekrana eklenmiş (standalone) olarak mı açık? */
export function anaEkrandaMi(): boolean {
  if (yerelMi) return true; // iOS uygulaması: Safari'nin 7 gün kuralı geçerli değil
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function iosMu(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function icsTarih(d: Date, saatli = true): string {
  const p = (n: number) => String(n).padStart(2, "0");
  const gun = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
  return saatli ? `${gun}T${p(d.getHours())}${p(d.getMinutes())}00` : gun;
}

/**
 * Günlük çalışma hatırlatması + sınav günleri için .ics dosyası.
 * Push sunucusu olmadan telefonun kendi takvimi bildirim gönderir.
 */
export function takvimDosyasi(saat: string, adres: string): string {
  const [hh, mm] = saat.split(":").map(Number);
  const bas = new Date();
  bas.setHours(hh, mm, 0, 0);
  if (bas < new Date()) bas.setDate(bas.getDate() + 1);
  const bit = new Date(bas.getTime() + 15 * 60_000);
  const damga = icsTarih(new Date()) ;
  const satirlar = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Akilda//YKS//TR",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:akilda-gunluk-${damga}@akilda`,
    `DTSTAMP:${damga}`,
    `DTSTART:${icsTarih(bas)}`,
    `DTEND:${icsTarih(bit)}`,
    `RRULE:FREQ=DAILY;UNTIL=${icsTarih(YKS_TARIHI, false)}`,
    "SUMMARY:Akılda: günlük tekrar",
    `DESCRIPTION:Bugünkü tekrarlarını yap\\, serini koru. ${adres}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:Akılda: günlük tekrar zamanı",
    "TRIGGER:PT0M",
    "END:VALARM",
    "END:VEVENT",
    ...[
      ["TYT", YKS_TARIHI, 165],
      ["AYT", AYT_TARIHI, 180],
    ].flatMap(([ad, t, dk]) => [
      "BEGIN:VEVENT",
      `UID:akilda-${ad}-2027@akilda`,
      `DTSTAMP:${damga}`,
      `DTSTART:${icsTarih(t as Date)}`,
      `DTEND:${icsTarih(new Date((t as Date).getTime() + (dk as number) * 60_000))}`,
      `SUMMARY:2027-YKS ${ad}`,
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:Yarın ${ad}! Kimliğini ve sınav giriş belgeni hazırla.`,
      "TRIGGER:-P1D",
      "END:VALARM",
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ];
  return satirlar.join("\r\n") + "\r\n";
}

export function dosyaIndir(icerik: string, ad: string, tur: string) {
  const blob = new Blob([icerik], { type: tur });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = ad;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** Uygulamanın kök adresi (hash'siz). iOS uygulamasında paylaşılabilir web adresi. */
export function uygulamaAdresi(): string {
  return yerelMi ? WEB_ADRES : window.location.href.split("#")[0];
}

/** Arkadaşa meydan okuma: aynı soruları içeren bağlantı */
export function meydanLinki(uids: string[], ad: string, dogru: number): string {
  const q = new URLSearchParams({ k: uids.join(","), a: ad || "Bir arkadaşın", s: `${dogru}/${uids.length}` });
  return `${uygulamaAdresi()}#/meydan?${q.toString()}`;
}

/** Paylaş menüsü varsa onu, yoksa panoya kopyalamayı dener. Sonucu metin olarak döner. */
export async function paylas(baslik: string, metin: string, url: string): Promise<string> {
  if (await metinPaylas(baslik, metin, url)) return "";
  try {
    if (navigator.share) {
      await navigator.share({ title: baslik, text: metin, url });
      return "Paylaşıldı.";
    }
  } catch {
    // kullanıcı vazgeçti ya da desteklenmiyor: kopyalamayı dene
  }
  try {
    await navigator.clipboard.writeText(`${metin} ${url}`);
    return "Bağlantı kopyalandı.";
  } catch {
    return url;
  }
}

const DEPO = "https://github.com/eseslikaptan/akilda";

/** "Bu kartta hata var": önceden doldurulmuş GitHub issue bağlantısı */
export function hataBildirLinki(r: KartRef): string {
  if (yerelMi) return `${WEB_ADRES}destek.html?kart=${encodeURIComponent(r.uid)}`;
  const k = r.kart;
  const metin =
    k.tur === "secmeli"
      ? [k.soru, ...(k.oncul ?? []).map((o, i) => `${["I", "II", "III", "IV", "V"][i]}. ${o}`), k.kok ?? ""].filter(Boolean).join("\n")
      : k.tur === "dy" ? k.ifade : k.tur === "bosluk" ? k.cumle : k.yonerge;
  const govde = [
    `**Kart:** \`${r.uid}\``,
    `**Kaynak:** ${r.kitap.baslik}, s. ${k.sayfa}`,
    `**Soru:** ${metin}`,
    `**Bilgi:** ${k.bilgi}`,
    "",
    "**Sorun nedir?**",
    "",
  ].join("\n");
  const q = new URLSearchParams({ title: `Kart hatası: ${r.uid}`, body: govde, labels: "icerik-hatasi" });
  return `${DEPO}/issues/new?${q.toString()}`;
}
