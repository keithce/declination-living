// @ts-check

/** @type {import('prettier').Config} */
const config = {
  // Basics
  semi: false,
  singleQuote: true,
  trailingComma: 'all',

  // Formatting
  tabWidth: 2,
  useTabs: false,
  printWidth: 100,

  // Consistency
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'always',
  endOfLine: 'lf',

  // JSX
  jsxSingleQuote: false,

  // Prose
  proseWrap: 'preserve',
}

export default config
