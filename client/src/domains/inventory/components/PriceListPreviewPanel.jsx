import React from 'react';
import {
  Alert,
  Box,
  Chip,
  Divider,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  AspectRatio as AspectRatioIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
} from '@mui/icons-material';

const PriceListPreviewPanel = ({
  selectedRows,
  totalLabelCount,
  activePreviewScale,
  handleZoomOut,
  handleZoomIn,
  autoFit,
  handleFitToWidth,
  paperType,
  missingBarcodeCount,
  printError,
  barcodeWarnings,
  previewContainerRef,
  previewRef,
  isThermalPreview,
  labelWidthMm,
  previewPageWidthMm,
  labelHeightMm,
  marginTopMm,
  marginRightMm,
  marginBottomMm,
  marginLeftMm,
  previewLabels,
  renderPreviewLabelCard,
  layout,
}) => {
  return (
    <Box
      className="printable-labels-area"
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        minWidth: 0,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 2,
          border: '1px solid #e5e7eb',
          borderRadius: 2,
          flex: 1,
          height: { xs: 'auto', sm: '100%' },
          display: 'flex',
          flexDirection: 'column',
          minHeight: { xs: 460, sm: 0 },
          '@media print': {
            border: 'none',
            boxShadow: 'none',
            p: 0,
            bgcolor: '#fff',
          },
        }}
      >
        <Box
          className="no-print"
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1,
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Live Preview
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip size="small" variant="outlined" label={`${selectedRows.length} items`} />
            <Chip size="small" color="primary" label={`${totalLabelCount} labels`} />

            <Box
              sx={{
                ml: 1,
                display: 'flex',
                alignItems: 'center',
                bgcolor: 'rgba(0,0,0,0.04)',
                borderRadius: 2,
                px: 0.5,
                py: 0.25,
              }}
            >
              <Tooltip title="Zoom Out">
                <span>
                  <IconButton size="small" onClick={handleZoomOut} disabled={paperType !== 'a4'}>
                    <ZoomOutIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Typography
                variant="caption"
                sx={{ minWidth: 45, textAlign: 'center', fontWeight: 600 }}
              >
                {Math.round(activePreviewScale * 100)}%
              </Typography>
              <Tooltip title="Zoom In">
                <span>
                  <IconButton size="small" onClick={handleZoomIn} disabled={paperType !== 'a4'}>
                    <ZoomInIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.5 }} />
              <Tooltip title="Auto-Fit to Width">
                <span>
                  <IconButton
                    size="small"
                    color={autoFit ? 'primary' : 'default'}
                    onClick={handleFitToWidth}
                    disabled={paperType !== 'a4'}
                  >
                    <AspectRatioIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Stack>
        </Box>
        <Divider className="no-print" sx={{ mb: 1.5 }} />

        {missingBarcodeCount > 0 && (
          <Alert severity="warning" className="no-print" sx={{ mb: 1.2 }}>
            {missingBarcodeCount} selected product(s) do not have barcode values.
          </Alert>
        )}
        {printError && (
          <Alert severity="error" className="no-print" sx={{ mb: 1.2 }}>
            {printError}
          </Alert>
        )}
        {barcodeWarnings.length > 0 && (
          <Alert severity="warning" className="no-print" sx={{ mb: 1.2 }}>
            {barcodeWarnings.length} selected barcode(s) may be difficult to scan with the current
            width settings. Example: {barcodeWarnings[0].productName}. {barcodeWarnings[0].message}
          </Alert>
        )}

        <Box
          ref={previewContainerRef}
          sx={{
            flex: 1,
            overflow: 'auto',
            boxSizing: 'border-box',
            borderRadius: 1.5,
            bgcolor: '#f1f5f9',
            p: paperType === 'a4' ? 4 : 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            scrollbarGutter: 'stable',
            '@media print': {
              overflow: 'visible',
              p: 0,
              bgcolor: '#fff',
            },
          }}
        >
          <Box
            ref={previewRef}
            sx={{
              width: isThermalPreview ? `${labelWidthMm}mm` : `${previewPageWidthMm}mm`,
              transform: paperType === 'a4' ? `scale(${activePreviewScale})` : 'none',
              transformOrigin: 'top center',
              bgcolor: '#fff',
              border: isThermalPreview ? 'none' : '1px dashed #94a3b8',
              boxShadow: 'none',
              borderRadius: '4px',
              mb: 12,
              flexShrink: 0,
              '@media print': {
                transform: 'none !important',
                border: 'none',
                boxShadow: 'none',
                mb: 0,
                width: '100%',
              },
            }}
          >
            {isThermalPreview ? (
              <Stack spacing={1.2} sx={{ width: `${labelWidthMm}mm` }}>
                {previewLabels.length === 0 ? (
                  <Box sx={{ p: 4, textAlign: 'center', width: '100%' }}>
                    <Typography variant="body1" color="text.secondary">
                      Your preview will appear here once you select products.
                    </Typography>
                  </Box>
                ) : (
                  previewLabels.map((label) => (
                    <Box
                      key={label.id}
                      sx={{
                        width: `${labelWidthMm}mm`,
                        height: `${labelHeightMm}mm`,
                        border: '1px dashed #94a3b8',
                        borderRadius: 1,
                        bgcolor: '#fff',
                        p: `${marginTopMm}mm ${marginRightMm}mm ${marginBottomMm}mm ${marginLeftMm}mm`,
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                      }}
                    >
                      {renderPreviewLabelCard(label, {
                        width: '100%',
                        minHeight: '100%',
                        padding: '0.8mm 1.4mm',
                        justifyContent: 'center',
                      })}
                    </Box>
                  ))
                )}
              </Stack>
            ) : (
              <Box
                className="price-list-grid"
                sx={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${Math.max(1, Number(layout.columns) || 1)}, ${labelWidthMm}mm)`,
                  columnGap: `${Math.max(0, Number(layout.gapHorizontal) || 0)}mm`,
                  rowGap: `${Math.max(0, Number(layout.gapVertical) || 0)}mm`,
                  p: `${marginTopMm}mm ${marginRightMm}mm ${marginBottomMm}mm ${marginLeftMm}mm`,
                  justifyContent: 'center',
                  position: 'relative',
                  '@media print': {
                    width: '100%',
                  },
                }}
              >
                {previewLabels.map((label) => renderPreviewLabelCard(label))}

                {previewLabels.length === 0 && (
                  <Box sx={{ p: 4, textAlign: 'center', width: '100%', gridColumn: '1 / -1' }}>
                    <Typography variant="body1" color="text.secondary">
                      Your preview will appear here once you select products.
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default PriceListPreviewPanel;
