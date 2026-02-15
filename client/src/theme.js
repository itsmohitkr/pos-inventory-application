import { createTheme, responsiveFontSizes } from '@mui/material/styles';

let theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0b1d39',
      contrastText: '#f8f5f0'
    },
    secondary: {
      main: '#f2b544'
    },
    success: {
      main: '#1f8a5b'
    },
    warning: {
      main: '#d97706'
    },
    error: {
      main: '#dc2626'
    },
    background: {
      default: '#f6f3ee',
      paper: '#ffffff'
    },
    text: {
      primary: '#101828',
      secondary: '#475467'
    }
  },
  shape: {
    borderRadius: 8
  },
  typography: {
    fontFamily: '"Inter", "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: {
      fontWeight: 700,
      letterSpacing: -0.5
    },
    h2: {
      fontWeight: 700,
      letterSpacing: -0.3
    },
    h3: {
      fontWeight: 700,
      letterSpacing: -0.2
    },
    h4: {
      fontWeight: 700,
      letterSpacing: -0.1
    },
    h5: {
      fontWeight: 600
    },
    h6: {
      fontWeight: 600
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: 0
    }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#f6f3ee'
        },
        '::selection': {
          backgroundColor: '#f2b544',
          color: '#0b1d39'
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #0b1d39 0%, #1b3e6f 100%)',
          color: '#f8f5f0',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          border: '1px solid #eee4d8'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          paddingLeft: 18,
          paddingRight: 18
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #0b1d39 0%, #1b3e6f 100%)'
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #f2b544 0%, #e69f2a 100%)',
          color: '#0b1d39'
        }
      }
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#f3eee6'
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600
        }
      }
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined'
      }
    }
  }
});

theme = responsiveFontSizes(theme);

export default theme;
