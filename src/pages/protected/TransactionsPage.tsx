import { useEffect, useState } from 'react';
import styles from './TransactionsPage.module.css';
import type { Transaction, TransactionType } from '../../types/transaction';


const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    walletId: 'w-1',
    type: 'BUY',
    fromCurrency: 'ARS',
    toCurrency: 'USD',
    fromAmount: '95000',
    toAmount: '100',
    exchangeRate: '950.32',
    feeAmount: '0.5',
    feeCurrency: 'USD',
    feeRate: '0.005',
    rateSource: 'MOCK',
    rateFetchedAt: '2026-08-01T14:31:50Z',
    status: 'COMPLETED',
    createdAt: '2026-08-01T14:32:00Z',
  },
  {
    id: '2',
    walletId: 'w-1',
    type: 'EXCHANGE',
    fromCurrency: 'USD',
    toCurrency: 'EUR',
    fromAmount: '200',
    toAmount: '184.6',
    exchangeRate: '0.923',
    feeAmount: '0',
    feeCurrency: 'EUR',
    feeRate: '0',
    rateSource: 'MOCK',
    rateFetchedAt: '2026-07-29T09:09:50Z',
    status: 'COMPLETED',
    createdAt: '2026-07-29T09:10:00Z',
  },
  {
    id: '3',
    walletId: 'w-1',
    type: 'SELL',
    fromCurrency: 'EUR',
    toCurrency: 'ARS',
    fromAmount: '50',
    toAmount: '51420',
    exchangeRate: '1028.4',
    feeAmount: '0.25',
    feeCurrency: 'EUR',
    feeRate: '0.005',
    rateSource: 'MOCK',
    rateFetchedAt: '2026-07-28T18:04:50Z',
    status: 'PENDING',
    createdAt: '2026-07-28T18:05:00Z',
  },
  {
    id: '4',
    walletId: 'w-1',
    type: 'BUY',
    fromCurrency: 'ARS',
    toCurrency: 'BRL',
    fromAmount: '30000',
    toAmount: '156.8',
    exchangeRate: '191.3',
    feeAmount: '0.78',
    feeCurrency: 'BRL',
    feeRate: '0.005',
    rateSource: 'MOCK',
    rateFetchedAt: '2026-07-25T11:46:50Z',
    status: 'FAILED',
    createdAt: '2026-07-25T11:47:00Z',
  },
];

function mockGetHistory(): Promise<Transaction[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_TRANSACTIONS), 900);
  });
}

// ─── Helpers de formato ─────────────────────────────────────────────────

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

function formatAmount(amount: string, currency: string): string {
  const n = parseFloat(amount);
  return `${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

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
  const rate = parseFloat(t.exchangeRate);
  return `1 ${t.fromCurrency} = ${rate.toLocaleString('es-AR', { maximumFractionDigits: 4 })} ${t.toCurrency}`;
}

function formatFee(t: Transaction): string {
  if (parseFloat(t.feeAmount) === 0) return 'Sin comisión';
  return `${formatAmount(t.feeAmount, t.feeCurrency)}`;
}

// ─── Componente ─────────────────────────────────────────────────────────

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
    mockGetHistory()
      .then(setTransactions)
      .catch(() => setError('No pudimos cargar tu historial. Intentá de nuevo.'))
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
          <div className={styles.iconBox}>⟲</div>
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
                  <span>{formatAmount(t.fromAmount, t.fromCurrency)}</span>
                  <span className={styles.arrow}>→</span>
                  <span>{formatAmount(t.toAmount, t.toCurrency)}</span>
                </div>

                <div className={styles.detailGrid}>
                  <div>
                    <p className={styles.detailLabel}>Tasa aplicada</p>
                    <p className={styles.detailValue}>{formatRate(t)}</p>
                  </div>
                  <div>
                    <p className={styles.detailLabel}>Comisión</p>
                    <p className={parseFloat(t.feeAmount) === 0 ? styles.detailValueMuted : styles.detailValue}>
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