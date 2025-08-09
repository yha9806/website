import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // Prevent the default error handling (which shows in console as "Uncaught (in promise)")
  event.preventDefault();
  
  // If it's from an extension or external script, ignore it
  const error = event.reason;
  if (error && error.stack && error.stack.includes('chrome-extension://')) {
    console.log('Ignoring error from browser extension');
    return;
  }
  
  // Log the error for debugging but don't crash the app
  if (import.meta.env.DEV) {
    console.warn('Development mode: Unhandled promise error logged but app continues');
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
