module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@dwitlit-db/data$': '<rootDir>/packages/data/src',
    '^@dwitlit-db/web$': '<rootDir>/packages/web/src',
    '^@dwitlit-db/ui$': '<rootDir>/packages/ui/src',
    '\\.(css|less|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
};
