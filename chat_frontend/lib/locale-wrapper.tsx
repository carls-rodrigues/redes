"use client"

import { NextIntlClientProvider } from 'next-intl';
import { useLocale } from '@/lib/locale-context';

// Import messages as TypeScript modules
import en from '../messages/en';
import ptBR from '../messages/pt-BR';

const allMessages = {
  'en': en,
  'pt-BR': ptBR,
};

export function LocaleWrapper({ children }: { children: React.ReactNode }) {
  const { locale } = useLocale();

  return (
    <NextIntlClientProvider 
      locale={locale} 
      messages={allMessages[locale]}
      timeZone="America/Sao_Paulo"
    >
      {children}
    </NextIntlClientProvider>
  );
}