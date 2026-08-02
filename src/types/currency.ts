export type CurrencyCode = 'USD' | 'EUR' | 'ARS' | 'BRL' | 'CLP' | 'COP' | 'MXN' | 'PEN';

export interface Currency {
  code: CurrencyCode;
  name: string;
  symbol: string;
  decimals: number;
  isActive: boolean;
}

export const DEFAULT_LOCAL_CURRENCY: CurrencyCode = 'ARS';

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, Currency> = {
  ARS: { code: 'ARS', name: 'Peso Argentino', symbol: '$', decimals: 2, isActive: true },
  USD: { code: 'USD', name: 'Dólar Estadounidense', symbol: '$', decimals: 2, isActive: true },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', decimals: 2, isActive: true },
  BRL: { code: 'BRL', name: 'Real Brasileño', symbol: 'R$', decimals: 2, isActive: true },
  CLP: { code: 'CLP', name: 'Peso Chileno', symbol: '$', decimals: 0, isActive: true },
  COP: { code: 'COP', name: 'Peso Colombiano', symbol: '$', decimals: 2, isActive: true },
  MXN: { code: 'MXN', name: 'Peso Mexicano', symbol: '$', decimals: 2, isActive: true },
  PEN: { code: 'PEN', name: 'Sol Peruano', symbol: 'S/', decimals: 2, isActive: true },
};
