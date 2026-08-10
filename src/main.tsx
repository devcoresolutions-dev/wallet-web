import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from "./contexts/AuthContext";
import { PreferencesProvider } from './contexts/PreferencesContext.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
        <PreferencesProvider>
    <AuthProvider>
     <App />
    </AuthProvider>
    </PreferencesProvider>
    </ThemeProvider>
  </StrictMode>,
)
