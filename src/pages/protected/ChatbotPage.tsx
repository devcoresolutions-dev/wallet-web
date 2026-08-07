import React from 'react';
import { Link } from 'react-router-dom';
import styles from './PlaceholderPage.module.css';

export const ChatbotPage: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconBox}>X</div>
        <h1 className={styles.title}>Asistente Financiero IA</h1>
        <p className={styles.description}>
          Hacé consultas conversacionales con Inteligencia Artificial sobre tus finanzas personales y obtené reportes a medida.
        </p>
        <Link to="/dashboard">
          <button className={styles.button}>Volver al Inicio</button>
        </Link>
      </div>
    </div>
  );
};

export default ChatbotPage;
