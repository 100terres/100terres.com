// @ts-check
import eslint from "@eslint/js";
import eslintPluginAstro from "eslint-plugin-astro";
import eslintPluginCompat from "eslint-plugin-compat";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";

export default defineConfig(
  {
    name: "custom/ignore",
    ignores: ["**/.astro", "**/dist", "**/node_modules"],
  },
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  {
    ...tseslint.configs.stylisticTypeChecked.at(-1), // This is to avoid duplicated configs
    name: "custom/typescript-eslint/stylistic-type-check",
  },
  eslintPluginAstro.configs["flat/recommended"],
  {
    ...eslintPluginAstro.configs["flat/jsx-a11y-strict"].at(-1), // This is to avoid duplicated configs
    name: "custom/astro/jsx-a11y",
  },
  {
    ...eslintPluginCompat.configs["flat/recommended"],
    files: [
      "**/*.astro/*.js",
      "*.astro/*.js",
      "**/*.astro/*.ts",
      "*.astro/*.ts",
    ],
    name: "custom/astro/compat",
  },
  {
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    name: "custom/typescript/languageOptions",
  },
  eslintPluginPrettierRecommended,
  {
    name: "custom/rules",
    rules: {
      "astro/jsx-a11y/no-redundant-roles": [
        "error",
        {
          // We allow explicit role on ul and ol elements, because we assume that we should remove
          // the default styles.
          ol: ["list"],
          ul: ["list"],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "MemberExpression[property.name='querySelector'], MemberExpression[property.value='querySelector']",
          message:
            'Use $$$querySelector from "~/utils/dom" instead of querySelector, so the selector classes get renamed at build time.',
        },
      ],
    },
  },
);
