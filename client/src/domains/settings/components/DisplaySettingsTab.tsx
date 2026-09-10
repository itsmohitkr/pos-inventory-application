import {
  Box,
  Button,
  Divider,
  Paper,
  Typography,
} from '@mui/material';
import { DisplaySettings as DisplayIcon } from '@mui/icons-material';

interface DisplaySettingsTabProps {
  /** Renderer zoom factor, 1 = 100%. */
  uiZoom: number;
  setUiZoom: (zoom: number) => void;
}

const DisplaySettingsTab = ({
  uiZoom,
  setUiZoom,
}: DisplaySettingsTabProps) => {
  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3 },
          mb: 2.5,
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          bgcolor: '#ffffff',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Box
            sx={{
              p: 0.75,
              borderRadius: '8px',
              bgcolor: 'rgba(11, 29, 57, 0.08)',
              color: '#0b1d39',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <DisplayIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0b1d39', fontSize: '1.05rem', lineHeight: 1.2 }}>
              Display & Zoom Settings
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.78rem' }}>
              Configure UI scaling and font sizes
            </Typography>
          </Box>
        </Box>
        <Divider sx={{ my: 2, borderColor: '#f1f5f9' }} />

        {/* Application Zoom */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0b1d39' }}>
              Application Zoom
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#0b1d39', bgcolor: '#f1f5f9', px: 1.25, py: 0.5, borderRadius: '6px' }}>
              Current: {uiZoom}%
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, fontSize: '0.78rem' }}>
            Scale text, buttons, and dialogs across the entire application interface.
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(4, 1fr)', md: 'repeat(6, 1fr)' }, gap: 1.25 }}>
            {[100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150].map((level) => {
              const isSelected = uiZoom === level;
              return (
                <Button
                  key={level}
                  variant={isSelected ? 'contained' : 'outlined'}
                  onClick={() => setUiZoom(level)}
                  size="small"
                  sx={{
                    py: 1,
                    fontWeight: isSelected ? 700 : 600,
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontSize: '0.85rem',
                    ...(isSelected
                      ? {
                          bgcolor: '#0b1d39',
                          color: '#ffffff',
                          boxShadow: '0 2px 6px rgba(11, 29, 57, 0.2)',
                          '&:hover': { bgcolor: '#1a365d' },
                        }
                      : {
                          bgcolor: '#ffffff',
                          borderColor: '#e2e8f0',
                          color: '#475467',
                          '&:hover': {
                            borderColor: '#cbd5e1',
                            bgcolor: '#f8fafc',
                            color: '#0b1d39',
                          },
                        }),
                  }}
                >
                  {level}%
                </Button>
              );
            })}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default DisplaySettingsTab;
