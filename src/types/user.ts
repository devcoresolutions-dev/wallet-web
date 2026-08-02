import { CurrencyCode } from './currency';

export interface User {
  id: string;
  email: string;
  fullName: string;
  defaultLocalCurrency: CurrencyCode;
  createdAt: string;
}
