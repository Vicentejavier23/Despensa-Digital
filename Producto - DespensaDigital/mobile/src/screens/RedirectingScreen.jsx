import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
} from 'react-native';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#2D6A4F',
  accent: '#52B788',
  bg: '#F4F4F4',
  white: '#FFFFFF',
  text: '#1A1A2E',
  textSecondary: '#6B7280',
};

/**
 * Pantalla de transición que se muestra después de login/registro exitoso.
 * Recibe { callbackUrl } como parámetro de navegación.
 *
 * Al montarse abre el navegador nativo con la URL de callback.
 * Incluye botón "Intentar de nuevo" por si el usuario cerró el navegador.
 */
export default function RedirectingScreen({ route }) {
  const { callbackUrl } = route.params ?? {};

  // Animación de pulso para el ícono
  const pulso = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Abrir el navegador nativo al montar
    if (callbackUrl) {
      Linking.openURL(callbackUrl).catch(() => {
        // Si falla silenciosamente, el usuario puede usar "Intentar de nuevo"
      });
    }

    // Animación de pulso continuo
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, {
          toValue: 1.08,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulso, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [callbackUrl, pulso]);

  async function handleReintentar() {
    if (callbackUrl) {
      await Linking.openURL(callbackUrl);
    }
  }

  return (
    <View style={styles.container}>
      {/* Ícono animado */}
      <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulso }] }]}>
        <Ionicons name="globe-outline" size={56} color={COLORS.white} />
      </Animated.View>

      {/* Textos */}
      <Text style={styles.titulo}>¡Todo listo!</Text>
      <Text style={styles.subtitulo}>Abriendo tu navegador...</Text>
      <Text style={styles.descripcion}>
        Estamos redirigiendo tu sesión a DespensaDigital.{'\n'}
        Este proceso es automático y seguro.
      </Text>

      {/* Spinner */}
      <ActivityIndicator
        size="large"
        color={COLORS.accent}
        style={styles.spinner}
      />

      {/* Botón reintentar */}
      <View style={styles.reintentarContainer}>
        <Text style={styles.reintentarTexto}>
          ¿No se abrió el navegador?
        </Text>
        <TouchableOpacity style={styles.botonReintentar} onPress={handleReintentar}>
          <Ionicons name="refresh-outline" size={16} color={COLORS.white} />
          <Text style={styles.botonReintentarTexto}>  Intentar de nuevo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 110,
    height: 110,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  titulo: {
    fontSize: 30,
    fontFamily: 'Nunito_800ExtraBold',
    color: COLORS.white,
    marginBottom: 8,
  },
  subtitulo: {
    fontSize: 18,
    fontFamily: 'Nunito_600SemiBold',
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 16,
  },
  descripcion: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  spinner: {
    marginBottom: 48,
  },
  reintentarContainer: {
    alignItems: 'center',
    gap: 12,
  },
  reintentarTexto: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 8,
  },
  botonReintentar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  botonReintentarTexto: {
    fontSize: 15,
    fontFamily: 'Nunito_600SemiBold',
    color: COLORS.white,
  },
});
