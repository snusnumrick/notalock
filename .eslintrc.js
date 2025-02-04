module.exports = {
  extends: ['@remix-run/eslint-config', '@remix-run/eslint-config/node'],
  rules: {
    // Disable some rules that are too strict for build output
    'no-undef': 'error',
    'no-unused-vars': 'warn',
    'no-mixed-operators': 'warn',
    'no-sequences': 'warn',
    'no-lone-blocks': 'warn',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  ignorePatterns: ['build/**/*', 'public/build/**/*', 'node_modules/**/*'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
};
