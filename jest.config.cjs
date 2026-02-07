module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@dwitlit-db/data$': '<rootDir>/packages/data/src',
    '^@dwitlit-db/ui$': '<rootDir>/packages/ui/src',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
};
