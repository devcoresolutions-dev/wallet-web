import { CurrencyCode } from './currency';

export type TransactionType = 'BUY' | 'SELL' | 'EXCHANGE';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED';
export type EntryDirection = 'DEBIT' | 'CREDIT';
export type EntryType = 'PRINCIPAL' | 'FEE';

export interface TransactionEntry {
  id: string;
  transactionId: string;
  balanceId: string;
  direction: EntryDirection;
  entryType: EntryType;
  amount: string;
  balanceAfter: string;
}

export interface Transaction {
  id: string;
  walletId: string;
  type: TransactionType;
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  fromAmount: string;
  toAmount: string;
  exchangeRate: string;
  feeAmount: string;
  feeCurrency: CurrencyCode;
  feeRate: string;
  rateSource: string;
  rateFetchedAt: string;
  status: TransactionStatus;
  createdAt: string;
  entries?: TransactionEntry[];
}
