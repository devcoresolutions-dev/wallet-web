import React from 'react';
import { Link } from 'react-router-dom';
import styles from './PlaceholderPage.module.css';

export const OperationsPage: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconBox}>X</div>
        <h1 className={styles.title}>Operaciones de Divisas</h1>
        <p className={styles.description}>
          Aquí podrás realizar operaciones de Compra, Venta e Intercambio de moneda extranjera en tiempo real con bajas comisiones.
        </p>
        <Link to="/dashboard">
          <button className={styles.button}>Volver al Inicio</button>
        </Link>
      </div>
    </div>
  );
};

export default OperationsPage;
