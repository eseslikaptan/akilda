import { useEffect, useState } from "react";

// GitHub Pages gibi statik barındırmada sorunsuz çalışması için hash tabanlı yönlendirme.
export interface Rota {
  yol: string[]; // "#/ders/tarih" -> ["ders", "tarih"]
  sorgu: URLSearchParams;
}

function coz(): Rota {
  const ham = window.location.hash.replace(/^#\/?/, "");
  const [yol, sorgu = ""] = ham.split("?");
  return { yol: yol.split("/").filter(Boolean).map(decodeURIComponent), sorgu: new URLSearchParams(sorgu) };
}

export function useRota(): Rota {
  const [rota, setRota] = useState(coz);
  useEffect(() => {
    const f = () => {
      setRota(coz());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  return rota;
}

export function git(yol: string, degistir = false) {
  const hedef = `#${yol.startsWith("/") ? yol : `/${yol}`}`;
  if (degistir) window.location.replace(hedef);
  else window.location.hash = hedef;
}

export function geri(yedek = "/") {
  if (window.history.length > 1) window.history.back();
  else git(yedek, true);
}
