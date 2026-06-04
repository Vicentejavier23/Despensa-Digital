// Para probar en celular: LOCAL_IP=192.168.x.x npx expo start
const ip = process.env.LOCAL_IP || 'localhost';

module.exports = {
  expo: {
    name: 'DespensaDigital',
    slug: 'despensa-digital',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    updates: {
      enabled: false,
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: false,
      bundleIdentifier: 'cl.duocuc.despensadigital',
    },
    extra: {
      apiBaseUrl:     `http://${ip}:3002`,
      webCallbackUrl: `http://${ip}:5173`,
      eas: {
        projectId: '9d5a2290-b708-4aa7-babe-a9fdb5a71cfd',
      },
    },
  },
};
