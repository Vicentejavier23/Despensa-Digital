import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import RedirectingScreen from '../screens/RedirectingScreen';

const Stack = createStackNavigator();

const COLORS = {
  primary: '#2D6A4F',
  bg: '#F4F4F4',
  white: '#FFFFFF',
};

/**
 * Navegador principal de la app.
 * 3 pantallas: Login → Register → Redirecting
 * El header nativo está desactivado (diseño propio en cada pantalla).
 */
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,          // Cada pantalla maneja su propio header/back
          cardStyle: { backgroundColor: COLORS.bg },
          animationEnabled: true,
          gestureEnabled: true,
          cardStyleInterpolator: ({ current, layouts }) => ({
            cardStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width, 0],
                  }),
                },
              ],
            },
          }),
        }}
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: 'Iniciar sesión' }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ title: 'Crear cuenta' }}
        />
        <Stack.Screen
          name="Redirecting"
          component={RedirectingScreen}
          options={{
            title: 'Redirigiendo...',
            gestureEnabled: false, // No se puede volver atrás desde aquí
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
