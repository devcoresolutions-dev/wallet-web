import type { CurrencyCode } from '../types/currency';
import type { Transaction } from '../types/transaction';
import { apiRequest } from './apiClient';
import { getRate } from './rateService';
import { SUPPORTED_CURRENCIES } from '../types/currency';

export type TransactionOperationType = 'buy' | 'sell' | 'exchange';

export type OperationMode = 'SWAP' | 'BUY' | 'SELL';

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
 * Determina la comisión según el TIPO DE OPERACIÓN.
 *
 * Reglas del backend:
 * - BUY: 0.5%
 * - SELL: 0.5%
 * - EXCHANGE: 0%
 *
 * La moneda involucrada no determina la comisión.
 */
function getFeePercentage(operationType: OperationMode): number {
  return operationType === 'SWAP' ? 0 : 0.005;
}

/**
 * Obtiene la información de la tasa de cambio y comisión.
 *
 * La comisión depende del modo seleccionado por el usuario:
 * - Intercambio Directo (SWAP): 0%
 * - Comprar Moneda (BUY): 0.5%
 * - Vender a ARS (SELL): 0.5%
 */
export async function getExchangeRateInfo(
  from: CurrencyCode,
  to: CurrencyCode,
  operationType: OperationMode = 'SWAP'
): Promise<ExchangeRateInfo> {
  if (from === to) {
    return {
      fromCurrency: from,
      toCurrency: to,
      rate: 1,
      inverseRate: 1,
      feePercentage: 0,
      rateAgeMinutes: 0,
      source: 'DIRECT',
    };
  }

  const rateData = await getRate(from, to);

  const rate =
    typeof rateData.rate === 'string'
      ? parseFloat(rateData.rate)
      : Number(rateData.rate) || 0;

  const inverseRate = rate !== 0 ? 1 / rate : 0;

  return {
    fromCurrency: from,
    toCurrency: to,
    rate,
    inverseRate,
    feePercentage: getFeePercentage(operationType),
    rateAgeMinutes: rateData.rateAgeMinutes,
    source: rateData.source,
  };
}

/**
 * Simula una operación usando la cotización real.
 *
 * La comisión, cuando existe, se calcula sobre la MONEDA DE ORIGEN,
 * igual que en el backend.
 *
 * EXCHANGE:
 *   fee = 0
 *   netTo = fromAmount * rate
 *
 * BUY / SELL:
 *   fee = fromAmount * 0.5%
 *   netFrom = fromAmount - fee
 *   netTo = netFrom * rate
 */
export async function simulateOperation(
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode,
  fromAmountStr: string,
  operationType: OperationMode = 'SWAP'
): Promise<SimulationResult> {
  const rateInfo = await getExchangeRateInfo(
    fromCurrency,
    toCurrency,
    operationType
  );

  const fromAmountNum = parseFloat(fromAmountStr) || 0;

  const feePercentage = rateInfo.feePercentage;

  const rawFee = fromAmountNum * feePercentage;

  // Se redondea hacia arriba a la cantidad de decimales de la moneda de origen,
  // siguiendo la regla del backend.
  const fromDecimals =
    SUPPORTED_CURRENCIES[fromCurrency]?.decimals ?? 2;

  const factor = Math.pow(10, fromDecimals);

  const feeNum =
    rawFee > 0
      ? Math.ceil((rawFee - Number.EPSILON) * factor) / factor
      : 0;

  const netFromNum = fromAmountNum - feeNum;
  const grossToNum = fromAmountNum * rateInfo.rate;
  const netToNum = netFromNum * rateInfo.rate;

  return {
    fromCurrency,
    toCurrency,
    fromAmount: fromAmountStr,
    grossToAmount: grossToNum.toString(),
    feeAmount: feeNum.toString(),
    feeCurrency: fromCurrency,
    netToAmount: netToNum.toString(),
    rate: rateInfo.rate,
    feePercentage: rateInfo.feePercentage * 100,
    rateAgeMinutes: rateInfo.rateAgeMinutes,
    source: rateInfo.source,
  };
}

/**
 * Convierte el modo visual del simulador en el tipo de endpoint real.
 */
export function getOperationEndpoint(
  operationType: OperationMode
): TransactionOperationType {
  switch (operationType) {
    case 'BUY':
      return 'buy';

    case 'SELL':
      return 'sell';

    case 'SWAP':
    default:
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
 * Ejecuta la operación real en el backend.
 *
 * El endpoint se determina por el modo seleccionado:
 * - BUY      -> POST /api/transactions/buy
 * - SELL     -> POST /api/transactions/sell
 * - SWAP     -> POST /api/transactions/exchange
 */
export async function executeSimulatedTransaction(params: {
  operationType: OperationMode;
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  fromAmount: string;
}): Promise<ExecuteTransactionResponse> {
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('Usuario no autenticado.');
  }

  const endpointType = getOperationEndpoint(
    params.operationType
  );

  return apiRequest<ExecuteTransactionResponse>(
    `/api/transactions/${endpointType}`,
    {
      method: 'POST',
      token,
      body: {
        fromCurrency: params.fromCurrency,
        toCurrency: params.toCurrency,
        fromAmount: params.fromAmount,
      },
    }
  );
}
