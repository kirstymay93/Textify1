export default {
  preset: 'ts-jest',

  testEnvironment: 'jsdom',

  roots: ['<rootDir>/src'],

  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }]
  },

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },

  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],

  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ]
};