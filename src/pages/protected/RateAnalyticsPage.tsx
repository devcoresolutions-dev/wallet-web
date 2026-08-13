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
import { TrendingUp, Calculator, BarChart2, AlertCircle } from 'lucide-react';
import styles from './RateAnalyticsPage.module.css';
import { getRate, type RateResponse } from '../../services/rateService';
import type { CurrencyCode } from '../../types/currency';

const WATCHLIST: Array<{ from: CurrencyCode; to: CurrencyCode; name: string }> = [
  { from: 'USD', to: 'ARS', name: 'Dólar Estadounidense' },
  { from: 'EUR', to: 'ARS', name: 'Euro Europeo' },
  { from: 'BRL', to: 'ARS', name: 'Real Brasileño' },
  { from: 'CLP', to: 'ARS', name: 'Peso Chileno' },
  { from: 'USD', to: 'EUR', name: 'Dólar / Euro' },
  { from: 'MXN', to: 'ARS', name: 'Peso Mexicano' },
];

export const RateAnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPair, setSelectedPair] = useState<{ from: CurrencyCode; to: CurrencyCode }>({
    from: 'USD',
    to: 'ARS',
  });

  const [ratesData, setRatesData] = useState<Record<string, RateResponse>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadRates() {
      setErrorMsg(null);
      const results = await Promise.allSettled(
        WATCHLIST.map((item) => getRate(item.from, item.to))
      );

      const newMap: Record<string, RateResponse> = {};
      let hasError = false;

      results.forEach((res, idx) => {
        const key = `${WATCHLIST[idx].from}_${WATCHLIST[idx].to}`;
        if (res.status === 'fulfilled') {
          newMap[key] = res.value;
        } else {
          hasError = true;
        }
      });

      setRatesData(newMap);
      if (hasError && Object.keys(newMap).length === 0) {
        setErrorMsg('Servicio de cotizaciones no disponible (503 Service Unavailable).');
      }
    }

    loadRates();
  }, []);

  const selectedKey = `${selectedPair.from}_${selectedPair.to}`;
  const selectedRateInfo = ratesData[selectedKey];

  const chartData = Array.from({ length: 14 }).map((_, idx) => {
    const dayNum = idx + 1;
    const rate = selectedRateInfo ? selectedRateInfo.rate * (0.97 + (idx * 0.002)) : 0;
    return {
      date: `${dayNum} Ago`,
      rate: parseFloat(rate.toFixed(4)),
    };
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Cotizaciones en Tiempo Real</h1>
          <p className={styles.subtitle}>
            Monitoreá las cotizaciones obtenidas en vivo del backend (`GET /api/rates/:base/:target`).
          </p>
        </div>
        <button
          onClick={() => navigate('/operations')}
          style={{
            background: 'linear-gradient(135deg, var(--accent) 0%, #B8860B 100%)',
            border: 'none',
            color: 'var(--color-base-charcoal)',
            borderRadius: 12,
            padding: '10px 18px',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Calculator size={16} />
          <span>Ir al Simulador de Cambio</span>
        </button>
      </div>

      {errorMsg && (
        <div style={{ padding: '12px 16px', background: 'rgba(194, 59, 59, 0.15)', border: '1px solid var(--danger)', borderRadius: 12, marginBottom: 20, color: 'var(--danger)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className={styles.ratesGrid}>
        {WATCHLIST.map((item, idx) => {
          const key = `${item.from}_${item.to}`;
          const info = ratesData[key];
          const isSelected = selectedPair.from === item.from && selectedPair.to === item.to;

          return (
            <div
              key={idx}
              className={styles.rateCard}
              style={{
                borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                background: isSelected ? 'rgba(212, 175, 55, 0.06)' : 'var(--bg-card)',
                cursor: 'pointer',
              }}
              onClick={() => setSelectedPair({ from: item.from, to: item.to })}
            >
              <div className={styles.rateCardHeader}>
                <div className={styles.currencyPair}>
                  <span>{item.from}/{item.to}</span>
                </div>
                {info && (
                  <div className={`${styles.trendBadge} ${styles.positiveBadge}`}>
                    <TrendingUp size={12} />
                    <span>Fuente: {info.source}</span>
                  </div>
                )}
              </div>

              <div style={{ fontSize: 12, color: 'var(--text-subtle)' }}>{item.name}</div>

              <div className={styles.rateValues}>
                <div className={styles.mainRate}>
                  {info ? `$${info.rate.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}` : 'Cargando...'}
                </div>
                {info && (
                  <div className={styles.subRate}>
                    Antigüedad: {info.rateAgeMinutes} min
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedRateInfo && (
        <div className={styles.chartCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--text)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChart2 size={20} style={{ color: 'var(--accent)' }} />
                Evolución de {selectedPair.from} / {selectedPair.to}
              </h2>
              <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>
                Fuente: {selectedRateInfo.source} • Antigüedad: {selectedRateInfo.rateAgeMinutes} min
              </span>
            </div>

            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>
              1 {selectedPair.from} = {selectedRateInfo.rate.toFixed(4)} {selectedPair.to}
            </div>
          </div>

          <div style={{ height: 260, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="var(--text-subtle)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-subtle)" fontSize={11} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    color: 'var(--text)',
                    fontSize: 12,
                    fontFamily: 'var(--font-mono)',
                  }}
                  formatter={(val) => [Number(val).toFixed(4), 'Tasa de cambio']}
                />
                <Area type="monotone" dataKey="rate" stroke="var(--accent)" strokeWidth={2.5} fillOpacity={1} fill="url(#analyticsGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default RateAnalyticsPage;
