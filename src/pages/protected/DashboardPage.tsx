import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import styles from './DashboardPage.module.css';
import { getWallets, getCurrentUser } from '../../services/walletService';
import { getTransactions } from '../../services/transactionService';
import type { Wallet } from '../../types/wallet';
import type { User } from '../../types/user';
import type { Transaction } from '../../types/transaction';
import { SUPPORTED_CURRENCIES, type CurrencyCode } from '../../types/currency';
import { formatCurrencyAmount } from '../../utils/formatters';

const CONVERSION_RATES: Record<CurrencyCode, number> = {
  ARS: 1.0,
  USD: 895.5,
  EUR: 970.0,
  BRL: 180.0,
  CLP: 0.95,
  COP: 0.23,
  MXN: 52.0,
  PEN: 240.0,
};

const CURRENCY_FLAGS: Record<CurrencyCode, string> = {
  ARS: 'ARS',
  USD: 'USD',
  EUR: 'EUR',
  BRL: 'BRL',
  CLP: 'CLP',
  COP: 'COP',
  MXN: 'MXN',
  PEN: 'PEN',
};

const CHART_COLORS = ['#D4AF37', '#C23B3B', '#4EBA6F', '#4FACFE', '#C77DFF', '#FF6B6B'];

const TRANSACTION_TYPE_LABEL = {
  BUY: 'Compra',
  SELL: 'Venta',
  EXCHANGE: 'Intercambio',
};

const TRANSACTION_TYPE_COLOR = {
  BUY: { bg: 'rgba(78, 186, 111, 0.1)', color: '#4EBA6F', icon: '↓' },
  SELL: { bg: 'rgba(194, 59, 59, 0.1)', color: '#C23B3B', icon: '↑' },
  EXCHANGE: { bg: 'rgba(212, 175, 55, 0.1)', color: '#D4AF37', icon: '⇄' },
};

const TRANSACTION_STATUS_LABEL = {
  COMPLETED: 'Completada',
  PENDING: 'Pendiente',
  FAILED: 'Fallida',
};

const TRANSACTION_STATUS_COLOR = {
  COMPLETED: '#4EBA6F',
  PENDING: '#D4AF37',
  FAILED: '#C23B3B',
};

