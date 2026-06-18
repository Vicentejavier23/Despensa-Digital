import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import styles from './Perfil.module.css';

export default function Perfil() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  if (!usuario) return null;

  const nombreCompleto = [
    usuario.pri_nom_usuario,
    usuario.seg_nom_usuario,
    usuario.pri_ape_usuario,
    usuario.seg_ape_usuario,
  ].filter(Boolean).join(' ');

  const filas: [string, string][] = [
    ['Nombre completo', nombreCompleto],
    ['Correo',          usuario.correo_usuario],
    ['Teléfono',        `+56 ${usuario.num_tel_usuario}`],
    ['Fecha de nacimiento', usuario.fecha_nac_usuario
      ? new Date(usuario.fecha_nac_usuario).toLocaleDateString('es-CL')
      : '—'],
    ['Miembro desde', usuario.fecha_reg_usuario
      ? new Date(usuario.fecha_reg_usuario).toLocaleDateString('es-CL')
      : '—'],
  ];

  return (
    <div className={styles.perfil}>
      <h1 className={styles.titulo}>👤 Mi perfil</h1>

      {/* Avatar + nombre */}
      <div className={styles.avatarCard}>
        <div className={styles.avatar}>
          {usuario.pri_nom_usuario[0]?.toUpperCase()}
        </div>
        <div>
          <div className={styles.avatarNombre}>{nombreCompleto}</div>
          <div className={styles.avatarCorreo}>{usuario.correo_usuario}</div>
        </div>
      </div>

      {/* Datos personales */}
      <div className={styles.datosCard}>
        <div className={styles.datosHeader}>INFORMACIÓN PERSONAL</div>
        {filas.map(([campo, valor]) => (
          <div key={campo} className={styles.datosFila}>
            <span className={styles.datosCampo}>{campo}</span>
            <span className={styles.datosValor}>{valor}</span>
          </div>
        ))}
      </div>

      {/* Cerrar sesión */}
      <button className={styles.logoutBtn} onClick={handleLogout}>
        ⏻ Cerrar sesión
      </button>
    </div>
  );
}
