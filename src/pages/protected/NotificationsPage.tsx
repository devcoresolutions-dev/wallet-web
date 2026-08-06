import React from 'react';
import { Link } from 'react-router-dom';
import styles from './PlaceholderPage.module.css';

export const NotificationsPage: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconBox}>X</div>
        <h1 className={styles.title}>Centro de Avisos</h1>
        <p className={styles.description}>
          Acá vas a recibir notificaciones automáticas y alertas sobre el estado de tus transacciones y movimientos.
        </p>
        <Link to="/dashboard">
          <button className={styles.button}>Volver al Inicio</button>
        </Link>
      </div>
    </div>
  );
};

export default NotificationsPage;
