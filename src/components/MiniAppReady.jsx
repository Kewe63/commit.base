import { useEffect } from 'react';
import { notifyMiniAppReady } from '../services/miniapp';

export default function MiniAppReady() {
  useEffect(() => {
    const timer = setTimeout(() => { void notifyMiniAppReady(); }, 0);
    return () => clearTimeout(timer);
  }, []);
  return null;
}
