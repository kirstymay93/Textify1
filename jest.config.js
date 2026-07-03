export default {
  preset: 'ts-jest',

  testEnvironment: 'jsdom',

  roots: ['<rootDir>/src'],

  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },

  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],

  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  },

  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ]
};