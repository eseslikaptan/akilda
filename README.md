# Akılda

**Okuduğun akılda kalsın.** YKS'ye hazırlanan öğrenciler için, MEB ders kitaplarındaki bilgileri kısa sorularla
hatırlatan bir tekrar uygulaması.

Konu anlatmaz, test kitabı da değildir. Okuduğun bilgiyi unutmak üzere olduğun anda yeniden sorar
(aralıklı tekrar), böylece bilgi kısa süreli hafızadan kalıcı hafızaya geçer.

## Özellikler

- **YKS düzeni:** Dersler TYT ve AYT olarak; her ders tek, kesintisiz bir konu yolu. Alan seçimi (SAY, EA, SÖZ,
  sadece TYT) hangi AYT derslerinin geleceğini belirler.
- **Ders kitabına dayalı sorular:** Her soru MEB'in güncel ders kitaplarından hazırlanır ve bilginin geçtiği kitap
  sayfasına bağlantı verir. Dört tür: çoktan seçmeli (A-E), doğru/yanlış, boşluk doldurma, eşleştirme.
- **ÖSYM'de çıkanlar:** 2018–2026 YKS'de sorulan bilgiler, MEB'in konu bazlı çıkmış soru kitaplarından çıkarılmış
  özgün kartlar. Her kartta yıl etiketi ve asıl sorunun MEB PDF'indeki sayfasına bağlantı; her konuda o konudan kaç
  soru çıktığı. ÖSYM'nin soru metinleri depoda yer almaz.
- **Aralıklı tekrar:** Her bilginin hatırlanma olasılığı ayrı izlenir; %90'ın altına düşünce "Tekrar"a girer.
  "Aslında tahmin ettim" ile şansla bilinen kart daha erken tekrar gelir.
- **YKS bilgi denemesi:** ÖSYM'nin ders dağılımında, süreli, boş bırakmalı; net = doğru − yanlış ÷ 4; ders ders net
  tablosu ve deneme geçmişi.
- **Geri sayım ve tempo:** 2027 YKS'ye kalan gün ve her şeyi sınavdan 3 hafta önce bitirmek için günlük yeni bilgi hedefi.
- **Yanlış defteri:** En çok zorlanılan bilgiler tek listede ve bunlardan oturum.
- **Seri ve hedef:** Günlük XP hedefi, gün serisi, seri dondurma hakkı, 16 haftalık çalışma takvimi.
- **Paylaşım:** Arkadaşa aynı sorularla meydan okuma bağlantısı; kartta hata bildirme.
- **Çevrimdışı çalışır (PWA):** Telefona kurulabilir. İlerleme yalnızca cihazda tutulur; yedek alınıp yüklenebilir,
  takvime günlük hatırlatma eklenebilir.

## İçerik

Ders kitaplarından (Türkiye Yüzyılı Maarif Modeli, 2026–2027 sürümleri) ve MEB'in 2018–2026 YKS çıkmış soru
derlemelerinden hazırlanmış kartlar. Güncel sayılar için `npm run validate`.

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

Çıkmış soru derlemeleri (`data/cikmis.json`) MEB'in OGM Materyal sitesindeki "YKS Çıkmış Soru Kitapları"dır. Bu
kitaplardan kart yazılırken soru metni kullanılmaz; yalnızca sorunun ölçtüğü bilgi özgün bir kartla sorulur.

Soru dosyası biçimi ve yazım kuralları: [docs/icerik-formati.md](docs/icerik-formati.md)

| Klasör | İçerik |
|---|---|
| `src/` | Uygulama (React + TypeScript + Vite) |
| `src/srs.ts` | Aralıklı tekrar modeli |
| `content/` | Kitap başına soru dosyaları |
| `scripts/` | İndirme, metin çıkarma, birleştirme, doğrulama |
| `data/books.json` | Kullanılan kitapların listesi ve bağlantıları |

## Kaynak ve haklar

Ders kitaplarının tüm hakları Millî Eğitim Bakanlığına, YKS sorularının hakları ÖSYM'ye aittir. Bu depo kitapların ve
sınavların metnini, sorularını veya görsellerini içermez. Sorular kitaplardaki bilgilere dayanılarak ayrıca yazılmıştır ve her biri ilgili kitap
sayfasını kaynak gösterir. Bir soruda hata görürsen kaynak sayfasıyla birlikte bir issue aç.
