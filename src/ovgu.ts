// Duruma göre övgü ve moral cümleleri. Aynı cümle üst üste gelmesin diye son seçilenler hatırlanır.
import type { Duygu } from "./maskot";

export interface Tepki {
  baslik: string;
  alt?: string;
  duygu: Duygu;
}

export interface Baglam {
  dogru: boolean;
  bilmiyorum: boolean;
  kombo: number; // bu cevapla birlikte art arda doğru sayısı
  tekrar: boolean; // oturum içinde daha önce yanlış yapılmış kart
  onTest: boolean;
  yakin: boolean; // yazarak cevapta küçük yazım farkı
  yil?: string; // ÖSYM'de sorulduğu yıl
  gecenGun?: number; // kartın son görülmesinden bu yana geçen gün
}

const DOGRU = [
  "Helal!",
  "Aferin!",
  "Süpersin!",
  "Bravo!",
  "İşte bu!",
  "Tam isabet!",
  "Kafa çalışıyor!",
  "Harikasın!",
  "Akılda!",
  "Sağlam!",
  "Çok iyi!",
  "Bildin!",
];
const DOGRU_ALT = ["Böyle devam.", "Bu bilgi yerine oturuyor.", "Sınavda da böyle.", "Akılda kalıyor.", ""];
const YANLIS = ["Olsun, şimdi öğrendin", "Bir dahakine kesin", "Az kaldı!", "Hata, öğrenmenin parçası", "Bunu unutmayacağız"];
const YANLIS_ALT = [
  "Birazdan tekrar soracağım.",
  "Yanlış yapıp öğrendiğin bilgi daha iyi akılda kalır.",
  "Bilgiyi oku, birkaç soru sonra yine geliyor.",
];
const BILMIYORUM = ["Dürüstlük kazandırır", "Şimdi öğrenme zamanı", "Sorun değil, işte bilgi"];
const TEKRAR_DOGRU = ["İşte şimdi oldu!", "Bu sefer kaptın!", "Gördün mü, öğrendin!", "Aynen böyle!"];

const sonSecilen: string[] = [];
function sec(liste: string[]): string {
  const uygun = liste.filter((x) => !sonSecilen.includes(x));
  const s = (uygun.length ? uygun : liste)[Math.floor(Math.random() * (uygun.length || liste.length))];
  sonSecilen.push(s);
  if (sonSecilen.length > 4) sonSecilen.shift();
  return s;
}

export function tepki(b: Baglam): Tepki {
  if (b.onTest) {
    return b.dogru
      ? { baslik: "Bunu zaten biliyorsun!", alt: "Birkaç gün sonra kontrol ederim.", duygu: "coskulu" }
      : { baslik: "Birazdan öğreneceksin", alt: "Ön testte yanlış yapmak sonraki öğrenmeyi güçlendirir.", duygu: "dusunceli" };
  }
  if (!b.dogru) {
    if (b.bilmiyorum) return { baslik: sec(BILMIYORUM), alt: "Oku ve aklında tut, birazdan soracağım.", duygu: "dusunceli" };
    return { baslik: sec(YANLIS), alt: sec(YANLIS_ALT), duygu: "uzgun" };
  }
  if (b.yakin) return { baslik: "Doğru, yazımına dikkat!", alt: "Küçük bir harf farkı vardı.", duygu: "mutlu" };
  if (b.kombo >= 15) return { baslik: `${b.kombo} üst üste!`, alt: "Bu iş sende.", duygu: "coskulu" };
  if (b.kombo === 10) return { baslik: "10'da 10!", alt: "Efsane gidiyorsun.", duygu: "coskulu" };
  if (b.kombo === 7) return { baslik: "7 üst üste!", alt: "Bugün formdasın.", duygu: "coskulu" };
  if (b.kombo === 5) return { baslik: "5'te 5!", alt: "Durdurulamıyorsun.", duygu: "coskulu" };
  if (b.kombo === 3) return { baslik: "3'te 3!", alt: "Isındın, böyle devam.", duygu: "coskulu" };
  if (b.yil) return { baslik: sec(DOGRU), alt: `ÖSYM bunu ${b.yil.replace("-", " ")}'de sordu, sen bildin.`, duygu: "mutlu" };
  if (b.gecenGun !== undefined && b.gecenGun >= 7)
    return { baslik: `${Math.round(b.gecenGun)} gün sonra bile hatırladın!`, alt: "Bu bilgi kalıcı olmaya yakın.", duygu: "coskulu" };
  if (b.tekrar) return { baslik: sec(TEKRAR_DOGRU), alt: "Hatadan öğrenmek böyle bir şey.", duygu: "mutlu" };
  return { baslik: sec(DOGRU), alt: sec(DOGRU_ALT) || undefined, duygu: "mutlu" };
}

/** Oturum sonu başlığı */
export function sonucBasligi(isabet: number, toplam: number): Tepki {
  if (toplam >= 5 && isabet === 1) return { baslik: "Kusursuz!", alt: "Tek hata yok. Helal olsun!", duygu: "coskulu" };
  if (isabet >= 0.8) return { baslik: "Helal olsun!", alt: "Bilgiler yerine oturuyor.", duygu: "coskulu" };
  if (isabet >= 0.6) return { baslik: "Güzel iş!", alt: "Biraz daha tekrarla bu konu tamam.", duygu: "mutlu" };
  return { baslik: "Tekrar güçlendirir", alt: "Bugün öğrendiklerin yarın daha kolay gelecek.", duygu: "dusunceli" };
}
