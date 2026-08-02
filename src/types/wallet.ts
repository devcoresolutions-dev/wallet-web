import { CurrencyCode } from './currency';

export interface Balance {
  id: string;
  walletId: string;
  currencyCode: CurrencyCode;
  amount: string; // Representado en string para evitar problemas de coma flotante
}

export interface Wallet {
  id: string;
  userId: string;
  createdAt: string;
  balances: Balance[];
}
