import { useEffect, useState } from 'react';

// Evento no estándar de Chrome/Android
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'dd_install_dismissed';

export default function InstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Ya instalada (abierta como app) → no mostrar
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // iOS
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    if (localStorage.getItem(DISMISS_KEY) === '1') return;

    const ua = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(ios);

    // iOS no dispara beforeinstallprompt → mostramos instrucciones
    if (ios) {
      setVisible(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, '1');
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === 'accepted') dismiss();
    setDeferred(null);
  };

  if (!visible) return null;

  return (
    <div style={s.bar}>
      <span style={s.icon}>📲</span>
      <span style={s.text}>
        {isIOS
          ? 'Instala DespensaDigital: toca Compartir ⬆️ y luego "Agregar a inicio".'
          : 'Instala DespensaDigital en tu celular para acceder más rápido.'}
      </span>
      {!isIOS && (
        <button style={s.btn} onClick={install}>
          Instalar
        </button>
      )}
      <button style={s.close} onClick={dismiss} aria-label="Cerrar">
        ✕
      </button>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  bar: {
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    background: '#2D6A4F',
    color: '#fff',
    fontFamily: 'var(--font-base)',
    fontSize: 14,
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  },
  icon: { fontSize: 20, flexShrink: 0 },
  text: { flex: 1, lineHeight: 1.3 },
  btn: {
    flexShrink: 0,
    padding: '6px 14px',
    background: '#fff',
    color: '#2D6A4F',
    border: 'none',
    borderRadius: 6,
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
  },
  close: {
    flexShrink: 0,
    background: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: 16,
    cursor: 'pointer',
    padding: 4,
    lineHeight: 1,
  },
};
