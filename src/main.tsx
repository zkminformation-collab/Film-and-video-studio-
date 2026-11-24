import {createRoot} from 'react-dom/client';
import 'animate.css';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  void navigator.serviceWorker.register('/studio-sw.js').catch(() => {});
}
