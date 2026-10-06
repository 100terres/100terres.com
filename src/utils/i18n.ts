import type { AstroGlobal } from "astro";
import { type I18nLocales, I18N_DEFAULT_LOCALE, I18N_LOCALES } from "~/config";

const isLocale = (value: unknown): value is I18nLocales => {
  for (const locale of I18N_LOCALES) {
    if (locale === value) {
      return true;
    }
  }

  return false;
};

export const getCurrentLocale = (astro: AstroGlobal): I18nLocales => {
  const currentLocale = astro.currentLocale ?? I18N_DEFAULT_LOCALE;

  if (!isLocale(currentLocale)) {
    throw Error(`Unknown currentLocale of value: ${currentLocale}`);
  }

  return currentLocale;
};

export type Translations = Record<I18nLocales, unknown>;

export const getTranslation = <
  TTranslations extends Translations = Translations,
>(
  astro: AstroGlobal,
  translations: TTranslations,
): { currentLocale: I18nLocales; t: TTranslations[I18nLocales] } => {
  const currentLocale = getCurrentLocale(astro);

  return { currentLocale, t: translations[currentLocale] };
};
