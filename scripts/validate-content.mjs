#!/usr/bin/env node
// content/*.json dosyalarını docs/icerik-formati.md'deki kurallara göre denetler.
// Kullanım: node scripts/validate-content.mjs [dosya ...]
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const DERSLER = ["edebiyat", "fizik", "kimya", "biyoloji", "cografya", "felsefe", "tarih", "inkilap", "din", "matematik"];
const TURLER = ["secmeli", "dy", "bosluk", "eslestir"];

// --yks: YKS biçimi zorunlu (yalnızca 5 şıklı çoktan seçmeli)
const argv = process.argv.slice(2);
const YKS = argv.includes("--yks");
const args = argv.filter((a) => a !== "--yks");
const files = args.length
  ? args
  : readdirSync(join(root, "content"))
      .filter((f) => f.endsWith(".json"))
      .map((f) => join(root, "content", f));

const isStr = (v, max = 1000) => typeof v === "string" && v.trim().length > 0 && v.length <= max;
const norm = (s) => s.toLocaleLowerCase("tr").replace(/\s+/g, " ").trim();

let totalErrors = 0;
let totalCards = 0;

for (const file of files) {
  const errors = [];
  const warns = [];
  let data;
  try {
    data = JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    console.error(`✗ ${file}: JSON okunamadı — ${e.message}`);
    totalErrors++;
    continue;
  }
  const err = (where, msg) => errors.push(`${where}: ${msg}`);

  if (data.kitap !== basename(file, ".json")) err("kitap", `dosya adıyla aynı olmalı (${basename(file, ".json")})`);
  if (!DERSLER.includes(data.ders)) err("ders", `geçersiz: ${data.ders}`);
  const cikmis = data.tip === "cikmis";
  if (cikmis) {
    if (!["TYT", "AYT"].includes(data.sinav)) err("sinav", `TYT ya da AYT olmalı: ${data.sinav}`);
    if (!isStr(data.testUrl) || !data.testUrl.startsWith("https://")) err("testUrl", "eksik");
  } else if (![9, 10, 11, 12].includes(data.sinif)) err("sinif", `geçersiz: ${data.sinif}`);
  if (!isStr(data.baslik)) err("baslik", "eksik");
  if (!isStr(data.pdfUrl) || !data.pdfUrl.startsWith("https://")) err("pdfUrl", "eksik");
  if (!Array.isArray(data.uniteler) || data.uniteler.length === 0) err("uniteler", "boş");

  const ids = new Set();
  const texts = new Map();
  const counts = Object.fromEntries(TURLER.map((t) => [t, 0]));
  let dyTrue = 0;
  let yksDisi = 0; // 5 şıklı olmayan çoktan seçmeli
  const sabitDogru = {}; // sıralı/öncüllü sorularda doğru şıkkın yeri

  for (const [ui, u] of (data.uniteler || []).entries()) {
    const uw = `ünite ${u.no ?? ui + 1}`;
    if (!Number.isInteger(u.no)) err(uw, "no tam sayı olmalı");
    if (!isStr(u.ad, 120)) err(uw, "ad eksik");
    if (!Array.isArray(u.konular) || u.konular.length === 0) err(uw, "konular boş");
    for (const k of u.konular || []) {
      const kw = `konu ${k.no}`;
      if (!isStr(k.no, 12)) err(kw, "no eksik");
      if (!isStr(k.ad, 140)) err(kw, "ad eksik");
      if (!Array.isArray(k.kartlar) || k.kartlar.length < (cikmis ? 1 : 3)) err(kw, `en az ${cikmis ? 1 : 3} kart olmalı`);
      if (cikmis) {
        if (!Number.isInteger(k.soruSayisi) || k.soruSayisi < 0) err(kw, "soruSayisi (bu konudaki çıkmış soru sayısı) tam sayı olmalı");
        if (!Array.isArray(k.eslesen) || k.eslesen.some((x) => typeof x !== "string" || !/^[a-z]+-\d+\/[\d.]+$/.test(x)))
          err(kw, "eslesen: ['tarih-9/1.2', ...] biçiminde konu kimlikleri listesi olmalı (boş olabilir)");
      }
      for (const c of k.kartlar || []) {
        totalCards++;
        const cw = `kart ${c.id ?? "?"}`;
        if (!isStr(c.id, 20)) err(cw, "id eksik");
        else if (ids.has(c.id)) err(cw, "id tekrar ediyor");
        else ids.add(c.id);
        if (!TURLER.includes(c.tur)) {
          err(cw, `geçersiz tür: ${c.tur}`);
          continue;
        }
        counts[c.tur]++;
        if (YKS && c.tur !== "secmeli") err(cw, `YKS biçiminde yalnızca secmeli kart olur (${c.tur})`);
        if (!isStr(c.bilgi, 360)) err(cw, "bilgi eksik veya çok uzun (≤ 360)");
        if (!Number.isInteger(c.sayfa) || c.sayfa < 1) err(cw, "sayfa pozitif tam sayı olmalı");
        if (cikmis && !/^20\d\d-(TYT|AYT)$/.test(c.yil ?? "")) err(cw, 'yil "2023-TYT" biçiminde olmalı');

        let key = "";
        if (c.tur === "secmeli") {
          key = [c.soru, ...(c.oncul || []), c.kok || ""].join(" ");
          if (!isStr(c.soru, 900)) err(cw, "soru eksik/uzun (≤ 900)");
          else if (c.soru.split("\n").some((p) => p.length > 650)) err(cw, "soru paragrafı çok uzun (≤ 650)");
          if (!Array.isArray(c.secenekler) || c.secenekler.length < 3 || c.secenekler.length > 5)
            err(cw, "3-5 seçenek olmalı");
          else {
            if (c.secenekler.length !== 5) {
              yksDisi++;
              if (YKS) err(cw, "YKS biçiminde 5 şık olmalı");
            }
            if (c.secenekler.some((s) => !isStr(s, 170))) err(cw, "boş/uzun seçenek (≤ 170)");
            if (new Set(c.secenekler.map(norm)).size !== c.secenekler.length) err(cw, "seçenekler tekrar ediyor");
            if (!Number.isInteger(c.dogru) || c.dogru < 0 || c.dogru >= c.secenekler.length) err(cw, "dogru indeksi geçersiz");
            if (c.secenekler.some((s) => /hepsi|hiçbiri/i.test(s))) warns.push(`${cw}: "hepsi/hiçbiri" seçeneği`);
            // Doğru şık belirgin biçimde en uzun olmamalı (cevabı ele verir)
            const uz = c.secenekler.map((s) => s.length);
            const digerleri = uz.filter((_, i) => i !== c.dogru).sort((a, b) => a - b);
            const ortanca = digerleri[Math.floor(digerleri.length / 2)];
            if (!c.oncul && !c.sirali && uz[c.dogru] > 30 && uz[c.dogru] > ortanca * 1.6 && uz[c.dogru] > Math.max(...digerleri))
              warns.push(`${cw}: doğru şık diğerlerinden belirgin biçimde uzun`);
            if (c.oncul || c.sirali) sabitDogru[c.dogru] = (sabitDogru[c.dogru] || 0) + 1;
          }
          if (c.oncul !== undefined) {
            if (!Array.isArray(c.oncul) || c.oncul.length < 2 || c.oncul.length > 5 || c.oncul.some((o) => !isStr(o, 240)))
              err(cw, "oncul: 2-5 ifade (her biri ≤ 240)");
            if (!isStr(c.kok, 200)) err(cw, "öncüllü soruda kok (öncüllerden sonraki soru kökü) gerekli");
            const R = ["I", "II", "III", "IV", "V"].slice(0, (c.oncul || []).length);
            const rx = `(${R.join("|")})`;
            const kume = new RegExp(`^(Yalnız ${rx}|${rx}(, ${rx})* ve ${rx})$`);
            const sira = new RegExp(`^${rx}( - ${rx})+$`);
            if (Array.isArray(c.secenekler) && !c.secenekler.every((s) => kume.test(s) || sira.test(s)))
              err(cw, 'öncüllü soruda şıklar "Yalnız I", "I ve II", "I, II ve III" ya da "II - I - III" biçiminde olmalı');
          } else if (c.kok !== undefined) err(cw, "kok yalnızca öncüllü sorularda kullanılır");
          if (c.tablo !== undefined) {
            const t = c.tablo;
            if (!Array.isArray(t) || t.length < 2 || t.length > 9 || t.some((r) => !Array.isArray(r) || r.length !== t[0].length || r.length < 2 || r.length > 7 || r.some((h) => typeof h !== "string" || h.length > 40)))
              err(cw, "tablo: 2-9 satır, eşit uzunlukta 2-7 hücre (≤ 40 karakter)");
          }
          if (c.grafik !== undefined) {
            const g = c.grafik;
            const nokta = (p) => Array.isArray(p) && p.length === 2 && p.every((v) => typeof v === "number" && isFinite(v));
            if (!g || !isStr(g.x, 20) || !isStr(g.y, 20) || !Array.isArray(g.seriler) || g.seriler.length < 1 || g.seriler.length > 4 || g.seriler.some((s) => !Array.isArray(s.n) || s.n.length < 2 || !s.n.every(nokta)))
              err(cw, "grafik: {x, y, seriler: [{ad?, n: [[x,y],...]}]} (1-4 seri, ≥ 2 nokta)");
            for (const k of ["xIsaret", "yIsaret"])
              if (g?.[k] !== undefined && (!Array.isArray(g[k]) || g[k].some((p) => !Array.isArray(p) || typeof p[0] !== "number" || typeof p[1] !== "string")))
                err(cw, `grafik.${k}: [[sayı, "etiket"], ...]`);
          }
        } else if (c.tur === "dy") {
          key = c.ifade;
          if (!isStr(c.ifade, 300)) err(cw, "ifade eksik/uzun");
          if (typeof c.dogru !== "boolean") err(cw, "dogru true/false olmalı");
          if (c.dogru === true) dyTrue++;
        } else if (c.tur === "bosluk") {
          key = c.cumle;
          if (!isStr(c.cumle, 300)) err(cw, "cumle eksik/uzun");
          else if ((c.cumle.match(/___/g) || []).length !== 1) err(cw, "cumle içinde tam bir ___ olmalı");
          if (!isStr(c.cevap, 60)) err(cw, "cevap eksik/uzun");
          if (!Array.isArray(c.celdiriciler) || c.celdiriciler.length < 2 || c.celdiriciler.length > 4)
            err(cw, "2-4 çeldirici olmalı");
          else if (c.celdiriciler.some((s) => !isStr(s, 60) || norm(s) === norm(c.cevap || "")))
            err(cw, "çeldirici boş/uzun ya da cevapla aynı");
        } else if (c.tur === "eslestir") {
          key = (c.ciftler || []).map((p) => p[0]).join("|");
          if (!isStr(c.yonerge, 160)) err(cw, "yonerge eksik");
          if (!Array.isArray(c.ciftler) || c.ciftler.length < 3 || c.ciftler.length > 5) err(cw, "3-5 çift olmalı");
          else {
            if (c.ciftler.some((p) => !Array.isArray(p) || p.length !== 2 || !isStr(p[0], 70) || !isStr(p[1], 90)))
              err(cw, "her çift [sol(≤70), sağ(≤90)] olmalı");
            else {
              if (new Set(c.ciftler.map((p) => norm(p[0]))).size !== c.ciftler.length) err(cw, "sol taraf tekrar ediyor");
              if (new Set(c.ciftler.map((p) => norm(p[1]))).size !== c.ciftler.length) err(cw, "sağ taraf tekrar ediyor");
            }
          }
        }
        if (key) {
          const n = norm(key);
          if (texts.has(n)) warns.push(`${cw}: ${texts.get(n)} ile aynı metin`);
          else texts.set(n, cw);
        }
      }
    }
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const mix = TURLER.map((t) => `${t} ${counts[t]}`).join(", ");
  if (counts.dy > 4 && (dyTrue / counts.dy < 0.3 || dyTrue / counts.dy > 0.7))
    warns.push(`D/Y dengesi: ${dyTrue}/${counts.dy} doğru`);
  const sabitToplam = Object.values(sabitDogru).reduce((a, b) => a + b, 0);
  if (sabitToplam >= 10 && Object.values(sabitDogru).some((n) => n / sabitToplam > 0.35))
    warns.push(`öncüllü/sıralı sorularda doğru şık dengesiz: ${JSON.stringify(sabitDogru)}`);
  if (yksDisi) warns.push(`${yksDisi} çoktan seçmeli soru 5 şıklı değil (YKS biçimi 5 şık)`);

  if (errors.length) {
    console.error(`✗ ${basename(file)} — ${errors.length} hata`);
    for (const e of errors.slice(0, 60)) console.error(`   ${e}`);
    if (errors.length > 60) console.error(`   … ${errors.length - 60} hata daha`);
  } else {
    console.log(`✓ ${basename(file)} — ${total} kart (${mix})`);
  }
  for (const w of warns.slice(0, 20)) console.log(`   uyarı: ${w}`);
  totalErrors += errors.length;
}

console.log(`\nToplam ${totalCards} kart, ${totalErrors} hata`);
process.exit(totalErrors ? 1 : 0);
