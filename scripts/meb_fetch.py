#!/usr/bin/env python3
"""MEB ders kitaplarını resmi kaynaktan (tymm.meb.gov.tr) listeler ve indirir.

Kullanım:
    python3 scripts/meb_fetch.py                 # YKS derslerinin tamamı, 9-12. sınıf
    python3 scripts/meb_fetch.py --ders tarih biyoloji --sinif 9 10
    python3 scripts/meb_fetch.py --sadece-liste  # PDF indirmeden sadece data/books.json

İndirilen PDF'ler data/raw/ altına kaydedilir ve depoya eklenmez (.gitignore).
Kitapların telif hakkı MEB'e aittir; depoda yalnızca kaynak gösterilerek
yazılmış sorular tutulur.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

BASE = "https://tymm.meb.gov.tr"
KADEME_ORTAOGRETIM = 3

# tymm.meb.gov.tr üzerindeki sınıf kimlikleri
SINIF_ID = {9: 11, 10: 12, 11: 13, 12: 14}

# Ders anahtarı -> (MEB ders kimliği, görünen ad)
DERSLER = {
    "edebiyat": (17, "Türk Dili ve Edebiyatı"),
    "matematik": (18, "Matematik"),
    "fizik": (19, "Fizik"),
    "kimya": (20, "Kimya"),
    "biyoloji": (21, "Biyoloji"),
    "cografya": (22, "Coğrafya"),
    "felsefe": (23, "Felsefe"),
    "tarih": (24, "Tarih"),
    "inkilap": (25, "T.C. İnkılap Tarihi ve Atatürkçülük"),
    "din": (13, "Din Kültürü ve Ahlak Bilgisi"),
}

ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = ROOT / "data" / "raw"
BOOKS_JSON = ROOT / "data" / "books.json"

UA = "Mozilla/5.0 (X11; Linux x86_64) akilda-icerik/1.0"


def get(url: str, *, timeout: int = 60) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.read()
        except Exception as exc:  # ağ hatalarında kısa bekleyip yeniden dene
            if attempt == 3:
                raise
            wait = 2 ** attempt
            print(f"  ! {exc} — {wait} sn sonra tekrar", file=sys.stderr)
            time.sleep(wait)
    raise RuntimeError("unreachable")


def get_json(path: str, **params) -> object:
    url = f"{BASE}{path}?{urllib.parse.urlencode(params)}"
    return json.loads(get(url).decode("utf-8"))


def find_pdf_url(detail_path: str) -> str | None:
    html = get(BASE + detail_path).decode("utf-8", "replace")
    m = re.search(r'href="(/assets/pdf/[^"]+\.pdf)"', html)
    return BASE + m.group(1) if m else None


def list_books(dersler: list[str], siniflar: list[int]) -> list[dict]:
    books: list[dict] = []
    for ders in dersler:
        ders_id, ders_adi = DERSLER[ders]
        for sinif in siniflar:
            items = get_json(
                "/Kitap/GetDersKitaplariBySinifDers",
                sinifId=SINIF_ID[sinif],
                dersId=ders_id,
                kademe=KADEME_ORTAOGRETIM,
            )
            for i, item in enumerate(items or [], start=1):
                key = f"{ders}-{sinif}" + (f"-{i}" if len(items) > 1 else "")
                pdf_url = find_pdf_url(item["detailPath"])
                books.append(
                    {
                        "key": key,
                        "mebId": item["id"],
                        "baslik": item["title"],
                        "ders": ders,
                        "dersAdi": ders_adi,
                        "sinif": sinif,
                        "sayfaUrl": BASE + item["detailPath"],
                        "pdfUrl": pdf_url,
                    }
                )
                print(f"• {key:16s} {item['title']}")
    return books


def download(book: dict) -> Path | None:
    if not book.get("pdfUrl"):
        print(f"  ! {book['key']}: PDF bağlantısı bulunamadı", file=sys.stderr)
        return None
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    out = RAW_DIR / f"{book['key']}.pdf"
    if out.exists() and out.stat().st_size > 0:
        return out
    print(f"  ↓ {book['key']} indiriliyor…")
    data = get(book["pdfUrl"], timeout=600)
    tmp = out.with_suffix(".part")
    tmp.write_bytes(data)
    tmp.rename(out)  # yarım kalan indirme tam dosya gibi görünmesin
    print(f"    {len(data) / 1e6:.1f} MB")
    return out


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--ders", nargs="*", default=list(DERSLER), choices=list(DERSLER))
    ap.add_argument("--sinif", nargs="*", type=int, default=[9, 10, 11, 12], choices=[9, 10, 11, 12])
    ap.add_argument("--sadece-liste", action="store_true", help="PDF indirme, sadece listeyi yaz")
    args = ap.parse_args()

    books = list_books(args.ders, args.sinif)

    # Var olan listeyle birleştir (farklı ders/sınıf seçimleri birbirini silmesin)
    existing = {}
    if BOOKS_JSON.exists():
        existing = {b["key"]: b for b in json.loads(BOOKS_JSON.read_text("utf-8"))}
    existing.update({b["key"]: b for b in books})
    BOOKS_JSON.parent.mkdir(parents=True, exist_ok=True)
    BOOKS_JSON.write_text(
        json.dumps(sorted(existing.values(), key=lambda b: b["key"]), ensure_ascii=False, indent=2) + "\n",
        "utf-8",
    )
    print(f"\n{len(books)} kitap bulundu → {BOOKS_JSON.relative_to(ROOT)}")

    if not args.sadece_liste:
        for book in books:
            download(book)


if __name__ == "__main__":
    main()
