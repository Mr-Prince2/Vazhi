import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { LanguageType, TRANSLATIONS } from "../../lib/languages";

// Explicitly export LanguageType here so internal consumers resolve it safely
export { LanguageType };

type TranslationMapType = (typeof TRANSLATIONS)["en"];

type LanguageContextType = {
  currentLang: LanguageType;
  t: TranslationMapType;
  changeLanguage: (lang: LanguageType) => Promise<void>;
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentLang, setCurrentLang] = useState<LanguageType>("en");

  useEffect(() => {
    (async () => {
      try {
        const storedLang = await AsyncStorage.getItem("vazhi:language");
        if (storedLang && Object.keys(TRANSLATIONS).includes(storedLang)) {
          setCurrentLang(storedLang as LanguageType);
        }
      } catch (err) {
        console.error("Error matching localization mapping layers:", err);
      }
    })();
  }, []);

  const changeLanguage = async (lang: LanguageType) => {
    setCurrentLang(lang);
    try {
      await AsyncStorage.setItem("vazhi:language", lang);
    } catch (err) {
      console.error("Storage save failed for language mapping:", err);
    }
  };

  const value: LanguageContextType = {
    currentLang,
    t: (TRANSLATIONS[currentLang] ||
      TRANSLATIONS["en"]) as unknown as TranslationMapType,
    changeLanguage,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context)
    throw new Error(
      "useTranslation was requested outside LanguageProvider bounds.",
    );
  return context;
};
