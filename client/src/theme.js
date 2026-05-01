import { createTheme, responsiveFontSizes } from '@mui/material/styles';

let theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0b1d39',
      contrastText: '#f8f5f0',
    },
    secondary: {
      main: '#f2b544',
    },
    success: {
      main: '#1f8a5b',
    },
    warning: {
      main: '#d97706',
    },
    error: {
      main: '#dc2626',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#101828',
      secondary: '#475467',
    },
    divider: '#e2e8f0',
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: {
      fontWeight: 700,
      letterSpacing: -0.5,
      fontSize: '2rem',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: -0.3,
      fontSize: '1.75rem',
    },
    h3: {
      fontWeight: 700,
      letterSpacing: -0.2,
      fontSize: '1.5rem',
    },
    h4: {
      fontWeight: 700,
      letterSpacing: -0.1,
      fontSize: '1.3rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.125rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
    },
    body1: {
      fontSize: '0.95rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.85rem',
      lineHeight: 1.45,
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: 0,
      fontSize: '0.85rem',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#f6f3ee',
          color: '#101828',
        },
        '::selection': {
          backgroundColor: '#f2b544',
          color: '#0b1d39',
        },
        '*': {
          boxShadow: 'none !important',
        },
      },
    },
    MuiAppBar: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #0b1d39 0%, #1b3e6f 100%)',
          color: '#f8f5f0',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          border: '1px solid #e2e8f0',
          boxShadow: 'none',
          borderRadius: 10,
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          boxShadow: 'none',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
        },
      },
    },
    MuiDialog: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        paper: {
          borderRadius: 12,
          border: '1px solid #e2e8f0',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
          minHeight: 38,
          paddingLeft: 18,
          paddingRight: 18,
          fontWeight: 600,
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #0b1d39 0%, #1b3e6f 100%)',
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #f2b544 0%, #e69f2a 100%)',
          color: '#0b1d39',
        },
        outlined: {
          borderColor: '#e2e8f0',
          '&:hover': {
            borderColor: '#b9ab95',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: '#ffffff',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#e2e8f0',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#b9ab95',
          },
        },
        input: {
          paddingTop: 10,
          paddingBottom: 10,
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          borderRadius: 8,
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: 0,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#f8fafc',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          color: '#344054',
          borderBottom: '1px solid #e2e8f0',
          fontSize: '0.8rem',
          paddingTop: 10,
          paddingBottom: 10,
        },
        body: {
          fontSize: '0.85rem',
          paddingTop: 10,
          paddingBottom: 10,
          borderBottom: '1px solid #e2e8f0',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 6,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: '#e7dece',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 40,
          fontSize: '0.85rem',
          fontWeight: 600,
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          paddingTop: 7,
          paddingBottom: 7,
          fontSize: '0.82rem',
          textTransform: 'none',
        },
      },
    },
  },
});

theme = responsiveFontSizes(theme);

export default theme;
