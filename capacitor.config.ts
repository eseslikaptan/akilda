import type { CapacitorConfig } from "@capacitor/cli";

// iOS uygulaması: web uygulaması (dist/) uygulamanın içine gömülür, çevrimdışı çalışır.
const config: CapacitorConfig = {
  appId: "com.eseslikaptan.akilda",
  appName: "Akılda",
  webDir: "dist",
  ios: {
    contentInset: "never",
    backgroundColor: "#fff8ef",
    // Bağlantılar (MEB PDF'leri) Safari'de açılsın
    limitsNavigationsToAppBoundDomains: false,
  },
  plugins: {
    LocalNotifications: {
      iconColor: "#ff8a1f",
    },
  },
};

export default config;
