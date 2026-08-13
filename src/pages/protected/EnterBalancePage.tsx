import { useEffect, useRef, useState } from 'react';
import styles from './EnterBalance.module.css';

interface Currency {
  code: string;
  name: string;
  symbol: string;
}

const CURRENCIES: Currency[] = [
  { code: 'USD', name: 'Dólar Estadounidense', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'ARS', name: 'Peso Argentino', symbol: '$' },
  { code: 'BRL', name: 'Real Brasileño', symbol: 'R$' },
  { code: 'CLP', name: 'Peso Chileno', symbol: '$' },
  { code: 'COP', name: 'Peso Colombiano', symbol: '$' },
  { code: 'MXN', name: 'Peso Mexicano', symbol: '$' },
  { code: 'PEN', name: 'Sol Peruano', symbol: 'S/' },
];

const MAX_AMOUNT = 1_000_000;

type SubmitState = 'idle' | 'processing' | 'success';

function formatEsAr(value: number): string {
  return value.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export interface EnterBalanceProps {
  /** Se llama cuando el saldo se cargó con éxito */
  onSuccess?: (amount: number, currency: string) => void;
  /** Se llama al presionar el link de volver */
  onBack?: () => void;
}

export default function EnterBalance({ onSuccess, onBack }: EnterBalanceProps) {
  const [selected, setSelected] = useState<Currency>(CURRENCIES[0]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [successText, setSuccessText] = useState('');

  const selectRef = useRef<HTMLDivElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  // cerrar el menú al clickear afuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (selectRef.current && !selectRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const parsedAmount = (() => {
    const raw = amount.replace(/,/g, '.');
    const num = parseFloat(raw);
    return isNaN(num) ? null : num;
  })();

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e.target.value.replace(/[^0-9.,]/g, '');

    const raw = v.replace(/,/g, '.');
    const num = parseFloat(raw);
    if (!isNaN(num) && num > MAX_AMOUNT) {
      v = String(MAX_AMOUNT);
    }

    setAmount(v);
    setError(num > MAX_AMOUNT ? 'El monto supera el tope permitido' : '');
  }

  function handleSelectCurrency(currency: Currency) {
    setSelected(currency);
    setMenuOpen(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (parsedAmount === null || parsedAmount <= 0 || parsedAmount > MAX_AMOUNT) {
      setError('Ingresá un monto válido');
      amountInputRef.current?.focus();
      return;
    }

    setError('');
    setSubmitState('processing');

    // simula la llamada al backend
    setTimeout(() => {
      setSubmitState('success');
      setSuccessText(
        `Saldo cargado con éxito · ${formatEsAr(parsedAmount)} ${selected.code}`
      );
      onSuccess?.(parsedAmount, selected.code);

      setTimeout(() => {
        setSubmitState('idle');
        setAmount('');
      }, 2200);
    }, 1600);
  }

  const disabled = submitState !== 'idle';
  const previewText = parsedAmount !== null
    ? `${formatEsAr(parsedAmount)} ${selected.code}`
    : `0,00 ${selected.code}`;

  return (
    <div className={styles.app}>
      <div className={styles.topbar}>
        <button type="button" className={styles.back} onClick={onBack}>
          &larr; Operar
        </button>
        <span className={styles.sep}>/</span>
        <span className={styles.current}>Ingresar saldo</span>
      </div>

      <h1 className={styles.title}>Ingresar saldo</h1>
      <p className={styles.subtitle}>Cargá saldo ficticio para operar</p>

      <form className={styles.form} onSubmit={handleSubmit}>
        {/* MONEDA */}
        <div className={styles.field}>
          <div className={styles.fieldLabel}>Moneda</div>
          <div className={styles.currencySelect} ref={selectRef}>
            <button
              type="button"
              className={`${styles.currencyTrigger} ${menuOpen ? styles.open : ''} ${disabled ? styles.disabled : ''}`}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <div className={styles.left}>
                <div className={styles.currencyBadge}>{selected.code.slice(0, 2)}</div>
                <div className={styles.currencyText}>
                  <span className={styles.currencyCode}>{selected.code}</span>
                  <span className={styles.currencyName}>{selected.name}</span>
                </div>
              </div>
              <svg
                className={`${styles.chevron} ${menuOpen ? styles.open : ''}`}
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
              >
                <path
                  d="M3 5L7 9L11 5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <div className={`${styles.currencyMenu} ${menuOpen ? styles.open : ''}`}>
              {CURRENCIES.map((c) => (
                <button
                  type="button"
                  key={c.code}
                  className={`${styles.currencyOption} ${c.code === selected.code ? styles.selected : ''}`}
                  onClick={() => handleSelectCurrency(c)}
                >
                  <div className={styles.currencyBadge}>{c.code.slice(0, 2)}</div>
                  <div className={styles.currencyText}>
                    <span className={styles.currencyCode}>{c.code}</span>
                    <span className={styles.currencyName}>{c.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* MONTO */}
        <div className={styles.field}>
          <div className={styles.fieldLabel}>Monto</div>
          <div className={styles.amountInputWrap}>
            <span className={styles.amountSymbol}>{selected.symbol}</span>
            <input
              ref={amountInputRef}
              className={styles.amountInput}
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              value={amount}
              onChange={handleAmountChange}
              disabled={disabled}
            />
          </div>
          <div className={styles.amountMeta}>
            <span className={styles.amountPreview}>
              ≈ <strong>{previewText}</strong>
            </span>
            <span className={styles.amountMax}>Tope: 1.000.000</span>
          </div>
          {error && <span className={styles.amountError}>{error}</span>}
        </div>

        <button
          type="submit"
          className={`${styles.submitBtn} ${
            submitState === 'processing' ? styles.processing : ''
          } ${submitState === 'success' ? styles.success : ''}`}
          disabled={disabled}
        >
          {submitState === 'idle' && <span>Ingresar saldo</span>}

          {submitState === 'processing' && (
            <>
              <span className={styles.spinner} />
              <span>Procesando…</span>
            </>
          )}

          {submitState === 'success' && (
            <>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 8.5L6.2 11.5L13 4.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Saldo cargado</span>
            </>
          )}
        </button>

        {submitState === 'success' && (
          <div className={styles.successBanner}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" />
              <path
                d="M5 8.2L7.1 10.3L11 6"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{successText}</span>
          </div>
        )}
      </form>

      <p className={styles.disclaimer}>
        Este saldo es ficticio y se utiliza únicamente para operar dentro del entorno de
        pruebas de eWallet.
      </p>
    </div>
  );
}