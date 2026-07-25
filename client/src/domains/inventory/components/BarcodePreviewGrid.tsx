import React from 'react';
import { Box, Typography } from '@mui/material';
import Barcode from 'react-barcode';
import { DEFAULT_SIZES } from '@/domains/inventory/components/barcodeSizePresets';

const BarcodePreviewGrid = ({
  product, quantity, paperSize, customDimensions, spacing, contentOptions, textAlign, shopName,
}) => {
  if (!product || !product.barcode) return null;

  const barcodes = product.barcode.split('|').map((b) => b.trim()).filter(Boolean);
  const primaryBarcode = barcodes[0] || product.id.toString();
  const activeDims = paperSize === 'custom' ? customDimensions : DEFAULT_SIZES[paperSize];
  const activeCols = activeDims.cols || 1;

  return (
    <Box
      className="barcode-container"
      sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(${activeCols}, 1fr)`,
        gap: `${spacing.horizontal}mm`,
        rowGap: `${spacing.vertical}mm`,
        justifyContent: activeCols === 1 ? 'center' : 'start',
      }}
    >
      {Array.from({ length: quantity }).map((_, index) => (
        <Box
          key={index}
          className="barcode-item"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems:
              textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center',
            border: '1px dashed #94a3b8',
            borderRadius: 1,
            padding: `${spacing.vertical}mm ${spacing.horizontal}mm`,
            bgcolor: '#ffffff',
            width: activeCols === 1 ? 'auto' : '100%',
            boxSizing: 'border-box',
            '@media print': { border: '1px solid #000000 !important' },
          }}
        >
          <Barcode
            value={primaryBarcode}
            width={activeDims.width}
            height={activeDims.height}
            fontSize={12}
            margin={0}
          />
          <Box className="barcode-info" sx={{ textAlign, width: '100%', mt: 0.5 }}>
            {contentOptions.productName && (
              <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                {product.name.length > 30 ? product.name.substring(0, 30) + '...' : product.name}
              </Typography>
            )}
            {contentOptions.mrp && product.batches && product.batches.length > 0 && (
              <Typography variant="caption" sx={{ display: 'block' }}>
                MRP: ₹{Math.max(...product.batches.map((b) => b.mrp))}
              </Typography>
            )}
            {contentOptions.sellingPrice && product.batches && product.batches.length > 0 && (
              <Typography variant="caption" sx={{ display: 'block' }}>
                Price: ₹{Math.max(...product.batches.map((b) => b.sellingPrice))}
              </Typography>
            )}
            {contentOptions.discount && product.batches && product.batches.length > 0 && (
              <Typography variant="caption" sx={{ display: 'block', color: 'green' }}>
                Save: ₹{Math.max(...product.batches.map((b) => b.mrp - b.sellingPrice))}
              </Typography>
            )}
            {contentOptions.shopName && (
              <Typography variant="caption" sx={{ display: 'block', fontStyle: 'italic' }}>
                {shopName}
              </Typography>
            )}
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export default BarcodePreviewGrid;
