#!/usr/bin/env node
// content/karisanlar/*.json: birbirine karıştırılan kavram setlerini denetler.
// Her set var olan kartlara (uid = "<kitap>/<kart id>") başvurur.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const uids = new Set();
const dersOf = new Map();
for (const f of readdirSync(join(root, "content")).filter((f) => f.endsWith(".json"))) {
  const d = JSON.parse(readFileSync(join(root, "content", f), "utf8"));
  for (const u of d.uniteler) for (const k of u.konular) for (const c of k.kartlar) {
    uids.add(`${d.kitap}/${c.id}`);
    dersOf.set(`${d.kitap}/${c.id}`, d.ders);
  }
}
const dir = join(root, "content", "karisanlar");
const files = process.argv.slice(2).length ? process.argv.slice(2) : existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => join(dir, f)) : [];
let hata = 0;
const ids = new Set();
for (const file of files) {
  const data = JSON.parse(readFileSync(file, "utf8"));
  const err = (m) => { console.error(`  ${m}`); hata++; };
  console.log(`• ${file.split("/").pop()}: ${data.setler?.length ?? 0} set`);
  for (const s of data.setler ?? []) {
    const w = `set ${s.id}`;
    if (!/^[a-z0-9-]+$/.test(s.id ?? "")) err(`${w}: id küçük harf, rakam ve tire olmalı`);
    if (ids.has(s.id)) err(`${w}: id tekrar ediyor`);
    ids.add(s.id);
    if (typeof s.ad !== "string" || s.ad.length < 3 || s.ad.length > 60) err(`${w}: ad 3-60 karakter olmalı`);
    if (typeof s.fark !== "string" || s.fark.length < 20 || s.fark.length > 300) err(`${w}: fark 20-300 karakter olmalı`);
    if (!Array.isArray(s.kartlar) || s.kartlar.length < 5 || s.kartlar.length > 16) err(`${w}: 5-16 kart olmalı`);
    for (const u of s.kartlar ?? []) if (!uids.has(u)) err(`${w}: kart yok: ${u}`);
    if (new Set(s.kartlar).size !== s.kartlar?.length) err(`${w}: kart tekrar ediyor`);
    if (s.ders && (s.kartlar ?? []).some((u) => uids.has(u) && dersOf.get(u) !== s.ders)) err(`${w}: başka dersten kart var`);
  }
}
console.log(hata ? `\n${hata} hata` : "\n0 hata");
process.exit(hata ? 1 : 0);
