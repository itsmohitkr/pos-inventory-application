module.exports = {
    testEnvironment: 'node',
    setupFilesAfterEnv: ['<rootDir>/tests/setup/prisma-mock.js'],
    clearMocks: true,
    moduleDirectories: ['node_modules', 'src'],

    // Tests stay .js while the source is converted — they are the net that
    // verifies the migration, so they change last. This transform lets those
    // .js tests require .ts source files.
    transform: {
        '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
    },
    moduleFileExtensions: ['ts', 'js', 'json', 'node'],

    testMatch: ['**/tests/domains/**/*.test.js'],
    collectCoverageFrom: ['src/domains/**/*.{js,ts}'],
    coverageDirectory: 'coverage',
};
