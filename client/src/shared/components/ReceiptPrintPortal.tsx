import type { ReceiptSale } from '@/domains/pos/types';
import type {
  ReceiptSettings,
  ShopMetadata,
} from '@/domains/settings/hooks/useSettings';
import React from 'react';
import { createPortal } from 'react-dom';
import { Box } from '@mui/material';
import Receipt from '@/domains/pos/components/Receipt';

interface ReceiptPrintPortalProps {
  /** The sale to print; null/undefined renders the off-screen container empty. */
  sale?: ReceiptSale | null;
  receiptSettings?: ReceiptSettings | null;
  shopMetadata?: ShopMetadata | null;
  /** Hides the customer block on the printed receipt when off. */
  customerFeatureEnabled?: boolean;
}

/**
 * Single shared source of the hidden, off-screen receipt DOM that
 * `print-manual` captures. POS (Pay & Print / Last Receipt) and Sale History
 * (reprint) both render this component so the printed output can never drift
 * between them again — they used to be two separately maintained, near-
 * identical files (POSPrintContainer / SaleHistoryPrintContainer), and that
 * duplication was exactly why Sale History silently fell back to different
 * settings defaults than POS for a while.
 *
 * The `ipcRenderer.invoke(IPC.PRINT_MANUAL, ...)` call itself stays pinned
 * in each screen's own trigger (usePOSSale.ts / SaleHistory.tsx) per the
 * project-wide print-IPC-location rule — this component only owns what gets
 * rendered, not the invoke.
 */
const ReceiptPrintPortal = ({
  sale,
  receiptSettings,
  shopMetadata,
  customerFeatureEnabled = true,
}: ReceiptPrintPortalProps) =>
  createPortal(
    <Box
      aria-hidden="true"
      sx={{
        position: 'absolute',
        left: '-9999px',
        top: '-9999px',
        height: 0,
        overflow: 'hidden',
        '@media print': {
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: 'auto',
          overflow: 'visible',
          display: 'block',
          zIndex: 9999,
        },
      }}
    >
      <div id="thermal-receipt-print">
        {sale && (
          <Receipt
            sale={sale}
            settings={receiptSettings ?? undefined}
            shopMetadata={shopMetadata ?? undefined}
            customerFeatureEnabled={customerFeatureEnabled}
          />
        )}
      </div>
    </Box>,
    // Rendered as a direct child of <body> via a portal instead of relying
    // on position:fixed to escape AppLayout's ancestor chain. AppLayout's
    // wrappers became position:relative in the sidebar-nav redesign, which
    // broke this container's position:absolute anchoring (it resolved
    // against the sidebar-narrowed layout instead of the true page) on
    // every route except /pos. A position:fixed fix was verified correct
    // against Playwright/Chromium in both dev and production builds, but
    // the real packaged Electron app's silent print still reproduced the
    // original bug — so instead of continuing to depend on exactly how a
    // given Chromium/Electron build resolves position:fixed containing
    // blocks under print, this portal makes the ancestor chain a non-issue
    // structurally: there are no ancestors to escape in the first place.
    document.body
  );

export default React.memo(ReceiptPrintPortal);
