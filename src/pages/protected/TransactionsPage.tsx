import { useEffect, useState } from 'react';
import styles from './TransactionsPage.module.css';
import type { Transaction, TransactionType } from '../../types/transaction';
import { getTransactions } from '../../services/transactionService';
import { formatCurrencyAmount } from '../../utils/formatters';

const TYPE_LABEL: Record<TransactionType, string> = {
  BUY: 'Compra',
  SELL: 'Venta',
  EXCHANGE: 'Intercambio',
};

const STATUS_LABEL: Record<Transaction['status'], string> = {
  COMPLETED: 'Completada',
  PENDING: 'Pendiente',
  FAILED: 'Fallida',
};

const STATUS_CLASS: Record<Transaction['status'], string> = {
  COMPLETED: styles.statusCompleted,
  PENDING: styles.statusPending,
  FAILED: styles.statusFailed,
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRate(t: Transaction): string {
  const rate = parseFloat(t.exchangeRate) || 0;
  return `1 ${t.fromCurrency} = ${rate.toLocaleString('es-AR', { maximumFractionDigits: 4 })} ${t.toCurrency}`;
}

function formatFee(t: Transaction): string {
  if (!t.feeAmount || parseFloat(t.feeAmount) === 0) return 'Sin comisión';
  return formatCurrencyAmount(t.feeAmount, t.feeCurrency);
}

const FILTERS: Array<{ key: TransactionType | 'ALL'; label: string }> = [
  { key: 'ALL', label: 'Todas' },
  { key: 'BUY', label: 'Compras' },
  { key: 'SELL', label: 'Ventas' },
  { key: 'EXCHANGE', label: 'Intercambios' },
];

export default function History() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TransactionType | 'ALL'>('ALL');

  function load() {
    setLoading(true);
    setError(null);
    getTransactions()
      .then(setTransactions)
      .catch((err) => {
        console.error('Error cargando transacciones:', err);
        setError('No pudimos conectar con el backend. Verificá tu sesión e intentá de nuevo.');
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = filter === 'ALL' ? transactions : transactions.filter((t) => t.type === filter);

  return (
    <div className={styles.screen}>
      <div className={styles.wrapper}>
        <div className={styles.titleRow}>
          <div>
            <h1 className={styles.title}>Historial</h1>
            <p className={styles.subtitle}>Tus operaciones, con la tasa y la comisión aplicada en cada una</p>
          </div>
        </div>

        <div className={styles.filterBar}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`${styles.filterButton} ${filter === f.key ? styles.filterButtonActive : ''}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className={styles.list}>
            <div className={styles.skeleton} />
            <div className={styles.skeleton} />
            <div className={styles.skeleton} />
          </div>
        )}

        {!loading && error && (
          <div className={styles.errorState}>
            <p className={styles.errorText}>{error}</p>
            <button onClick={load} className={styles.retryButton}>
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>Todavía no hay movimientos</p>
            <p className={styles.emptyText}>Cuando hagas tu primera operación, va a aparecer acá.</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className={styles.list}>
            {filtered.map((t) => (
              <div key={t.id} className={styles.item}>
                <div className={styles.itemHeader}>
                  <span className={styles.typeBadge}>{TYPE_LABEL[t.type]}</span>
                  <span className={styles.date}>{formatDate(t.createdAt)}</span>
                  <span className={`${styles.statusBadge} ${STATUS_CLASS[t.status]}`}>
                    {STATUS_LABEL[t.status]}
                  </span>
                </div>

                <div className={styles.amountRow}>
                  <span>{formatCurrencyAmount(t.fromAmount, t.fromCurrency)}</span>
                  <span className={styles.arrow}>→</span>
                  <span>{formatCurrencyAmount(t.toAmount, t.toCurrency)}</span>
                </div>

                <div className={styles.detailGrid}>
                  <div>
                    <p className={styles.detailLabel}>Tasa aplicada</p>
                    <p className={styles.detailValue}>{formatRate(t)}</p>
                  </div>
                  <div>
                    <p className={styles.detailLabel}>Comisión</p>
                    <p className={!t.feeAmount || parseFloat(t.feeAmount) === 0 ? styles.detailValueMuted : styles.detailValue}>
                      {formatFee(t)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}