import React from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  Coins,
  Zap,
  BarChart2,
  ShieldCheck,
  Bot,
  BellRing,
} from 'lucide-react';
import styles from './LandingPage.module.css';

// Datos de la página

const FEATURES: { icon: React.ReactNode; title: string; desc: string }[] = [
  {
    icon: <Coins size={22} />,
    title: 'Multi-Moneda',
    desc: 'Operá con MXN, USD, EUR y más desde una sola billetera unificada.',
  },
  {
    icon: <Zap size={22} />,
    title: 'Transferencias Instantáneas',
    desc: 'Enviá y recibí dinero al instante, sin importar la moneda ni la ubicación.',
  },
  {
    icon: <BarChart2 size={22} />,
    title: 'Analítica en Tiempo Real',
    desc: 'Visualizá tus gastos, ingresos y tendencias con gráficos interactivos.',
  },
  {
    icon: <ShieldCheck size={22} />,
    title: 'Seguridad Avanzada',
    desc: 'Cifrado de extremo a extremo, autenticación de dos factores y más.',
  },
  {
    icon: <Bot size={22} />,
    title: 'Asistente IA',
    desc: 'Nuestro chatbot inteligente resuelve tus dudas y optimiza tu flujo financiero.',
  },
  {
    icon: <BellRing size={22} />,
    title: 'Notificaciones Inteligentes',
    desc: 'Alertas personalizadas para movimientos, tipos de cambio y vencimientos.',
  },
];

const STEPS = [
  {
    number: '01',
    title: 'Creá tu Cuenta',
    desc: 'Registrate en menos de 2 minutos con tu correo electrónico.',
  },
  {
    number: '02',
    title: 'Fondea tu Billetera',
    desc: 'Depositá fondos en la moneda que prefieras de forma segura.',
  },
  {
    number: '03',
    title: 'Operá sin Límites',
    desc: 'Transferí, convertí y administrá tu dinero desde cualquier lugar.',
  },
];

const STATS = [
  { value: '25K+', label: 'Usuarios Activos' },
  { value: '5M+', label: 'Transacciones Procesadas' },
  { value: '99.99%', label: 'Uptime Garantizado' },
];

//Scroll helper

function scrollTo(id: string) {
  return (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };
}

// Componente principal de Landing Page

export const LandingPage: React.FC = () => {
  return (
    <div>
      {/* Barra de navegación */}
      <nav className={styles.navbar} id="landing-navbar">
        <Link to="/" className={styles.navLogo}>
          <Wallet size={22} className={styles.navLogoIcon} />
          <span className={styles.navLogoText}>DevPocket</span>
        </Link>

        <div className={styles.navLinks}>
          <button className={styles.navLink} onClick={scrollTo('features')}>
            Características
          </button>
          <button className={styles.navLink} onClick={scrollTo('how-it-works')}>
            Cómo Funciona
          </button>
          <button className={styles.navLink} onClick={scrollTo('cta')}>
            Contacto
          </button>
        </div>

        <div className={styles.navActions}>
          <Link to="/login" className={styles.navBtnOutline}>
            Iniciar Sesión
          </Link>
          <Link to="/register" className={styles.navBtnSolid}>
            Registrarse
          </Link>
        </div>
      </nav>

      {/* ─── HERO ───────────────────────────────────────────────────────── */}
      <section className={styles.hero} id="hero">
        <span className={styles.heroBadge}>
          <span className={styles.heroBadgeDot} />
          Plataforma en línea
        </span>

        <h1 className={styles.heroTitle}>
          Tu Dinero, <span className={styles.heroTitleAccent}>Sin Fronteras</span>
        </h1>

        <p className={styles.heroSubtitle}>
          La billetera digital multi-moneda diseñada para el futuro. Enviá, recibí
          y convertí divisas al instante con la seguridad que merecés.
        </p>

        <div className={styles.heroCtas}>
          <Link to="/register" className={styles.btnPrimary}>
            Crear Cuenta Gratis →
          </Link>
          <button className={styles.btnSecondary} onClick={scrollTo('features')}>
            Descubrí Más ↓
          </button>
        </div>
      </section>

      {/* ─── STATS BAR ──────────────────────────────────────────────────── */}
      <div className={styles.statsBar} id="stats">
        {STATS.map((stat) => (
          <div className={styles.statItem} key={stat.label}>
            <p className={styles.statValue}>{stat.value}</p>
            <p className={styles.statLabel}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ─── FEATURES ───────────────────────────────────────────────────── */}
      <section className={styles.section} id="features">
        <div className={styles.sectionInner}>
          <span className={styles.sectionTag}>Características</span>
          <h2 className={styles.sectionTitle}>Todo lo que Necesitás</h2>
          <p className={styles.sectionDesc}>
            Herramientas poderosas que simplifican tus finanzas personales e
            internacionales.
          </p>

          <div className={styles.featuresGrid}>
            {FEATURES.map((f) => (
              <div className={styles.featureCard} key={f.title}>
                <div className={styles.featureIcon}>{f.icon}</div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ───────────────────────────────────────────────── */}
      <section className={styles.section} id="how-it-works">
        <div className={styles.sectionInner}>
          <span className={styles.sectionTag}>Cómo Funciona</span>
          <h2 className={styles.sectionTitle}>En 3 Simples Pasos</h2>
          <p className={styles.sectionDesc}>
            Empezá a operar en minutos. Sin papeleos, sin complicaciones.
          </p>

          <div className={styles.stepsGrid}>
            {STEPS.map((s) => (
              <div className={styles.stepCard} key={s.number}>
                <span className={styles.stepNumber}>{s.number}</span>
                <h3 className={styles.stepTitle}>{s.title}</h3>
                <p className={styles.stepDesc}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ────────────────────────────────────────────────────────── */}
      <section className={styles.ctaSection} id="cta">
        <div className={styles.ctaCard}>
          <h2 className={styles.ctaTitle}>
            Empezá a Controlar tu Dinero Hoy
          </h2>
          <p className={styles.ctaDesc}>
            Unite a miles de usuarios que ya confían en DevPocket para sus
            finanzas digitales. Registrate gratis y descubrí una nueva forma de
            operar.
          </p>
          <div className={styles.ctaActions}>
            <Link to="/register" className={styles.btnPrimary}>
              Crear Cuenta Gratis →
            </Link>
            <Link to="/login" className={styles.btnSecondary}>
              Ya Tengo Cuenta
            </Link>
          </div>
          <div className={styles.ctaContact}>
            <p className={styles.contactText}>
              ¿Tenés alguna consulta o necesitas soporte? Contactanos en{' '}
              <a href="mailto:teamdevcoresolutions@gmail.com" className={styles.contactEmail}>
                teamdevcoresolutions@gmail.com
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className={styles.footer} id="landing-footer">
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <Wallet size={20} className={styles.footerLogoIcon} />
            <span className={styles.footerBrandText}>DevPocket</span>
          </div>

          <div className={styles.footerLinks}>
            <button className={styles.footerLink} onClick={scrollTo('features')}>
              Características
            </button>
            <button className={styles.footerLink} onClick={scrollTo('how-it-works')}>
              Cómo Funciona
            </button>
            <Link to="/login" className={styles.footerLink}>
              Iniciar Sesión
            </Link>
            <Link to="/register" className={styles.footerLink}>
              Registrarse
            </Link>
          </div>

          <p className={styles.footerCopy}>
            © {new Date().getFullYear()} DevPocket. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
