import React from 'react';
import { Box, Button } from '@mui/material';
import { Backspace as BackspaceIcon } from '@mui/icons-material';

interface NumpadGridProps {
  onDigit: (digit: number) => void;
  onClear: () => void;
  onBackspace: () => void;
}

const numpadRows = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
  ['Clear', 0, 'DEL'],
] as const;

/**
 * The 3-column digit/Clear/DEL grid shared verbatim by LooseSaleDialog,
 * QuantityDialog, and CustomerMobileDialog — previously three separately
 * hand-rolled copies of the same buttons/styling, which already required one
 * visual tweak to be applied in all three places by hand. Calculator.tsx and
 * NumpadDialog.tsx are structurally different (operators, decimal point, a
 * mode-toggle row) and intentionally keep their own grids rather than being
 * forced into this shape.
 */
const NumpadGrid = ({ onDigit, onClear, onBackspace }: NumpadGridProps) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5 }}>
    {numpadRows.flat().map((val, idx) => (
      <Button
        key={idx}
        variant="outlined"
        color={val === 'Clear' ? 'error' : 'inherit'}
        onClick={() => {
          if (typeof val === 'number') onDigit(val);
          else if (val === 'Clear') onClear();
          else onBackspace();
        }}
        sx={{
          height: 60,
          fontSize: val === 'Clear' ? '1.2rem' : '1.6rem',
          fontWeight: 'bold',
          borderColor: 'divider',
          color: val === 'Clear' ? 'error.main' : 'text.primary',
          '&:hover': { bgcolor: 'action.hover', filter: 'brightness(0.95)' },
        }}
      >
        {val === 'DEL' ? <BackspaceIcon /> : val}
      </Button>
    ))}
  </Box>
);

export default NumpadGrid;
