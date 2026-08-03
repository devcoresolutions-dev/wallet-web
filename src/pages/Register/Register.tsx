import { useState } from 'react';
import type { ChangeEvent, FocusEvent, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import styles from './Register.module.css';

// ─── Colores de acento (mismo verde usado en Login) ───────────────────────
const ACCENT = '#1D9E75';

// ─── Tipos y validación ─────────────────────────────────────────────────

type Field = 'fullName' | 'email' | 'password' | 'confirmPassword';

interface Values {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const EMPTY_VALUES: Values = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateField(field: Field, values: Values): string | undefined {
  switch (field) {
    case 'fullName':
      if (!values.fullName.trim()) return 'Ingresá tu nombre completo.';
      if (values.fullName.trim().length < 2) return 'El nombre es demasiado corto.';
      return undefined;
    case 'email':
      if (!values.email.trim()) return 'Ingresá tu email.';
      if (!EMAIL_REGEX.test(values.email.trim())) return 'Ingresá un email válido.';
      return undefined;
    case 'password':
      if (!values.password) return 'Ingresá una contraseña.';
      if (values.password.length < 8) return 'Debe tener al menos 8 caracteres.';
      return undefined;
    case 'confirmPassword':
      if (!values.confirmPassword) return 'Confirmá tu contraseña.';
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

// Simulación de registro — todavía NO llama a la API real.
// Cuando el backend esté listo, reemplazar este bloque por:
//   import { register } from '@/services/authService';
//   await register({ fullName: values.fullName, email: values.email, password: values.password });
function mockRegisterRequest(values: Values): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Para probar el estado de error sin backend, registrate con este email:
      if (values.email.trim().toLowerCase() === 'test@error.com') {
        reject(new Error('Ese email ya está registrado.'));
      } else {
        resolve();
      }
    }, 1200);
  });
}

// ─── Componente ─────────────────────────────────────────────────────────

export default function Register() {
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

      // Revalida en vivo solo lo que el usuario ya tocó, para no marcar
      // error antes de que termine de escribir por primera vez.
      if (touched[field]) {
        setErrors((prev) => ({ ...prev, [field]: validateField(field, next) }));
      }
      // Si cambia la contraseña, re-chequea la confirmación también.
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
    setTouched({ fullName: true, email: true, password: true, confirmPassword: true });

    if (Object.keys(allErrors).length > 0) return;

    setSubmitting(true);
    try {
      await mockRegisterRequest(values);
      setSuccess(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'No pudimos crear tu cuenta.');
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
              <h1 className={styles.title}>¡Cuenta creada!</h1>
              <p className={styles.subtitle}>Ya podés iniciar sesión con tus datos.</p>
            </div>
          </div>
          <div className={styles.card}>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: '#333', marginBottom: 16 }}>
              Registramos a <strong style={{ color: '#000' }}>{values.fullName}</strong> con el email{' '}
              <strong style={{ color: '#000' }}>{values.email}</strong>.
            </p>
            <Link to="/login" className={styles.submitButton} style={{ display: 'block', textAlign: 'center', color: ACCENT, textDecoration: 'none' }}>
              Ir a iniciar sesión
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
          <div className={styles.iconBox}>✧</div>
          <div>
            <h1 className={styles.title}>Crear cuenta</h1>
            <p className={styles.subtitle}>Empezá a gestionar tus ingresos en distintas monedas</p>
          </div>
        </div>

        <div className={styles.card}>
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {renderField('fullName', 'Nombre completo', 'text', 'Juan Pérez')}
            {renderField('email', 'Email', 'email', 'tu@email.com')}
            {renderField('password', 'Contraseña', 'password', '••••••••')}
            {renderField('confirmPassword', 'Confirmar contraseña', 'password', '••••••••')}

            {submitError && <p className={styles.submitError}>{submitError}</p>}

            <button type="submit" disabled={submitting} className={styles.submitButton} style={{ color: ACCENT }}>
              {submitting ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>
        </div>

        <p className={styles.switchText}>
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className={styles.switchLink} style={{ color: ACCENT }}>
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}