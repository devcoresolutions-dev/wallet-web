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

// Tasas de cambio mockeadas para convertir todo a ARS y calcular el Patrimonio Neto
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
  ARS: 'X',
  USD: 'X',
  EUR: 'X',
  BRL: 'X',
  CLP: 'X',
  COP: 'X',
  MXN: 'X',
  PEN: 'X',
};

const CHART_COLORS = ['#D4AF37', '#C23B3B', '#4EBA6F', '#4FACFE', '#C77DFF', '#FF6B6B'];

const TRANSACTION_TYPE_LABEL = {
  BUY: 'Compra',
  SELL: 'Venta',
  EXCHANGE: 'Intercambio',
};

const TRANSACTION_TYPE_COLOR = {
  BUY: { bg: 'rgba(78, 186, 111, 0.1)', color: '#4EBA6F', icon: 'X' },
  SELL: { bg: 'rgba(194, 59, 59, 0.1)', color: '#C23B3B', icon: 'X' },
  EXCHANGE: { bg: 'rgba(212, 175, 55, 0.1)', color: '#D4AF37', icon: 'X' },
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
      try {
        setLoading(true);
        setError(null);

        // Ejecutar en paralelo todas las consultas del backend
        const [userData, walletsData, txData] = await Promise.all([
          getCurrentUser(),
          getWallets(),
          getTransactions(),
        ]);

        setUser(userData);
        if (walletsData && walletsData.length > 0) {
          setWallet(walletsData[0]);
        }
        setTransactions(txData);
      } catch (err) {
        console.error('Error cargando información de dashboard:', err);
        setError('No pudimos conectar con el backend. Verificá que estés autenticado.');
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  function exportToCSV() {
    if (!wallet || !user) return;

    // Construcción del archivo CSV
    let csv = '--- REPORTE FINANCIERO EWALLET ---\n';
    csv += `Usuario,${user.fullName}\n`;
    csv += `Email,${user.email}\n`;
    csv += `Fecha de exportacion,${new Date().toLocaleString('es-AR')}\n\n`;

    csv += '--- RESUMEN ---\n';
    csv += `Patrimonio Neto (ARS),${totalPatrimonioARS.toFixed(2)}\n`;
    csv += `Patrimonio Neto (USD),${totalPatrimonioUSD.toFixed(2)}\n\n`;

    csv += '--- DETALLE DE SALDOS ---\n';
    csv += 'Moneda,Nombre,Monto,Equivalente ARS\n';
    balancesConValor.forEach((b) => {
      const name = SUPPORTED_CURRENCIES[b.currencyCode]?.name || b.currencyCode;
      csv += `${b.currencyCode},"${name}",${parseFloat(b.amount).toFixed(2)},${b.valueInARS.toFixed(2)}\n`;
    });
    csv += '\n';

    csv += '--- HISTORIAL DE TRANSACCIONES ---\n';
    csv += 'ID,Fecha,Tipo,Moneda Origen,Moneda Destino,Monto Origen,Monto Destino,Estado\n';
    if (transactions.length > 0) {
      transactions.forEach((t) => {
        csv += `${t.id},${new Date(t.createdAt).toLocaleDateString('es-AR')},${TRANSACTION_TYPE_LABEL[t.type]},${t.fromCurrency},${t.toCurrency || '-'},${parseFloat(t.fromAmount).toFixed(2)},${t.toAmount ? parseFloat(t.toAmount).toFixed(2) : '-'},${TRANSACTION_STATUS_LABEL[t.status]}\n`;
      });
    } else {
      csv += 'Sin movimientos registrados,,,,,,\n';
    }

    // Descarga del archivo en el navegador
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

  if (error || !wallet) {
    return (
      <div className={styles.container}>
        <div className={styles.card} style={{ borderColor: 'var(--danger)', padding: 32, textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--danger)', marginBottom: 12 }}>¡Error de conexión!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>{error || 'No se encontró una billetera activa.'}</p>
          <Link
            to="/login"
            className={styles.aiActionBtn}
            style={{ display: 'inline-block', maxWidth: 200, textDecoration: 'none', textAlign: 'center' }}
          >
            Ir a Iniciar Sesión
          </Link>
        </div>
      </div>
    );
  }

  // Cálculos de saldos y conversión
  const balancesConValor = wallet.balances.map((b) => {
    const amount = parseFloat(b.amount);
    const rate = CONVERSION_RATES[b.currencyCode] || 1;
    const valueInARS = amount * rate;
    return {
      ...b,
      amountNum: amount,
      valueInARS,
    };
  });

  const totalPatrimonioARS = balancesConValor.reduce((sum, b) => sum + b.valueInARS, 0);
  const totalPatrimonioUSD = totalPatrimonioARS / CONVERSION_RATES.USD;

  // Filtrar activos con saldo mayor a 0 para el gráfico de distribución
  const chartData = balancesConValor
    .filter((b) => b.amountNum > 0)
    .map((b) => ({
      name: b.currencyCode,
      value: b.valueInARS,
    }));

  // Si no hay saldo en ninguna moneda, mostramos ARS como 100% para evitar gráficos vacíos
  const assetDistributionData = chartData.length > 0
    ? chartData
    : [{ name: 'ARS', value: 1 }];

  // Gráfico de línea histórica (Mockeado en base al saldo actual para dar realismo visual)
  const historicalData = [
    { day: 'Lun', valor: totalPatrimonioARS * 0.96 },
    { day: 'Mar', valor: totalPatrimonioARS * 0.98 },
    { day: 'Mié', valor: totalPatrimonioARS * 0.97 },
    { day: 'Jue', valor: totalPatrimonioARS * 0.99 },
    { day: 'Vie', valor: totalPatrimonioARS * 0.98 },
    { day: 'Sáb', valor: totalPatrimonioARS * 1.01 },
    { day: 'Dom', valor: totalPatrimonioARS },
  ];

  // Obtener las últimas 3 transacciones reales
  const recentTransactions = transactions.slice(0, 3);

  // Sugerencia dinámica de la IA en base a los saldos
  const mainBalanceARS = wallet.balances.find((b) => b.currencyCode === 'ARS')?.amount || '0.00';
  const mainBalanceARSNum = parseFloat(mainBalanceARS);

  let aiSuggestion = '¡Billetera vacía! Realiza un depósito o ingresa fondos para comenzar a operar con distintas monedas.';
  if (mainBalanceARSNum > 500000) {
    aiSuggestion = 'Tienes una cantidad considerable de Pesos Argentinos. El dólar cotiza estable esta semana; podrías considerar diversificar un 20% a USD para resguardar tu capital.';
  } else if (mainBalanceARSNum > 0) {
    aiSuggestion = '¡Buen comienzo! Recuerda monitorear nuestra sección de cotizaciones en tiempo real para aprovechar el mejor momento de intercambio.';
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
          X Exportar Reporte CSV
        </button>
      </div>

      {/* ─── Grid de Resumen Superior ─── */}
      <div className={styles.summaryGrid}>
        <div className={styles.card}>
          <span className={styles.cardLabel}>Patrimonio Neto (ARS)</span>
          <span className={styles.cardValue}>
            {totalPatrimonioARS.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
          </span>
          <span className={styles.cardSub}>
            Equivalente a{' '}
            <strong style={{ fontFamily: 'var(--font-mono)' }}>
              {totalPatrimonioUSD.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </strong>
          </span>
        </div>

        <div className={styles.card}>
          <span className={styles.cardLabel}>Saldos Activos</span>
          <span className={styles.cardValue} style={{ fontSize: 24 }}>
            {wallet.balances.filter((b) => parseFloat(b.amount) > 0).length} Monedas
          </span>
          <span className={styles.cardSub}>
            De {wallet.balances.length} monedas soportadas
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
        {/* Columna Izquierda (Saldos y Gráfico de Patrimonio) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Desglose de saldos reales */}
          <div>
            <h2 className={styles.sectionTitle}>Tus Activos</h2>
            <div className={styles.balancesGrid}>
              {wallet.balances.map((b) => {
                const currency = SUPPORTED_CURRENCIES[b.currencyCode];
                const amount = parseFloat(b.amount);

                // Mostrar solo monedas activas o las principales (ARS, USD, EUR) y ocultar el resto si están en 0
                if (amount === 0 && b.currencyCode !== 'ARS' && b.currencyCode !== 'USD' && b.currencyCode !== 'EUR') {
                  return null;
                }

                const valueInARS = amount * (CONVERSION_RATES[b.currencyCode] || 1);

                return (
                  <div key={b.id} className={styles.balanceItem}>
                    <div className={styles.currencyInfo}>
                      <div className={styles.flagBox}>{CURRENCY_FLAGS[b.currencyCode]}</div>
                      <div>
                        <div className={styles.currencyCode}>{b.currencyCode}</div>
                        <div className={styles.currencyName}>{currency?.name || b.currencyCode}</div>
                      </div>
                    </div>
                    <div>
                      <div className={styles.balanceAmount}>
                        {amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </div>
                      {b.currencyCode !== 'ARS' && amount > 0 && (
                        <div className={styles.balanceConverted}>
                          ≈ {valueInARS.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
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
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--success)' }}>+2.4% este mes</span>
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

        {/* Columna Derecha (Sugerencias AI, Distribución y Actividad Reciente) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Sugerencias de la IA */}
          <div className={styles.aiCard}>
            <div className={styles.aiHeader}>
              <div className={styles.aiHeaderDot} />
              <span>Sugerencia del Asistente Gemini</span>
            </div>
            <p className={styles.aiText}>{aiSuggestion}</p>
            <Link to="/chatbot" style={{ width: '100%' }}>
              <button className={styles.aiActionBtn}>Consultar al Asistente IA</button>
            </Link>
          </div>

          {/* Gráfico circular de distribución de activos */}
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
                      chartData.length > 0
                        ? `${(((value as number) / totalPatrimonioARS) * 100).toFixed(1)}%`
                        : '0%',
                      name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Leyenda del gráfico */}
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
                          {parseFloat(t.fromAmount).toLocaleString('es-AR')} {t.fromCurrency}
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
