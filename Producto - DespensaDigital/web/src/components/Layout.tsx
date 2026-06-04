import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Layout.module.css';

const NAV_ITEMS = [
  { to: '/dashboard',    icon: '⊞', label: 'Dashboard'     },
  { to: '/inventario',   icon: '📦', label: 'Inventario'    },
  { to: '/patologias',   icon: '🩺', label: 'Patologías'   },
  { to: '/lista-compras',icon: '🛒', label: 'Lista compras' },
  { to: '/perfil',       icon: '👤', label: 'Mi perfil'     },
];

export default function Layout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const nombreCorto = usuario
    ? `${usuario.pri_nom_usuario} ${usuario.pri_ape_usuario}`
    : 'Usuario';

  return (
    <div className={styles.shell}>
      {/* ── Overlay móvil ──────────────────────────────────────── */}
      {menuAbierto && (
        <div
          className={styles.overlay}
          onClick={() => setMenuAbierto(false)}
        />
      )}

      {/* ── Sidebar ────────────────────────────────────────────── */}
      <aside className={`${styles.sidebar} ${menuAbierto ? styles.sidebarOpen : ''}`}>
        {/* Logo */}
        <div className={styles.brand}>
          <span className={styles.brandEmoji}>🥗</span>
          <div>
            <span className={styles.brandName}>DespensaDigital</span>
            <span className={styles.brandTagline}>Que nada venza</span>
          </div>
        </div>

        {/* Nav */}
        <nav className={styles.nav}>
          {NAV_ITEMS.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
              }
              onClick={() => setMenuAbierto(false)}
            >
              <span className={styles.navIcon}>{icon}</span>
              <span className={styles.navLabel}>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer sidebar — usuario + logout */}
        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {usuario?.pri_nom_usuario?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className={styles.userDetails}>
              <span className={styles.userName}>{nombreCorto}</span>
              <span className={styles.userEmail}>{usuario?.correo_usuario}</span>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout} title="Cerrar sesión">
            ⏻
          </button>
        </div>
      </aside>

      {/* ── Área principal ─────────────────────────────────────── */}
      <div className={styles.main}>
        {/* Topbar móvil */}
        <header className={styles.topbar}>
          <button
            className={styles.menuBtn}
            onClick={() => setMenuAbierto(true)}
            aria-label="Abrir menú"
          >
            ☰
          </button>
          <span className={styles.topbarTitle}>🥗 DespensaDigital</span>
        </header>

        {/* Contenido de la página */}
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
