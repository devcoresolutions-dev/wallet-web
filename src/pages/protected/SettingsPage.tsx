import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './SettingsPage.module.css';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconBox}>X</div>
        <h1 className={styles.title}>Ajustes y Configuración</h1>
        <p className={styles.description}>
          Configurá tus datos personales, métodos de cobro, cuentas bancarias asociadas y alertas personalizadas de tipo de cambio.
        </p>
        <Link to="/dashboard">
          <button className={styles.button}>Volver al Inicio</button>
        </Link>
      </div>

      <button onClick={handleLogout} className={styles.floatingLogout}>
        <span>X</span> Cerrar Sesión
      </button>
    </div>
  );
};

export default SettingsPage;
