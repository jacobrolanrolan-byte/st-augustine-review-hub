import { createTheme } from '@mui/material/styles';

export const getMuiTheme = (mode: 'light' | 'dark') => {
  return createTheme({
    palette: {
      mode,
      primary: { main: '#1A73E8' },      // Google Blue
      secondary: { main: '#34A853' },    // Google Green
      warning: { main: '#FBBC05' },      // Google Yellow / Accent
      error: { main: '#EA4335' },        // Google Red
      background: {
        default: mode === 'light' ? '#F8F9FA' : '#121212',
        paper: mode === 'light' ? '#FFFFFF' : '#1E1E1E',
      },
    },
    shape: {
      borderRadius: 16,
    },
    typography: {
      fontFamily: 'Roboto, Arial, sans-serif',
      button: { textTransform: 'none' },
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 24,
            boxShadow: mode === 'light' 
              ? '0px 1px 3px rgba(0,0,0,0.12), 0px 1px 2px rgba(0,0,0,0.24)' 
              : 'none',
          },
        },
      },
    },
  });
};