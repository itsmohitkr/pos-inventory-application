// Aggregates every domain's registerXIpc() call, so desktop/main.ts has one
// entry point instead of accumulating an ever-growing list of individual
// imports as more domains migrate. See the IPC migration plan.
import { registerCategoryIpc } from './category.ipc';
import { registerSettingIpc } from './setting.ipc';
import { registerReportIpc } from './report.ipc';
import { registerPromotionIpc } from './promotion.ipc';
import { registerCategorySaleIpc } from './category-sale.ipc';
import { registerLooseSaleIpc } from './loose-sale.ipc';
import { registerCustomerIpc } from './customer.ipc';
import { registerExpenseIpc } from './expense.ipc';
import { registerPurchaseIpc } from './purchase.ipc';
import { registerSaleIpc } from './sale.ipc';
import { registerProductIpc } from './product.ipc';
import { registerAuthIpc } from './auth.ipc';

export const registerAllIpc = (): void => {
  registerCategoryIpc();
  registerSettingIpc();
  registerReportIpc();
  registerPromotionIpc();
  registerCategorySaleIpc();
  registerLooseSaleIpc();
  registerCustomerIpc();
  registerExpenseIpc();
  registerPurchaseIpc();
  registerSaleIpc();
  registerProductIpc();
  registerAuthIpc();
};
