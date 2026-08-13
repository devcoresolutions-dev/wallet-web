import type { CurrencyCode } from '../types/currency';
import type { Transaction } from '../types/transaction';
import { apiRequest } from './apiClient';
import { getRate } from './rateService';

export interface ExchangeRateInfo {
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  rate: number;
  inverseRate: number;
  feePercentage: number;
  rateAgeMinutes?: number;
  source?: string;
}

export interface SimulationResult {
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  fromAmount: string;
  grossToAmount: string;
  feeAmount: string;
  feeCurrency: CurrencyCode;
  netToAmount: string;
  rate: number;
  feePercentage: number;
  rateAgeMinutes?: number;
  source?: string;
}

/**
 * Obtiene la información de la tasa de cambio y comisión entre dos monedas
 * Comisiones reales:
 * - Compra (ARS a Extranjera): 0.5% (0.005)
 * - Venta (Extranjera a ARS): 0.5% (0.005)
 * - Intercambio (Extranjera a Extranjera): 0.0% (0.000)
 */
export async function getExchangeRateInfo(from: CurrencyCode, to: CurrencyCode): Promise<ExchangeRateInfo> {
  if (from === to) {
    return {
      fromCurrency: from,
      toCurrency: to,
      rate: 1.0,
      inverseRate: 1.0,
      feePercentage: 0,
      rateAgeMinutes: 0,
      source: 'DIRECT',
    };
  }

  const rateData = await getRate(from, to);
  const rate = typeof rateData.rate === 'string' ? parseFloat(rateData.rate) : Number(rateData.rate) || 0;
  const inverseRate = rate !== 0 ? 1 / rate : 0;

  // Comisiones reales: 0.5% compra/venta (involucra ARS), 0% en intercambio directo entre divisas
  let feePercentage = 0;
  if (from === 'ARS' || to === 'ARS') {
    feePercentage = 0.005; // 0.5%
  } else {
    feePercentage = 0; // 0% intercambio
  }

  return {
    fromCurrency: from,
    toCurrency: to,
    rate,
    inverseRate,
    feePercentage,
    rateAgeMinutes: rateData.rateAgeMinutes,
    source: rateData.source,
  };
}

/**
 * Realiza la simulación de la transacción utilizando cotizaciones reales
 * Maneja los montos como strings para preservar precisión decimal
 */
export async function simulateOperation(
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  fromAmountStr: string
): Promise<SimulationResult> {
  const rateInfo = await getExchangeRateInfo(fromCurrency, toCurrency);
  const fromAmountNum = parseFloat(fromAmountStr) || 0;

  const grossToNum = fromAmountNum * rateInfo.rate;
  const feeNum = grossToNum * rateInfo.feePercentage;
  const netToNum = grossToNum - feeNum;

  return {
    fromCurrency,
    toCurrency,
    fromAmount: fromAmountStr,
    grossToAmount: grossToNum.toString(),
    feeAmount: feeNum.toString(),
    feeCurrency: toCurrency,
    netToAmount: netToNum.toString(),
    rate: rateInfo.rate,
    feePercentage: rateInfo.feePercentage * 100,
    rateAgeMinutes: rateInfo.rateAgeMinutes,
    source: rateInfo.source,
  };
}

export type TransactionOperationType = 'buy' | 'sell' | 'exchange';

export function getOperationEndpoint(fromCurrency: CurrencyCode, toCurrency: CurrencyCode): TransactionOperationType {
  if (fromCurrency === 'ARS') {
    return 'buy';
  } else if (toCurrency === 'ARS') {
    return 'sell';
  } else {
    return 'exchange';
  }
}

export interface ExecuteTransactionResponse {
  transaction: Transaction;
  balances: Array<{
    currencyCode: CurrencyCode;
    amount: string;
  }>;
}

/**
 * Ejecuta la transacción real en el backend mediante POST /api/transactions/buy, /sell o /exchange
 */
export async function executeSimulatedTransaction(params: {
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  fromAmount: string;
}): Promise<ExecuteTransactionResponse> {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Usuario no autenticado.');
  }

  const endpointType = getOperationEndpoint(params.fromCurrency, params.toCurrency);

  return apiRequest<ExecuteTransactionResponse>(`/api/transactions/${endpointType}`, {
    method: 'POST',
    token,
    body: {
      fromCurrency: params.fromCurrency,
      toCurrency: params.toCurrency,
      fromAmount: params.fromAmount,
    },
  });
}
