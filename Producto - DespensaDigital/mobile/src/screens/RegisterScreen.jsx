import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, TextInput, ActivityIndicator, Alert,
  useWindowDimensions,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useAuthFlow } from '../hooks/useAuthFlow';
import { getPaises, getRegiones, getCiudades, getComunas } from '../api/geoApi';
import {
  validarEmail, validarPassword, validarEdadMinima, validarTelefono,
} from '../utils/validators';

const C = {
  bg: '#F4F7F5', surface: '#FFFFFF', border: '#E2E8F0',
  text: '#1A1A2E', muted: '#6B7280',
  p800: '#2D6A4F', p700: '#40916C', p600: '#52B788', p50: '#F0FDF4',
  danger: '#EF4444',
};

export default function RegisterScreen({ navigation }) {
  // ── Campos personales ──────────────────────────────────────────
  const [nombre,        setNombre]       = useState('');
  const [segNombre,     setSegNombre]    = useState('');
  const [apellido,      setApellido]     = useState('');
  const [segApellido,   setSegApellido]  = useState('');
  const [correo,        setCorreo]       = useState('');
  const [telefono,      setTelefono]     = useState('');
  const [fechaNac,      setFechaNac]     = useState('');
  const [fechaDisplay,  setFechaDisplay] = useState('');

  // ── Ubicación ─────────────────────────────────────────────────
  const [paises,   setPaises]   = useState([]);
  const [regiones, setRegiones] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  const [comunas,  setComunas]  = useState([]);
  const [selPais,   setSelPais]   = useState('');
  const [selRegion, setSelRegion] = useState('');
  const [selCiudad, setSelCiudad] = useState('');
  const [selComuna, setSelComuna] = useState('');

  // ── Dirección ─────────────────────────────────────────────────
  const [calle,          setCalle]          = useState('');
  const [numeroDireccion, setNumeroDireccion] = useState('');

  // ── Contraseña ────────────────────────────────────────────────
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');

  // ── Errores ───────────────────────────────────────────────────
  const [err, setErr] = useState({
    nombre: '', segNombre: '', apellido: '', segApellido: '',
    correo: '', telefono: '', fechaNac: '',
    pais: '', region: '', ciudad: '', comuna: '',
    calle: '', numeroDireccion: '',
    password: '', confirm: '',
  });

  const { height } = useWindowDimensions();
  const { loading, ejecutarRegistro } = useAuthFlow();

  // refs para navegación entre campos
  const segNomRef   = useRef(null);
  const apRef       = useRef(null);
  const segApRef    = useRef(null);
  const coRef       = useRef(null);
  const telRef      = useRef(null);
  const paRef       = useRef(null);
  const calleRef    = useRef(null);
  const numDirRef   = useRef(null);
  const c2Ref       = useRef(null);

  useEffect(() => {
    getPaises().then(setPaises).catch(() => {});
  }, []);

  const onPaisChange = useCallback(async (id) => {
    setSelPais(id); setSelRegion(''); setSelCiudad(''); setSelComuna('');
    setRegiones([]); setCiudades([]); setComunas([]);
    if (id) getRegiones(Number(id)).then(setRegiones).catch(() => {});
  }, []);

  const onRegionChange = useCallback(async (id) => {
    setSelRegion(id); setSelCiudad(''); setSelComuna('');
    setCiudades([]); setComunas([]);
    if (id) getCiudades(Number(id)).then(setCiudades).catch(() => {});
  }, []);

  const onCiudadChange = useCallback(async (id) => {
    setSelCiudad(id); setSelComuna('');
    setComunas([]);
    if (id) getComunas(Number(id)).then(setComunas).catch(() => {});
  }, []);

  function handleFecha(texto) {
    let limpio = texto.replace(/[^0-9/]/g, '');
    if (limpio.length === 2 && !limpio.includes('/') && fechaDisplay.length < 2) limpio += '/';
    else if (limpio.length === 5 && limpio.split('/').length === 2) limpio += '/';
    setFechaDisplay(limpio);
    const p = limpio.split('/');
    if (p.length === 3 && p[2].length === 4) {
      setFechaNac(`${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`);
    } else {
      setFechaNac('');
    }
    if (err.fechaNac) setErr(e => ({ ...e, fechaNac: '' }));
  }

  const clrErr = (campo) => () => {
    if (err[campo]) setErr(e => ({ ...e, [campo]: '' }));
  };

  function validarTodo() {
    const e = {
      nombre: '', segNombre: '', apellido: '', segApellido: '',
      correo: '', telefono: '', fechaNac: '',
      pais: '', region: '', ciudad: '', comuna: '',
      calle: '', numeroDireccion: '',
      password: '', confirm: '',
    };
    let ok = true;

    // Nombre y apellidos
    if (!nombre.trim())   { e.nombre   = 'El nombre es obligatorio';   ok = false; }
    if (!apellido.trim()) { e.apellido = 'El apellido es obligatorio';  ok = false; }

    // Contacto
    if (!validarEmail(correo).valido) { e.correo  = 'Correo electrónico inválido'; ok = false; }
    const tr = validarTelefono(telefono);
    if (!tr.valido)                   { e.telefono = tr.mensaje; ok = false; }
    const er = validarEdadMinima(fechaNac, 13);
    if (!er.valido)                   { e.fechaNac = er.mensaje; ok = false; }

    // Ubicación
    if (!selPais)   { e.pais   = 'Selecciona tu país';    ok = false; }
    if (!selRegion) { e.region = 'Selecciona tu región';  ok = false; }
    if (!selCiudad) { e.ciudad = 'Selecciona tu ciudad';  ok = false; }
    if (!selComuna) { e.comuna = 'Selecciona tu comuna';  ok = false; }

    // Contraseña
    const pr = validarPassword(password);
    if (!pr.valido)               { e.password = pr.mensaje; ok = false; }
    if (password !== confirm)     { e.confirm  = 'Las contraseñas no coinciden'; ok = false; }

    setErr(e); return ok;
  }

  async function handleRegistro() {
    if (!validarTodo()) return;

    const payload = {
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
    };

    const result = await ejecutarRegistro(payload);
    if (result) {
      navigation.navigate('Main', { jwt: result.jwt, usuario: result.usuario });
    } else {
      Alert.alert(
        'Error al crear cuenta',
        'Es posible que el correo ya esté registrado.',
        [{ text: 'OK' }]
      );
    }
  }

  return (
    <View style={[s.outer, { height }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
        bounces={false}
      >
        <View style={s.card}>

          {/* Header */}
          <View style={s.header}>
            <Text style={s.logo}>🥗</Text>
            <Text style={s.titulo}>DespensaDigital</Text>
            <Text style={s.subtitulo}>Gestor de despensa inteligente</Text>
          </View>

          {/* Tabs */}
          <View style={s.tabs}>
            <TouchableOpacity style={s.tab} onPress={() => navigation.navigate('Login')}>
              <Text style={s.tabText}>Iniciar sesión</Text>
            </TouchableOpacity>
            <View style={[s.tab, s.tabActive]}>
              <Text style={[s.tabText, s.tabTextActive]}>Registrarse</Text>
            </View>
          </View>


          {/* ── Datos personales ── */}
          <Text style={s.sectionTitle}> Datos personales</Text>

          <Row>
            <Field label="Nombre *" error={err.nombre} flex={1}>
              <TI placeholder="Juan" value={nombre}
                onChangeText={v => { setNombre(v); clrErr('nombre')(); }}
                error={!!err.nombre}
                onSubmitEditing={() => segNomRef.current?.focus()} returnKeyType="next" />
            </Field>
            <Field label="Segundo nombre" error={err.segNombre} flex={1}>
              <TI ref={segNomRef} placeholder="Carlos (opcional)" value={segNombre}
                onChangeText={v => { setSegNombre(v); clrErr('segNombre')(); }}
                error={!!err.segNombre}
                onSubmitEditing={() => apRef.current?.focus()} returnKeyType="next" />
            </Field>
          </Row>

          <Row>
            <Field label="Apellido *" error={err.apellido} flex={1}>
              <TI ref={apRef} placeholder="Pérez" value={apellido}
                onChangeText={v => { setApellido(v); clrErr('apellido')(); }}
                error={!!err.apellido}
                onSubmitEditing={() => segApRef.current?.focus()} returnKeyType="next" />
            </Field>
            <Field label="Segundo apellido" error={err.segApellido} flex={1}>
              <TI ref={segApRef} placeholder="González (opcional)" value={segApellido}
                onChangeText={v => { setSegApellido(v); clrErr('segApellido')(); }}
                error={!!err.segApellido}
                onSubmitEditing={() => coRef.current?.focus()} returnKeyType="next" />
            </Field>
          </Row>

          {/* ── Contacto ── */}
          <Text style={s.sectionTitle}> Contacto</Text>

          <Field label="Correo electrónico *" error={err.correo}>
            <TI ref={coRef} placeholder="tucorreo@gmail.com" value={correo}
              onChangeText={v => { setCorreo(v); clrErr('correo')(); }}
              error={!!err.correo} keyboardType="email-address" autoCapitalize="none"
              onSubmitEditing={() => telRef.current?.focus()} returnKeyType="next" />
          </Field>

          <Row>
            <Field label="Teléfono *" error={err.telefono} flex={1}>
              <TI ref={telRef} placeholder="912345678" value={telefono}
                onChangeText={v => { setTelefono(v.replace(/\D/g, '').slice(0, 9)); clrErr('telefono')(); }}
                error={!!err.telefono} keyboardType="phone-pad"
                onSubmitEditing={() => paRef.current?.focus()} returnKeyType="next" />
            </Field>
            <Field label="Fecha de nacimiento *" error={err.fechaNac} flex={1}>
              <TI ref={paRef} placeholder="DD/MM/AAAA" value={fechaDisplay}
                onChangeText={handleFecha} error={!!err.fechaNac}
                keyboardType="numeric" maxLength={10} returnKeyType="next" />
            </Field>
          </Row>

          {/* ── Ubicación ── */}
          <Text style={s.sectionTitle}> Ubicación</Text>

          <Field label="País *" error={err.pais}>
            <PickerField
              selectedValue={selPais}
              onValueChange={v => { onPaisChange(v); setErr(e => ({ ...e, pais: '' })); }}
              error={!!err.pais}
            >
              <Picker.Item label="— Selecciona tu país —" value="" />
              {paises.map(p => <Picker.Item key={p.id_pais} label={p.nombre_pais} value={String(p.id_pais)} />)}
            </PickerField>
          </Field>

          <Row>
            <Field label="Región *" error={err.region} flex={1}>
              <PickerField
                selectedValue={selRegion}
                onValueChange={v => { onRegionChange(v); setErr(e => ({ ...e, region: '' })); }}
                enabled={!!selPais} error={!!err.region}
              >
                <Picker.Item label={selPais ? '— Elige región —' : '— Elige país —'} value="" />
                {regiones.map(r => <Picker.Item key={r.id_region} label={r.nombre_region} value={String(r.id_region)} />)}
              </PickerField>
            </Field>
            <Field label="Ciudad *" error={err.ciudad} flex={1}>
              <PickerField
                selectedValue={selCiudad}
                onValueChange={v => { onCiudadChange(v); setErr(e => ({ ...e, ciudad: '' })); }}
                enabled={!!selRegion} error={!!err.ciudad}
              >
                <Picker.Item label={selRegion ? '— Elige ciudad —' : '— Elige región —'} value="" />
                {ciudades.map(c => <Picker.Item key={c.id_ciudad} label={c.nombre_ciudad} value={String(c.id_ciudad)} />)}
              </PickerField>
            </Field>
          </Row>

          <Field label="Comuna *" error={err.comuna}>
            <PickerField
              selectedValue={selComuna}
              onValueChange={v => { setSelComuna(v); setErr(e => ({ ...e, comuna: '' })); }}
              enabled={!!selCiudad} error={!!err.comuna}
            >
              <Picker.Item label={selCiudad ? '— Elige comuna —' : '— Elige ciudad —'} value="" />
              {comunas.map(c => <Picker.Item key={c.id_comuna} label={c.nombre_comuna} value={String(c.id_comuna)} />)}
            </PickerField>
          </Field>

          {/* ── Dirección ── */}
          <Text style={s.sectionTitle}> Dirección</Text>

          <Row>
            <Field label="Calle" error={err.calle} flex={2}>
              <TI ref={calleRef} placeholder="Av. O'Higgins (opcional)" value={calle}
                onChangeText={v => { setCalle(v); clrErr('calle')(); }}
                error={!!err.calle}
                onSubmitEditing={() => numDirRef.current?.focus()} returnKeyType="next" />
            </Field>
            <Field label="Número" error={err.numeroDireccion} flex={1}>
              <TI ref={numDirRef} placeholder="1234" value={numeroDireccion}
                onChangeText={v => { setNumeroDireccion(v.replace(/\D/g, '')); clrErr('numeroDireccion')(); }}
                error={!!err.numeroDireccion} keyboardType="numeric"
                returnKeyType="next" />
            </Field>
          </Row>

          {/* ── Contraseña ── */}
          <Text style={s.sectionTitle}> Contraseña</Text>

          <Row>
            <Field label="Contraseña *" error={err.password} flex={1}>
              <TI placeholder="Mín. 8 car., 1 mayús., 1 núm." value={password}
                onChangeText={v => { setPassword(v); clrErr('password')(); }}
                error={!!err.password} secureTextEntry autoCapitalize="none"
                onSubmitEditing={() => c2Ref.current?.focus()} returnKeyType="next" />
            </Field>
            <Field label="Repetir contraseña *" error={err.confirm} flex={1}>
              <TI ref={c2Ref} placeholder="Repite la contraseña" value={confirm}
                onChangeText={v => { setConfirm(v); clrErr('confirm')(); }}
                error={!!err.confirm} secureTextEntry autoCapitalize="none"
                onSubmitEditing={handleRegistro} returnKeyType="done" />
            </Field>
          </Row>

          {/* ── Botón ── */}
          <TouchableOpacity style={[s.btn, loading && s.btnDis]}
            onPress={handleRegistro} disabled={loading} activeOpacity={0.8}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnTxt}>Crear cuenta →</Text>}
          </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  );
}

