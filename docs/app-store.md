# App Store'a yükleme

Akılda, web uygulamasının [Capacitor](https://capacitorjs.com) ile sarılmış iOS sürümüdür (`ios/`).
Derleme ve yükleme GitHub Actions'ın macOS makinelerinde yapılır; Mac gerekmez.

## Bir kez yapılacaklar

### 1. Apple Developer Program
[developer.apple.com/programs](https://developer.apple.com/programs/) üzerinden üye ol (yıllık 99 $).
Onaylanınca **Team ID**'ni not al: developer.apple.com → Account → Membership details.

### 2. App Store Connect'te uygulama kaydı
[appstoreconnect.apple.com](https://appstoreconnect.apple.com) → Apps → **+** → New App:

| Alan | Değer |
|---|---|
| Platform | iOS |
| Name | Akılda: YKS Bilgi Tekrarı |
| Primary language | Turkish |
| Bundle ID | `com.eseslikaptan.akilda` (listede yoksa: developer.apple.com → Identifiers → **+** → App IDs → bu kimlikle oluştur) |
| SKU | `akilda-ios` |

> Ad başkası tarafından alınmışsa küçük bir değişiklik yap (ör. "Akılda – YKS Tekrar").

### 3. App Store Connect API anahtarı
App Store Connect → Users and Access → **Integrations** → App Store Connect API → **+**:
- Name: `GitHub Actions`, Access: **Admin** (bulut imzalama için gerekli)
- Oluşturunca **Issuer ID** ve **Key ID**'yi not al, `.p8` dosyasını indir (yalnızca bir kez indirilebilir).

### 4. GitHub depo sırları
GitHub → depo → Settings → Secrets and variables → Actions → **New repository secret**:

| Ad | Değer |
|---|---|
| `APPLE_TEAM_ID` | 1. adımdaki Team ID |
| `ASC_KEY_ID` | 3. adımdaki Key ID |
| `ASC_ISSUER_ID` | 3. adımdaki Issuer ID |
| `ASC_KEY_P8` | `.p8` dosyasını metin düzenleyiciyle açıp **tüm içeriğini** yapıştır |

Bu bilgileri kimseyle (sohbet dahil) paylaşma; yalnızca bu ekrana gir.

### 5. Gizlilik ve destek sayfaları
App Store, herkesin açabildiği bir gizlilik politikası adresi ister. Sayfalar hazır:
`public/gizlilik.html` ve `public/destek.html`. GitHub Pages ile yayınlamak için depo **public** olmalı:
Settings → General → Change visibility → Public; ardından Settings → Pages → Source: **GitHub Actions**.
Adresler: `https://eseslikaptan.github.io/akilda/gizlilik.html` ve `.../destek.html`.

## Her sürümde

1. GitHub → Actions → **iOS · App Store Connect** → Run workflow → sürüm (ör. `1.0`) → Run.
2. ~15 dakika sonra derleme App Store Connect → **TestFlight**'ta görünür. TestFlight uygulamasıyla
   kendi iPhone'unda deneyebilirsin (Internal Testing grubuna kendini ekle).
3. App Store sekmesi → 1.0 sürümü:
   - `store/metin.md` içindeki ad, alt başlık, açıklama, anahtar kelimeler, URL'ler
   - `store/ekran/` içindeki 6 ekran görüntüsü (iPhone 6,9")
   - Build: TestFlight'taki derlemeyi seç
   - App Privacy: "Data Not Collected"
   - Age Rating: tüm sorulara "None" → 4+
   - App Review Information: oturum açma gerekmez; `store/metin.md`'deki inceleme notunu yapıştır
4. **Add for Review** → **Submit**. İnceleme genelde 1–3 gün sürer.

## Sık karşılaşılanlar

- **"No profiles for 'com.eseslikaptan.akilda' were found"**: API anahtarının rolü Admin olmalı ve
  Bundle ID developer.apple.com'da kayıtlı olmalı.
- **"Missing compliance"**: `Info.plist` içinde `ITSAppUsesNonExemptEncryption = false` var; soru sorulmaz.
- **Reddedilme (4.2 Minimum Functionality)**: Uygulama çevrimdışı çalışır, yerel bildirim, titreşim ve paylaşım
  kullanır; incelemeci notunda bunları belirt.
- **Ad / logo**: Uygulama MEB veya ÖSYM'nin resmî uygulaması değildir; açıklamada bu belirtilmiştir. Kurum logoları kullanılmaz.

## Yerelde (Mac varsa)

```bash
npm run ios          # web derle + iOS projesine kopyala
npx cap open ios     # Xcode'da aç → Signing & Capabilities → Team seç → Product → Archive
```
