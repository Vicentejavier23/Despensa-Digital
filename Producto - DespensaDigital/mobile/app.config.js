// Para probar en celular: LOCAL_IP=192.168.x.x npx expo start
const ip = process.env.LOCAL_IP || (process.env.API_BASE_URL ? (process.env.API_BASE_URL.match(/https?:\/\/([^:/]+)/)?.[1] || 'localhost') : 'localhost');

module.exports = {
  expo: {
    name: 'DespensaDigital',
    slug: 'despensa-digital',
    version: '1.0.0',
    sdkVersion: '53.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    updates: {
      enabled: false,
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'cl.duocuc.despensadigital',
    },
    android: {
      package: 'cl.duocuc.despensadigital',
      adaptiveIcon: {
        backgroundColor: '#2D6A4F',
      },
    },
    extra: {
      apiBaseUrl:     `http://${ip}:3001`,
      webCallbackUrl: `http://${ip}:5173`,
      eas: {
        projectId: '9d5a2290-b708-4aa7-babe-a9fdb5a71cfd',
      },
    },
  },
};

