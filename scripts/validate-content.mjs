#!/usr/bin/env node
// content/*.json dosyalarını docs/icerik-formati.md'deki kurallara göre denetler.
// Kullanım: node scripts/validate-content.mjs [dosya ...]
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const DERSLER = ["edebiyat", "fizik", "kimya", "biyoloji", "cografya", "felsefe", "tarih", "inkilap", "din", "matematik"];
const TURLER = ["secmeli", "dy", "bosluk", "eslestir"];

const files = process.argv.slice(2).length
  ? process.argv.slice(2)
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
        if (!isStr(c.bilgi, 260)) err(cw, "bilgi eksik veya çok uzun (≤ 260)");
        if (!Number.isInteger(c.sayfa) || c.sayfa < 1) err(cw, "sayfa pozitif tam sayı olmalı");
        if (cikmis && !/^20\d\d-(TYT|AYT)$/.test(c.yil ?? "")) err(cw, 'yil "2023-TYT" biçiminde olmalı');

        let key = "";
        if (c.tur === "secmeli") {
          key = c.soru;
          if (!isStr(c.soru, 300)) err(cw, "soru eksik/uzun");
          if (!Array.isArray(c.secenekler) || c.secenekler.length < 3 || c.secenekler.length > 5)
            err(cw, "3-5 seçenek olmalı");
          else {
            if (c.secenekler.some((s) => !isStr(s, 140))) err(cw, "boş/uzun seçenek");
            if (new Set(c.secenekler.map(norm)).size !== c.secenekler.length) err(cw, "seçenekler tekrar ediyor");
            if (!Number.isInteger(c.dogru) || c.dogru < 0 || c.dogru >= c.secenekler.length) err(cw, "dogru indeksi geçersiz");
            if (c.secenekler.some((s) => /hepsi|hiçbiri/i.test(s))) warns.push(`${cw}: "hepsi/hiçbiri" seçeneği`);
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
