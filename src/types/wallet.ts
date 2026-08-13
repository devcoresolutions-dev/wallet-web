import type { CurrencyCode } from './currency';

export interface RawBalance {
  currencyCode: CurrencyCode;
  currencyName: string;
  symbol: string;
  decimals: number;
  amount: string; // En string para conservar precisión decimal exacta
}

export interface BalanceResponse {
  walletId: string;
  balances: RawBalance[];
}

export interface Balance extends RawBalance {
  id: string;
  walletId: string;
}

export interface Wallet {
  id: string;
  userId: string;
  createdAt: string;
  balances: Balance[];
}