// ── Helpers ─────────────────────────────────────────────────────
function Row({ children }) {
  return <View style={{ flexDirection: 'row', gap: 12 }}>{children}</View>;
}

function Field({ label, error, children, flex }) {
  return (
    <View style={{ flex, marginBottom: 14 }}>
      <Text style={s.label}>{label}</Text>
      {children}
      {!!error && <Text style={s.fieldErr}>⚠ {error}</Text>}
    </View>
  );
}

const TI = React.forwardRef(({ error, style, ...p }, ref) => (
  <TextInput
    ref={ref}
    style={[s.input, error && s.inputErr, style]}
    placeholderTextColor={C.muted}
    {...p}
  />
));

function PickerField({ children, error, enabled = true, ...p }) {
  return (
    <View style={[s.pickerWrap, error && s.inputErr, !enabled && { opacity: 0.5 }]}>
      <Picker style={s.picker} enabled={enabled} {...p}>
        {children}
      </Picker>
    </View>
  );
}

const s = StyleSheet.create({
  outer:  { backgroundColor: C.bg, overflow: 'hidden' },
  scroll: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 16 },
  card: {
    backgroundColor: C.surface, borderRadius: 16, padding: 28,
    width: '100%', maxWidth: 520,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.10, shadowRadius: 24, elevation: 8,
  },
  header:    { alignItems: 'center', marginBottom: 24 },
  logo:      { fontSize: 40, marginBottom: 8 },
  titulo:    { fontSize: 24, fontFamily: 'Nunito_700Bold', color: C.p800, marginBottom: 4 },
  subtitulo: { fontSize: 14, fontFamily: 'Nunito_400Regular', color: C.muted },
  tabs: {
    flexDirection: 'row', gap: 4, backgroundColor: C.bg,
    borderRadius: 12, padding: 4, marginBottom: 24,
  },
  tab:           { flex: 1, paddingVertical: 9, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center' },
  tabActive:     { backgroundColor: C.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  tabText:       { fontSize: 14, fontFamily: 'Nunito_600SemiBold', color: C.muted },
  tabTextActive: { color: C.p800 },
  sectionTitle: {
    fontSize: 14, fontFamily: 'Nunito_700Bold', color: C.p700,
    borderBottomWidth: 1, borderBottomColor: C.border,
    paddingBottom: 6, marginTop: 4, marginBottom: 14,
  },
  label:    { fontSize: 14, fontFamily: 'Nunito_600SemiBold', color: C.text, marginBottom: 5 },
  input: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 8,
    paddingVertical: 10, paddingHorizontal: 12,
    fontSize: 14, fontFamily: 'Nunito_400Regular', color: C.text, backgroundColor: C.surface,
  },
  inputCenter: { textAlign: 'center' },
  inputErr:  { borderColor: C.danger },
  fieldErr:  { fontSize: 12, color: C.danger, marginTop: 4, fontFamily: 'Nunito_400Regular' },
  pickerWrap: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 8,
    backgroundColor: C.surface, overflow: 'hidden',
  },
  picker:    { height: 44, color: C.text },
  btn:    { backgroundColor: C.p700, borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  btnDis: { opacity: 0.55 },
  btnTxt: { color: '#fff', fontSize: 16, fontFamily: 'Nunito_700Bold' },
});