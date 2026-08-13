import { createContext, type ReactNode, useContext, useState } from 'react';

interface PreferencesContextValue {
  notificationsEnabled: boolean;
  setNotificationsEnabled: (value: boolean) => void;
  hideBalanceOnEntry: boolean;
  setHideBalanceOnEntry: (value: boolean) => void;
}

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

const NOTIFICATIONS_KEY = 'billetera-notifications-enabled';
const HIDE_BALANCE_KEY = 'billetera-hide-balance';

function readBool(key: string, fallback: boolean): boolean {
  const stored = localStorage.getItem(key);
  return stored === null ? fallback : stored === 'true';
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [notificationsEnabled, setNotificationsEnabledState] = useState(() =>
    readBool(NOTIFICATIONS_KEY, true)
  );
  const [hideBalanceOnEntry, setHideBalanceOnEntryState] = useState(() =>
    readBool(HIDE_BALANCE_KEY, false)
  );

  function setNotificationsEnabled(value: boolean) {
    setNotificationsEnabledState(value);
    localStorage.setItem(NOTIFICATIONS_KEY, String(value));
  }

  function setHideBalanceOnEntry(value: boolean) {
    setHideBalanceOnEntryState(value);
    localStorage.setItem(HIDE_BALANCE_KEY, String(value));
  }

  return (
    <PreferencesContext.Provider
      value={{
        notificationsEnabled,
        setNotificationsEnabled,
        hideBalanceOnEntry,
        setHideBalanceOnEntry,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences debe usarse dentro de un PreferencesProvider');
  return ctx;
}