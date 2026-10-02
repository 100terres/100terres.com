import { type ThemePreference } from "./theme-state";

declare global {
  interface Window {
    // aka: getThemePreference
    t: () => ThemePreference;
  }
}
