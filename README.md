# Akılda

**Okuduğun akılda kalsın.** YKS'ye hazırlanan öğrenciler için, MEB ders kitaplarındaki bilgileri kısa sorularla
hatırlatan bir tekrar uygulaması.

Konu anlatmaz, test kitabı da değildir. Okuduğun bilgiyi unutmak üzere olduğun anda yeniden sorar
(aralıklı tekrar), böylece bilgi kısa süreli hafızadan kalıcı hafızaya geçer.

## Özellikler

- **Ders kitabına dayalı sorular:** Her soru MEB'in güncel ders kitaplarından hazırlanır ve bilginin geçtiği
  kitap sayfasına bağlantı verir.
- **Dört soru türü:** çoktan seçmeli, doğru/yanlış, boşluk doldurma, eşleştirme.
- **Aralıklı tekrar:** Her bilginin hatırlanma olasılığı ayrı ayrı izlenir. Olasılık %90'ın altına düşünce
  bilgi "Tekrar" listesine girer. Doğru cevaplar aralığı uzatır, yanlışlar kısaltır.
- **Hafıza haritası:** Ders ve konu bazında hafıza gücü. Tekrar edilmezse zamanla solar.
- **Konu özeti:** Bir konunun tüm bilgileri, sayfa bağlantılarıyla tek listede. Önce oku, sonra kendini sına.
- **Günlük hedef ve seri:** XP hedefi, ardışık gün serisi, 16 haftalık çalışma takvimi.
- **Çevrimdışı çalışır (PWA):** Telefona kurulabilir. İlerleme yalnızca cihazda tutulur; yedek alınıp
  yüklenebilir.

## İçerik

19 ders kitabından 3.430 kart (9–11. sınıf):

| Ders | Sınıflar | Kart |
|---|---|---|
| Tarih | 9, 10, 11 | 459 |
| Coğrafya | 9, 10, 11 | 537 |
| Türk Dili ve Edebiyatı | 9, 10, 11 | 551 |
| Felsefe | 10 | 232 |
| Din Kültürü ve Ahlak Bilgisi | 9, 10 | 341 |
| Biyoloji | 9, 10, 11 | 524 |
| Kimya | 9, 10 | 387 |
| Fizik | 9, 10 | 399 |

## Çalıştırma

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # içerik doğrulama + tip denetimi + dist/
```

`main` dalına gönderilen her değişiklik GitHub Actions ile GitHub Pages'e yayınlanır
(`.github/workflows/pages.yml`). İlk seferde depo ayarlarından **Settings → Pages → Source: GitHub Actions**
seçilmelidir.

## İçerik hattı

Kitaplar MEB'in resmi sitesi [tymm.meb.gov.tr](https://tymm.meb.gov.tr/ders-kitaplari/ortaogretim) üzerinden
alınır. PDF'ler ve çıkarılan metinler depoya **eklenmez**; depoda yalnızca soru dosyaları (`content/`) bulunur.

```bash
pip install pymupdf
python3 scripts/meb_fetch.py --ders tarih --sinif 9 10   # kitap listesi + PDF → data/raw/
python3 scripts/extract_text.py                          # PDF → sayfa sayfa metin → data/text/
node scripts/birlestir.mjs tarih-9                       # data/parca/tarih-9/u*.json → content/tarih-9.json
npm run validate                                         # tüm soru dosyalarını denetle
```

Soru dosyası biçimi ve yazım kuralları: [docs/icerik-formati.md](docs/icerik-formati.md)

| Klasör | İçerik |
|---|---|
| `src/` | Uygulama (React + TypeScript + Vite) |
| `src/srs.ts` | Aralıklı tekrar modeli |
| `content/` | Kitap başına soru dosyaları |
| `scripts/` | İndirme, metin çıkarma, birleştirme, doğrulama |
| `data/books.json` | Kullanılan kitapların listesi ve bağlantıları |

## Kaynak ve haklar

Ders kitaplarının tüm hakları Millî Eğitim Bakanlığına aittir. Bu depo kitapların metnini, sorularını veya
görsellerini içermez. Sorular kitaplardaki bilgilere dayanılarak ayrıca yazılmıştır ve her biri ilgili kitap
sayfasını kaynak gösterir. Bir soruda hata görürsen kaynak sayfasıyla birlikte bir issue aç.
