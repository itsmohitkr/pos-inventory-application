const { mockDeep, mockReset } = require('jest-mock-extended');

// Use jest.mock to intercept the actual prisma file
jest.mock('../../src/config/prisma', () => mockDeep());

const prisma = require('../../src/config/prisma');

beforeEach(() => {
    mockReset(prisma);
});
