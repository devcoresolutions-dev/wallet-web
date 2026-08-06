import { useState } from 'react';
import type { ChangeEvent, FocusEvent, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './LoginPage.module.css';
import { loginUser, ApiError } from '../../services/authService';

// Tipos y validación

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

// Componente

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
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
      const emailLower = values.email.trim().toLowerCase();
      if (emailLower === 'test@ewallet.com') {
        // Bypass para pruebas locales con datos mockeados
        localStorage.setItem('token', 'mock-token');
        navigate('/dashboard');
        return;
      }

      const { token } = await loginUser({
        email: emailLower,
        password: values.password,
      });
      // Guardar el token JWT
      localStorage.setItem('token', token);
      // Redirigir al dashboard
      navigate('/dashboard');
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message || 'Email o contraseña incorrectos.');
      } else {
        setSubmitError('Error de conexión. Verificá tu internet e intentá de nuevo.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  function renderField(field: Field, label: string, type: string, placeholder: string) {
    const error = touched[field] ? errors[field] : undefined;
    return (
      <div className={styles.field}>
        <div className={styles.labelRow}>
          <label className={styles.label} htmlFor={field}>
            {label}
          </label>
          {field === 'password' && (
            <Link to="/forgot-password" className={styles.forgotLink}>
              ¿Olvidaste tu contraseña?
            </Link>
          )}
        </div>
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
        <Link to="/" className={styles.backLink}>
          ← Volver al inicio
        </Link>
        <div className={styles.titleRow}>
          <div className={styles.iconBox}>X</div>
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

            <button type="submit" disabled={submitting} className={styles.submitButton}>
              {submitting ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>
        </div>

        <p className={styles.switchText}>
          ¿No tenés cuenta?{' '}
          <Link to="/register" className={styles.switchLink}>
            Registrate
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
