module.exports = {
  root: true,
  env: {
    es2020: true,
    node: true,
    jest: true,
  },
  globals: {
    web3: true,
  },
  overrides: [
    {
      files: ["**/*.ts", "**/*.tsx"],
      parser: "@typescript-eslint/parser",
      parserOptions: { project: "./tsconfig.json" },
      plugins: ["@typescript-eslint", "jsx-a11y"],
      extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:prettier/recommended",
        "react-app",
        "plugin:jsx-a11y/recommended",
      ],
      rules: {
        "@typescript-eslint/no-unused-vars": [
          "warn",
          { argsIgnorePattern: "^_" },
        ],
        "@typescript-eslint/no-use-before-define": [
          "error",
          { functions: false, classes: false },
        ],
        "prettier/prettier": "warn",
        "@typescript-eslint/camelcase": "off",
        "@typescript-eslint/no-floating-promises": [
          "error",
          { ignoreVoid: true, ignoreIIFE: true },
        ],
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",
      },
    },
    {
      files: ["**/*.js", "**/*.jsx"],
      extends: [
        "eslint:recommended",
        "standard",
        "plugin:prettier/recommended",
        "react-app",
      ],
      rules: {
        "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
        "prettier/prettier": "warn",
        "no-var": "error",
        camelcase: "off",
      },
    },
  ],
};
