/** @type {import('ts-jest').JestConfigWithTsJest} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    // Handle CSS imports
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    
    // Handle module aliases
    '^~/(.*)$': '<rootDir>/app/$1',
    '^@/(.*)$': '<rootDir>/app/$1',
    '^@remix-run/node$': '<rootDir>/app/__mocks__/@remix-run/node.ts'
  },
  transform: {
    '^.+\\.(t|j)sx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      useESM: true
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(uuid)/.*)'
  ],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/build/',
    '/public/',
    '/.husky/',
    '/coverage/',
  ],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    '!app/**/*.d.ts',
  ],
  testEnvironmentOptions: {
    url: 'http://localhost'
  }
};

export default config;