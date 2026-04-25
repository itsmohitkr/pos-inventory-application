import React from 'react';
import { Box, Typography } from '@mui/material';
import Barcode from 'react-barcode';

const formatCurrency = (value) => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return '-';
  }
  return Number(value).toFixed(2);
};

const PriceListLabelCard = ({ label, options = {}, layout, displayOptions }) => {
  const resolvedTextAlign = layout.textAlign || 'left';

  return (
    <Box
      key={label.id}
      className="price-label-item"
      sx={{
        width: options.width || `${Math.max(20, Number(layout.labelWidth) || 20)}mm`,
        minHeight: options.minHeight || `${Math.max(15, Number(layout.labelHeight) || 15)}mm`,
        border: 'none',
        borderRadius: '2px',
        boxSizing: 'border-box',
        bgcolor: '#fff',
        p: options.padding ?? 1,
        overflow: 'hidden',
        textAlign: resolvedTextAlign,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: options.justifyContent || 'flex-start',
        '@media print': {
          border: 'none',
        },
      }}
    >
      {displayOptions.barcode && label.barcodeValue ? (
        <Box
          className="barcode-block"
          sx={{ display: 'flex', justifyContent: 'center', px: 0.5, mb: 0.5 }}
        >
          <Barcode
            value={label.barcodeValue}
            format={layout.barcodeFormat || 'CODE128'}
            width={Math.max(0.1, Number(layout.barcodeLineWidth) || 0.7)}
            height={Math.max(20, Number(layout.barcodeHeight) || 20)}
            margin={0}
            fontSize={11}
            textMargin={3}
            displayValue
          />
        </Box>
      ) : displayOptions.barcode ? (
        <Typography variant="caption" color="error.main">
          No barcode
        </Typography>
      ) : null}

      <Box
        sx={{
          mt: 0.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.2,
          textAlign: resolvedTextAlign,
        }}
      >
        {displayOptions.productName && (
          <Typography
            className="label-line label-name"
            sx={{ fontSize: '0.68rem', fontWeight: 700, textAlign: resolvedTextAlign }}
          >
            {label.product.name}
          </Typography>
        )}
        {displayOptions.mrp && (
          <Typography
            className="label-line"
            sx={{ fontSize: '0.64rem', textAlign: resolvedTextAlign }}
          >
            MRP: Rs {formatCurrency(label.batch?.mrp)}
          </Typography>
        )}
        {displayOptions.salePrice && (
          <Typography
            className="label-line"
            sx={{ fontSize: '0.64rem', textAlign: resolvedTextAlign }}
          >
            Sale: Rs {formatCurrency(label.batch?.sellingPrice)}
          </Typography>
        )}
        {displayOptions.batchNumber && (
          <Typography
            className="label-line"
            sx={{ fontSize: '0.64rem', textAlign: resolvedTextAlign }}
          >
            Batch: {label.batch?.batchCode || '-'}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default PriceListLabelCard;
