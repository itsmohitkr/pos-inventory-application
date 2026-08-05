// IPC handlers for the setting domain — replaces setting.router.ts /
// setting.controller.ts for packaged builds / electron-dev. See
// category.ipc.ts and the IPC migration plan for the shared pattern.
import { ipcMain } from 'electron';
import { StatusCodes } from 'http-status-codes';
import IPC = require('../ipcChannels');
import { resolveServerModulePath } from './resolveServerModule';
import { buildSuccessPayload, validateIpcPayload, withErrorHandling } from './ipcHelpers';

type SettingServiceModule = typeof import('../../server/dist/src/domains/setting/setting.service');
type SettingValidationModule = typeof import('../../server/dist/src/domains/setting/setting.validation');

const settingService: SettingServiceModule = require(
  resolveServerModulePath('src', 'domains', 'setting', 'setting.service')
);
const { UpdateSettingsSchema }: SettingValidationModule = require(
  resolveServerModulePath('src', 'domains', 'setting', 'setting.validation')
);

export const registerSettingIpc = (): void => {
  ipcMain.handle(IPC.SETTING_GET_ALL, async () =>
    withErrorHandling(async () => {
      const settings = await settingService.getAllSettings();
      return buildSuccessPayload(StatusCodes.OK, settings, 'Settings fetched successfully');
    })
  );

  ipcMain.handle(IPC.SETTING_UPDATE, async (_event, payload: unknown) =>
    withErrorHandling(async () => {
      const { body } = validateIpcPayload(UpdateSettingsSchema, { body: payload });
      const message = await settingService.updateSettingsRequest(
        body as Parameters<typeof settingService.updateSettingsRequest>[0]
      );
      return buildSuccessPayload(StatusCodes.OK, undefined, message);
    })
  );
};
