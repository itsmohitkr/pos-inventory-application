module.exports = {
    testEnvironment: 'node',
    setupFilesAfterEnv: ['<rootDir>/tests/setup/prisma-mock.js'],
    clearMocks: true,
    moduleDirectories: ['node_modules', 'src'],
    testMatch: ['**/tests/domains/**/*.test.js'],
    collectCoverageFrom: ['src/domains/**/*.js'],
    coverageDirectory: 'coverage',
};
