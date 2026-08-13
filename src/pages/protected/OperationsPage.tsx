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
  getExchangeRateInfo,
  simulateOperation,
  executeSimulatedTransaction,
  type SimulationResult,
  type ExchangeRateInfo,
} from '../../services/simulatorService';
import { SUPPORTED_CURRENCIES, type CurrencyCode } from '../../types/currency';
import type { Wallet } from '../../types/wallet';
import { formatCurrencyAmount } from '../../utils/formatters';

export const OperationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<Wallet | null>(null);

  // Formulario del simulador
  const [opMode, setOpMode] = useState<'SWAP' | 'BUY' | 'SELL'>('SWAP');
  const [fromCurrency, setFromCurrency] = useState<CurrencyCode>('ARS');
  const [toCurrency, setToCurrency] = useState<CurrencyCode>('USD');
  const [fromAmount, setFromAmount] = useState<string>('100000');

  // Estados de cálculo de simulación
  const [rateInfo, setRateInfo] = useState<ExchangeRateInfo | null>(null);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [simLoading, setSimLoading] = useState<boolean>(false);
  const [simError, setSimError] = useState<string | null>(null);

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

  // Recalcular simulación y tasa real cuando cambian las monedas o el monto
  useEffect(() => {
    let isSubscribed = true;
    async function fetchSimulation() {
      setSimError(null);
      if (fromCurrency === toCurrency) {
        setRateInfo({
          fromCurrency,
          toCurrency,
          rate: 1,
          inverseRate: 1,
          feePercentage: 0,
        });
        setSimulation({
          fromCurrency,
          toCurrency,
          fromAmount,
          grossToAmount: fromAmount,
          feeAmount: '0',
          feeCurrency: toCurrency,
          netToAmount: fromAmount,
          rate: 1,
          feePercentage: 0,
        });
        return;
      }

      try {
        setSimLoading(true);
        const [info, sim] = await Promise.all([
          getExchangeRateInfo(fromCurrency, toCurrency),
          simulateOperation(fromCurrency, toCurrency, fromAmount),
        ]);
        if (isSubscribed) {
          setRateInfo(info);
          setSimulation(sim);
        }
      } catch (err: any) {
        if (isSubscribed) {
          console.error('Error obteniendo cotizaciones de la API:', err);
          setSimError(err?.message || 'No se pudo obtener la cotización actual (503 Service Unavailable).');
          setSimulation(null);
        }
      } finally {
        if (isSubscribed) setSimLoading(false);
      }
    }

    fetchSimulation();
    return () => {
      isSubscribed = false;
    };
  }, [fromCurrency, toCurrency, fromAmount]);

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

  function handleSwapCurrencies() {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
    setSuccessTxId(null);
  }

  const currentFromBalance = wallet?.balances.find((b) => b.currencyCode === fromCurrency);
  const availableBalanceStr = currentFromBalance?.amount || '0';
  const availableBalanceNum = parseFloat(availableBalanceStr);

  function handlePresetPercent(percent: number) {
    if (availableBalanceNum <= 0) {
      setFromAmount('10000');
      return;
    }
    const calculated = (availableBalanceNum * (percent / 100)).toString();
    setFromAmount(calculated);
  }

  // Gráfico histórico simulado alrededor de la tasa real
  const currentRate = rateInfo?.rate || 1;
  const chartHistoricalData = [
    { day: 'Lun', rate: currentRate * 0.985 },
    { day: 'Mar', rate: currentRate * 0.992 },
    { day: 'Mié', rate: currentRate * 0.988 },
    { day: 'Jue', rate: currentRate * 0.996 },
    { day: 'Vie', rate: currentRate * 1.002 },
    { day: 'Sáb', rate: currentRate * 0.998 },
    { day: 'Hoy', rate: currentRate },
  ];

  async function handleConfirmExecution() {
    if (!fromAmount || parseFloat(fromAmount) <= 0) return;
    try {
      setIsExecuting(true);
      setErrorMsg(null);

      const res = await executeSimulatedTransaction({
        fromCurrency,
        toCurrency,
        fromAmount,
      });

      setSuccessTxId(res.transaction.id);
      setShowConfirmModal(false);

      // Recargar balances
      const updatedWallets = await getWallets();
      if (updatedWallets && updatedWallets.length > 0) {
        setWallet(updatedWallets[0]);
      }
    } catch (err: any) {
      console.error('Error ejecutando transacción:', err);
      setErrorMsg(err?.message || 'No se pudo completar la operación. Intenta nuevamente.');
    } finally {
      setIsExecuting(false);
    }
  }

  return (
    <div className={styles.container}>
      {/* ─── Bar de Estado ─── */}
      <div className={styles.tickerBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent)', fontSize: 12, fontWeight: 700 }}>
          <Activity size={15} />
          <span>SIMULADOR CON COTIZACIÓN EN VIVO</span>
        </div>
        {rateInfo?.rateAgeMinutes !== undefined && (
          <div style={{ fontSize: 11, color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }}>
            Edad de cotización: {rateInfo.rateAgeMinutes} min ({rateInfo.source || 'REAL_FEED'})
          </div>
        )}
      </div>

      {/* ─── Grid de Operaciones ─── */}
      <div className={styles.operationsGrid}>
        {/* Columna Izquierda: Calculadora / Simulador */}
        <div className={styles.simulatorCard}>
          <div className={styles.simulatorHeader}>
            <h1 className={styles.simulatorTitle}>
              <Calculator size={22} className={styles.titleIcon} />
              Simulador de Operaciones
            </h1>
            <div className={styles.rateBadge}>
              Comisión: {rateInfo ? `${(rateInfo.feePercentage * 100).toFixed(1)}%` : '...'}
            </div>
          </div>

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
                  ¡Operación Realizada con Éxito!
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

          {(errorMsg || simError) && (
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
              <span>{errorMsg || simError}</span>
            </div>
          )}

          <div className={styles.currencyBox}>
            <div className={styles.currencyBoxHeader}>
              <span>Tú Entregas</span>
              <span className={styles.balanceBadge}>
                Disponible: {formatCurrencyAmount(availableBalanceStr, fromCurrency, currentFromBalance?.decimals)}
              </span>
            </div>
            <div className={styles.currencyInputRow}>
              <input
                type="text"
                className={styles.amountInput}
                value={fromAmount}
                onChange={(e) => {
                  setFromAmount(e.target.value);
                  setSuccessTxId(null);
                }}
                placeholder="0"
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

            <div className={styles.presetChips}>
              <button className={styles.chipBtn} onClick={() => handlePresetPercent(25)}>25%</button>
              <button className={styles.chipBtn} onClick={() => handlePresetPercent(50)}>50%</button>
              <button className={styles.chipBtn} onClick={() => handlePresetPercent(75)}>75%</button>
              <button className={styles.chipBtn} onClick={() => handlePresetPercent(100)}>MAX</button>
            </div>
          </div>

          <div className={styles.swapWrapper}>
            <button
              className={styles.swapBtn}
              onClick={handleSwapCurrencies}
              title="Invertir dirección de cambio"
            >
              <ArrowRightLeft size={18} />
            </button>
          </div>

          <div className={styles.currencyBox} style={{ background: 'rgba(0, 0, 0, 0.25)' }}>
            <div className={styles.currencyBoxHeader}>
              <span>Tú Recibes (Neto Estimado)</span>
              <span>Comisión de {rateInfo ? `${(rateInfo.feePercentage * 100).toFixed(1)}%` : '0%'}</span>
            </div>
            <div className={styles.currencyInputRow}>
              <div className={styles.amountInput} style={{ color: 'var(--accent)' }}>
                {simLoading
                  ? 'Calculando...'
                  : simulation
                  ? formatCurrencyAmount(simulation.netToAmount, toCurrency)
                  : '-'}
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

          <button
            className={styles.executeBtn}
            disabled={!simulation || parseFloat(fromAmount || '0') <= 0 || fromCurrency === toCurrency || isExecuting || !!simError}
            onClick={() => setShowConfirmModal(true)}
          >
            <Sparkles size={18} />
            <span>Confirmar Operación</span>
          </button>
        </div>

        {/* Columna Derecha: Desglose */}
        <div className={styles.infoColumn}>
          <div className={styles.breakdownCard}>
            <div className={styles.cardTitle}>
              <span>Detalles de Cotización Real</span>
              <ShieldCheck size={16} style={{ color: 'var(--success)' }} />
            </div>

            <div className={styles.breakdownList}>
              <div className={styles.breakdownRow}>
                <span>Tipo de Cambio Aplicado</span>
                <span className={styles.breakdownValue}>
                  {rateInfo ? `1 ${fromCurrency} = ${Number(rateInfo.rate).toFixed(4)} ${toCurrency}` : '-'}
                </span>
              </div>

              <div className={styles.breakdownRow}>
                <span>Tasa Inversa</span>
                <span className={styles.breakdownValue}>
                  {rateInfo ? `1 ${toCurrency} = ${Number(rateInfo.inverseRate).toFixed(4)} ${fromCurrency}` : '-'}
                </span>
              </div>

              <div className={styles.breakdownRow}>
                <span>Monto Bruto</span>
                <span className={styles.breakdownValue}>
                  {simulation ? formatCurrencyAmount(simulation.grossToAmount, toCurrency) : '-'}
                </span>
              </div>

              <div className={styles.breakdownRow} style={{ color: 'var(--danger)' }}>
                <span>Comisión ({rateInfo ? (rateInfo.feePercentage * 100).toFixed(1) : 0}%)</span>
                <span className={styles.breakdownValue}>
                  {simulation ? `-${formatCurrencyAmount(simulation.feeAmount, toCurrency)}` : '-'}
                </span>
              </div>

              <div className={`${styles.breakdownRow} ${styles.breakdownRowBold}`}>
                <span>Total a Acreditar</span>
                <span className={styles.breakdownValue} style={{ color: 'var(--accent)' }}>
                  {simulation ? formatCurrencyAmount(simulation.netToAmount, toCurrency) : '-'}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <span className={styles.cardTitle} style={{ margin: 0 }}>
                Evolución ({fromCurrency}/{toCurrency})
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

      {/* Modal de Confirmación */}
      {showConfirmModal && simulation && (
        <div className={styles.modalBackdrop} onClick={() => !isExecuting && setShowConfirmModal(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalIconBox}>
              <Calculator size={30} />
            </div>

            <h2 className={styles.modalTitle}>Confirmar Operación Real</h2>

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
                  {formatCurrencyAmount(fromAmount, fromCurrency)}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-subtle)' }}>Tasa de cambio:</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>
                  1 {fromCurrency} = {rateInfo?.rate.toFixed(4)} {toCurrency}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-subtle)' }}>Comisión ({(rateInfo!.feePercentage * 100).toFixed(1)}%):</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--danger)' }}>
                  -{formatCurrencyAmount(simulation.feeAmount, toCurrency)}
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
                  {formatCurrencyAmount(simulation.netToAmount, toCurrency)}
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
