import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import es from "./es.json";
import en from "./en.json";
import pt from "./pt.json";
import zhCN from "./zh-CN.json";
import zhTW from "./zh-TW.json";
import ja from "./ja.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
      pt: { translation: pt },
      "zh-CN": { translation: zhCN },
      "zh-TW": { translation: zhTW },
      ja: { translation: ja }
    },
    fallbackLng: "es",
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "stockalert-idioma"
    },
    interpolation: { escapeValue: false }
  });

export default i18n;
