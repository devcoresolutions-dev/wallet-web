import { apiRequest } from './apiClient';
import type { Transaction } from '../types/transaction';

export interface TransactionsResponse {
  transactions: Transaction[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Obtiene el token guardado en localStorage
 */
function getToken(): string | undefined {
  return localStorage.getItem('token') || undefined;
}

/**
 * Obtiene el historial de transacciones del usuario
 * GET /api/transactions
 */
export async function getTransactions(): Promise<Transaction[]> {
  const token = getToken();

  const res = await apiRequest<TransactionsResponse | Transaction[]>('/api/transactions', {
    method: 'GET',
    token,
  });

  if (Array.isArray(res)) {
    return res;
  }
  return res.transactions || [];
}
