import React from 'react';
import { Link } from 'react-router-dom';
import styles from './PlaceholderPage.module.css';

export const RateAnalyticsPage: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconBox}>X</div>
        <h1 className={styles.title}>Cotizaciones en Tiempo Real</h1>
        <p className={styles.description}>
          Seguí la evolución de las cotizaciones históricas de tus monedas preferidas con gráficos interactivos avanzados.
        </p>
        <Link to="/dashboard">
          <button className={styles.button}>Volver al Inicio</button>
        </Link>
      </div>
    </div>
  );
};

export default RateAnalyticsPage;
