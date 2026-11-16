# İçerik formatı

Her ders kitabı için `content/<kitap>.json` dosyası bulunur (ör. `content/tarih-9.json`).
Kitap anahtarları `data/books.json` ile aynıdır: `<ders>-<sınıf>`.

Sorular MEB ders kitabındaki bilgilere dayanır ama kitaptan kopyalanmaz; her kart
bilginin geçtiği PDF sayfasını (`sayfa`) gösterir. Uygulama bu numarayla doğrudan
`<pdfUrl>#page=<sayfa>` bağlantısı kurar.

## Dosya yapısı

```jsonc
{
  "kitap": "tarih-9",
  "ders": "tarih",              // edebiyat | fizik | kimya | biyoloji | cografya | felsefe | tarih | inkilap | din | matematik
  "sinif": 9,
  "baslik": "Tarih 9. Sınıf Ders Kitabı",
  "sayfaUrl": "https://tymm.meb.gov.tr/kitap/43/tarih-9sinif-ders-kitabi",
  "pdfUrl": "https://tymm.meb.gov.tr/assets/pdf/....pdf",
  "uniteler": [
    {
      "no": 1,
      "ad": "Geçmişin İnşa Sürecinde Tarih",
      "konular": [
        {
          "no": "1.1",
          "ad": "Tarih Öğrenmenin Faydaları",
          "kartlar": [ /* aşağıdaki kart türleri */ ]
        }
      ]
    }
  ]
}
```

## Kart türleri

Her kartta ortak alanlar:

| alan    | açıklama |
|---------|----------|
| `id`    | Kitap içinde benzersiz. Biçim: `<konuNo>-<iki haneli sıra>` → `"1.1-03"` |
| `tur`   | `secmeli`, `dy`, `bosluk`, `eslestir` |
| `bilgi` | Akılda tutulacak bilgi, tek cümle (≤ 220 karakter). Cevaptan sonra gösterilir. |
| `sayfa` | Bilginin geçtiği PDF sayfası (metin dosyasındaki `=== SAYFA n ===`) |

### `secmeli` — çoktan seçmeli
```json
{ "id": "1.2-01", "tur": "secmeli",
  "soru": "Tarihsel bilginin oluşmasındaki üç temel unsur hangi seçenekte doğru verilmiştir?",
  "secenekler": ["İnsan, kaynak, tarihçi", "Zaman, mekân, devlet", "Kaynak, arşiv, müze", "İnsan, coğrafya, kronoloji"],
  "dogru": 0,
  "bilgi": "Tarihsel bilgi; insan, kaynak ve tarihçi unsurlarının etkileşimiyle oluşur.",
  "sayfa": 22 }
```
4 seçenek (en az 3, en fazla 5). `dogru` doğru seçeneğin sırası (0'dan başlar). Uygulama seçenekleri karıştırır.

### `dy` — doğru / yanlış
```json
{ "id": "1.2-02", "tur": "dy",
  "ifade": "Kronoloji, olayların yalnızca tarih sırasına dizilmesinden ibarettir.",
  "dogru": false,
  "bilgi": "Kronoloji olayları sıraya dizmenin ötesinde sebep, sonuç, değişim ve sürekliliği anlamayı gerektirir.",
  "sayfa": 23 }
```
Yanlış ifadelerde `bilgi` doğrusunu söyler.

### `bosluk` — boşluk doldurma
```json
{ "id": "1.2-03", "tur": "bosluk",
  "cumle": "Tarih çalışmalarında nesnel olarak ölçülebilir zamana ___ denir.",
  "cevap": "kronoloji",
  "celdiriciler": ["takvim", "dönemlendirme", "çağ"],
  "bilgi": "Nesnel olarak ölçülebilir zaman kronoloji olarak adlandırılır.",
  "sayfa": 23 }
```
`cumle` içinde tam olarak bir `___` bulunur. 2–4 çeldirici.

### `eslestir` — eşleştirme
```json
{ "id": "1.2-04", "tur": "eslestir",
  "yonerge": "Kavramları açıklamalarıyla eşleştir.",
  "ciftler": [["Kronoloji", "Olayların zaman sırası"], ["Kaynak", "Geçmişin izini taşıyan materyal"], ["Tarihçi", "Kaynakları yorumlayan kişi"]],
  "bilgi": "Tarihsel bilgi; kaynak, kronoloji ve tarihçinin yorumuyla inşa edilir.",
  "sayfa": 22 }
```
3–5 çift. Sol ve sağ taraf kendi içinde benzersiz olmalı.

## Doğrulama

```bash
node scripts/validate-content.mjs            # tüm content/*.json
node scripts/validate-content.mjs content/tarih-9.json
```
