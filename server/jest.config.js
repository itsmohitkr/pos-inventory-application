module.exports = {
    testEnvironment: 'node',
    setupFilesAfterEnv: ['<rootDir>/tests/setup/prisma-mock.ts'],
    clearMocks: true,
    moduleDirectories: ['node_modules', 'src'],

    transform: {
        '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json', isolatedModules: true }],
    },
    moduleFileExtensions: ['ts', 'js', 'json', 'node'],

    testMatch: ['**/tests/domains/**/*.test.ts'],
    collectCoverageFrom: ['src/domains/**/*.{js,ts}'],
    coverageDirectory: 'coverage',
};
