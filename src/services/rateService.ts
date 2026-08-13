import { apiRequest } from './apiClient';
import type { CurrencyCode } from '../types/currency';

export interface RateResponse {
  base: CurrencyCode;
  target: CurrencyCode;
  rate: number;
  rateAgeMinutes: number;
  source: string;
}

/**
  Obtiene la cotización real desde el backend
  GET /api/rates/:base/:target
 */
export async function getRate(base: CurrencyCode, target: CurrencyCode): Promise<RateResponse> {
  if (base === target) {
    return {
      base,
      target,
      rate: 1.0,
      rateAgeMinutes: 0,
      source: 'DIRECT',
    };
  }

  const data = await apiRequest<RateResponse>(`/api/rates/${base}/${target}`, {
    method: 'GET',
  });

  return {
    ...data,
    rate: typeof data.rate === 'string' ? parseFloat(data.rate) : Number(data.rate) || 0,
    rateAgeMinutes: typeof data.rateAgeMinutes === 'string' ? parseInt(data.rateAgeMinutes, 10) : Number(data.rateAgeMinutes) || 0,
  };
}
