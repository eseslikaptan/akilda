// Uygulama içi kısa bildirimler (rozet kazanıldı vb.)
import { useSyncExternalStore } from "react";

export interface Bildirim {
  id: number;
  baslik: string;
  alt?: string;
  simge?: string;
}

let liste: Bildirim[] = [];
const dinleyiciler = new Set<() => void>();
let sayac = 0;

function yay() {
  dinleyiciler.forEach((f) => f());
}

export function bildir(b: Omit<Bildirim, "id">, sure = 4200) {
  const id = ++sayac;
  liste = [...liste, { ...b, id }];
  yay();
  setTimeout(() => {
    liste = liste.filter((x) => x.id !== id);
    yay();
  }, sure);
}

export function useBildirimler(): Bildirim[] {
  return useSyncExternalStore(
    (f) => {
      dinleyiciler.add(f);
      return () => dinleyiciler.delete(f);
    },
    () => liste,
  );
}
