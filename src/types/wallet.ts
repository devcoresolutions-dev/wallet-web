import type { CurrencyCode } from './currency';

export interface Balance {
  
  currencyCode: CurrencyCode;
  currencyName: string;
  symbol: string;
  decimals: number;
  amount: string; // string para evitar problemas de coma flotante
}

export interface Wallet {
  walletId: string;
  balances: Balance[];
}
