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
 * Obtiene la información de las billeteras y balances del usuario
 * GET /api/wallets
 */
export async function getWallets(): Promise<Wallet[]> {
  const token = getToken();
  if (token === 'mock-token') {
    return [
      {
        id: 'mock-wallet-123',
        userId: 'mock-user-123',
        createdAt: new Date().toISOString(),
        balances: [
          { id: 'b1', walletId: 'mock-wallet-123', currencyCode: 'ARS', amount: '850000.00' },
          { id: 'b2', walletId: 'mock-wallet-123', currencyCode: 'USD', amount: '1250.00' },
          { id: 'b3', walletId: 'mock-wallet-123', currencyCode: 'EUR', amount: '350.00' },
          { id: 'b4', walletId: 'mock-wallet-123', currencyCode: 'BRL', amount: '500.00' },
          { id: 'b5', walletId: 'mock-wallet-123', currencyCode: 'CLP', amount: '0.00' },
          { id: 'b6', walletId: 'mock-wallet-123', currencyCode: 'COP', amount: '0.00' },
          { id: 'b7', walletId: 'mock-wallet-123', currencyCode: 'MXN', amount: '0.00' },
          { id: 'b8', walletId: 'mock-wallet-123', currencyCode: 'PEN', amount: '0.00' }
        ]
      }
    ];
  }

  return apiRequest<Wallet[]>('/api/wallets', {
    method: 'GET',
    token,
  });
}

/**
 * Obtiene el perfil del usuario actual
 * GET /api/users/me
 */
export async function getCurrentUser(): Promise<User> {
  const token = getToken();
  if (token === 'mock-token') {
    return {
      id: 'mock-user-123',
      email: 'test@ewallet.com',
      fullName: 'Tester de eWallet',
      defaultLocalCurrency: 'ARS',
      createdAt: new Date().toISOString()
    };
  }

  return apiRequest<User>('/api/users/me', {
    method: 'GET',
    token,
  });
}
