import { createRoot } from 'react-dom/client';
import PrimeReact from 'primereact/api';
import App from './App.tsx';
import './index.css';

// Configure PrimeReact global settings at application entry point
PrimeReact.ripple = true;
PrimeReact.autoZIndex = true;
PrimeReact.hideOverlaysOnDocumentScrolling = true;

createRoot(document.getElementById('root')!).render(
  <App />
);
