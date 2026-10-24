// @ts-check
import { defineConfig } from "eslint/config";
import eslint from "@eslint/js";
import eslintPluginAstro from "eslint-plugin-astro";
import eslintPluginCheckFile from "eslint-plugin-check-file";
import eslintPluginCompat from "eslint-plugin-compat";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import eslintPluginToml from "eslint-plugin-toml";
import eslintPluginYml from "eslint-plugin-yml";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import tseslint from "typescript-eslint";

export default defineConfig(
  {
    name: "custom/ignore",
    ignores: [
      "**/.astro",
      "**/dist",
      "**/node_modules",
      "mise.lock",
      "pnpm-lock.yaml",
    ],
  },
  {
    name: "custom/code",
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,astro}"],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.strictTypeChecked,
      {
        ...tseslint.configs.stylisticTypeChecked.at(-1), // This is to avoid duplicated configs
        name: "custom/typescript-eslint/stylistic-type-check",
      },
      eslintPluginAstro.configs.recommended,
      {
        ...eslintPluginAstro.configs["jsx-a11y-strict"].at(-1), // This is to avoid duplicated configs
        name: "custom/astro/jsx-a11y",
      },
      {
        name: "custom/typescript/languageOptions",
        languageOptions: {
          parserOptions: {
            project: "./tsconfig.json",
            tsconfigRootDir: import.meta.dirname,
          },
        },
      },
    ],
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
  {
    name: "custom/json",
    files: ["**/*.json"],
    ignores: ["**/tsconfig*.json", ".vscode/*.json"],
    plugins: { json },
    language: "json/json",
    extends: [json.configs.recommended],
  },
  {
    name: "custom/jsonc-with-trailing-commas",
    files: ["**/tsconfig*.json", ".vscode/*.json"],
    plugins: { json },
    language: "json/jsonc",
    languageOptions: {
      allowTrailingCommas: true,
    },
    extends: [json.configs.recommended],
  },
  {
    name: "custom/markdown",
    files: ["**/*.md"],
    extends: [markdown.configs.recommended],
    language: "markdown/gfm",
    languageOptions: {
      frontmatter: "yaml",
    },
  },
  {
    name: "custom/yaml",
    files: ["**/*.{yaml,yml}"],
    extends: [
      eslintPluginYml.configs.recommended,
      eslintPluginYml.configs.prettier,
    ],
  },
  {
    name: "custom/toml",
    files: ["**/*.toml"],
    extends: [eslintPluginToml.configs.recommended],
  },
  eslintPluginPrettierRecommended,

  // This must stay after "custom/code" and the Prettier config
  {
    name: "custom/astro/virtual",
    // Virtual files extracted from the <script> of .astro files.
    files: ["src/**/*.astro/*.{js,ts}"],
    extends: [
      eslintPluginCompat.configs["flat/recommended"],
      // These files aren't part of the TypeScript project, so type-aware rules
      // can't run on them. Otherwise the parse error is silently swallowed and
      // the script isn't linted at all.
      // https://github.com/ota-meshi/eslint-plugin-astro/issues/402
      tseslint.configs.disableTypeChecked,
    ],
    rules: {
      // Prettier already formats the whole .astro file, scripts included. On
      // the virtual files, it would pick the astro parser and fail.
      "prettier/prettier": "off",
    },
  },
  {
    name: "custom/astro/folder-names",
    files: ["src/**/*.astro/**"],
    plugins: { "check-file": eslintPluginCheckFile },
    rules: {
      // The scripts of .astro files are linted as virtual files named
      // `<file>.astro/<n>_<n>.{js,ts}` (see "custom/astro/virtual"). A real
      // folder named `*.astro` would have its files mistaken for those.
      "check-file/folder-naming-convention": [
        "error",
        { "src/**/": "!(*.astro)" },
        {
          errorMessage:
            'Folders can\'t be named *.astro, rename "{{ target }}"',
        },
      ],
    },
  },
);
