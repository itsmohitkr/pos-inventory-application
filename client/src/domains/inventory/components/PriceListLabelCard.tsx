import Barcode from 'react-barcode';
import type {
  PriceListDisplayOptions,
  PriceListLayout,
} from '@/domains/inventory/components/paperSizePresets';
import { LABEL_METRICS } from '@/domains/inventory/components/priceListLabelStyles';
import type { PriceListLabel } from '@/domains/inventory/components/usePriceList';

const formatCurrency = (value: unknown): string => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return '-';
  }
  return Number(value).toFixed(2);
};

interface PriceListLabelCardProps {
  label: PriceListLabel;
  layout: PriceListLayout;
  displayOptions: PriceListDisplayOptions;
}

/**
 * Structure only — every visual rule comes from the stylesheet built by
 * priceListLabelStyles, which the print document includes verbatim. Styling
 * this through `sx` would look right on screen and disappear on paper, since
 * emotion's classes never reach the print window.
 */
const PriceListLabelCard = ({ label, layout, displayOptions }: PriceListLabelCardProps) => (
  <div className="price-label-item">
    {displayOptions.barcode && label.barcodeValue ? (
      <div className="barcode-block">
        <Barcode
          value={label.barcodeValue}
          format={layout.barcodeFormat || 'CODE128'}
          width={Math.max(0.1, Number(layout.barcodeLineWidth) || 0.7)}
          height={Math.max(20, Number(layout.barcodeHeight) || 20)}
          margin={0}
          fontSize={LABEL_METRICS.barcodeTextFontPx}
          textMargin={LABEL_METRICS.barcodeTextMarginPx}
          displayValue
        />
      </div>
    ) : displayOptions.barcode ? (
      <span className="label-line">No barcode</span>
    ) : null}

    <div className="label-lines">
      {displayOptions.productName && <span className="label-name">{label.product.name}</span>}
      {displayOptions.mrp && (
        <span className="label-line">MRP: Rs {formatCurrency(label.batch?.mrp)}</span>
      )}
      {displayOptions.salePrice && (
        <span className="label-line">Sale: Rs {formatCurrency(label.batch?.sellingPrice)}</span>
      )}
      {displayOptions.batchNumber && (
        <span className="label-line">Batch: {label.batch?.batchCode || '-'}</span>
      )}
    </div>
  </div>
);

export default PriceListLabelCard;