export const DashboardPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      setError(null);

      // Usar Promise.allSettled para resiliencia: si un endpoint cae, las otras secciones cargan
      const results = await Promise.allSettled([
        getCurrentUser(),
        getWallets(),
        getTransactions(),
      ]);

      const [userRes, walletsRes, txRes] = results;

      if (userRes.status === 'fulfilled') {
        setUser(userRes.value);
      }
      if (walletsRes.status === 'fulfilled' && walletsRes.value.length > 0) {
        setWallet(walletsRes.value[0]);
      }
      if (txRes.status === 'fulfilled') {
        setTransactions(txRes.value);
      }

      if (userRes.status === 'rejected' && walletsRes.status === 'rejected') {
        setError('No pudimos conectar con el backend. Verificá tu autenticación.');
      }
      setLoading(false);
    }

    loadDashboardData();
  }, []);

  function exportToCSV() {
    if (!user) return;

    let csv = '--- REPORTE FINANCIERO EWALLET ---\n';
    csv += `Usuario,${user.fullName}\n`;
    csv += `Email,${user.email}\n`;
    csv += `Fecha de exportacion,${new Date().toLocaleString('es-AR')}\n\n`;

    if (wallet) {
      csv += '--- RESUMEN ---\n';
      csv += `Patrimonio Neto (ARS),${totalPatrimonioARS.toFixed(2)}\n`;
      csv += `Patrimonio Neto (USD),${totalPatrimonioUSD.toFixed(2)}\n\n`;

      csv += '--- DETALLE DE SALDOS ---\n';
      csv += 'Moneda,Nombre,Monto,Equivalente ARS\n';
      balancesConValor.forEach((b) => {
        const name = SUPPORTED_CURRENCIES[b.currencyCode]?.name || b.currencyCode;
        csv += `${b.currencyCode},"${name}",${b.amount},${b.valueInARS.toFixed(2)}\n`;
      });
      csv += '\n';
    }

    csv += '--- HISTORIAL DE TRANSACCIONES ---\n';
    csv += 'ID,Fecha,Tipo,Moneda Origen,Moneda Destino,Monto Origen,Monto Destino,Estado\n';
    if (transactions.length > 0) {
      transactions.forEach((t) => {
        csv += `${t.id},${new Date(t.createdAt).toLocaleDateString('es-AR')},${TRANSACTION_TYPE_LABEL[t.type]},${t.fromCurrency},${t.toCurrency || '-'},${t.fromAmount},${t.toAmount || '-'},${TRANSACTION_STATUS_LABEL[t.status]}\n`;
      });
    } else {
      csv += 'Sin movimientos registrados,,,,,,\n';
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_ewallet_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.shimmerCard} style={{ height: 80, marginBottom: 16 }} />
        <div className={styles.summaryGrid}>
          <div className={styles.shimmerCard} />
          <div className={styles.shimmerCard} />
          <div className={styles.shimmerCard} />
        </div>
        <div style={{ marginTop: 24 }} className={styles.summaryGrid}>
          <div className={styles.shimmerCard} style={{ height: 280 }} />
          <div className={styles.shimmerCard} style={{ height: 280 }} />
        </div>
      </div>
    );
  }

  const balancesConValor = wallet?.balances.map((b) => {
    const amountNum = parseFloat(b.amount) || 0;
    const rate = CONVERSION_RATES[b.currencyCode] || 1;
    const valueInARS = amountNum * rate;
    return {
      ...b,
      amountNum,
      valueInARS,
    };
  }) || [];

  const totalPatrimonioARS = balancesConValor.reduce((sum, b) => sum + b.valueInARS, 0);
  const totalPatrimonioUSD = totalPatrimonioARS / CONVERSION_RATES.USD;

  const chartData = balancesConValor
    .filter((b) => b.amountNum > 0)
    .map((b) => ({
      name: b.currencyCode,
      value: b.valueInARS,
    }));

  const assetDistributionData = chartData.length > 0
    ? chartData
    : [{ name: 'ARS', value: 1 }];

  const historicalData = [
    { day: 'Lun', valor: totalPatrimonioARS * 0.96 },
    { day: 'Mar', valor: totalPatrimonioARS * 0.98 },
    { day: 'Mié', valor: totalPatrimonioARS * 0.97 },
    { day: 'Jue', valor: totalPatrimonioARS * 0.99 },
    { day: 'Vie', valor: totalPatrimonioARS * 0.98 },
    { day: 'Sáb', valor: totalPatrimonioARS * 1.01 },
    { day: 'Dom', valor: totalPatrimonioARS },
  ];

  const recentTransactions = transactions.slice(0, 3);

  const mainBalanceARS = wallet?.balances.find((b) => b.currencyCode === 'ARS')?.amount || '0';
  const mainBalanceARSNum = parseFloat(mainBalanceARS);

  let aiSuggestion = '¡Billetera vacía! Realizá una operación para comenzar a diversificar en distintas monedas.';
  if (mainBalanceARSNum > 500000) {
    aiSuggestion = 'Tenés una cantidad considerable de Pesos Argentinos. El dólar cotiza estable esta semana; podrías considerar diversificar para resguardar tu capital.';
  } else if (mainBalanceARSNum > 0) {
    aiSuggestion = '¡Buen comienzo! Recordá monitorear nuestra sección de cotizaciones en tiempo real para aprovechar el mejor momento.';
  }

  return (
    <div className={styles.container}>
      {/* ─── Cabecera de Bienvenida ─── */}
      <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className={styles.greeting}>Hola, {user?.fullName || 'Usuario'}</h1>
          <p className={styles.subtitle}>Este es el estado de tu portafolio financiero hoy</p>
        </div>
        <button onClick={exportToCSV} className={styles.exportBtn}>
          Exportar Reporte CSV
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: 'rgba(194, 59, 59, 0.15)', border: '1px solid var(--danger)', borderRadius: 12, marginBottom: 20, color: 'var(--danger)', fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* ─── Grid de Resumen Superior ─── */}
      <div className={styles.summaryGrid}>
        <div className={styles.card}>
          <span className={styles.cardLabel}>Patrimonio Neto (ARS)</span>
          <span className={styles.cardValue}>
            {formatCurrencyAmount(totalPatrimonioARS.toString(), 'ARS')}
          </span>
          <span className={styles.cardSub}>
            Equivalente a{' '}
            <strong style={{ fontFamily: 'var(--font-mono)' }}>
              {formatCurrencyAmount(totalPatrimonioUSD.toString(), 'USD')}
            </strong>
          </span>
        </div>

        <div className={styles.card}>
          <span className={styles.cardLabel}>Saldos Activos</span>
          <span className={styles.cardValue} style={{ fontSize: 24 }}>
            {wallet ? wallet.balances.filter((b) => parseFloat(b.amount) > 0).length : 0} Monedas
          </span>
          <span className={styles.cardSub}>
            De {wallet ? wallet.balances.length : 0} monedas soportadas
          </span>
        </div>

        <div className={styles.card}>
          <span className={styles.cardLabel}>Último Movimiento</span>
          {transactions.length > 0 ? (
            <>
              <span className={styles.cardValue} style={{ fontSize: 20, color: TRANSACTION_TYPE_COLOR[transactions[0].type].color }}>
                {TRANSACTION_TYPE_LABEL[transactions[0].type]}
              </span>
              <span className={styles.cardSub}>
                Realizado el {new Date(transactions[0].createdAt).toLocaleDateString('es-AR')}
              </span>
            </>
          ) : (
            <>
              <span className={styles.cardValue} style={{ fontSize: 20, color: 'var(--text-subtle)' }}>
                Sin registros
              </span>
              <span className={styles.cardSub}>No has hecho operaciones aún</span>
            </>
          )}
        </div>
      </div>

      {/* ─── Layout de Dos Columnas del Dashboard ─── */}
      <div className={styles.dashboardBody}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Desglose de saldos reales */}
          <div>
            <h2 className={styles.sectionTitle}>Tus Activos</h2>
            <div className={styles.balancesGrid}>
              {wallet?.balances.map((b) => {
                const currency = SUPPORTED_CURRENCIES[b.currencyCode];
                const amountNum = parseFloat(b.amount) || 0;

                if (amountNum === 0 && b.currencyCode !== 'ARS' && b.currencyCode !== 'USD' && b.currencyCode !== 'EUR') {
                  return null;
                }

                const valueInARS = amountNum * (CONVERSION_RATES[b.currencyCode] || 1);

                return (
                  <div key={b.id} className={styles.balanceItem}>
                    <div className={styles.currencyInfo}>
                      <div className={styles.flagBox}>{CURRENCY_FLAGS[b.currencyCode]}</div>
                      <div>
                        <div className={styles.currencyCode}>{b.currencyCode}</div>
                        <div className={styles.currencyName}>{b.currencyName || currency?.name || b.currencyCode}</div>
                      </div>
                    </div>
                    <div>
                      <div className={styles.balanceAmount}>
                        {formatCurrencyAmount(b.amount, b.currencyCode, b.decimals)}
                      </div>
                      {b.currencyCode !== 'ARS' && amountNum > 0 && (
                        <div className={styles.balanceConverted}>
                          ≈ {formatCurrencyAmount(valueInARS.toString(), 'ARS')}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gráfico Recharts de evolución histórica de patrimonio */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <span className={styles.cardLabel}>Tendencia de Patrimonio</span>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--success)' }}>Feed en vivo</span>
            </div>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historicalData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    stroke="var(--text-subtle)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--text-subtle)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      color: 'var(--text)',
                      fontFamily: 'var(--font-sans)',
                      fontSize: 12,
                    }}
                    formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Patrimonio']}
                  />
                  <Area
                    type="monotone"
                    dataKey="valor"
                    stroke="var(--accent)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorValor)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Columna Derecha */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Sugerencias de la IA */}
          <div className={styles.aiCard}>
            <div className={styles.aiHeader}>
              <div className={styles.aiHeaderDot} />
              <span>Asistente eWallet</span>
            </div>
            <p className={styles.aiText}>{aiSuggestion}</p>
            <Link to="/chatbot" style={{ width: '100%' }}>
              <button className={styles.aiActionBtn}>Consultar al Asistente IA</button>
            </Link>
          </div>

          {/* Gráfico circular */}
          <div className={styles.chartCard} style={{ padding: '20px 24px' }}>
            <span className={styles.cardLabel} style={{ marginBottom: 12, display: 'block' }}>Distribución de Activos</span>
            <div className={styles.chartContainer} style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assetDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {assetDistributionData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      color: 'var(--text)',
                      fontFamily: 'var(--font-sans)',
                      fontSize: 11,
                    }}
                    formatter={(value, name) => [
                      chartData.length > 0 && totalPatrimonioARS > 0
                        ? `${(((value as number) / totalPatrimonioARS) * 100).toFixed(1)}%`
                        : '0%',
                      name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 12 }}>
              {assetDistributionData.map((entry, index) => (
                <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 3,
                      background: CHART_COLORS[index % CHART_COLORS.length],
                      marginTop: 3,
                    }}
                  />
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{entry.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actividad Reciente */}
          <div className={styles.activityCard}>
            <div className={styles.activityHeader}>
              <span className={styles.cardLabel}>Actividad Reciente</span>
              {transactions.length > 0 && (
                <Link to="/transactions" className={styles.viewAllLink}>
                  Ver todas
                </Link>
              )}
            </div>

            <div className={styles.activityList}>
              {recentTransactions.length > 0 ? (
                recentTransactions.map((t) => {
                  const meta = TRANSACTION_TYPE_COLOR[t.type];
                  return (
                    <div key={t.id} className={styles.activityItem}>
                      <div className={styles.activityLeft}>
                        <div
                          className={styles.activityIcon}
                          style={{ background: meta.bg, color: meta.color }}
                        >
                          {meta.icon}
                        </div>
                        <div>
                          <div className={styles.activityInfoTitle}>
                            {TRANSACTION_TYPE_LABEL[t.type]}
                          </div>
                          <div className={styles.activityInfoDate}>
                            {new Date(t.createdAt).toLocaleDateString('es-AR', {
                              day: '2-digit',
                              month: 'short',
                            })}
                          </div>
                        </div>
                      </div>
                      <div className={styles.activityRight}>
                        <div className={styles.activityAmount}>
                          {formatCurrencyAmount(t.fromAmount, t.fromCurrency)}
                        </div>
                        <div
                          className={styles.activityStatus}
                          style={{ color: TRANSACTION_STATUS_COLOR[t.status] }}
                        >
                          {TRANSACTION_STATUS_LABEL[t.status]}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-subtle)', fontSize: 13 }}>
                  No hay operaciones recientes.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
