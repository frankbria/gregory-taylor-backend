/** @type {import('jest').Config} */
module.exports = {
  // Use Node environment for API testing
  testEnvironment: 'node',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'app/api/**/*.js',
    'lib/**/*.js',
    'models/**/*.js',
    '!**/__tests__/**',
    '!**/node_modules/**',
    '!**/.next/**'
  ],

  // Module path aliases (matching Next.js @ alias)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },

  // Transform configuration - use babel-jest for ES modules
  transform: {
    '^.+\\.js$': 'babel-jest',
  },

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/'
  ],

  // Timeout for long-running tests (database operations)
  testTimeout: 10000,

  // Globals for MongoDB memory server
  globalSetup: '<rootDir>/__tests__/setup/globalSetup.js',
  globalTeardown: '<rootDir>/__tests__/setup/globalTeardown.js',
}
