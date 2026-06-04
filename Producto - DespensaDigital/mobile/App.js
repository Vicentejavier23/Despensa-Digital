import React from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Fix de scroll para modo web: Expo bloquea el overflow del root por defecto
if (Platform.OS === 'web') {
  const style = document.createElement('style');
  style.textContent = `
    html, body { overflow-y: auto !important; height: auto !important; }
    #root { overflow-y: auto !important; min-height: 100vh; height: auto !important; }
  `;
  document.head.appendChild(style);
}
import {
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';

import AppNavigator from './src/navigation/AppNavigator';

/**
 * Punto de entrada de DespensaDigital Mobile.
 *
 * Carga las fuentes Nunito antes de renderizar la app.
 * Mientras cargan, muestra un spinner centrado sobre fondo verde.
 */
export default function App() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#52B788" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="auto" />
      <AppNavigator />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  splash: {
    flex: 1,
    backgroundColor: '#2D6A4F',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
