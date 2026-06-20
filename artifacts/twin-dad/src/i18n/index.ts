import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en";
import es from "./locales/es";
import pt from "./locales/pt";

const savedLang = localStorage.getItem("twin-dad-lang") || "en";

i18n.use(initReactI18next).init({
  resources: { en, es, pt },
  lng: savedLang,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

i18n.on("languageChanged", (lng) => {
  localStorage.setItem("twin-dad-lang", lng);
});

export default i18n;
