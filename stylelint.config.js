/** @type {import('stylelint').Config} */
export default {
  extends: [
    "stylelint-config-standard",
    "stylelint-config-html/html",
    "stylelint-config-html/astro",
    "stylelint-prettier/recommended",
  ],
  plugins: ["stylelint-no-unsupported-browser-features"],
  rules: {
    "plugin/no-unsupported-browser-features": [
      true,
      {
        severity: "error",
      },
    ],
  },
  overrides: [
    {
      // The inline <style> is filled at build time via `set:html`.
      files: ["src/theme/ThemeCriticalSetup.astro"],
      rules: {
        "no-empty-source": null,
      },
    },
  ],
};
