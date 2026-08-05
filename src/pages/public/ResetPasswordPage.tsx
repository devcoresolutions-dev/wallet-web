import React, { useState } from 'react';
import type { ChangeEvent, FocusEvent, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import styles from './ResetPasswordPage.module.css';

type Field = 'password' | 'confirmPassword';

interface Values {
  password: string;
  confirmPassword: string;
}

const EMPTY_VALUES: Values = {
  password: '',
  confirmPassword: '',
};

function validateField(field: Field, values: Values): string | undefined {
  switch (field) {
    case 'password':
      if (!values.password) return 'Ingresá tu nueva contraseña.';
      if (values.password.length < 8) return 'Debe tener al menos 8 caracteres.';
      return undefined;
    case 'confirmPassword':
      if (!values.confirmPassword) return 'Confirmá tu nueva contraseña.';
      if (values.confirmPassword !== values.password) return 'Las contraseñas no coinciden.';
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

function mockResetPassword(values: Values): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (values.password === 'error1234') {
        reject(new Error('El token de restablecimiento ha expirado o es inválido.'));
      } else {
        resolve();
      }
    }, 1000);
  });
}

export const ResetPasswordPage: React.FC = () => {
  const [values, setValues] = useState<Values>(EMPTY_VALUES);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleChange(field: Field) {
    return (e: ChangeEvent<HTMLInputElement>) => {
      const next = { ...values, [field]: e.target.value };
      setValues(next);

      if (touched[field]) {
        setErrors((prev) => ({ ...prev, [field]: validateField(field, next) }));
      }
      if (field === 'password' && touched.confirmPassword) {
        setErrors((prev) => ({ ...prev, confirmPassword: validateField('confirmPassword', next) }));
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
    setTouched({ password: true, confirmPassword: true });

    if (Object.keys(allErrors).length > 0) return;

    setSubmitting(true);
    try {
      await mockResetPassword(values);
      setSuccess(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'No pudimos actualizar tu contraseña.');
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

  if (success) {
    return (
      <div className={styles.screen}>
        <div className={styles.wrapper}>
          <div className={styles.titleRow}>
            <div className={styles.iconBox}>✓</div>
            <div>
              <h1 className={styles.title}>¡Contraseña actualizada!</h1>
              <p className={styles.subtitle}>Tu clave ha sido cambiada correctamente.</p>
            </div>
          </div>
          <div className={styles.card}>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.6 }}>
              Ya podés ingresar a tu billetera con tu nueva contraseña.
            </p>
            <Link to="/login" className={styles.submitButton} style={{ textDecoration: 'none' }}>
              Iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      <div className={styles.wrapper}>
        <div className={styles.titleRow}>
          <div className={styles.iconBox}>🔐</div>
          <div>
            <h1 className={styles.title}>Nueva contraseña</h1>
            <p className={styles.subtitle}>Ingresá tu nueva clave para acceder</p>
          </div>
        </div>

        <div className={styles.card}>
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {renderField('password', 'Nueva contraseña', 'password', '••••••••')}
            {renderField('confirmPassword', 'Confirmar nueva contraseña', 'password', '••••••••')}

            {submitError && <p className={styles.submitError}>{submitError}</p>}

            <button type="submit" disabled={submitting} className={styles.submitButton}>
              {submitting ? 'Guardando...' : 'Cambiar contraseña'}
            </button>
          </form>
        </div>

        <p className={styles.switchText}>
          ¿Volver al inicio?{' '}
          <Link to="/login" className={styles.switchLink}>
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
