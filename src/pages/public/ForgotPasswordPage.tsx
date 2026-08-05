import React, { useState } from 'react';
import type { ChangeEvent, FocusEvent, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import styles from './ForgotPasswordPage.module.css';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email: string): string | undefined {
  if (!email.trim()) return 'Ingresá tu email.';
  if (!EMAIL_REGEX.test(email.trim())) return 'Ingresá un email válido.';
  return undefined;
}

// Simulación de solicitud de recuperación de contraseña — todavía NO llama a la API real.
// Cuando el backend esté listo, reemplazar por:
//   import { requestPasswordReset } from '@/services/authService';
//   await requestPasswordReset(email);
function mockResetRequest(email: string): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (email.trim().toLowerCase() === 'test@error.com') {
        reject(new Error('No encontramos ninguna cuenta asociada a este email.'));
      } else {
        resolve();
      }
    }, 1000);
  });
}

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setEmail(value);
    if (touched) {
      setError(validateEmail(value));
    }
  }

  function handleBlur(_e: FocusEvent<HTMLInputElement>) {
    setTouched(true);
    setError(validateEmail(email));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const emailError = validateEmail(email);
    setError(emailError);
    setTouched(true);

    if (emailError) return;

    setSubmitting(true);
    try {
      await mockResetRequest(email);
      setSuccess(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'No pudimos procesar tu solicitud.');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className={styles.screen}>
        <div className={styles.wrapper}>
          <div className={styles.titleRow}>
            <div className={styles.iconBox}>✓</div>
            <div>
              <h1 className={styles.title}>¡Correo enviado!</h1>
              <p className={styles.subtitle}>Revisá tu bandeja de entrada</p>
            </div>
          </div>
          <div className={styles.card}>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
              Si existe una cuenta asociada a <strong style={{ color: 'var(--text)' }}>{email}</strong>, recibirás las instrucciones para restablecer tu contraseña.
            </p>
            <Link to="/login" className={styles.submitButton} style={{ textDecoration: 'none' }}>
              Volver a iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      <div className={styles.wrapper}>
        <Link to="/login" className={styles.backLink}>
          ← Volver a iniciar sesión
        </Link>
        <div className={styles.titleRow}>
          <div className={styles.iconBox}>⚿</div>
          <div>
            <h1 className={styles.title}>Recuperar contraseña</h1>
            <p className={styles.subtitle}>Ingresá tu email para restablecer la clave</p>
          </div>
        </div>

        <div className={styles.card}>
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="email">
                Email registrado
              </label>
              <input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={submitting}
                aria-invalid={!!(touched && error)}
                className={`${styles.input} ${touched && error ? styles.inputError : ''}`}
              />
              {touched && error && <p className={styles.fieldError}>{error}</p>}
            </div>

            {submitError && <p className={styles.submitError}>{submitError}</p>}

            <button type="submit" disabled={submitting} className={styles.submitButton}>
              {submitting ? 'Enviando...' : 'Enviar instrucciones'}
            </button>
          </form>
        </div>

        <p className={styles.switchText}>
          ¿Te acordaste de tu contraseña?{' '}
          <Link to="/login" className={styles.switchLink}>
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
