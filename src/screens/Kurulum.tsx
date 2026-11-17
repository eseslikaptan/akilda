import { useState } from "react";
import type { Dizin } from "../content";
import { kurulumuTamamla } from "../store";
import { ALANLAR, type AlanKey } from "../kurslar";
import { Kivilcim } from "../maskot";
import { AlanSecici, HEDEFLER } from "./Profil";

export function Kurulum({ dizin }: { dizin: Dizin }) {
  const [adim, setAdim] = useState(0);
  const [ad, setAd] = useState("");
  const [alan, setAlan] = useState<AlanKey>(ALANLAR[0].key);
  const [hedef, setHedef] = useState(100);

  const bitir = () => kurulumuTamamla({ ad: ad.trim(), gunlukHedef: hedef, alan });

  return (
    <div className="kurulum">
      <div className="kurulum-noktalar" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span key={i} className={i <= adim ? "aktif" : ""} />
        ))}
      </div>

      {adim === 0 && (
        <section className="kurulum-adim">
          <div className="kurulum-maskot">
            <Kivilcim duygu="selam" boyut={110} className="zipla" />
            <p className="balon">Selam! Ben Kıvılcım. Okuduklarının aklında kalmasına yardım edeceğim.</p>
          </div>
          <h1>
            Okuduğun <em>akılda</em> kalsın.
          </h1>
          <p>
            MEB ders kitaplarındaki bilgileri kısa sorularla tekrar ettir. Unutmak üzere olduğun bilgiyi tam zamanında
            karşına çıkarır.
          </p>
          <label className="alan">
            <span>Sana nasıl seslenelim?</span>
            <input value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Adın (isteğe bağlı)" maxLength={24} />
          </label>
          <button className="dugme birincil genis" onClick={() => setAdim(1)}>
            Başlayalım
          </button>
        </section>
      )}

      {adim === 1 && (
        <section className="kurulum-adim">
          <h1>Hangi alandasın?</h1>
          <p>TYT dersleri herkese gelir; AYT dersleri alanına göre seçilir. Sonra değiştirebilirsin.</p>
          <AlanSecici dizin={dizin} secili={alan} onSec={setAlan} />
          <button className="dugme birincil genis" onClick={() => setAdim(2)}>
            Devam
          </button>
        </section>
      )}

      {adim === 2 && (
        <section className="kurulum-adim">
          <h1>Günlük hedefin ne olsun?</h1>
          <p>Az ama her gün çalışmak, hafızayı en çok güçlendiren şeydir.</p>
          <div className="hedef-liste">
            {HEDEFLER.map((h) => (
              <button key={h.xp} className={`hedef-secim ${hedef === h.xp ? "aktif" : ""}`} onClick={() => setHedef(h.xp)}>
                <strong>{h.ad}</strong>
                <span>{h.aciklama}</span>
                <em>{h.xp} XP</em>
              </button>
            ))}
          </div>
          <button className="dugme birincil genis" onClick={bitir}>
            Hadi başlayalım
          </button>
        </section>
      )}
    </div>
  );
}
