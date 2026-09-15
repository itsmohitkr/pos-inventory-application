import type { ReceiptSaleItem } from '@/domains/pos/types';
import React, { forwardRef } from 'react';
import {
  DEFAULT_RECEIPT_SETTINGS,
  getReceiptCalculations,
  getReceiptTheme,
  getSafePrintableWidth,
} from '@/domains/pos/components/receiptUtils';
import { buildReceiptCss } from '@/domains/pos/components/receiptStyles';

interface ReceiptProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sale?: Record<string, any> | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  settings?: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shopMetadata?: Record<string, any>;
  customerFeatureEnabled?: boolean;
}

/**
 * Structure only — every visual rule (font size, weight, spacing) comes from
 * buildReceiptCss, embedded verbatim in the trailing <style> tag below. This
 * mirrors PriceListLabelCard.tsx's pattern: no MUI `sx`/`Typography` inside
 * the printable tree, so there is no Emotion-generated class whose cascade
 * position depends on the app's render history. Whatever prints is exactly
 * what this component rendered, because the stylesheet travels with the
 * cloned markup instead of being reconstructed from a separate snapshot.
 */
const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(
  ({ sale, settings, shopMetadata, customerFeatureEnabled = true }, ref) => {
  if (!sale) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config: Record<string, any> = settings || DEFAULT_RECEIPT_SETTINGS;

  const paperSize = config.paperSize || '72mm';
  const printableWidth = getSafePrintableWidth(paperSize);
  const marginTop = config.marginTop !== undefined ? `${config.marginTop}mm` : '2mm';
  const marginBottom = config.marginBottom !== undefined ? `${config.marginBottom}mm` : '2mm';
  const marginSide = config.marginSide !== undefined ? `${config.marginSide}mm` : '2mm';

  const { originalTotal, roundedTotal, roundOff, calculatedSavings, totalItemCount } =
    getReceiptCalculations(sale, config);
  const theme = getReceiptTheme(config.billFormat);

  const receiptCss = buildReceiptCss({
    config,
    theme,
    printableWidth,
    paperSize,
    marginTop,
    marginBottom,
    marginSide,
  });

  return (
    <div ref={ref} id="receipt-container" className="receipt-container">
      <div id="receipt-content" className="receipt-content">
        {/* Header */}
        {config.billFormat !== 'Minimalist' && (
          <div className="receipt-header-block">
            {config.shopName && (
              <div className="receipt-shop-name">{config.customShopName}</div>
            )}
            {(config.header || config.customHeader) && (
              <div className="receipt-header-lines">
                <div className="receipt-header-line">{config.customHeader}</div>
                {config.customHeader2 && (
                  <div className="receipt-header-line">{config.customHeader2}</div>
                )}
                {config.customHeader3 && (
                  <div className="receipt-header-line">{config.customHeader3}</div>
                )}
                {shopMetadata?.shopMobile && (
                  <div className="receipt-tel-line">Tel: {shopMetadata.shopMobile}</div>
                )}
                {shopMetadata?.shopMobile2 && (
                  <div className="receipt-tel-line">Tel 2: {shopMetadata.shopMobile2}</div>
                )}
              </div>
            )}

            <div style={{ borderBottom: theme.divider, margin: '4px 0' }} />
            <div className="receipt-invoice-label">{config.invoiceLabel || 'Tax Invoice'}</div>
            <div style={{ borderBottom: theme.divider, marginTop: '4px', marginBottom: '6.4px' }} />
          </div>
        )}

        {/* Sale Info */}
        <div className="receipt-sale-info-block">
          <div className="receipt-bill-info-row">
            <div className="receipt-bill-no">Bill No: ORD-{sale.id}</div>
            <div className="receipt-sale-info-line">
              {new Date(sale.createdAt).toLocaleDateString()}
            </div>
          </div>
          <div className="receipt-sale-info-line">
            Time: {new Date(sale.createdAt).toLocaleTimeString()}
          </div>

          {/* Customer Details - Only if enabled and available */}
          {customerFeatureEnabled && config.customerDetails && sale.customer && (
            <div className="receipt-customer-block">
              <div className="receipt-sale-info-line">
                Bill To: {sale.customer.name || 'Customer'} ({sale.customer.phone})
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            borderBottom: config.billFormat === 'Minimalist' ? theme.divider : '1px solid black',
            marginBottom: '4px',
          }}
        />

        {/* Items Table */}
        <table
          style={{
            width: '100%',
            fontSize: `${config.itemFontSize || 0.8}rem`,
            borderCollapse: 'collapse',
            color: '#000',
          }}
        >
          <thead>
            <tr style={{ borderBottom: theme.divider }}>
              {config.productName && (
                <th style={{ textAlign: 'left', padding: '2px 0', fontWeight: theme.headerWeight }}>
                  Item
                </th>
              )}
              <th style={{ textAlign: 'center', padding: '2px 0', fontWeight: theme.headerWeight }}>
                Qty
              </th>
              {config.price && (
                <th
                  style={{ textAlign: 'right', padding: '2px 0', fontWeight: theme.headerWeight }}
                >
                  Price
                </th>
              )}
              <th style={{ textAlign: 'right', padding: '2px 0', fontWeight: theme.headerWeight }}>
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {sale.items ? (
              sale.items.map((item: ReceiptSaleItem, idx: number) => {
                const mrp = item.mrp || item.sellingPrice;
                return (
                  <tr key={idx} style={{ borderBottom: theme.itemDivider }}>
                    {config.productName && (
                      <td style={{ padding: '6px 0', verticalAlign: 'top', maxWidth: '120px' }}>
                        <div
                          style={{
                            fontWeight: theme.boldWeight,
                            fontSize: '1em',
                            lineHeight: 1.2,
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            whiteSpace: 'normal',
                          }}
                        >
                          {item.productName || item.batch?.product?.name}
                          {item.isWholesale && (
                            <span style={{ fontSize: '0.8em', marginLeft: '4px', color: '#000' }}>
                              (WS)
                            </span>
                          )}
                          {item.isOnSale && (
                            <span style={{ fontSize: '0.8em', marginLeft: '4px', color: '#000' }}>
                              (Sale)
                            </span>
                          )}
                          {item.isFree && (
                            <span style={{ fontSize: '0.8em', marginLeft: '4px', color: '#000' }}>
                              (Free)
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            gap: '8px',
                            fontSize: '0.85em',
                            marginTop: '3px',
                            fontWeight: theme.textWeight,
                          }}
                        >
                          {config.barcode && <span>BC: {item.batch?.product?.barcode}</span>}
                          {config.exp && item.batch?.expiryDate && (
                            <span>EXP: {new Date(item.batch.expiryDate).toLocaleDateString()}</span>
                          )}
                        </div>
                        {config.mrp && (
                          <div
                            style={{
                              fontSize: '0.85em',
                              fontWeight: theme.boldWeight,
                              marginTop: '2px',
                            }}
                          >
                            MRP: ₹{mrp.toFixed(2)}
                          </div>
                        )}
                      </td>
                    )}
                    <td
                      style={{
                        padding: '6px 0',
                        textAlign: 'center',
                        verticalAlign: 'top',
                        fontWeight: theme.boldWeight + 100,
                      }}
                    >
                      {item.quantity}
                    </td>
                    {config.price && (
                      <td
                        style={{
                          padding: '6px 0',
                          textAlign: 'right',
                          verticalAlign: 'top',
                          fontWeight: theme.textWeight,
                        }}
                      >
                        {item.sellingPrice.toFixed(2)}
                      </td>
                    )}
                    <td
                      style={{
                        padding: '6px 0',
                        textAlign: 'right',
                        verticalAlign: 'top',
                        fontWeight: theme.boldWeight + 100,
                      }}
                    >
                      {(item.quantity * item.sellingPrice).toFixed(2)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} style={{ padding: '10px 0', fontWeight: 600 }}>
                  {sale.itemName || 'Loose Item Sale'}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div style={{ borderBottom: theme.divider, margin: '4px 0' }} />

        {/* Totals */}
        <div className="receipt-totals-block">
          {config.totalItems !== false && (
            <>
              <div className="receipt-totals-row receipt-totals-row--start">
                <div className="receipt-items-summary">
                  Items: {sale.items?.length || 0}, Quantity: {totalItemCount}
                </div>
              </div>
              <div style={{ borderBottom: theme.divider, margin: '4px 0' }} />
            </>
          )}
          <div className="receipt-totals-row">
            <div className="receipt-subtotal-text">Subtotal:</div>
            <div className="receipt-subtotal-text">
              ₹{(originalTotal + (sale.discount || 0) + (sale.extraDiscount || 0)).toFixed(2)}
            </div>
          </div>
          {config.discount && ((sale.discount || 0) > 0 || (sale.extraDiscount || 0) > 0) && (
            <div className="receipt-totals-row">
              <div className="receipt-discount-text">TOTAL DISCOUNT:</div>
              <div className="receipt-discount-text">
                -₹{((sale.discount || 0) + (sale.extraDiscount || 0)).toFixed(2)}
              </div>
            </div>
          )}

          {config.roundOff && roundOff !== 0 && (
            <div className="receipt-totals-row">
              <div className="receipt-roundoff-label">Round Off:</div>
              <div className="receipt-roundoff-value">
                {roundOff > 0 ? '+' : ''}₹{roundOff.toFixed(2)}
              </div>
            </div>
          )}

          <div style={{ borderBottom: '1.5px solid black', margin: '4px 0' }} />
          {config.totalValue && (
            <div className="receipt-grand-total-row">
              <div className="receipt-grand-total-label">GRAND TOTAL:</div>
              <div className="receipt-grand-total-value">₹{roundedTotal.toFixed(2)}</div>
            </div>
          )}
          {config.totalSavings && calculatedSavings > 0 && (
            <div className="receipt-savings-box">
              <div className="receipt-savings-text">
                TOTAL SAVINGS: ₹{(calculatedSavings - (config.roundOff ? roundOff : 0)).toFixed(2)}
              </div>
            </div>
          )}
        </div>

        <div style={{ borderBottom: theme.divider, margin: '6.4px 0' }} />

        {/* Footer */}
        <div className="receipt-footer-block">
          {config.footer && (
            <>
              <div className="receipt-footer-line">{config.customFooter}</div>
              {config.customFooter2 && (
                <div className="receipt-footer-line--secondary">{config.customFooter2}</div>
              )}
            </>
          )}
          {config.showBranding && <div className="receipt-branding">Software by Resoft</div>}
        </div>

        <style>{`
                ${receiptCss}

                /* Global print helper — page mechanics only, no on-screen meaning. */
                @media print {
                  .no-print {
                    display: none !important;
                  }

                  html, body {
                    margin: 0 !important;
                    padding: 0 !important;
                    width: ${paperSize} !important;
                    background: white !important;
                  }

                  #receipt-container {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: ${printableWidth} !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    display: block !important;
                  }

                  /* Ensure background colors/images print */
                  * {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                }
            `}</style>
      </div>
    </div>
  );
});

export default Receipt;
