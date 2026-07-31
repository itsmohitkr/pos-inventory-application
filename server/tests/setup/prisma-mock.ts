import type { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, type DeepMockProxy } from 'jest-mock-extended';

// Use jest.mock to intercept the actual prisma file. The factory's return
// value becomes `module.exports` directly (mirroring the real module's
// `export = prisma`), so anything that requires '../../src/config/prisma'
// gets the mock itself rather than a `{ default }`-wrapped object.
jest.mock('../../src/config/prisma', () => mockDeep<PrismaClient>());

import prismaModule = require('../../src/config/prisma');

// The real module's export type is `PrismaClient`, but at runtime (via the
// jest.mock above) it is actually a DeepMockProxy. This cast makes that
// visible to callers so `prisma.user.findUnique.mockResolvedValue(...)`
// type-checks in test files.
const prisma = prismaModule as unknown as DeepMockProxy<PrismaClient>;

beforeEach(() => {
    mockReset(prisma);
});

/** Typed accessor for the mocked Prisma client, for use in .test.ts files. */
export const getMockPrisma = (): DeepMockProxy<PrismaClient> => prisma;

/**
 * Test fixtures deliberately include only the fields a given test cares
 * about, not every column a Prisma model requires (createdAt, updatedAt,
 * relations, etc.) — so they can't be assigned directly to a `mockResolvedValue`
 * typed against the real model. Rather than scattering `as any` through every
 * fixture literal, this one generic assertion (object -> T, never through
 * `any`) documents the gap in a single place.
 */
export const asMock = <T>(value: unknown): T => value as T;
