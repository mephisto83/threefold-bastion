import { useGameState } from '../../state/gameState';
import { TRANSLATIONS, TranslationKey } from '../../game/config/translations';

export const useTranslation = () => {
  const { language } = useGameState();
  
  const t = (key: TranslationKey | string, params?: Record<string, string | number>) => {
    const lang = language || 'en';
    const dict = TRANSLATIONS[lang];
    
    let text = key;

    // If key exists in dictionary, use it
    if (key in dict) {
      text = dict[key as TranslationKey];
    }
    // Fallback to English if missing in current language
    else if (lang !== 'en' && key in TRANSLATIONS.en) {
      text = TRANSLATIONS.en[key as TranslationKey];
    }

    // Interpolate params
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        text = text.replace(`{${paramKey}}`, String(paramValue));
      });
    }

    return text;
  };

  return { t, language };
};
