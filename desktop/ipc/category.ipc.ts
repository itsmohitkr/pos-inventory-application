// IPC handlers for the category domain — the direct-service-call replacement
// for category.router.ts / category.controller.ts, used only in packaged
// builds / electron-dev (dev-in-browser still goes through Express). See the
// IPC migration plan for the full rationale and the shared pattern every
// domain's *.ipc.ts file follows.
//
// require()s the *compiled* server modules (server/dist/**) — the same
// modules server/index.ts already loads in this same process, not a new
// module-resolution path — via resolveServerModulePath, not a relative
// require(). See that file's comment for why a relative path would be the
// wrong tool here.
import { ipcMain } from 'electron';
import { StatusCodes } from 'http-status-codes';
import IPC = require('../ipcChannels');
import { resolveServerModulePath } from './resolveServerModule';
import { buildSuccessPayload, validateIpcPayload, withErrorHandling } from './ipcHelpers';

type CategoryServiceModule = typeof import('../../server/dist/src/domains/category/category.service');
type CategoryValidationModule = typeof import('../../server/dist/src/domains/category/category.validation');

const categoryService: CategoryServiceModule = require(
  resolveServerModulePath('src', 'domains', 'category', 'category.service')
);
const { CreateCategorySchema, UpdateCategorySchema, DeleteCategorySchema }: CategoryValidationModule = require(
  resolveServerModulePath('src', 'domains', 'category', 'category.validation')
);

export const registerCategoryIpc = (): void => {
  ipcMain.handle(IPC.CATEGORY_GET_CATEGORIES, async () =>
    withErrorHandling(async () => {
      const data = await categoryService.getCategoryTree();
      return buildSuccessPayload(StatusCodes.OK, data, 'Categories fetched successfully');
    })
  );

  ipcMain.handle(IPC.CATEGORY_CREATE, async (_event, payload: unknown) =>
    withErrorHandling(async () => {
      const { body } = validateIpcPayload(CreateCategorySchema, { body: payload });
      const category = await categoryService.createCategory(
        body as Parameters<typeof categoryService.createCategory>[0]
      );
      return buildSuccessPayload(StatusCodes.CREATED, category, 'Category saved successfully');
    })
  );

  ipcMain.handle(
    IPC.CATEGORY_UPDATE,
    async (_event, payload: { id?: unknown; name?: unknown }) =>
      withErrorHandling(async () => {
        const { params, body } = validateIpcPayload(UpdateCategorySchema, {
          params: { id: payload?.id },
          body: payload,
        });
        const category = await categoryService.updateCategory(
          (params as { id: number }).id,
          body as Parameters<typeof categoryService.updateCategory>[1]
        );
        return buildSuccessPayload(StatusCodes.OK, category, 'Category updated successfully');
      })
  );

  ipcMain.handle(IPC.CATEGORY_DELETE, async (_event, payload: { id?: unknown }) =>
    withErrorHandling(async () => {
      const { params } = validateIpcPayload(DeleteCategorySchema, {
        params: { id: payload?.id },
      });
      await categoryService.deleteCategory((params as { id: number }).id);
      return buildSuccessPayload(StatusCodes.OK, undefined, 'Category deleted');
    })
  );
};
