import type { CurrencyCode } from '../types/currency';
import type { Transaction } from '../types/transaction';
import { apiRequest } from './apiClient';

export interface ExchangeRateInfo {
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  rate: number;
  inverseRate: number;
  feePercentage: number;
  trend24h: number;
  rateSource: string;
}

export interface SimulationResult {
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  fromAmount: number;
  grossToAmount: number;
  feeAmount: number;
  feeCurrency: CurrencyCode;
  netToAmount: number;
  rate: number;
  feePercentage: number;
  estimatedSavingsARS: number;
}

// Tasas de cambio base (1 USD = X ARS)
const BASE_USD_RATES: Record<CurrencyCode, number> = {
  USD: 1.0,
  ARS: 895.5,
  EUR: 0.923,
  BRL: 5.45,
  CLP: 940.0,
  COP: 3910.0,
  MXN: 18.25,
  PEN: 3.75,
};

// Tendencias diarias mock
const MARKET_TRENDS: Record<CurrencyCode, number> = {
  USD: 0.25,
  ARS: -0.45,
  EUR: 0.12,
  BRL: -0.18,
  CLP: 0.05,
  COP: 0.30,
  MXN: -0.10,
  PEN: 0.08,
};

/**
 * Obtiene la tasa de cambio entre dos monedas cualesquiera
 */
export function getExchangeRate(from: CurrencyCode, to: CurrencyCode): ExchangeRateInfo {
  if (from === to) {
    return {
      fromCurrency: from,
      toCurrency: to,
      rate: 1.0,
      inverseRate: 1.0,
      feePercentage: 0.0,
      trend24h: 0.0,
      rateSource: 'EWALLET_DIRECT',
    };
  }

  // Convertimos 'from' a USD y luego de USD a 'to'
  const fromInUSD = 1 / BASE_USD_RATES[from];
  const rate = fromInUSD * BASE_USD_RATES[to];
  const inverseRate = 1 / rate;

  // Tarifa diferenciada (operaciones con ARS tienen 0.5%, entre extranjeras 0.8%)
  const feePercentage = (from === 'ARS' || to === 'ARS') ? 0.005 : 0.008;
  const trend24h = MARKET_TRENDS[to] - MARKET_TRENDS[from];

  return {
    fromCurrency: from,
    toCurrency: to,
    rate,
    inverseRate,
    feePercentage,
    trend24h: parseFloat(trend24h.toFixed(2)),
    rateSource: 'BCRA_MARKET_FEED',
  };
}

/**
 * Realiza la simulación completa de la transacción
 */
export function simulateOperation(
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  fromAmount: number
): SimulationResult {
  const rateInfo = getExchangeRate(fromCurrency, toCurrency);
  const grossToAmount = fromAmount * rateInfo.rate;

  // Comisión calculada en la moneda de destino (o en la de origen)
  const feeAmount = grossToAmount * rateInfo.feePercentage;
  const netToAmount = grossToAmount - feeAmount;

  // Estimación de protección/ahorro proyectado a 30 días en ARS
  const fromInARS = fromAmount * (fromCurrency === 'ARS' ? 1 : BASE_USD_RATES['ARS'] / BASE_USD_RATES[fromCurrency]);
  const estimatedSavingsARS = fromInARS * 0.032; // 3.2% rendimiento/cobertura mensual estimado

  return {
    fromCurrency,
    toCurrency,
    fromAmount,
    grossToAmount,
    feeAmount,
    feeCurrency: toCurrency,
    netToAmount,
    rate: rateInfo.rate,
    feePercentage: rateInfo.feePercentage * 100,
    estimatedSavingsARS,
  };
}

/**
 * Ejecuta la transacción simulada o real en el backend / mock
 */
export async function executeSimulatedTransaction(params: {
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  fromAmount: number;
}): Promise<Transaction> {
  const token = localStorage.getItem('token');
  const sim = simulateOperation(params.fromCurrency, params.toCurrency, params.fromAmount);

  // Si estamos en modo mock o desarrollo sin backend activo
  if (!token || token === 'mock-token') {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const newTx: Transaction = {
      id: `txn-sim-${Date.now()}`,
      walletId: 'mock-wallet-123',
      type: params.fromCurrency === 'ARS' ? 'BUY' : params.toCurrency === 'ARS' ? 'SELL' : 'EXCHANGE',
      fromCurrency: params.fromCurrency,
      toCurrency: params.toCurrency,
      fromAmount: params.fromAmount.toFixed(2),
      toAmount: sim.netToAmount.toFixed(2),
      exchangeRate: sim.rate.toFixed(4),
      feeAmount: sim.feeAmount.toFixed(2),
      feeCurrency: sim.feeCurrency,
      feeRate: (sim.feePercentage / 100).toString(),
      rateSource: 'EWALLET_SIMULATOR',
      rateFetchedAt: new Date().toISOString(),
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
    };

    return newTx;
  }

  // Si hay token real
  return apiRequest<Transaction>('/api/transactions', {
    method: 'POST',
    token,
    body: {
      fromCurrency: params.fromCurrency,
      toCurrency: params.toCurrency,
      fromAmount: params.fromAmount.toString(),
    },
  });
}
