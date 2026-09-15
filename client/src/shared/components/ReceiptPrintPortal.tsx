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
  /**
   * The id given to the hidden print target, and the id exempted from
   * index.css's `body * { visibility: hidden }` print rule below. Defaults
   * to the original shared id for the two long-standing consumers (POS,
   * Sale History). Any additional consumer mounted alongside one of those
   * (e.g. a dialog that's always in the tree, not just while open) MUST
   * pass its own distinct id — two elements sharing an id is invalid HTML,
   * and index.css's `#thermal-receipt-print` selector matches *every*
   * element with that id, not just one, so a second consumer reusing the
   * default would silently print doubled/overlapping content instead of
   * failing loudly.
   */
  targetId?: string;
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
  targetId = 'thermal-receipt-print',
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
      <div id={targetId}>
        {sale && (
          <Receipt
            sale={sale}
            settings={receiptSettings ?? undefined}
            shopMetadata={shopMetadata ?? undefined}
            customerFeatureEnabled={customerFeatureEnabled}
          />
        )}
      </div>
      {/*
        index.css's global `body * { visibility: hidden }` print rule hides
        everything except #thermal-receipt-print — the one id it hardcodes.
        A non-default targetId needs its own matching exemption, so each
        portal instance carries it rather than requiring every new consumer
        to also edit the shared global stylesheet. Harmless, exact duplicate
        of index.css's rule for the default id.
      */}
      <style>{`
        @media print {
          #${targetId}, #${targetId} * {
            visibility: visible;
          }
        }
      `}</style>
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
