import React, { useState } from 'react';
import { Bell, CheckCircle2, ShieldCheck, Zap, Info, Check, Trash2 } from 'lucide-react';
import styles from './NotificationsPage.module.css';

interface NotificationItem {
  id: string;
  type: 'SUCCESS' | 'SECURITY' | 'MARKET' | 'SYSTEM';
  title: string;
  description: string;
  time: string;
  isRead: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    type: 'SUCCESS',
    title: 'Operación de Compra Ejecutada',
    description: 'Compraste $500.00 USD utilizando $447,750.00 ARS. Tu saldo fue acreditado correctamente.',
    time: 'Hace 2 horas',
    isRead: false,
  },
  {
    id: 'n2',
    type: 'MARKET',
    title: 'Alerta de Mercado: USD / ARS',
    description: 'El Dólar Estadounidense se mantiene en un rango estable con bajo nivel de volatilidad hoy.',
    time: 'Hace 5 horas',
    isRead: false,
  },
  {
    id: 'n3',
    type: 'SECURITY',
    title: 'Inicio de Sesión Detectado',
    description: 'Se registró un inicio de sesión desde un nuevo dispositivo Windows (Chrome Browser).',
    time: 'Hace 1 día',
    isRead: true,
  },
  {
    id: 'n4',
    type: 'SYSTEM',
    title: 'Bienvenido a eWallet',
    description: 'Tu billetera multidivisa está lista. Puedes realizar intercambios directos y consultar a nuestro asistente con IA.',
    time: 'Hace 2 días',
    isRead: true,
  },
];

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  function clearAll() {
    setNotifications([]);
  }

  function getTypeStyle(type: NotificationItem['type']) {
    switch (type) {
      case 'SUCCESS':
        return { bg: 'rgba(78, 186, 111, 0.15)', color: '#4EBA6F', icon: <CheckCircle2 size={20} /> };
      case 'SECURITY':
        return { bg: 'rgba(194, 59, 59, 0.15)', color: '#C23B3B', icon: <ShieldCheck size={20} /> };
      case 'MARKET':
        return { bg: 'rgba(212, 175, 55, 0.15)', color: '#D4AF37', icon: <Zap size={20} /> };
      default:
        return { bg: 'rgba(79, 172, 254, 0.15)', color: '#4FACFE', icon: <Info size={20} /> };
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Centro de Avisos</h1>
          <p className={styles.subtitle}>
            Recibe notificaciones automáticas y alertas sobre el estado de tus transacciones.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={markAllAsRead}
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text)',
              borderRadius: 10,
              padding: '8px 14px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Check size={14} />
            <span>Marcar Leídas</span>
          </button>

          <button
            onClick={clearAll}
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-subtle)',
              borderRadius: 10,
              padding: '8px 14px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Trash2 size={14} />
            <span>Limpiar</span>
          </button>
        </div>
      </div>

      <div className={styles.list}>
        {notifications.length > 0 ? (
          notifications.map((n) => {
            const style = getTypeStyle(n.type);
            return (
              <div
                key={n.id}
                className={`${styles.item} ${!n.isRead ? styles.unread : ''}`}
              >
                <div className={styles.iconBox} style={{ background: style.bg, color: style.color }}>
                  {style.icon}
                </div>
                <div className={styles.itemContent}>
                  <h3 className={styles.itemTitle}>{n.title}</h3>
                  <p className={styles.itemDesc}>{n.description}</p>
                  <span className={styles.itemTime}>{n.time}</span>
                </div>
              </div>
            );
          })
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              background: 'var(--bg-card)',
              borderRadius: 16,
              border: '1px solid var(--border)',
              color: 'var(--text-subtle)',
            }}
          >
            <Bell size={32} style={{ marginBottom: 12, color: 'var(--text-subtle)' }} />
            <div>No tienes notificaciones pendientes.</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
