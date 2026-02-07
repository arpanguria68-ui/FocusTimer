import React, { useEffect } from 'react';
import { GlassTimer } from '@/components/GlassTimer';

import { quickStorageTest } from '@/utils/storageTest';

export function ChromeExtensionMain() {
  useEffect(() => {
    const checkBackend = async () => {
      try {
        await Promise.all([
          quickStorageTest()
        ]);
      } catch (error) {
        // Silent failure in UI, design doesn't show connection status
        console.error('Backend check failed', error);
      }
    };
    checkBackend();
  }, []);

  // Chrome extension popup requires fixed dimensions
  return (
    <div className="w-[400px] h-[600px] overflow-hidden relative text-slate-100 font-sans">
      <GlassTimer />
    </div>
  );
}