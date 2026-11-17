#!/usr/bin/env python3
"""data/raw/*.pdf dosyalarını sayfa sayfa düz metne çevirir.

Çıktı: data/text/<kitap>.txt — her sayfa "=== SAYFA n ===" satırıyla başlar.
Sayfa numarası PDF'teki sıradır; uygulama kaynağa "<pdfUrl>#page=n" ile bağlanır.

Gerekli paket: pip install pymupdf
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

import pymupdf as fitz

ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = ROOT / "data" / "raw"
TEXT_DIR = ROOT / "data" / "text"


def clean(text: str) -> str:
    text = text.replace("­", "")  # yumuşak tire
    text = re.sub(r"[\x00-\x08\x0b-\x1f�]+", "", text)  # form alanı / bozuk glif artıkları
    text = re.sub(r"(\w)-\n(\w)", r"\1\2", text)  # satır sonu hecelemesi
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def harf_harf_mi(text: str) -> bool:
    """Taranmış (OCR'lı) PDF'lerde kelimeler harf harf bölünebilir: "Ç e vr e s or u nl arı"."""
    kelimeler = re.findall(r"\w+", text)
    if len(kelimeler) < 200:
        return False
    tek = sum(1 for k in kelimeler if len(k) <= 2)
    return tek / len(kelimeler) > 0.45


def extract(pdf: Path) -> Path:
    TEXT_DIR.mkdir(parents=True, exist_ok=True)
    out = TEXT_DIR / f"{pdf.stem}.txt"
    with fitz.open(pdf) as doc:
        sayfalar = [page.get_text("text") for page in doc]
        if harf_harf_mi("\n".join(sayfalar)):
            # Kelime içine boşluk eklenmesini engelleyerek yeniden çıkar
            sayfalar = [page.get_text("text", flags=fitz.TEXT_INHIBIT_SPACES) for page in doc]
            print(f"  {pdf.name}: harf harf bölünmüş metin algılandı, bitişik çıkarıldı")
    parts = [f"=== SAYFA {i} ===\n{clean(t)}" for i, t in enumerate(sayfalar, start=1)]
    out.write_text("\n\n".join(parts) + "\n", "utf-8")
    return out


def main() -> None:
    pdfs = [Path(p) for p in sys.argv[1:]] or sorted(RAW_DIR.glob("*.pdf"))
    if not pdfs:
        sys.exit("data/raw/ içinde PDF yok. Önce: python3 scripts/meb_fetch.py")
    for pdf in pdfs:
        out = extract(pdf)
        print(f"{pdf.name:28s} → {out.relative_to(ROOT)} ({out.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
