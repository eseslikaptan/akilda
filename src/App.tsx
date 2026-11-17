import { useEffect, useState } from "react";
import { icerikYukle, type Dizin } from "./content";
import { useIlerleme } from "./store";
import { vadeliKartlar, type OturumTipi } from "./oturum";
import { useRota, git } from "./router";
import { kaliciDepolamaIste } from "./araclar";
import { Ikon, IKON } from "./ui";
import { Bugun } from "./screens/Bugun";
import { DersListesi, KonuOzeti, KursDetay } from "./screens/Dersler";
import { Oturum } from "./screens/Oturum";
import { Kaynaklar, Profil } from "./screens/Profil";
import { Kurulum } from "./screens/Kurulum";
import { Deneme, DenemeSecim } from "./screens/Deneme";
import { Defter } from "./screens/Defter";

export function App() {
  const [dizin, setDizin] = useState<Dizin | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const p = useIlerleme();
  const rota = useRota();

  useEffect(() => {
    icerikYukle().then(setDizin, (e) => setHata(String(e)));
  }, []);

  // Kurulumdan sonra tarayıcıdan verileri kendiliğinden silmemesini iste
  useEffect(() => {
    if (p.kurulum) kaliciDepolamaIste();
  }, [p.kurulum]);

  if (hata) return <div className="yukleniyor">İçerik yüklenemedi: {hata}</div>;
  if (!dizin)
    return (
      <div className="yukleniyor" aria-busy="true">
        <Ikon d={IKON.beyin} boyut={40} kalin={1.5} />
        <span>Akılda</span>
      </div>
    );

  if (!p.kurulum) return <Kurulum dizin={dizin} />;

  const [bolum, arg] = rota.yol;

  if (bolum === "oturum") {
    const s = rota.sorgu;
    const kurs = s.get("kurs") ?? undefined;
    const tip: OturumTipi = s.get("konu")
      ? { tip: "konu", konuId: s.get("konu")! }
      : s.get("tekrar")
        ? { tip: "tekrar", kurs }
        : s.get("cikmis")
          ? { tip: "cikmis", kurs }
          : s.get("defter")
            ? { tip: "defter" }
            : { tip: "karisik", kurs };
    // Aynı rotada yeni oturum açılınca bileşen sıfırdan kurulsun
    return <Oturum key={window.location.hash} dizin={dizin} tip={tip} />;
  }

  if (bolum === "meydan") {
    const s = rota.sorgu;
    const uids = (s.get("k") ?? "").split(",").filter((u) => dizin.kartlar.has(u));
    return (
      <Oturum
        key={window.location.hash}
        dizin={dizin}
        tip={{ tip: "liste", uids }}
        meydan={{ ad: (s.get("a") ?? "Bir arkadaşın").slice(0, 24), skor: s.get("s") ?? "" }}
      />
    );
  }

  if (bolum === "deneme" && rota.sorgu.get("sinav")) {
    const sinav = rota.sorgu.get("sinav") === "AYT" ? "AYT" : "TYT";
    const olcek = Math.min(1, Math.max(0.25, Number(rota.sorgu.get("olcek")) || 0.5));
    return <Deneme key={window.location.hash} dizin={dizin} sinav={sinav} olcek={olcek} />;
  }

  let icerik;
  let sekme = "bugun";
  if (bolum === "dersler") {
    icerik = <DersListesi dizin={dizin} />;
    sekme = "dersler";
  } else if (bolum === "kurs" && arg && dizin.kurs.has(arg)) {
    icerik = <KursDetay key={arg} dizin={dizin} kursId={arg} />;
    sekme = "dersler";
  } else if (bolum === "ozet" && arg) {
    icerik = <KonuOzeti dizin={dizin} konuId={arg} />;
    sekme = "dersler";
  } else if (bolum === "deneme") {
    icerik = <DenemeSecim dizin={dizin} />;
  } else if (bolum === "defter") {
    icerik = <Defter dizin={dizin} />;
  } else if (bolum === "profil") {
    icerik = <Profil dizin={dizin} />;
    sekme = "profil";
  } else if (bolum === "kaynaklar") {
    icerik = <Kaynaklar dizin={dizin} />;
    sekme = "profil";
  } else {
    icerik = <Bugun dizin={dizin} />;
  }

  const vadeli = vadeliKartlar(dizin, p).length;

  return (
    <div className="kabuk">
      <div className="icerik">{icerik}</div>
      <nav className="alt-menu" aria-label="Ana menü">
        <Sekme etiket="Bugün" ikon={IKON.ev} aktif={sekme === "bugun"} onClick={() => git("/")} />
        <Sekme etiket="Dersler" ikon={IKON.kitap} aktif={sekme === "dersler"} onClick={() => git("/dersler")} />
        <Sekme etiket="Tekrar" ikon={IKON.tekrar} rozet={vadeli} onClick={() => git("/oturum?tekrar=1")} />
        <Sekme etiket="Profil" ikon={IKON.profil} aktif={sekme === "profil"} onClick={() => git("/profil")} />
      </nav>
    </div>
  );
}

function Sekme({ etiket, ikon, aktif, rozet, onClick }: { etiket: string; ikon: string; aktif?: boolean; rozet?: number; onClick: () => void }) {
  return (
    <button className={`sekme ${aktif ? "aktif" : ""}`} onClick={onClick} aria-current={aktif ? "page" : undefined}>
      <span className="sekme-ikon">
        <Ikon d={ikon} />
        {!!rozet && <span className="sekme-rozet">{rozet > 99 ? "99+" : rozet}</span>}
      </span>
      <span>{etiket}</span>
    </button>
  );
}
