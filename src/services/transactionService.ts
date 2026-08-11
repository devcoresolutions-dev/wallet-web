import { apiRequest } from './apiClient';
import type { Transaction } from '../types/transaction';

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
  if (token === 'mock-token') {
    return [
      {
        id: 'mock-txn-1',
        walletId: 'mock-wallet-123',
        type: 'BUY',
        fromCurrency: 'ARS',
        toCurrency: 'USD',
        fromAmount: '447750.00',
        toAmount: '500.00',
        exchangeRate: '895.5',
        feeAmount: '7.50',
        feeCurrency: 'USD',
        feeRate: '0.015',
        rateSource: 'MOCK',
        rateFetchedAt: new Date().toISOString(),
        status: 'COMPLETED',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // Hace 2 horas
      },
      {
        id: 'mock-txn-2',
        walletId: 'mock-wallet-123',
        type: 'EXCHANGE',
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        fromAmount: '150.00',
        toAmount: '138.45',
        exchangeRate: '0.923',
        feeAmount: '1.20',
        feeCurrency: 'EUR',
        feeRate: '0.008',
        rateSource: 'MOCK',
        rateFetchedAt: new Date().toISOString(),
        status: 'COMPLETED',
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // Hace 1 día
      },
      {
        id: 'mock-txn-3',
        walletId: 'mock-wallet-123',
        type: 'SELL',
        fromCurrency: 'EUR',
        toCurrency: 'ARS',
        fromAmount: '50.00',
        toAmount: '48500.00',
        exchangeRate: '970.0',
        feeAmount: '582.00',
        feeCurrency: 'ARS',
        feeRate: '0.012',
        rateSource: 'MOCK',
        rateFetchedAt: new Date().toISOString(),
        status: 'PENDING',
        createdAt: new Date(Date.now() - 3600000 * 48).toISOString(), // Hace 2 días
      }
    ];
  }
  
// El backend devuelve { transactions, pagination }. Se desenvuelve acá para
  // que quien llame siga recibiendo un array: la paginación no se usa todavía.
  const response = await apiRequest<{
    transactions: Transaction[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>('/api/transactions', {
    method: 'GET',
    token,
  });

  return response.transactions;
}
