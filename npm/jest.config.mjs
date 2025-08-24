export default {
  preset: undefined,
  projects: [
    {
      displayName: 'id-generator',
      testMatch: ['<rootDir>/packages/id-generator/__tests__/**/*.{unit,spec}.mjs'],
      transform: {},
      testEnvironment: 'node',
      extensionsToTreatAsEsm: []
    },
    {
      displayName: 'rehype-append-ids',
      testMatch: ['<rootDir>/packages/rehype-append-ids/__tests__/**/*.{unit,spec}.mjs'],
      transform: {},
      moduleNameMapper: {
        '^@thinkeloquent/id-generator$': '<rootDir>/packages/id-generator/index.mjs'
      },
      testEnvironment: 'node',
      extensionsToTreatAsEsm: []
    },
    {
      displayName: 'xast-append-ids',
      testMatch: ['<rootDir>/packages/xast-append-ids/__tests__/**/*.{unit,spec}.mjs'],
      transform: {},
      moduleNameMapper: {
        '^@thinkeloquent/id-generator$': '<rootDir>/packages/id-generator/index.mjs'
      },
      testEnvironment: 'node',
      extensionsToTreatAsEsm: []
    },
    {
      displayName: 'babel-plugin-jsx-append-ids',
      testMatch: ['<rootDir>/packages/babel-plugin-jsx-append-ids/__tests__/**/*.{unit,spec}.mjs'],
      transform: {},
      moduleNameMapper: {
        '^@thinkeloquent/id-generator$': '<rootDir>/packages/id-generator/index.mjs'
      },
      testEnvironment: 'node',
      extensionsToTreatAsEsm: []
    },
    {
      displayName: 'monorepo',
      testMatch: ['<rootDir>/__tests__/**/*.{unit,spec}.mjs'],
      transform: {},
      testEnvironment: 'node',
      extensionsToTreatAsEsm: []
    }
  ],
  collectCoverageFrom: [
    'packages/*/index.mjs',
    '!**/node_modules/**',
    '!**/__tests__/**'
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
};