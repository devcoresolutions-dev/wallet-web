import { useState } from 'react';
import type { ChangeEvent, FocusEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SettingsPage.module.css';
import { useTheme } from '@/contexts/ThemeContext';
import type { ThemeMode } from '@/contexts/ThemeContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useAuth } from '@/hooks/useAuth';

// ─── Switch reutilizable ────────────────────────────────────────────────

function Switch({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`${styles.switch} ${checked ? styles.switchOn : ''}`}
    >
      <span className={styles.switchThumb} />
    </button>
  );
}

// ─── Formulario de cambio de contraseña ────────────────────────────────

type PasswordField = 'currentPassword' | 'newPassword' | 'confirmPassword';

interface PasswordValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const EMPTY_PASSWORD_VALUES: PasswordValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

function validatePasswordField(field: PasswordField, values: PasswordValues): string | undefined {
  switch (field) {
    case 'currentPassword':
      if (!values.currentPassword) return 'Ingresá tu contraseña actual.';
      return undefined;
    case 'newPassword':
      if (!values.newPassword) return 'Ingresá una contraseña nueva.';
      if (values.newPassword.length < 8) return 'Debe tener al menos 8 caracteres.';
      if (values.newPassword === values.currentPassword) return 'Tiene que ser distinta a la actual.';
      return undefined;
    case 'confirmPassword':
      if (!values.confirmPassword) return 'Confirmá la contraseña nueva.';
      if (values.confirmPassword !== values.newPassword) return 'Las contraseñas no coinciden.';
      return undefined;
  }
}

function validateAllPassword(values: PasswordValues) {
  const errors: Partial<Record<PasswordField, string>> = {};
  (Object.keys(values) as PasswordField[]).forEach((field) => {
    const error = validatePasswordField(field, values);
    if (error) errors[field] = error;
  });
  return errors;
}

// Simulación — todavía NO llama a la API real.
// Reemplazar por POST /auth/change-password cuando el backend esté listo.
function mockChangePassword(values: PasswordValues): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (values.currentPassword === 'wrongpass') {
        reject(new Error('La contraseña actual es incorrecta.'));
      } else {
        resolve();
      }
    }, 1000);
  });
}

function ChangePasswordForm() {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<PasswordValues>(EMPTY_PASSWORD_VALUES);
  const [errors, setErrors] = useState<Partial<Record<PasswordField, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<PasswordField, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleChange(field: PasswordField) {
    return (e: ChangeEvent<HTMLInputElement>) => {
      const next = { ...values, [field]: e.target.value };
      setValues(next);
      setSuccess(false);
      if (touched[field]) {
        setErrors((prev) => ({ ...prev, [field]: validatePasswordField(field, next) }));
      }
    };
  }

  function handleBlur(field: PasswordField) {
    return (_e: FocusEvent<HTMLInputElement>) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      setErrors((prev) => ({ ...prev, [field]: validatePasswordField(field, values) }));
    };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const allErrors = validateAllPassword(values);
    setErrors(allErrors);
    setTouched({ currentPassword: true, newPassword: true, confirmPassword: true });

    if (Object.keys(allErrors).length > 0) return;

    setSubmitting(true);
    try {
      await mockChangePassword(values);
      setSuccess(true);
      setValues(EMPTY_PASSWORD_VALUES);
      setTouched({});
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'No pudimos cambiar tu contraseña.');
    } finally {
      setSubmitting(false);
    }
  }

  function renderField(field: PasswordField, label: string, placeholder: string) {
    const error = touched[field] ? errors[field] : undefined;
    return (
      <div className={styles.field}>
        <label className={styles.label} htmlFor={field}>
          {label}
        </label>
        <input
          id={field}
          type="password"
          placeholder={placeholder}
          value={values[field]}
          onChange={handleChange(field)}
          onBlur={handleBlur(field)}
          disabled={submitting}
          aria-invalid={!!error}
          className={`${styles.input} ${error ? styles.inputError : ''}`}
        />
        {error && <p className={styles.fieldError}>{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <button type="button" className={styles.actionButton} onClick={() => setOpen((v) => !v)}>
        <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Cambiar contraseña
          <span className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}>›</span>
        </span>
      </button>

      {open && (
        <form className={styles.passwordForm} onSubmit={handleSubmit} noValidate>
          {renderField('currentPassword', 'Contraseña actual', '••••••••')}
          {renderField('newPassword', 'Contraseña nueva', '••••••••')}
          {renderField('confirmPassword', 'Confirmar contraseña nueva', '••••••••')}

          {submitError && <p className={`${styles.formFeedback} ${styles.formFeedbackError}`}>{submitError}</p>}
          {success && (
            <p className={`${styles.formFeedback} ${styles.formFeedbackSuccess}`}>
              Contraseña actualizada correctamente.
            </p>
          )}

          <button type="submit" disabled={submitting} className={styles.submitButton}>
            {submitting ? 'Guardando...' : 'Guardar contraseña'}
          </button>
        </form>
      )}
    </div>
  );
}

// ─── Página principal ───────────────────────────────────────────────────

const THEME_OPTIONS: Array<{ key: ThemeMode; label: string }> = [
  { key: 'light', label: 'Claro' },
  { key: 'dark', label: 'Oscuro' },
  { key: 'auto', label: 'Automático' },
];

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { notificationsEnabled, setNotificationsEnabled, hideBalanceOnEntry, setHideBalanceOnEntry } =
    usePreferences();
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className={styles.screen}>
      <div className={styles.wrapper}>
        <div className={styles.titleRow}>
          <div className={styles.iconBox}>⚙</div>
          <div>
            <h1 className={styles.title}>Ajustes</h1>
            <p className={styles.subtitle}>Personalizá tu cuenta y tu experiencia en la app</p>
          </div>
        </div>

        {/* ── Apariencia ── */}
        <div className={styles.section}>
          <p className={styles.sectionTitle}>Apariencia</p>
          <div className={styles.card}>
            <div className={styles.segmented}>
              {THEME_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  className={`${styles.segmentButton} ${theme === opt.key ? styles.segmentButtonActive : ''}`}
                  onClick={() => setTheme(opt.key)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Notificaciones ── */}
        <div className={styles.section}>
          <p className={styles.sectionTitle}>Notificaciones</p>
          <div className={styles.card}>
            <div className={styles.row}>
              <div>
                <p className={styles.rowLabel}>Activar notificaciones</p>
                <p className={styles.rowDescription}>
                  Emails de bienvenida, confirmaciones de transacción y avisos de seguridad.
                </p>
              </div>
              <Switch
                checked={notificationsEnabled}
                onChange={() => setNotificationsEnabled(!notificationsEnabled)}
                label="Activar notificaciones"
              />
            </div>
          </div>
        </div>

        {/* ── Seguridad ── */}
        <div className={styles.section}>
          <p className={styles.sectionTitle}>Seguridad</p>
          <div className={styles.card}>
            <ChangePasswordForm />

            <div className={`${styles.row} ${styles.rowDivider}`}>
              <div>
                <p className={styles.rowLabel}>Mostrar saldo al ingresar</p>
                <p className={styles.rowDescription}>
                  Si lo desactivás, el balance aparece oculto hasta que lo toques.
                </p>
              </div>
              <Switch
                checked={!hideBalanceOnEntry}
                onChange={() => setHideBalanceOnEntry(!hideBalanceOnEntry)}
                label="Mostrar saldo al ingresar"
              />
            </div>
          </div>

          <button className={styles.dangerButton} onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}