# YKS tarzı soru yazımı

Akılda'daki her kart gerçek bir TYT/AYT sorusu gibi olmalı. Amaç tek cümlelik ezber yoklaması
("1064'te hangi kale alındı?", "x-t grafiğinin eğimi neyi verir?") değil, bilgiyi **kullandıran**
soru: yorum, çıkarım, karşılaştırma, neden-sonuç, hesap, grafik/tablo okuma.

Biçim ayrıntıları için `docs/icerik-formati.md`, denetim için `node scripts/validate-content.mjs --yks <dosya>`.

## Temel kurallar

1. **Yalnızca `secmeli`, 5 şık (A–E).** `dy`, `bosluk`, `eslestir` yazılmaz. Onların YKS karşılıkları:
   - doğru/yanlış yargılar → öncüllü soru (I, II, III)
   - boşluk doldurma → "Bu parçada boş bırakılan yere aşağıdakilerden hangisi getirilmelidir?"
   - eşleştirme → "Aşağıdaki eşleştirmelerden hangisi yanlıştır?"
2. **Yalnızca YKS'de ölçülen bilgi.** Sorulmaz: kitaptaki etkinlik/proje/sunum adımları, kitabın kendi örnek
   metinleri ve alıntıladığı akademisyenler, günlük hayat önerileri, kitap içi kişi adları, ay-gün düzeyinde
   tarihler, müze/kale/köprü gibi ayrıntılar (YKS'de sorulmuyorsa), "X'e ne denir?" tanım soruları.
   Ölçüt: "Bu bilgi bir ÖSYM sorusunda kullanılabilir mi?" Değilse at.
3. **Zorluk orta–zor.** Soruların çoğu en az iki bilgiyi birleştirmeli ya da yorum istemeli. Kökte cevabı
   ele veren ipucu olmamalı.
4. **Tek ve kesin doğru cevap.** Öncüllerin her biri kesin doğru ya da kesin yanlış olmalı; "kesinlikle",
   "yalnızca", "her zaman" gibi sözcükleri bilerek kullan. Sayısal sorularda sonucu iki kez hesapla.
5. **Bilimsel ve tarihsel doğruluk.** MEB kitabındaki ve müfredattaki bilgiyle tutarlı yaz. Emin olmadığın
   ayrıntıyı sorma, kitapta olmayan tartışmalı bilgiyi doğru cevap yapma.
6. **Özgünlük.** ÖSYM/MEB sorularını, kökünü ve şıklarını kopyalama. 1955'ten sonra ölmüş yazarların
   metinlerinden en fazla bir dize/kısa ifade alıntıla; gerekirse eseri betimle. Divan, halk, Tanzimat dönemi
   ve eski metinler serbest. Paragrafları kendin yaz.

## Soru kökleri (her dosyada karışık kullan)

| tür | yaklaşık pay | örnek kök |
|-----|------|-----------|
| öncüllü | %30–40 | "…ile ilgili, I. … II. … III. … yargılarından hangileri doğrudur?" |
| parça / durum / deney yorumu | %25–35 | "Bu bilgilere göre aşağıdakilerden hangisine ulaşılabilir?" |
| olumsuz kök | %15–20 | "…aşağıdakilerden hangisi söylenemez / değildir / yanlıştır?" |
| sıralama, eşleştirme, boşluk, hesap | geri kalanı | "kronolojik sıralaması", "hangisi yanlış eşleştirilmiştir" |

Derse özgü YKS kalıpları:

- **Tarih:** neden-sonuç, karşılaştırma ("her ikisinde de görülen"), bir gelişmenin "göstergesi", kronoloji,
  kavram-dönem ilişkisi, parçadan çıkarım.
- **Coğrafya:** iklim/nüfus/üretim verisi tablosu, koordinat ve konum yorumu, bir olayın nedeni, "bu özellik
  hangi bölgede görülmez".
- **Edebiyat:** parçadaki özelliklere göre dönem/topluluk/sanatçı, nazım biçimi ve türü, söz sanatı,
  eser–yazar eşleştirmesi, "bu sanatçıyla ilgili hangisi yanlıştır".
- **Felsefe / psikoloji / sosyoloji / mantık:** parçadaki görüşün hangi filozofa, akıma ya da kavrama ait
  olduğu, iki görüşün karşılaştırılması, örnek durumun hangi kavramla açıklanacağı.
- **Din kültürü:** ayet/hadis mealinden çıkarım, kavram–örnek ilişkisi, mezhep ve düşünce ekolleri.
- **Fizik:** grafik (`grafik`) ve tablo (`tablo`) yorumu, oran ve hesap, deney düzeneği, "hangileri kesinlikle".
- **Kimya:** hesap (mol, derişim, gaz), tablo, tanecik/olay yorumu, "aşağıdakilerden hangisi yanlıştır".
- **Biyoloji:** deney düzeneği ve sonucu, grafik yorumu, karşılaştırma ("her ikisinde de"), "hangileri ortaktır".

## Şıklar

- 5 şık, hepsi aynı türden ve benzer uzunlukta. **Doğru şık en uzun ya da en ayrıntılı şık olmasın.**
- Çeldiriciler gerçek kavram yanılgılarından gelsin; bariz saçma şık yazma. "Hepsi / hiçbiri" yok.
- Öncüllü şıklar ÖSYM sırasıyla bu yedisinden seçilen beşi: `Yalnız I`, `Yalnız II`, `Yalnız III`,
  `I ve II`, `I ve III`, `II ve III`, `I, II ve III`. Sıralama soruları: `II - I - IV - III`.
  Öncüllü sorularda şıklar uygulamada karıştırılmaz.
- Sayısal şıklar küçükten büyüğe dizilir ve `"sirali": true` verilir.
- Öncüllü ve sıralı sorularda doğru şıkkın yeri A–E arasında dengeli dağılsın; `I, II ve III`
  doğru cevapların %20'sini geçmesin.

## Alanlar

- `soru`: varsa parça/durum, ardından kök; paragraflar `\n` ile ayrılır. **Son paragraf kalın kök olarak**
  gösterilir. Öncüllü sorularda `soru` yalnızca giriştir ("…ile ilgili," / "Buna göre,").
- `oncul` + `kok`: öncüllü sorularda ifadeler ve öncüllerden sonraki kök.
- `tablo`: `[["başlık", …], ["satır adı", …], …]`, ilk satır başlık, satırların ilk hücresi satır adı.
- `grafik`: `{ "x": "t (s)", "y": "v (m/s)", "seriler": [{ "ad": "K", "n": [[0, 0], [4, 20]] }] }`.
  Eksen işaretleri sembolik olacaksa `"xIsaret": [[1, "t"], [2, "2t"]]`.
- `bilgi`: **çözüm**, ≤ 360 karakter, 1–2 cümle: doğru cevabın gerekçesi ve gerekirse en güçlü çeldiricinin
  neden yanlış olduğu. Cevaptan sonra gösterilir.
- `sayfa`: bilginin geçtiği PDF sayfası (eski kartlardan al). Çıkmış soru dosyalarında `yil` korunur.
- `id`: `<konuNo>-<iki haneli sıra>`, konu içinde 01'den başlar.

## Sayı

Her konu için eski kart sayısının yaklaşık **yarısı ile üçte ikisi** kadar soru (ders kitaplarında en az 4,
çıkmış soru dosyalarında en az 1). ÖSYM'de çok soru çıkan konulara daha fazla soru yaz. Eski kartlardaki
YKS'ye uygun bilgilerin her biri bir sorunun kökünde, öncülünde, şıkkında ya da çözümünde yer alsın.

## Örnekler

Öncüllü, parçadan çıkarım (Tarih 10):

```json
{ "id": "1.1-01", "tur": "secmeli",
  "soru": "Selçuklular, 1040'ta Gaznelilere karşı kazandıkları Dandanakan Savaşı'nın ardından Tuğrul Bey'i sultan ilan etmiş; kısa sürede Horasan ve İran'ı denetim altına alarak 1055'te Bağdat'a girmiş ve Abbasi halifesini Büveyhoğulları baskısından kurtarmışlardır.\nBu bilgilere göre,",
  "oncul": ["Dandanakan Savaşı, Büyük Selçuklu Devleti'nin kuruluşunu sağlamıştır.", "Selçuklular, İslam dünyasının siyasi önderliğini üstlenmeye başlamıştır.", "Selçuklular, Anadolu'yu kesin olarak Türk yurdu hâline getirmiştir."],
  "kok": "yargılarından hangilerine ulaşılabilir?",
  "secenekler": ["Yalnız I", "Yalnız II", "Yalnız III", "I ve II", "I, II ve III"],
  "dogru": 3,
  "bilgi": "Dandanakan (1040) devletin kuruluş savaşıdır; Bağdat'a girilmesi (1055) Selçukluları halifenin koruyucusu yaptı. Anadolu'nun Türk yurdu olması Malazgirt (1071) ve Miryokefalon (1176) ile gerçekleşir, metinde de yoktur.",
  "sayfa": 13 }
```

Olumsuz kök (Tarih 10):

```json
{ "id": "1.1-03", "tur": "secmeli",
  "soru": "1176'da II. Kılıçarslan ile Bizans İmparatoru Manuel Komnenos arasında yapılan Miryokefalon Savaşı'nı Türkler kazanmıştır. Bu savaştan sonra Bizans, Türkleri Anadolu'dan çıkarma ümidini yitirerek savunmaya çekilmiştir.\nBu bilgilere dayanarak Miryokefalon Savaşı ile ilgili aşağıdakilerden hangisi söylenemez?",
  "secenekler": ["Malazgirt Savaşı ile başlayan süreci pekiştirmiştir.", "Bizans'ın Anadolu politikasının değişmesine yol açmıştır.", "Haçlı Seferleri'nin sona ermesini sağlamıştır.", "Anadolu'daki Türk varlığını kalıcı hâle getirmiştir.", "Türkiye Selçuklularının Bizans karşısındaki üstünlüğünü göstermiştir."],
  "dogru": 2,
  "bilgi": "Miryokefalon, Anadolu'nun Türk yurdu olduğunu kesinleştirdi ve Bizans'ı savunmaya itti. Haçlı Seferleri ise sonrasında da sürdü (III. Haçlı Seferi 1189, IV. Haçlı Seferi 1204).",
  "sayfa": 18 }
```

Grafik + hesap (Fizik 10):

```json
{ "id": "1.1-02", "tur": "secmeli",
  "soru": "Doğrusal bir yolda hareket eden bir aracın hız-zaman grafiği şekildeki gibidir.\nAracın 0-6 s aralığındaki yer değiştirmesinin büyüklüğü Δx, aldığı yol s olduğuna göre Δx/s oranı kaçtır?",
  "grafik": { "x": "t (s)", "y": "v (m/s)", "seriler": [{ "n": [[0, 10], [4, 10], [4, -5], [6, -5]] }] },
  "secenekler": ["1/5", "2/5", "3/5", "4/5", "1"],
  "sirali": true,
  "dogru": 2,
  "bilgi": "Grafiğin altındaki alan yer değiştirmeyi verir: 0-4 s'de +40 m, 4-6 s'de −10 m. Δx = 30 m, s = 40 + 10 = 50 m; oran 3/5.",
  "sayfa": 20 }
```

Tablo (Fizik 10):

```json
{ "id": "1.1-04", "tur": "secmeli",
  "soru": "Doğrusal bir yolda birbirine doğru sabit hızlarla hareket eden K ve L araçlarının bazı anlardaki konumları tabloda verilmiştir.\nAraçlar hareketlerini bu şekilde sürdürürse t = 0 anından kaç saniye sonra yan yana gelir?",
  "tablo": [["t (s)", "0", "1", "2"], ["K'nin konumu (m)", "0", "10", "20"], ["L'nin konumu (m)", "60", "55", "50"]],
  "secenekler": ["3", "4", "5", "6", "8"],
  "sirali": true,
  "dogru": 1,
  "bilgi": "K'nin hızı +10 m/s, L'nin hızı −5 m/s. Yan yana gelmeleri için 10t = 60 − 5t olmalı; t = 4 s.",
  "sayfa": 20 }
```

Tamamı: `content/tarih-10.json` ve `content/fizik-10.json` içinde konu 1.1.
