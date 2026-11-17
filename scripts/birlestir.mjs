#!/usr/bin/env node
// data/parca/<kitap>/u*.json ünite parçalarını content/<kitap>.json dosyasında birleştirir.
// Kitap bilgileri (başlık, bağlantılar) data/books.json'dan alınır.
// Kullanım: node scripts/birlestir.mjs tarih-9 [cografya-9 ...]
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const books = JSON.parse(readFileSync(join(root, "data", "books.json"), "utf8"));
// ÖSYM çıkmış soru kaynakları (MEB'in konu bazlı derlemeleri): bilgileri sorulan çıkmış sorulardan çıkarılmış kartlar
const cikmis = JSON.parse(readFileSync(join(root, "data", "cikmis.json"), "utf8"));
const keys = process.argv.slice(2);
if (!keys.length) {
  console.error("Kullanım: node scripts/birlestir.mjs <kitap> [...]");
  process.exit(1);
}

for (const key of keys) {
  const book = books.find((b) => b.key === key) ?? cikmis.find((b) => b.key === key);
  if (!book) throw new Error(`data/books.json ya da data/cikmis.json içinde yok: ${key}`);
  const dir = join(root, "data", "parca", key);
  const parts = readdirSync(dir)
    .filter((f) => /^u\d+\.json$/.test(f))
    .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")))
    .sort((a, b) => a.no - b.no);

  const out = book.sinav
    ? {
        kitap: key,
        tip: "cikmis",
        ders: book.ders,
        sinav: book.sinav,
        baslik: book.baslik,
        sayfaUrl: book.sayfaUrl,
        pdfUrl: book.pdfUrl,
        testUrl: book.testUrl,
        uniteler: parts,
      }
    : {
        kitap: key,
        ders: book.ders,
        sinif: book.sinif,
        baslik: book.baslik.replace(/(\d+)\.Sınıf/, "$1. Sınıf").replace(/\s+/g, " ").trim(),
        sayfaUrl: book.sayfaUrl,
        pdfUrl: book.pdfUrl,
        uniteler: parts,
      };
  mkdirSync(join(root, "content"), { recursive: true });
  writeFileSync(join(root, "content", `${key}.json`), JSON.stringify(out, null, 1) + "\n");
  const n = parts.reduce((s, u) => s + u.konular.reduce((t, k) => t + k.kartlar.length, 0), 0);
  console.log(`${key}: ${parts.length} ünite, ${n} kart → content/${key}.json`);
}
