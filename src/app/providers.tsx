'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

import { StoreProvider } from '@/lib/store';
import { Toaster } from 'sonner';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <StoreProvider>
        {children}
        <Toaster position="bottom-right" />
      </StoreProvider>
    </SessionProvider>
  );
}
