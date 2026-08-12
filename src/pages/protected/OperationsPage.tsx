import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import {
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Sparkles,
  Calculator,
  CheckCircle2,
  AlertCircle,
  Activity,
} from 'lucide-react';
import styles from './OperationsPage.module.css';
import { getWallets } from '../../services/walletService';
import {
  getExchangeRate,
  simulateOperation,
  executeSimulatedTransaction,
  type SimulationResult,
} from '../../services/simulatorService';
import { SUPPORTED_CURRENCIES, type CurrencyCode } from '../../types/currency';
import type { Wallet } from '../../types/wallet';

const TICKER_CURRENCIES: Array<{ from: CurrencyCode; to: CurrencyCode }> = [
  { from: 'USD', to: 'ARS' },
  { from: 'EUR', to: 'ARS' },
  { from: 'BRL', to: 'ARS' },
  { from: 'USD', to: 'EUR' },
  { from: 'CLP', to: 'ARS' },
  { from: 'MXN', to: 'ARS' },
];

export const OperationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<Wallet | null>(null);

  // Formulario del simulador
  const [opMode, setOpMode] = useState<'SWAP' | 'BUY' | 'SELL'>('SWAP');
  const [fromCurrency, setFromCurrency] = useState<CurrencyCode>('ARS');
  const [toCurrency, setToCurrency] = useState<CurrencyCode>('USD');
  const [fromAmount, setFromAmount] = useState<string>('100000');

  // Estados de Ejecución / Modal / Éxito
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [successTxId, setSuccessTxId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Cargar balances de la billetera
  useEffect(() => {
    async function loadWallet() {
      try {
        const wallets = await getWallets();
        if (wallets && wallets.length > 0) {
          setWallet(wallets[0]);
        }
      } catch (err) {
        console.error('Error cargando billetera en operaciones:', err);
      }
    }
    loadWallet();
  }, []);

  // Ajustar monedas según el modo seleccionado
  function handleModeChange(mode: 'SWAP' | 'BUY' | 'SELL') {
    setOpMode(mode);
    setSuccessTxId(null);
    setErrorMsg(null);
    if (mode === 'BUY') {
      setFromCurrency('ARS');
      setToCurrency('USD');
    } else if (mode === 'SELL') {
      setFromCurrency('USD');
      setToCurrency('ARS');
    }
  }

  // Intercambiar origen y destino
  function handleSwapCurrencies() {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
    setSuccessTxId(null);
  }

  // Calcular balance disponible para la moneda seleccionada
  const currentFromBalance = wallet?.balances.find((b) => b.currencyCode === fromCurrency);
  const availableBalanceNum = parseFloat(currentFromBalance?.amount || '0');

  // Aplicar porcentaje rápido (25%, 50%, 75%, 100%)
  function handlePresetPercent(percent: number) {
    if (availableBalanceNum <= 0) {
      setFromAmount('10000');
      return;
    }
    const calculated = (availableBalanceNum * (percent / 100)).toFixed(2);
    setFromAmount(calculated);
  }

  // Cálculo de la simulación en tiempo real
  const numericAmount = parseFloat(fromAmount) || 0;
  const simulation: SimulationResult = simulateOperation(fromCurrency, toCurrency, numericAmount);
  const rateInfo = getExchangeRate(fromCurrency, toCurrency);

  // Generar datos históricos simulados para el gráfico según el par seleccionado
  const chartHistoricalData = [
    { day: 'Lun', rate: rateInfo.rate * 0.985 },
    { day: 'Mar', rate: rateInfo.rate * 0.992 },
    { day: 'Mié', rate: rateInfo.rate * 0.988 },
    { day: 'Jue', rate: rateInfo.rate * 0.996 },
    { day: 'Vie', rate: rateInfo.rate * 1.002 },
    { day: 'Sáb', rate: rateInfo.rate * 0.998 },
    { day: 'Hoy', rate: rateInfo.rate },
  ];

  // Ejecución de la transacción simulada
  async function handleConfirmExecution() {
    if (numericAmount <= 0) return;
    try {
      setIsExecuting(true);
      setErrorMsg(null);

      const tx = await executeSimulatedTransaction({
        fromCurrency,
        toCurrency,
        fromAmount: numericAmount,
      });

      setSuccessTxId(tx.id);
      setShowConfirmModal(false);

      // Recargar balance de la billetera para reflejar el cambio inmediato
      const updatedWallets = await getWallets();
      if (updatedWallets && updatedWallets.length > 0) {
        setWallet(updatedWallets[0]);
      }
    } catch (err: any) {
      console.error('Error ejecutando simulación:', err);
      setErrorMsg(err?.message || 'No se pudo completar la simulación. Intenta nuevamente.');
    } finally {
      setIsExecuting(false);
    }
  }

  return (
    <div className={styles.container}>
      {/* ─── Ticker Tasa de Mercado ─── */}
      <div className={styles.tickerBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent)', fontSize: 12, fontWeight: 700 }}>
          <Activity size={15} />
          <span>MERCADO EN VIVO:</span>
        </div>
        {TICKER_CURRENCIES.map((pair, idx) => {
          const info = getExchangeRate(pair.from, pair.to);
          const isPos = info.trend24h >= 0;
          return (
            <div key={idx} className={styles.tickerItem}>
              <span className={styles.tickerPair}>{pair.from}/{pair.to}</span>
              <span className={styles.tickerRate}>
                {info.rate.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
              </span>
              <span className={`${styles.tickerTrend} ${isPos ? styles.positive : styles.negative}`}>
                {isPos ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {isPos ? `+${info.trend24h}%` : `${info.trend24h}%`}
              </span>
            </div>
          );
        })}
      </div>

      {/* ─── Grid de Operaciones (Simulador e Información) ─── */}
      <div className={styles.operationsGrid}>
        {/* Columna Izquierda: Calculadora / Simulador */}
        <div className={styles.simulatorCard}>
          <div className={styles.simulatorHeader}>
            <h1 className={styles.simulatorTitle}>
              <Calculator size={22} className={styles.titleIcon} />
              Simulador de Operaciones
            </h1>
            <div className={styles.rateBadge}>
              Spread Estándar: {(rateInfo.feePercentage * 100).toFixed(1)}%
            </div>
          </div>

          {/* Selector de Modo */}
          <div className={styles.tabContainer}>
            <button
              className={`${styles.tabBtn} ${opMode === 'SWAP' ? styles.tabBtnActive : ''}`}
              onClick={() => handleModeChange('SWAP')}
            >
              Intercambio Directo
            </button>
            <button
              className={`${styles.tabBtn} ${opMode === 'BUY' ? styles.tabBtnActive : ''}`}
              onClick={() => handleModeChange('BUY')}
            >
              Comprar Moneda
            </button>
            <button
              className={`${styles.tabBtn} ${opMode === 'SELL' ? styles.tabBtnActive : ''}`}
              onClick={() => handleModeChange('SELL')}
            >
              Vender a ARS
            </button>
          </div>

          {/* Banner de Éxito al completar simulación */}
          {successTxId && (
            <div
              style={{
                background: 'rgba(78, 186, 111, 0.15)',
                border: '1px solid var(--success)',
                borderRadius: 14,
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <CheckCircle2 size={24} style={{ color: 'var(--success)' }} />
              <div>
                <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: 14 }}>
                  ¡Operación Simulada con Éxito!
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  ID de Transacción: <span style={{ fontFamily: 'var(--font-mono)' }}>{successTxId}</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/transactions')}
                style={{
                  marginLeft: 'auto',
                  background: 'var(--success)',
                  border: 'none',
                  color: '#fff',
                  padding: '6px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Ver Historial
              </button>
            </div>
          )}

          {/* Mensaje de Error */}
          {errorMsg && (
            <div
              style={{
                background: 'rgba(194, 59, 59, 0.15)',
                border: '1px solid var(--danger)',
                borderRadius: 14,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                color: 'var(--danger)',
                fontSize: 13,
              }}
            >
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Campo Desde (Monto a Entregar) */}
          <div className={styles.currencyBox}>
            <div className={styles.currencyBoxHeader}>
              <span>Tú Entregas</span>
              <span className={styles.balanceBadge}>
                Disponible: {availableBalanceNum.toLocaleString('es-AR', { minimumFractionDigits: 2 })} {fromCurrency}
              </span>
            </div>
            <div className={styles.currencyInputRow}>
              <input
                type="number"
                min="0"
                step="any"
                className={styles.amountInput}
                value={fromAmount}
                onChange={(e) => {
                  setFromAmount(e.target.value);
                  setSuccessTxId(null);
                }}
                placeholder="0.00"
              />
              <select
                className={styles.currencySelect}
                value={fromCurrency}
                onChange={(e) => {
                  setFromCurrency(e.target.value as CurrencyCode);
                  setSuccessTxId(null);
                }}
              >
                {Object.keys(SUPPORTED_CURRENCIES).map((code) => (
                  <option key={code} value={code}>
                    {code} ({SUPPORTED_CURRENCIES[code as CurrencyCode].symbol})
                  </option>
                ))}
              </select>
            </div>

            {/* Chips de porcentaje rápido */}
            <div className={styles.presetChips}>
              <button className={styles.chipBtn} onClick={() => handlePresetPercent(25)}>25%</button>
              <button className={styles.chipBtn} onClick={() => handlePresetPercent(50)}>50%</button>
              <button className={styles.chipBtn} onClick={() => handlePresetPercent(75)}>75%</button>
              <button className={styles.chipBtn} onClick={() => handlePresetPercent(100)}>MAX</button>
            </div>
          </div>

          {/* Botón de Intercambiar Monedas */}
          <div className={styles.swapWrapper}>
            <button
              className={styles.swapBtn}
              onClick={handleSwapCurrencies}
              title="Invertir dirección de cambio"
            >
              <ArrowRightLeft size={18} />
            </button>
          </div>

          {/* Campo Hacia (Monto Recibido Neto) */}
          <div className={styles.currencyBox} style={{ background: 'rgba(0, 0, 0, 0.25)' }}>
            <div className={styles.currencyBoxHeader}>
              <span>Tú Recibes (Neto Estimado)</span>
              <span>Incluye deducción de comisiones</span>
            </div>
            <div className={styles.currencyInputRow}>
              <div className={styles.amountInput} style={{ color: 'var(--accent)' }}>
                {simulation.netToAmount.toLocaleString('es-AR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 4,
                })}
              </div>
              <select
                className={styles.currencySelect}
                value={toCurrency}
                onChange={(e) => {
                  setToCurrency(e.target.value as CurrencyCode);
                  setSuccessTxId(null);
                }}
              >
                {Object.keys(SUPPORTED_CURRENCIES).map((code) => (
                  <option key={code} value={code}>
                    {code} ({SUPPORTED_CURRENCIES[code as CurrencyCode].symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Botón de Acción Principal */}
          <button
            className={styles.executeBtn}
            disabled={numericAmount <= 0 || fromCurrency === toCurrency || isExecuting}
            onClick={() => setShowConfirmModal(true)}
          >
            <Sparkles size={18} />
            <span>Simular y Ejecutar Operación</span>
          </button>
        </div>

        {/* Columna Derecha: Desglose y Gráfico de Tendencia */}
        <div className={styles.infoColumn}>
          {/* Tarjeta de Desglose Transparente */}
          <div className={styles.breakdownCard}>
            <div className={styles.cardTitle}>
              <span>Detalles del Intercambio</span>
              <ShieldCheck size={16} style={{ color: 'var(--success)' }} />
            </div>

            <div className={styles.breakdownList}>
              <div className={styles.breakdownRow}>
                <span>Tipo de Cambio Aplicado</span>
                <span className={styles.breakdownValue}>
                  1 {fromCurrency} = {rateInfo.rate.toFixed(4)} {toCurrency}
                </span>
              </div>

              <div className={styles.breakdownRow}>
                <span>Tasa Inversa</span>
                <span className={styles.breakdownValue}>
                  1 {toCurrency} = {rateInfo.inverseRate.toFixed(4)} {fromCurrency}
                </span>
              </div>

              <div className={styles.breakdownRow}>
                <span>Monto Bruto</span>
                <span className={styles.breakdownValue}>
                  {simulation.grossToAmount.toFixed(2)} {toCurrency}
                </span>
              </div>

              <div className={styles.breakdownRow} style={{ color: 'var(--danger)' }}>
                <span>Comisión de Servicio ({simulation.feePercentage.toFixed(1)}%)</span>
                <span className={styles.breakdownValue}>
                  -{simulation.feeAmount.toFixed(2)} {toCurrency}
                </span>
              </div>

              <div className={`${styles.breakdownRow} ${styles.breakdownRowBold}`}>
                <span>Total a Acreditar</span>
                <span className={styles.breakdownValue} style={{ color: 'var(--accent)' }}>
                  {simulation.netToAmount.toFixed(2)} {toCurrency}
                </span>
              </div>
            </div>

            {/* Banner de protección estimativa */}
            <div
              style={{
                marginTop: 20,
                background: 'rgba(212, 175, 55, 0.08)',
                border: '1px dashed var(--accent)',
                borderRadius: 12,
                padding: '12px 14px',
                fontSize: 12,
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <Sparkles size={20} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <div>
                <strong>Proyección de Cobertura (30 días):</strong> Con esta operación mantienes una reserva estimada de{' '}
                <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                  +${simulation.estimatedSavingsARS.toFixed(0)} ARS
                </span>{' '}
                frente a la fluctuación cambiaria.
              </div>
            </div>
          </div>

          {/* Gráfico de Evolución del Par Seleccionado */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <span className={styles.cardTitle} style={{ margin: 0 }}>
                Evolución 7 Días ({fromCurrency}/{toCurrency})
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  color: rateInfo.trend24h >= 0 ? 'var(--success)' : 'var(--danger)',
                }}
              >
                {rateInfo.trend24h >= 0 ? `+${rateInfo.trend24h}%` : `${rateInfo.trend24h}%`} 24h
              </span>
            </div>

            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartHistoricalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="var(--text-subtle)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="var(--text-subtle)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      color: 'var(--text)',
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                    }}
                    formatter={(val) => [Number(val).toFixed(4), 'Cotización']}
                  />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke="var(--accent)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#rateGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Modal de Confirmación de Operación ─── */}
      {showConfirmModal && (
        <div className={styles.modalBackdrop} onClick={() => !isExecuting && setShowConfirmModal(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalIconBox}>
              <Calculator size={30} />
            </div>

            <h2 className={styles.modalTitle}>Confirmar Operación</h2>

            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Estás a punto de simular y registrar la siguiente transacción en tu portafolio:
            </p>

            <div
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 14,
                padding: '16px',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-subtle)' }}>Monto a entregar:</span>
                <strong style={{ fontFamily: 'var(--font-mono)' }}>
                  {numericAmount.toLocaleString('es-AR')} {fromCurrency}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-subtle)' }}>Tasa de cambio:</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>
                  1 {fromCurrency} = {rateInfo.rate.toFixed(4)} {toCurrency}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-subtle)' }}>Comisión ({simulation.feePercentage.toFixed(1)}%):</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--danger)' }}>
                  -{simulation.feeAmount.toFixed(2)} {toCurrency}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 15,
                  fontWeight: 700,
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: 8,
                  marginTop: 4,
                }}
              >
                <span>Recibirás en tu saldo:</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
                  {simulation.netToAmount.toFixed(2)} {toCurrency}
                </span>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                className={styles.cancelBtn}
                disabled={isExecuting}
                onClick={() => setShowConfirmModal(false)}
              >
                Cancelar
              </button>
              <button
                className={styles.confirmBtn}
                disabled={isExecuting}
                onClick={handleConfirmExecution}
              >
                {isExecuting ? 'Procesando...' : 'Confirmar Operación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationsPage;
