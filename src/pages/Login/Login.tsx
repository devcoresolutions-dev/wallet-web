import { useState } from 'react';
import type { ChangeEvent, FocusEvent, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import styles from './Login.module.css';

// ─── Colores de acento ─────────────────────────────────────────────────
const ACCENT = '#1D9E75';

// ─── Tipos y validación ─────────────────────────────────────────────────

type Field = 'email' | 'password';

interface Values {
  email: string;
  password: string;
}

const EMPTY_VALUES: Values = {
  email: '',
  password: '',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateField(field: Field, values: Values): string | undefined {
  switch (field) {
    case 'email':
      if (!values.email.trim()) return 'Ingresá tu email.';
      if (!EMAIL_REGEX.test(values.email.trim())) return 'Ingresá un email válido.';
      return undefined;
    case 'password':
      if (!values.password) return 'Ingresá tu contraseña.';
      return undefined;
  }
}

function validateAll(values: Values) {
  const errors: Partial<Record<Field, string>> = {};
  (Object.keys(values) as Field[]).forEach((field) => {
    const error = validateField(field, values);
    if (error) errors[field] = error;
  });
  return errors;
}

// Simulación de login — todavía NO llama a la API real.
// Cuando el backend esté listo, reemplazar por:
//   import { login } from '@/services/authService';
//   const { token, user } = await login({ email: values.email, password: values.password });
function mockLoginRequest(values: Values): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Para probar el estado de error sin backend, usá esta contraseña:
      if (values.password === 'wrongpass') {
        reject(new Error('Email o contraseña incorrectos.'));
      } else {
        resolve();
      }
    }, 1000);
  });
}

// ─── Componente ─────────────────────────────────────────────────────────

export default function Login() {
  const [values, setValues] = useState<Values>(EMPTY_VALUES);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function handleChange(field: Field) {
    return (e: ChangeEvent<HTMLInputElement>) => {
      const next = { ...values, [field]: e.target.value };
      setValues(next);
      if (touched[field]) {
        setErrors((prev) => ({ ...prev, [field]: validateField(field, next) }));
      }
    };
  }

  function handleBlur(field: Field) {
    return (_e: FocusEvent<HTMLInputElement>) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      setErrors((prev) => ({ ...prev, [field]: validateField(field, values) }));
    };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const allErrors = validateAll(values);
    setErrors(allErrors);
    setTouched({ email: true, password: true });

    if (Object.keys(allErrors).length > 0) return;

    setSubmitting(true);
    try {
      await mockLoginRequest(values);
      // Acá, cuando esté conectado de verdad: setSession(token, user) + navigate('/')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'No pudimos iniciar sesión.');
    } finally {
      setSubmitting(false);
    }
  }

  function renderField(field: Field, label: string, type: string, placeholder: string) {
    const error = touched[field] ? errors[field] : undefined;
    return (
      <div className={styles.field}>
        <label className={styles.label} htmlFor={field}>
          {label}
        </label>
        <input
          id={field}
          type={type}
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
    <div className={styles.screen}>
      <div className={styles.wrapper}>
        <div className={styles.titleRow}>
          <div className={styles.iconBox}>◫</div>
          <div>
            <h1 className={styles.title}>Iniciar sesión</h1>
            <p className={styles.subtitle}>Accedé a tu billetera multi-moneda</p>
          </div>
        </div>

        <div className={styles.card}>
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {renderField('email', 'Email', 'email', 'tu@email.com')}
            {renderField('password', 'Contraseña', 'password', '••••••••')}

            {submitError && <p className={styles.submitError}>{submitError}</p>}

            <button type="submit" disabled={submitting} className={styles.submitButton} style={{ color: ACCENT }}>
              {submitting ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>
        </div>

        <p className={styles.switchText}>
          ¿No tenés cuenta?{' '}
          <Link to="/register" className={styles.switchLink} style={{ color: ACCENT }}>
            Registrate
          </Link>
        </p>
      </div>
    </div>
  );
}