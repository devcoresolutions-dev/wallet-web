import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calculator,
  History,
  TrendingUp,
  Bot,
  Bell,
  Settings,
  Wallet as WalletIcon,
  LogOut,
  X,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import styles from './ProtectedLayout.module.css';
import { getWallet } from '../services/walletService';
import type { Wallet } from '../types/wallet';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  mobile: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Inicio', icon: <LayoutDashboard size={18} />, mobile: true },
  { path: '/operations', label: 'Operar', icon: <Calculator size={18} />, mobile: true },
  { path: '/transactions', label: 'Historial', icon: <History size={18} />, mobile: true },
  { path: '/analytics', label: 'Cotizaciones', icon: <TrendingUp size={18} />, mobile: false },
  { path: '/chatbot', label: 'Chat AI', icon: <Bot size={18} />, mobile: false },
  { path: '/notifications', label: 'Avisos', icon: <Bell size={18} />, mobile: false },
  { path: '/settings', label: 'Ajustes', icon: <Settings size={18} />, mobile: true },
];

export const ProtectedLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [showMiniAi, setShowMiniAi] = useState(false);

  // Cargar saldo del usuario para mostrar en el sidebar
  // Cargar saldo del usuario para mostrar en el sidebar
  useEffect(() => {
    getWallet()
      .then(setWallet)
      .catch((err) => {
        console.error('Error cargando balances en layout:', err);
      });
  }, [location.pathname]); // Recargar al cambiar de página para reflejar movimientos

  const currentPath = location.pathname;
  const currentItem = NAV_ITEMS.find((item) => item.path === currentPath);
  const pageTitle = currentItem ? currentItem.label : 'App';

  // Buscar saldo ARS o el primero disponible
  const arsBalance = wallet?.balances.find((b) => b.currencyCode === 'ARS');
  const mainBalanceFormatted = arsBalance
    ? `${parseFloat(arsBalance.amount).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}`
    : '$ 0,00';

  function handleLogout() {
    localStorage.removeItem('token');
    navigate('/login');
  }

  function handleOpenFullChat() {
    setShowMiniAi(false);
    navigate('/chatbot');
  }

  return (
    <div className={styles.container}>
      {/* ─── Desktop Sidebar ─── */}
      <aside className={styles.desktopSidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarLogoIcon}>
            <WalletIcon size={20} />
          </div>
          <div>
            <div className={styles.sidebarLogoText}>eWallet</div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-subtle)' }}>DevCore</span>
          </div>
        </div>

        <nav className={styles.sidebarNav}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `${styles.sidebarLink} ${isActive ? styles.sidebarLinkActive : ''}`
              }
            >
              <span className={styles.sidebarLinkIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.sidebarFooterLabel}>Saldo principal (ARS)</div>
          <div className={styles.sidebarFooterValue}>{mainBalanceFormatted}</div>
          <div className={styles.sidebarFooterSub}>Disponible</div>
          <button
            onClick={handleLogout}
            style={{
              marginTop: 12,
              width: '100%',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '8px',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <LogOut size={13} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* ─── Mobile Header ─── */}
      <header className={styles.mobileHeader}>
        <div className={styles.logoArea}>
          <div className={styles.logoIcon}>
            <WalletIcon size={18} />
          </div>
          <span className={styles.logoText}>eWallet</span>
        </div>

        <div className={styles.mobileHeaderRight}>
          <div className={styles.pageIndicator}>{pageTitle}</div>

          {/* Botoncito con la campanita para notificaciones en Móvil */}
          <NavLink
            to="/notifications"
            className={({ isActive }) =>
              `${styles.mobileNotificationBtn} ${isActive ? styles.mobileNotificationBtnActive : ''}`
            }
            title="Centro de Avisos y Notificaciones"
          >
            <Bell size={18} />
            <span className={styles.notificationBadge} />
          </NavLink>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main className={styles.mainContent}>
        <Outlet />
      </main>

      {/* ─── Widget Flotante de IA para Móvil (Visible en cualquier página) ─── */}
      <button
        className={styles.floatingAiWidget}
        onClick={() => setShowMiniAi(true)}
        title="Consultar al Asistente IA"
      >
        <Bot size={22} />
        <span className={styles.floatingAiBadge}>AI</span>
      </button>

      {/* ─── Mini Sheet / Drawer Rápido de IA en Móvil ─── */}
      {showMiniAi && (
        <div className={styles.miniAiBackdrop} onClick={() => setShowMiniAi(false)}>
          <div className={styles.miniAiDrawer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.miniAiHeader}>
              <h3 className={styles.miniAiTitle}>
                <Sparkles size={18} style={{ color: 'var(--accent)' }} />
                Gemini Financial Assistant
              </h3>
              <button className={styles.miniAiCloseBtn} onClick={() => setShowMiniAi(false)}>
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
              ¿Qué deseas consultar sobre tus finanzas en este momento?
            </p>

            <button className={styles.miniAiPromptBtn} onClick={handleOpenFullChat}>
              <span>📊 Analizar el rendimiento de mis saldos</span>
              <ArrowRight size={14} />
            </button>

            <button className={styles.miniAiPromptBtn} onClick={handleOpenFullChat}>
              <span>💵 Cotizaciones y mejor momento de compra</span>
              <ArrowRight size={14} />
            </button>

            <button className={styles.fullChatBtn} onClick={handleOpenFullChat}>
              <Bot size={18} />
              <span>Abrir Chat Completo de IA</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── Mobile Bottom Navigation ─── */}
      <nav className={styles.bottomNav}>
        {NAV_ITEMS.filter((item) => item.mobile).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `${styles.navTab} ${isActive ? styles.navTabActive : ''}`
            }
          >
            <div className={styles.tabIconBox}>{item.icon}</div>
            <span className={styles.tabLabel}>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default ProtectedLayout;
