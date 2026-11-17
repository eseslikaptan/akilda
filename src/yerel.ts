// iOS uygulaması (Capacitor) içindeyken yerel özellikler: titreşim, bildirim, paylaşım, dosya,
// ilerlemenin uygulama hafızasında ikinci kopyası. Web'de bu fonksiyonlar hiçbir şey yapmaz ya da
// tarayıcı karşılığına düşer.
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Share } from "@capacitor/share";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Preferences } from "@capacitor/preferences";

export const yerelMi = Capacitor.isNativePlatform();

/** Uygulamanın web adresi: paylaşılan bağlantılar (meydan okuma, destek) buraya gider */
export const WEB_ADRES = "https://eseslikaptan.github.io/akilda/";

export function titret(tur: "dogru" | "yanlis" | "kutlama") {
  if (!yerelMi) {
    if (tur === "yanlis") navigator.vibrate?.(60);
    return;
  }
  const is =
    tur === "dogru"
      ? Haptics.impact({ style: ImpactStyle.Light })
      : Haptics.notification({ type: tur === "yanlis" ? NotificationType.Error : NotificationType.Success });
  is.catch(() => {});
}

// ---- Günlük hatırlatma bildirimi ----

const HATIRLATMA_ID = 1;

/** Her gün verilen saatte "günlük tekrar" bildirimi kurar. Sonucu kullanıcıya gösterilecek metin olarak döner. */
export async function hatirlatmaKur(saat: string): Promise<string> {
  const [hour, minute] = saat.split(":").map(Number);
  try {
    const izin = await LocalNotifications.requestPermissions();
    if (izin.display !== "granted") return "Bildirim izni verilmedi. Ayarlar > Akılda > Bildirimler'den açabilirsin.";
    await LocalNotifications.cancel({ notifications: [{ id: HATIRLATMA_ID }] }).catch(() => {});
    await LocalNotifications.schedule({
      notifications: [
        {
          id: HATIRLATMA_ID,
          title: "Kıvılcım seni bekliyor 🔥",
          body: "Bugünkü tekrarlarını yap, bildiklerin akılda kalsın.",
          schedule: { on: { hour, minute }, allowWhileIdle: true },
        },
      ],
    });
    return `Her gün ${saat}'de hatırlatacağım.`;
  } catch {
    return "Bildirim kurulamadı.";
  }
}

export async function hatirlatmaKaldir(): Promise<void> {
  await LocalNotifications.cancel({ notifications: [{ id: HATIRLATMA_ID }] }).catch(() => {});
}

export async function hatirlatmaVarMi(): Promise<boolean> {
  if (!yerelMi) return false;
  try {
    const { notifications } = await LocalNotifications.getPending();
    return notifications.some((n) => n.id === HATIRLATMA_ID);
  } catch {
    return false;
  }
}

// ---- Paylaşım ve dosyalar ----

export async function metinPaylas(baslik: string, metin: string, url: string): Promise<boolean> {
  if (!yerelMi) return false;
  try {
    await Share.share({ title: baslik, text: metin, url, dialogTitle: baslik });
  } catch {
    /* kullanıcı vazgeçti */
  }
  return true;
}

/** Dosyayı uygulamanın geçici klasörüne yazıp paylaşım menüsünü açar (Dosyalar'a kaydet, AirDrop, WhatsApp…) */
export async function dosyaPaylas(icerik: string, ad: string, base64 = false): Promise<void> {
  const { uri } = await Filesystem.writeFile({
    path: ad,
    data: icerik,
    directory: Directory.Cache,
    ...(base64 ? {} : { encoding: Encoding.UTF8 }),
  });
  await Share.share({ title: ad, files: [uri] }).catch(() => {});
}

// ---- İlerlemenin ikinci kopyası ----

const ANAHTAR = "akilda:v1";
let zamanlayici: ReturnType<typeof setTimeout> | undefined;

/** localStorage'a ek olarak uygulamanın kendi hafızasına da yaz (ara sıra, toplu) */
export function ikinciKopya(json: string) {
  if (!yerelMi) return;
  clearTimeout(zamanlayici);
  zamanlayici = setTimeout(() => {
    Preferences.set({ key: ANAHTAR, value: json }).catch(() => {});
  }, 1500);
}

/** Açılışta localStorage boşsa ikinci kopyadan geri yükle */
export async function ikinciKopyadanYukle(): Promise<void> {
  if (!yerelMi) return;
  try {
    if (localStorage.getItem(ANAHTAR)) return;
    const { value } = await Preferences.get({ key: ANAHTAR });
    if (value) localStorage.setItem(ANAHTAR, value);
  } catch {
    /* sorun değil: boş başlar */
  }
}
