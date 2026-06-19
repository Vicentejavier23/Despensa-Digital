import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen       from '../screens/LoginScreen';
import RegisterScreen    from '../screens/RegisterScreen';
import RedirectingScreen from '../screens/RedirectingScreen';
import MainScreen        from '../screens/MainScreen';
import PatologiasScreen  from '../screens/PatologiasScreen';
import ListaComprasScreen from '../screens/ListaComprasScreen';

const Stack = createStackNavigator();

const COLORS = { primary: '#2D6A4F', bg: '#F4F4F4', white: '#FFFFFF' };

/**
 * Navegador principal de DespensaDigital Mobile.
 *
 * Flujo de autenticación:
 *   Login / Register → Main (pantalla principal con JWT)
 *                    → Redirecting (abre la web en el navegador)
 *
 * Pantallas autenticadas (reciben jwt por navigation params):
 *   Main → Patologias
 *   Main → ListaCompras
 */
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: COLORS.bg },
          animationEnabled: true,
          gestureEnabled: true,
          cardStyleInterpolator: ({ current, layouts }) => ({
            cardStyle: {
              transform: [{
                translateX: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [layouts.screen.width, 0],
                }),
              }],
            },
          }),
        }}
      >
        {/* ── Auth ── */}
        <Stack.Screen name="Login"       component={LoginScreen}       options={{ title: 'Iniciar sesión' }} />
        <Stack.Screen name="Register"    component={RegisterScreen}    options={{ title: 'Crear cuenta' }} />
        <Stack.Screen name="Redirecting" component={RedirectingScreen} options={{ title: 'Redirigiendo...', gestureEnabled: false }} />

        {/* ── App principal (requieren jwt en params) ── */}
        <Stack.Screen name="Main"        component={MainScreen}        options={{ title: 'Inicio', gestureEnabled: false }} />
        <Stack.Screen name="Patologias"  component={PatologiasScreen}  options={{ title: 'Patologías' }} />
        <Stack.Screen name="ListaCompras" component={ListaComprasScreen} options={{ title: 'Lista de compras' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
