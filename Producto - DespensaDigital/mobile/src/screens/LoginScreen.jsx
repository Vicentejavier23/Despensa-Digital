import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, TextInput, ActivityIndicator, Dimensions,
} from 'react-native';
import { useAuthFlow } from '../hooks/useAuthFlow';

const SCREEN_HEIGHT = Dimensions.get('window').height;

// ─── Design tokens idénticos a la web ────────────────────────────
const C = {
  bg:         '#F4F7F5',
  surface:    '#FFFFFF',
  border:     '#E2E8F0',
  text:       '#1A1A2E',
  muted:      '#6B7280',
  p800:       '#2D6A4F',
  p700:       '#40916C',
  p600:       '#52B788',
  p50:        '#F0FDF4',
  danger:     '#EF4444',
  dangerBg:   '#FEF2F2',
  dangerBorder:'#FECACA',
  ok:         '#22C55E',
};

export default function LoginScreen({ navigation }) {
  const [correo,      setCorreo]      = useState('');
  const [password,    setPassword]    = useState('');
  const [errCorreo,   setErrCorreo]   = useState('');
  const [errPassword, setErrPassword] = useState('');
  const [errorBanner, setErrorBanner] = useState('');
  const [focusCorreo, setFocusCorreo] = useState(false);
  const [focusPass,   setFocusPass]   = useState(false);

  const passRef = useRef(null);
  const { loading, ejecutarLogin } = useAuthFlow();

  function validar() {
    let ok = true;
    if (!correo.trim()) {
      setErrCorreo('El correo electrónico es obligatorio'); ok = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) {
      setErrCorreo('Ingresa un correo válido (ej: nombre@gmail.com)'); ok = false;
    } else setErrCorreo('');

    if (!password) {
      setErrPassword('La contraseña es obligatoria'); ok = false;
    } else setErrPassword('');

    return ok;
  }

  async function handleLogin() {
    setErrorBanner('');
    if (!validar()) return;
    const result = await ejecutarLogin(correo.trim().toLowerCase(), password);
    if (result) {
      navigation.navigate('Main', { jwt: result.jwt, usuario: result.usuario });
    } else {
      setErrorBanner('Correo o contraseña incorrectos. Verifica tus datos e intenta de nuevo.');
    }
  }

  return (
    <View style={s.outer}>
      <ScrollView
        style={{ flex: 1, height: SCREEN_HEIGHT }}
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
        bounces={false}
      >
        {/* ── Tarjeta ── */}
        <View style={s.card}>

          {/* Header */}
          <View style={s.header}>
            <Text style={s.logo}>🥗</Text>
            <Text style={s.titulo}>DespensaDigital</Text>
            <Text style={s.subtitulo}>Gestor de despensa inteligente</Text>
          </View>

          {/* Tabs */}
          <View style={s.tabs}>
            <View style={[s.tab, s.tabActive]}>
              <Text style={[s.tabText, s.tabTextActive]}>Iniciar sesión</Text>
            </View>
            <TouchableOpacity
              style={s.tab}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={s.tabText}>Registrarse</Text>
            </TouchableOpacity>
          </View>

          {/* Banner error */}
          {!!errorBanner && (
            <View style={s.banner}>
              <Text style={s.bannerText}>⚠ {errorBanner}</Text>
            </View>
          )}

          {/* Campo correo */}
          <Field label="Correo electrónico" error={errCorreo}>
            <TextInput
              style={[s.input, focusCorreo && s.inputFocus, !!errCorreo && s.inputErr]}
              placeholder="tucorreo@gmail.com"
              placeholderTextColor={C.muted}
              value={correo}
              onChangeText={t => { setCorreo(t); setErrCorreo(''); setErrorBanner(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setFocusCorreo(true)}
              onBlur={() => setFocusCorreo(false)}
              onSubmitEditing={() => passRef.current?.focus()}
              returnKeyType="next"
            />
          </Field>

          {/* Campo contraseña */}
          <Field label="Contraseña" error={errPassword}>
            <TextInput
              ref={passRef}
              style={[s.input, focusPass && s.inputFocus, !!errPassword && s.inputErr]}
              placeholder="Tu contraseña"
              placeholderTextColor={C.muted}
              value={password}
              onChangeText={t => { setPassword(t); setErrPassword(''); setErrorBanner(''); }}
              secureTextEntry
              autoCapitalize="none"
              onFocus={() => setFocusPass(true)}
              onBlur={() => setFocusPass(false)}
              onSubmitEditing={handleLogin}
              returnKeyType="done"
            />
          </Field>

          {/* Botón principal */}
          <TouchableOpacity
            style={[s.btn, loading && s.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnText}>Ingresar →</Text>
            }
          </TouchableOpacity>

          {/* Hint */}
          <Text style={s.hint}>
            💡 Prueba: <Text style={{ fontFamily: 'Nunito_700Bold' }}>test@despensa.cl</Text> / <Text style={{ fontFamily: 'Nunito_700Bold' }}>Password123</Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function Field({ label, error, children }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.label}>{label}</Text>
      {children}
      {!!error && <Text style={s.fieldErr}>⚠ {error}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  outer:  { flex: 1, backgroundColor: C.bg },
  scroll: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 16 },

  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 28,
    width: '100%',
    maxWidth: 520,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 8,
  },

  header:   { alignItems: 'center', marginBottom: 24 },
  logo:     { fontSize: 40, marginBottom: 8 },
  titulo:   { fontSize: 24, fontFamily: 'Nunito_700Bold', color: C.p800, marginBottom: 4 },
  subtitulo:{ fontSize: 14, fontFamily: 'Nunito_400Regular', color: C.muted },

  tabs: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: C.bg,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: C.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText:       { fontSize: 14, fontFamily: 'Nunito_600SemiBold', color: C.muted },
  tabTextActive: { color: C.p800 },

  banner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  bannerText: { fontSize: 13, fontFamily: 'Nunito_600SemiBold', color: C.danger, lineHeight: 20 },

  label:    { fontSize: 14, fontFamily: 'Nunito_600SemiBold', color: C.text, marginBottom: 5 },
  input: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: C.text,
    backgroundColor: C.surface,
  },
  inputFocus: { borderColor: C.p700 },
  inputErr:   { borderColor: C.danger },
  fieldErr:   { fontSize: 12, color: C.danger, marginTop: 4, fontFamily: 'Nunito_400Regular' },

  btn: {
    backgroundColor: C.p700,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.55 },
  btnText: { color: '#fff', fontSize: 16, fontFamily: 'Nunito_700Bold' },

  hint: { fontSize: 12, color: C.muted, textAlign: 'center', marginTop: 12, fontFamily: 'Nunito_400Regular' },
});
