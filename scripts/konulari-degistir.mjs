#!/usr/bin/env node
// Bir kitap dosyasındaki konuların kartlarını yenileriyle değiştirir; dosyanın biçimini (1 boşluk girinti) korur.
// Kullanım: node scripts/konulari-degistir.mjs content/tarih-10.json yeni.json
// yeni.json: { "1.1": [kart, ...], "1.2": [...] } — yalnızca verilen konular değişir.
import { readFileSync, writeFileSync } from "node:fs";

const [dosya, yeni] = process.argv.slice(2);
if (!dosya || !yeni) {
  console.error("Kullanım: node scripts/konulari-degistir.mjs content/<kitap>.json <yeni-konular>.json");
  process.exit(1);
}
const kitap = JSON.parse(readFileSync(dosya, "utf8"));
const konular = JSON.parse(readFileSync(yeni, "utf8"));
const bulunan = new Set();
for (const u of kitap.uniteler)
  for (const k of u.konular)
    if (konular[k.no]) {
      k.kartlar = konular[k.no];
      bulunan.add(k.no);
    }
const eksik = Object.keys(konular).filter((no) => !bulunan.has(no));
if (eksik.length) {
  console.error(`Bu konular dosyada yok: ${eksik.join(", ")}`);
  process.exit(1);
}
writeFileSync(dosya, JSON.stringify(kitap, null, 1) + "\n");
console.log(`${dosya}: ${bulunan.size} konu güncellendi (${[...bulunan].join(", ")})`);
