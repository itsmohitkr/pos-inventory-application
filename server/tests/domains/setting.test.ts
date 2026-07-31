import request from 'supertest';
import app = require('../../src/app');
import { getMockPrisma, asMock } from '../setup/prisma-mock';

const prisma = getMockPrisma();

describe('Setting Domain API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/settings', () => {
        it('should fetch all application settings mapped identically', async () => {
            prisma.setting.findMany.mockResolvedValue(asMock([
                { key: 'STORE_NAME', value: 'My Shop' },
                { key: 'TAX_RATE', value: '5' }
            ]));

            const res = await request(app).get('/api/settings');

            // Settings controller uses default wrapped schema ({ success, data, message })
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.STORE_NAME).toBe('My Shop');
            expect(res.body.data.TAX_RATE).toBe(5);
        });
    });

    // Settings are stored as TEXT and JSON-parsed on read, with a raw-string
    // fallback when parsing fails. processSale reads receiptSettings.roundOff to
    // decide money rounding, so this serialisation path affects totals.
    describe('JSON serialisation round-trip', () => {
        it('parses object-valued settings back into objects', async () => {
            const receiptSettings = { roundOff: true, paperSize: '72mm', marginSide: 4 };
            prisma.setting.findMany.mockResolvedValue(asMock([
                { key: 'posReceiptSettings', value: JSON.stringify(receiptSettings) },
            ]));

            const res = await request(app).get('/api/settings');

            expect(res.status).toBe(200);
            expect(res.body.data.posReceiptSettings).toEqual(receiptSettings);
            expect(res.body.data.posReceiptSettings.roundOff).toBe(true);
        });

        it('stores values JSON-stringified', async () => {
            prisma.setting.upsert.mockResolvedValue(asMock({}));

            await request(app)
                .post('/api/settings')
                .send({ settings: { posReceiptSettings: { roundOff: false } } });

            expect(prisma.setting.upsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { key: 'posReceiptSettings' },
                    create: { key: 'posReceiptSettings', value: '{"roundOff":false}' },
                    update: { value: '{"roundOff":false}' },
                })
            );
        });

        it('falls back to the raw string when a stored value is not valid JSON', async () => {
            // A legacy or hand-edited row must not crash the settings endpoint.
            prisma.setting.findMany.mockResolvedValue(asMock([
                { key: 'posShopName', value: 'Bachat Bazaar' },
                { key: 'broken', value: '{not valid json' },
            ]));

            const res = await request(app).get('/api/settings');

            expect(res.status).toBe(200);
            expect(res.body.data.posShopName).toBe('Bachat Bazaar');
            expect(res.body.data.broken).toBe('{not valid json');
        });
    });

    describe('POST /api/settings', () => {
        it('should update multiple settings transactionally', async () => {
            // Mock upsert logic
            prisma.setting.upsert.mockResolvedValue(asMock({ key: 'STORE_NAME', value: 'New Bazaar' }));

            const res = await request(app)
                .post('/api/settings')
                .send({
                    settings: {
                        STORE_NAME: 'New Bazaar'
                    }
                });

            // Default wrapped schema returns success state and no specific data payload on update
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(prisma.setting.upsert).toHaveBeenCalled();
        });
    });
});
