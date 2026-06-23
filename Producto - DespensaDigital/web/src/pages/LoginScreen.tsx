import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPaises, getRegiones, getCiudades, getComunas } from '../api/geoApi';
import type { Pais, Region, Ciudad, Comuna } from '../types';

const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

// ─── Tipos de error por campo ─────────────────────────────────────────────────
type LoginErrors = Partial<Record<'correo' | 'password', string>>;
type RegisterErrors = Partial<Record<
  | 'nombre' | 'segNombre' | 'apellido' | 'segApellido'
  | 'correo' | 'telefono' | 'fechaNac'
  | 'password' | 'confirmPassword'
  | 'pais' | 'region' | 'ciudad' | 'comuna'
  | 'calle' | 'numeroDireccion',
  string
>>;

export default function LoginScreen() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { iniciarSesion } = useAuth();

  const isRegisterPage = location.pathname === '/register';
  const [mode, setMode] = useState<'login' | 'register'>(isRegisterPage ? 'register' : 'login');
  const [loading, setLoading] = useState(false);

  // ── Login fields ──
  const [loginCorreo,   setLoginCorreo]   = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginErrors,   setLoginErrors]   = useState<LoginErrors>({});

  // ── Register fields ──
  // Identidad
  const [nombre,          setNombre]          = useState('');
  const [segNombre,       setSegNombre]       = useState('');
  const [apellido,        setApellido]        = useState('');
  const [segApellido,     setSegApellido]     = useState('');
  // Contacto
  const [correo,          setCorreo]          = useState('');
  const [telefono,        setTelefono]        = useState('');
  const [fechaNac,        setFechaNac]        = useState('');
  // Contraseña
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Dirección
  const [calle,           setCalle]           = useState('');
  const [numeroDireccion, setNumeroDireccion] = useState('');
  // Errores
  const [regErrors,       setRegErrors]       = useState<RegisterErrors>({});

  // ── Geo state ──
  const [paises,   setPaises]   = useState<Pais[]>([]);
  const [regiones, setRegiones] = useState<Region[]>([]);
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [comunas,  setComunas]  = useState<Comuna[]>([]);
  const [selPais,   setSelPais]   = useState('');
  const [selRegion, setSelRegion] = useState('');
  const [selCiudad, setSelCiudad] = useState('');
  const [selComuna, setSelComuna] = useState('');

  useEffect(() => {
    getPaises().then(setPaises).catch(() => {});
  }, []);

  const onPaisChange = useCallback(async (id: string) => {
    setSelPais(id); setSelRegion(''); setSelCiudad(''); setSelComuna('');
    setRegiones([]); setCiudades([]); setComunas([]);
    if (id) { try { setRegiones(await getRegiones(Number(id))); } catch { /* noop */ } }
  }, []);

  const onRegionChange = useCallback(async (id: string) => {
    setSelRegion(id); setSelCiudad(''); setSelComuna('');
    setCiudades([]); setComunas([]);
    if (id) { try { setCiudades(await getCiudades(Number(id))); } catch { /* noop */ } }
  }, []);

  const onCiudadChange = useCallback(async (id: string) => {
    setSelCiudad(id); setSelComuna('');
    setComunas([]);
    if (id) { try { setComunas(await getComunas(Number(id))); } catch { /* noop */ } }
  }, []);

  // ── VALIDACIÓN LOGIN ──────────────────────────────────────────────────────
  function validarLogin(): LoginErrors {
    const errs: LoginErrors = {};
    if (!loginCorreo.trim())
      errs.correo = 'El correo electrónico es obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginCorreo))
      errs.correo = 'Ingresa un correo válido (ej: nombre@gmail.com)';
    if (!loginPassword)
      errs.password = 'La contraseña es obligatoria';
    return errs;
  }

  // ── VALIDACIÓN REGISTRO ───────────────────────────────────────────────────
  function validarRegistro(): RegisterErrors {
    const errs: RegisterErrors = {};

    // Nombre y apellidos
    if (!nombre.trim())
      errs.nombre = 'El nombre es obligatorio';
    if (!apellido.trim())
      errs.apellido = 'El apellido es obligatorio';

    // Correo
    if (!correo.trim())
      errs.correo = 'El correo electrónico es obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo))
      errs.correo = 'Ingresa un correo válido (ej: nombre@gmail.com)';

    // Teléfono
    if (!telefono.trim())
      errs.telefono = 'El teléfono es obligatorio';
    else if (!/^\d{9}$/.test(telefono))
      errs.telefono = 'El teléfono debe tener 9 dígitos sin el +56 (ej: 912345678)';

    // Fecha de nacimiento
    if (!fechaNac)
      errs.fechaNac = 'La fecha de nacimiento es obligatoria';
    else {
      const edad = (Date.now() - new Date(fechaNac).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      if (edad < 13) errs.fechaNac = 'Debes tener al menos 13 años para registrarte';
    }

    // Contraseña
    if (!password)
      errs.password = 'La contraseña es obligatoria';
    else if (password.length < 8)
      errs.password = 'La contraseña debe tener al menos 8 caracteres';
    else if (!/[A-Z]/.test(password))
      errs.password = 'La contraseña debe incluir al menos una letra mayúscula';
    else if (!/[0-9]/.test(password))
      errs.password = 'La contraseña debe incluir al menos un número';

    if (!confirmPassword)
      errs.confirmPassword = 'Debes repetir la contraseña';
    else if (password !== confirmPassword)
      errs.confirmPassword = 'Las contraseñas no coinciden';

    // Ubicación
    if (!selPais)    errs.pais   = 'Selecciona tu país';
    if (!selRegion)  errs.region = 'Selecciona tu región';
    if (!selCiudad)  errs.ciudad = 'Selecciona tu ciudad';
    if (!selComuna)  errs.comuna = 'Selecciona tu comuna';

    return errs;
  }

  // ── SUBMIT LOGIN ──────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validarLogin();
    if (Object.keys(errs).length) { setLoginErrors(errs); return; }
    setLoginErrors({});
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo_usuario: loginCorreo.trim().toLowerCase(), password_usuario: loginPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        const msg: string = data.error ?? 'Error al iniciar sesión';
        if (msg.toLowerCase().includes('correo') || msg.toLowerCase().includes('credenciales'))
          setLoginErrors({ correo: 'Correo o contraseña incorrectos' });
        else
          setLoginErrors({ password: msg });
        setLoading(false);
        return;
      }

      if (!data.exchange_token) {
        setLoginErrors({ correo: 'Respuesta inválida del servidor' });
        setLoading(false);
        return;
      }

      const exchRes = await fetch(`${API_BASE}/api/auth/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: data.exchange_token }),
      });
      const exchData = await exchRes.json();

      if (!exchRes.ok || !exchData.jwt) {
        setLoginErrors({ correo: exchData.error ?? 'Error al obtener sesión' });
        setLoading(false);
        return;
      }

      iniciarSesion(exchData.jwt, exchData.usuario);
      navigate('/dashboard', { replace: true });

    } catch (err: unknown) {
      setLoginErrors({ correo: err instanceof Error ? err.message : 'Error de conexión con el servidor' });
      setLoading(false);
    }
  };

  // ── SUBMIT REGISTRO ───────────────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validarRegistro();
    if (Object.keys(errs).length) { setRegErrors(errs); return; }
    setRegErrors({});
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pri_nom_usuario:   nombre.trim(),
          seg_nom_usuario:   segNombre.trim() || null,
          pri_ape_usuario:   apellido.trim(),
          seg_ape_usuario:   segApellido.trim() || null,
          correo_usuario:    correo.trim().toLowerCase(),
          num_tel_usuario:   parseInt(telefono, 10),
          password_usuario:  password,
          fecha_nac_usuario: fechaNac,
          id_comuna:         parseInt(selComuna, 10),
          calle_direccion:   calle.trim() || 'Sin calle',
          numero_direccion:  parseInt(numeroDireccion, 10) || 0,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        const msg: string = data.error ?? 'Error al registrarse';
        if (msg.toLowerCase().includes('correo'))       setRegErrors({ correo: msg });
        else if (msg.toLowerCase().includes('comuna'))  setRegErrors({ comuna: msg });
        else setRegErrors({ nombre: msg });
        setLoading(false);
        return;
      }

      if (!data.exchange_token) {
        setRegErrors({ nombre: 'Respuesta inválida del servidor' });
        setLoading(false);
        return;
      }

      const exchRes = await fetch(`${API_BASE}/api/auth/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: data.exchange_token }),
      });
      const exchData = await exchRes.json();

      if (!exchRes.ok || !exchData.jwt) {
        // Exchange falló → ir a login con mensaje de éxito
        setNombre(''); setSegNombre(''); setApellido(''); setSegApellido('');
        setCorreo(''); setTelefono(''); setFechaNac('');
        setPassword(''); setConfirmPassword('');
        setCalle(''); setNumeroDireccion('');
        setSelPais(''); setSelRegion(''); setSelCiudad(''); setSelComuna('');
        setMode('login');
        setLoginErrors({ correo: '✅ Cuenta creada. Inicia sesión con tu correo y contraseña.' });
        setLoading(false);
        return;
      }

      iniciarSesion(exchData.jwt, exchData.usuario);
      navigate('/dashboard', { replace: true });

    } catch (err: unknown) {
      setRegErrors({ nombre: err instanceof Error ? err.message : 'Error de conexión con el servidor' });
      setLoading(false);
    }
  };

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={s.container}>
      <div style={s.card}>

        {/* Header */}
        <div style={s.header}>
          <span style={s.logo}>🥗</span>
          <h1 style={s.titulo}>DespensaDigital</h1>
          <p style={s.subtitulo}>Gestor de despensa inteligente</p>
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
          <button style={{ ...s.tab, ...(mode === 'login'    ? s.tabActive : {}) }} onClick={() => setMode('login')}>
            Iniciar sesión
          </button>
          <button style={{ ...s.tab, ...(mode === 'register' ? s.tabActive : {}) }} onClick={() => setMode('register')}>
            Registrarse
          </button>
        </div>

        {/* ── LOGIN ── */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} noValidate style={s.form}>
            <Field label="Correo electrónico" error={loginErrors.correo}>
              <input
                type="email"
                placeholder="tucorreo@gmail.com"
                value={loginCorreo}
                onChange={e => setLoginCorreo(e.target.value)}
                style={{ ...s.input, ...(loginErrors.correo ? s.inputError : {}) }}
                disabled={loading}
                autoComplete="email"
              />
            </Field>

            <Field label="Contraseña" error={loginErrors.password}>
              <input
                type="password"
                placeholder="Tu contraseña"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                style={{ ...s.input, ...(loginErrors.password ? s.inputError : {}) }}
                disabled={loading}
                autoComplete="current-password"
              />
            </Field>

            <button type="submit" disabled={loading} style={{ ...s.btn, ...(loading ? s.btnDisabled : {}) }}>
              {loading ? 'Iniciando sesión...' : 'Ingresar →'}
            </button>

            <p style={s.hint}>
              💡 Prueba: <strong>test@despensa.cl</strong> / <strong>Password123</strong>
            </p>
          </form>
        )}

        {/* ── REGISTRO ── */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} noValidate style={s.form}>


            {/* ── Nombre y Apellidos ── */}
            <div style={s.sectionTitle}> Datos personales</div>

            <div style={s.row}>
              <Field label="Nombre *" error={regErrors.nombre} style={{ flex: 1 }}>
                <input type="text" placeholder="Juan" value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  style={{ ...s.input, ...(regErrors.nombre ? s.inputError : {}) }} disabled={loading} />
              </Field>
              <Field label="Segundo nombre" error={regErrors.segNombre} style={{ flex: 1 }}>
                <input type="text" placeholder="Carlos (opcional)" value={segNombre}
                  onChange={e => setSegNombre(e.target.value)}
                  style={{ ...s.input, ...(regErrors.segNombre ? s.inputError : {}) }} disabled={loading} />
              </Field>
            </div>

            <div style={s.row}>
              <Field label="Apellido *" error={regErrors.apellido} style={{ flex: 1 }}>
                <input type="text" placeholder="Pérez" value={apellido}
                  onChange={e => setApellido(e.target.value)}
                  style={{ ...s.input, ...(regErrors.apellido ? s.inputError : {}) }} disabled={loading} />
              </Field>
              <Field label="Segundo apellido" error={regErrors.segApellido} style={{ flex: 1 }}>
                <input type="text" placeholder="González (opcional)" value={segApellido}
                  onChange={e => setSegApellido(e.target.value)}
                  style={{ ...s.input, ...(regErrors.segApellido ? s.inputError : {}) }} disabled={loading} />
              </Field>
            </div>

            {/* ── Contacto ── */}
            <div style={s.sectionTitle}> Contacto</div>

            <Field label="Correo electrónico *" error={regErrors.correo}>
              <input type="email" placeholder="tucorreo@gmail.com" value={correo}
                onChange={e => setCorreo(e.target.value)}
                style={{ ...s.input, ...(regErrors.correo ? s.inputError : {}) }}
                disabled={loading} autoComplete="email" />
            </Field>

            <div style={s.row}>
              <Field label="Teléfono *" error={regErrors.telefono} style={{ flex: 1 }}>
                <input type="tel" placeholder="912345678" value={telefono}
                  onChange={e => setTelefono(e.target.value.replace(/\D/g, '').slice(0, 9))}
                  style={{ ...s.input, ...(regErrors.telefono ? s.inputError : {}) }} disabled={loading} />
              </Field>
              <Field label="Fecha de nacimiento *" error={regErrors.fechaNac} style={{ flex: 1 }}>
                <input type="date" value={fechaNac}
                  onChange={e => setFechaNac(e.target.value)}
                  style={{ ...s.input, ...(regErrors.fechaNac ? s.inputError : {}) }} disabled={loading} />
              </Field>
            </div>

            {/* ── Ubicación ── */}
            <div style={s.sectionTitle}> Ubicación</div>

            <Field label="País *" error={regErrors.pais}>
              <select value={selPais} onChange={e => onPaisChange(e.target.value)}
                style={{ ...s.input, ...(regErrors.pais ? s.inputError : {}) }} disabled={loading}>
                <option value="">— Selecciona tu país —</option>
                {paises.map(p => <option key={p.id_pais} value={p.id_pais}>{p.nombre_pais}</option>)}
              </select>
            </Field>

            <div style={s.row}>
              <Field label="Región *" error={regErrors.region} style={{ flex: 1 }}>
                <select value={selRegion} onChange={e => onRegionChange(e.target.value)}
                  style={{ ...s.input, ...(regErrors.region ? s.inputError : {}) }}
                  disabled={loading || !selPais}>
                  <option value="">— Primero elige un país —</option>
                  {regiones.map(r => <option key={r.id_region} value={r.id_region}>{r.nombre_region}</option>)}
                </select>
              </Field>
              <Field label="Ciudad *" error={regErrors.ciudad} style={{ flex: 1 }}>
                <select value={selCiudad} onChange={e => onCiudadChange(e.target.value)}
                  style={{ ...s.input, ...(regErrors.ciudad ? s.inputError : {}) }}
                  disabled={loading || !selRegion}>
                  <option value="">— Primero elige región —</option>
                  {ciudades.map(c => <option key={c.id_ciudad} value={c.id_ciudad}>{c.nombre_ciudad}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Comuna *" error={regErrors.comuna}>
              <select value={selComuna} onChange={e => setSelComuna(e.target.value)}
                style={{ ...s.input, ...(regErrors.comuna ? s.inputError : {}) }}
                disabled={loading || !selCiudad}>
                <option value="">— Primero elige ciudad —</option>
                {comunas.map(c => <option key={c.id_comuna} value={c.id_comuna}>{c.nombre_comuna}</option>)}
              </select>
            </Field>

            {/* ── Dirección ── */}
            <div style={s.sectionTitle}> Dirección</div>

            <div style={s.row}>
              <Field label="Calle" error={regErrors.calle} style={{ flex: 2 }}>
                <input type="text" placeholder="Av. Libertador Bernardo O'Higgins (opcional)" value={calle}
                  onChange={e => setCalle(e.target.value)}
                  style={{ ...s.input, ...(regErrors.calle ? s.inputError : {}) }} disabled={loading} />
              </Field>
              <Field label="Número" error={regErrors.numeroDireccion} style={{ flex: 1 }}>
                <input type="text" placeholder="1234" value={numeroDireccion}
                  onChange={e => setNumeroDireccion(e.target.value.replace(/\D/g, ''))}
                  style={{ ...s.input, ...(regErrors.numeroDireccion ? s.inputError : {}) }} disabled={loading} />
              </Field>
            </div>

            {/* ── Contraseña ── */}
            <div style={s.sectionTitle}> Contraseña</div>

            <div style={s.row}>
              <Field label="Contraseña *" error={regErrors.password} style={{ flex: 1 }}>
                <input type="password" placeholder="Mín. 8 caracteres, 1 mayúscula, 1 número"
                  value={password} onChange={e => setPassword(e.target.value)}
                  style={{ ...s.input, ...(regErrors.password ? s.inputError : {}) }}
                  disabled={loading} autoComplete="new-password" />
              </Field>
              <Field label="Repetir contraseña *" error={regErrors.confirmPassword} style={{ flex: 1 }}>
                <input type="password" placeholder="Repite la contraseña"
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  style={{ ...s.input, ...(regErrors.confirmPassword ? s.inputError : {}) }}
                  disabled={loading} autoComplete="new-password" />
              </Field>
            </div>

            <button type="submit" disabled={loading} style={{ ...s.btn, ...(loading ? s.btnDisabled : {}) }}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta →'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}

// ─── Componente auxiliar Field ────────────────────────────────────────────────
function Field({
  label, error, children, style,
}: {
  label: string; error?: string; children: React.ReactNode; style?: React.CSSProperties;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, ...style }}>
      <label style={s.label}>{label}</label>
      {children}
      {error && (
        <p style={{ ...s.fieldErr, ...(error.startsWith('✅') ? s.fieldOk : {}) }}>
          {error.startsWith('✅') ? error : `⚠ ${error}`}
        </p>
      )}
    </div>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
    minHeight: '100vh', backgroundColor: 'var(--color-bg)',
    fontFamily: 'var(--font-base)', padding: '32px 16px',
  },
  card: {
    backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-lg)', padding: '36px 32px',
    width: '100%', maxWidth: 560,
  },
  header: { textAlign: 'center', marginBottom: 24 },
  logo:   { fontSize: 40, display: 'block', marginBottom: 8 },
  titulo: {
    fontSize: 'var(--font-size-2xl)', fontWeight: 700, margin: '0 0 4px',
    color: 'var(--color-primary-800)',
  },
  subtitulo: { fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', margin: 0 },

  tabs: {
    display: 'flex', gap: 4, background: 'var(--color-bg)',
    borderRadius: 'var(--radius-md)', padding: 4, marginBottom: 24,
  },
  tab: {
    flex: 1, padding: '9px 12px', borderRadius: 'var(--radius-sm)',
    fontSize: 'var(--font-size-sm)', fontWeight: 600, cursor: 'pointer',
    border: 'none', background: 'transparent', color: 'var(--color-text-muted)',
    transition: 'all 150ms',
  },
  tabActive: {
    background: 'var(--color-surface)', color: 'var(--color-primary-800)',
    boxShadow: 'var(--shadow-sm)',
  },

  form:  { display: 'flex', flexDirection: 'column', gap: 14 },
  row:   { display: 'flex', gap: 12 },
  label: { fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-text)' },

  input: {
    width: '100%', padding: '10px 12px', fontSize: 'var(--font-size-sm)',
    border: '1.5px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
    fontFamily: 'var(--font-base)', background: 'var(--color-surface)',
    color: 'var(--color-text)', transition: 'border-color 150ms',
    boxSizing: 'border-box',
  },
  inputError: { borderColor: 'var(--color-danger)' },

  fieldErr: { margin: '3px 0 0', fontSize: 12, color: 'var(--color-danger)', lineHeight: 1.3 },
  fieldOk:  { color: 'var(--color-ok)' },

  sectionTitle: {
    fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-primary-700)',
    borderBottom: '1px solid var(--color-border)', paddingBottom: 6, marginTop: 4,
  },
  hint: { fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center', margin: 0 },

  btn: {
    padding: '12px 16px', fontSize: 'var(--font-size-base)', fontWeight: 700,
    background: 'var(--color-primary-700)', color: '#fff', border: 'none',
    borderRadius: 'var(--radius-sm)', cursor: 'pointer', marginTop: 4,
    transition: 'background 150ms', fontFamily: 'var(--font-base)',
  },
  btnDisabled: { opacity: 0.55, cursor: 'not-allowed' },
};