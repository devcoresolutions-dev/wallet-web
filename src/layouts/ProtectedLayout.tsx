import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import styles from './ProtectedLayout.module.css';
import { getWallets } from '../services/walletService';
import type { Wallet } from '../types/wallet';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  mobile: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Inicio', icon: 'X', mobile: true },
  { path: '/operations', label: 'Operar', icon: 'X', mobile: true },
  { path: '/transactions', label: 'Historial', icon: 'X', mobile: true },
  { path: '/analytics', label: 'Cotizaciones', icon: 'X', mobile: false },
  { path: '/chatbot', label: 'Chat AI', icon: 'X', mobile: true },
  { path: '/notifications', label: 'Avisos', icon: 'X', mobile: false },
  { path: '/settings', label: 'Ajustes', icon: 'X', mobile: true },
];

export const ProtectedLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<Wallet | null>(null);

  // Cargar saldo del usuario para mostrar en el sidebar
  useEffect(() => {
    getWallets()
      .then((wallets) => {
        if (wallets && wallets.length > 0) {
          setWallet(wallets[0]);
        }
      })
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

  return (
    <div className={styles.container}>
      {/* ─── Desktop Sidebar ─── */}
      <aside className={styles.desktopSidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarLogoIcon}>W</div>
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
              padding: '6px',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ─── Mobile Header ─── */}
      <header className={styles.mobileHeader}>
        <div className={styles.logoArea}>
          <div className={styles.logoIcon}>W</div>
          <span className={styles.logoText}>eWallet</span>
        </div>
        <div className={styles.pageIndicator}>{pageTitle}</div>
      </header>

      {/* ─── Main Content ─── */}
      <main className={styles.mainContent}>
        <Outlet />
      </main>

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

