import { SUPPORTED_CURRENCIES, type CurrencyCode } from '../types/currency';

/**
 * Formatea un monto en string respetando los decimales correspondientes a la moneda.
 * Por ejemplo: CLP (decimals: 0) -> "$15.000", ARS (decimals: 2) -> "$15.000,00"
 */
export function formatCurrencyAmount(
  amountStr: string | number,
  currencyCode: CurrencyCode,
  overrideDecimals?: number
): string {
  const num = typeof amountStr === 'number' ? amountStr : parseFloat(amountStr) || 0;
  const currencyInfo = SUPPORTED_CURRENCIES[currencyCode];
  const decimals = overrideDecimals !== undefined ? overrideDecimals : (currencyInfo?.decimals ?? 2);
  const symbol = currencyInfo?.symbol || '$';

  const formattedNumber = num.toLocaleString('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `${symbol} ${formattedNumber}`;
}
