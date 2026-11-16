import { useState, type CSSProperties } from "react";
import type { Dizin } from "../content";
import type { DersKey } from "../types";
import { kurulumuTamamla } from "../store";
import { DERSLER } from "../subjects";
import { DersRozeti, Ikon, IKON } from "../ui";
import { HEDEFLER } from "./Profil";

export function Kurulum({ dizin }: { dizin: Dizin }) {
  const [adim, setAdim] = useState(0);
  const [ad, setAd] = useState("");
  const [dersler, setDersler] = useState<DersKey[]>(dizin.dersler);
  const [hedef, setHedef] = useState(100);

  const toggle = (d: DersKey) => setDersler((l) => (l.includes(d) ? l.filter((x) => x !== d) : [...l, d]));

  const bitir = () =>
    kurulumuTamamla({
      ad: ad.trim(),
      gunlukHedef: hedef,
      dersler: dersler.length === dizin.dersler.length || dersler.length === 0 ? [] : dersler,
    });

  return (
    <div className="kurulum">
      <div className="kurulum-noktalar" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span key={i} className={i <= adim ? "aktif" : ""} />
        ))}
      </div>

      {adim === 0 && (
        <section className="kurulum-adim">
          <div className="logo-buyuk" aria-hidden="true">
            <Ikon d={IKON.beyin} boyut={56} kalin={1.5} />
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
          <h1>Hangi dersleri çalışıyorsun?</h1>
          <p>Tekrarlar bu derslerden gelir. Sonra değiştirebilirsin.</p>
          <div className="kurulum-dersler">
            {dizin.dersler.map((d) => (
              <button
                key={d}
                className={`kurulum-ders ${dersler.includes(d) ? "secili" : ""}`}
                style={{ "--hue": DERSLER[d].hue } as CSSProperties}
                aria-pressed={dersler.includes(d)}
                onClick={() => toggle(d)}
              >
                <DersRozeti hue={DERSLER[d].hue} ikon={DERSLER[d].ikon} boyut={36} />
                <span>{DERSLER[d].kisa}</span>
                {dersler.includes(d) && <Ikon d={IKON.tik} boyut={18} kalin={2.4} className="tik" />}
              </button>
            ))}
          </div>
          <button className="dugme birincil genis" disabled={!dersler.length} onClick={() => setAdim(2)}>
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
