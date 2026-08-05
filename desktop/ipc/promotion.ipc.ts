// IPC handlers for the promotion domain — replaces promotion.router.ts /
// promotion.controller.ts for packaged builds / electron-dev. See
// category.ipc.ts and the IPC migration plan for the shared pattern.
import { ipcMain } from 'electron';
import { StatusCodes } from 'http-status-codes';
import IPC = require('../ipcChannels');
import { resolveServerModulePath } from './resolveServerModule';
import { buildSuccessPayload, validateIpcPayload, withErrorHandling } from './ipcHelpers';

type PromotionServiceModule = typeof import('../../server/dist/src/domains/promotion/promotion.service');
type PromotionValidationModule = typeof import('../../server/dist/src/domains/promotion/promotion.validation');

const promotionService: PromotionServiceModule = require(
  resolveServerModulePath('src', 'domains', 'promotion', 'promotion.service')
);
const {
  CreatePromotionSchema,
  UpdatePromotionSchema,
  DeletePromotionSchema,
  GetProductPricingOptionsSchema,
  GetEffectivePromoPriceSchema,
}: PromotionValidationModule = require(
  resolveServerModulePath('src', 'domains', 'promotion', 'promotion.validation')
);

export const registerPromotionIpc = (): void => {
  ipcMain.handle(IPC.PROMOTION_CREATE, async (_event, payload: unknown) =>
    withErrorHandling(async () => {
      const { body } = validateIpcPayload(CreatePromotionSchema, { body: payload });
      const promotion = await promotionService.createPromotion(
        body as Parameters<typeof promotionService.createPromotion>[0]
      );
      return buildSuccessPayload(StatusCodes.CREATED, promotion, 'Promotion created successfully', {
        format: 'raw',
      });
    })
  );

  ipcMain.handle(IPC.PROMOTION_GET_ALL, async () =>
    withErrorHandling(async () => {
      const promotions = await promotionService.getAllPromotions();
      return buildSuccessPayload(StatusCodes.OK, promotions, 'Promotions fetched successfully', {
        format: 'raw',
      });
    })
  );

  ipcMain.handle(
    IPC.PROMOTION_UPDATE,
    async (_event, payload: { id?: unknown } & Record<string, unknown>) =>
      withErrorHandling(async () => {
        const { params, body } = validateIpcPayload(UpdatePromotionSchema, {
          params: { id: payload?.id },
          body: payload,
        });
        const promotion = await promotionService.updatePromotion(
          (params as { id: number }).id,
          body as Parameters<typeof promotionService.updatePromotion>[1]
        );
        return buildSuccessPayload(StatusCodes.OK, promotion, 'Promotion updated successfully', {
          format: 'raw',
        });
      })
  );

  ipcMain.handle(IPC.PROMOTION_DELETE, async (_event, payload: { id?: unknown }) =>
    withErrorHandling(async () => {
      const { params } = validateIpcPayload(DeletePromotionSchema, {
        params: { id: payload?.id },
      });
      await promotionService.deletePromotion((params as { id: number }).id);
      const message = 'Promotion deleted successfully';
      return buildSuccessPayload(StatusCodes.OK, { message }, message, { format: 'raw' });
    })
  );

  ipcMain.handle(
    IPC.PROMOTION_GET_PRODUCT_PRICING_OPTIONS,
    async (_event, payload: { productId?: unknown }) =>
      withErrorHandling(async () => {
        const { params } = validateIpcPayload(GetProductPricingOptionsSchema, {
          params: { productId: payload?.productId },
        });
        const options = await promotionService.getProductPricingOptions(
          (params as { productId: number }).productId
        );
        return buildSuccessPayload(
          StatusCodes.OK,
          options,
          'Promotion pricing options fetched successfully',
          { format: 'raw' }
        );
      })
  );

  ipcMain.handle(
    IPC.PROMOTION_GET_EFFECTIVE_PRICE,
    async (_event, payload: { productId?: unknown }) =>
      withErrorHandling(async () => {
        const { params } = validateIpcPayload(GetEffectivePromoPriceSchema, {
          params: { productId: payload?.productId },
        });
        const price = await promotionService.getEffectivePromoPrice(
          (params as { productId: number }).productId
        );
        return buildSuccessPayload(
          StatusCodes.OK,
          { promoPrice: price },
          'Effective promotional price fetched successfully',
          { format: 'raw' }
        );
      })
  );
};
