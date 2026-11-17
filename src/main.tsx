import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/nunito";
import "@fontsource-variable/fredoka";
import "./styles.css";
import { App } from "./App";
import { ikinciKopyadanYukle } from "./yerel";

// iOS uygulamasında ilerleme silinmişse uygulama hafızasındaki ikinci kopyadan geri yükle
ikinciKopyadanYukle().then(async () => {
  const { ilerlemeyiYenile } = await import("./store");
  ilerlemeyiYenile();
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
