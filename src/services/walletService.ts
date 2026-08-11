import { apiRequest } from './apiClient';
import type { Wallet } from '../types/wallet';
import type { User } from '../types/user';

/**
 * Obtiene el token guardado en localStorage
 */
function getToken(): string | undefined {
  return localStorage.getItem('token') || undefined;
}

/**
 * Obtiene la wallet del usuario con sus balances en las 8 monedas.
 * GET /api/wallet/balances
 *
 * La wallet se deriva del token en el backend: no se envía ningún id.
 */
export async function getWallet(): Promise<Wallet> {
  const token = getToken();

  if (token === 'mock-token') {
    return {
      walletId: 'mock-wallet-123',
      balances: [
        { currencyCode: 'ARS', currencyName: 'Argentine Peso', symbol: '$', decimals: 2, amount: '850000.00' },
        { currencyCode: 'USD', currencyName: 'US Dollar', symbol: '$', decimals: 2, amount: '1250.00' },
        { currencyCode: 'EUR', currencyName: 'Euro', symbol: '€', decimals: 2, amount: '350.00' },
        { currencyCode: 'BRL', currencyName: 'Brazilian Real', symbol: 'R$', decimals: 2, amount: '500.00' },
        { currencyCode: 'CLP', currencyName: 'Chilean Peso', symbol: '$', decimals: 0, amount: '0.00' },
        { currencyCode: 'COP', currencyName: 'Colombian Peso', symbol: '$', decimals: 2, amount: '0.00' },
        { currencyCode: 'MXN', currencyName: 'Mexican Peso', symbol: '$', decimals: 2, amount: '0.00' },
        { currencyCode: 'PEN', currencyName: 'Peruvian Sol', symbol: 'S/', decimals: 2, amount: '0.00' },
      ],
    };
  }

  return apiRequest<Wallet>('/api/wallet/balances', {
    method: 'GET',
    token,
  });
}

/**
 * Obtiene el perfil del usuario actual
 * GET /api/auth/me
 */
export async function getCurrentUser(): Promise<User> {
  const token = getToken();

  if (token === 'mock-token') {
    return {
      id: 'mock-user-123',
      email: 'test@ewallet.com',
      fullName: 'Tester de eWallet',
      defaultLocalCurrency: 'ARS',
      createdAt: new Date().toISOString(),
    };
  }

  const response = await apiRequest<{ user: User }>('/api/auth/me', {
    method: 'GET',
    token,
  });

  return response.user;
}
