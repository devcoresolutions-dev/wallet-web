import { apiRequest } from './apiClient';
import type { Wallet, BalanceResponse } from '../types/wallet';
import type { User } from '../types/user';

/**
 * Obtiene el token guardado en localStorage
 */
function getToken(): string | undefined {
  return localStorage.getItem('token') || undefined;
}

/**
 * Obtiene los saldos de la billetera del usuario
 * GET /api/wallet/balances -> devuelve { walletId: string, balances: [...] }
 */
export async function getWalletBalances(): Promise<BalanceResponse> {
  const token = getToken();

  return apiRequest<BalanceResponse>('/api/wallet/balances', {
    method: 'GET',
    token,
  });
}

/**
 * Mantiene compatibilidad convirtiendo la respuesta de getWalletBalances al tipo Wallet
 */
export async function getWallets(): Promise<Wallet[]> {
  try {
    const res = await getWalletBalances();
    return [
      {
        id: res.walletId,
        userId: '',
        createdAt: new Date().toISOString(),
        balances: res.balances.map((b) => ({
          id: `${res.walletId}-${b.currencyCode}`,
          walletId: res.walletId,
          currencyCode: b.currencyCode,
          amount: b.amount,
          currencyName: b.currencyName,
          symbol: b.symbol,
          decimals: b.decimals,
        })),
      },
    ];
  } catch (err) {
    console.error('[walletService] Error obteniendo balances:', err);
    throw err;
  }
}

/**
 * Obtiene el perfil del usuario actual
 * GET /api/auth/me -> { user: { id, email, fullName } }
 */
export async function getCurrentUser(): Promise<User> {
  const token = getToken();

  const res = await apiRequest<{ user: { id: string; email: string; fullName: string } }>('/api/auth/me', {
    method: 'GET',
    token,
  });

  return {
    id: res.user.id,
    email: res.user.email,
    fullName: res.user.fullName,
    defaultLocalCurrency: 'ARS',
    createdAt: new Date().toISOString(),
  };
}
