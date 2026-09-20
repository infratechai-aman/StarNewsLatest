'use client';

import ShortsPage from '@/components/ShortsPage';
import { LanguageProvider } from '@/contexts/LanguageContext';

export default function Page() {
  return (
    <LanguageProvider>
      <ShortsPage />
    </LanguageProvider>
  );
}
