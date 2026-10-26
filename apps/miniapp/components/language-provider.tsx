'use client';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { isLanguage, normalizeLanguage, translate, type Language } from '../lib/i18n/core';

type TelegramWindow = Window & { Telegram?: { WebApp?: { initData?: string; initDataUnsafe?: { user?: { language_code?: string } } } } };
const Context = createContext<{language: Language; setLanguage: (l: Language) => void; t: (s: string | number | null | undefined, p?: Record<string,string>) => string; syncFailed: boolean} | null>(null);
const STORAGE = 'vaynexo.language';
export function LanguageProvider({children}: {children: ReactNode}) {
  const [language, update] = useState<Language>('uz');
  const [syncFailed, setSyncFailed] = useState(false);
  const revision = useRef(0);
  const writes = useRef(Promise.resolve());
  function persist(l: Language) {
    update(l);
    document.documentElement.lang = l;
    try { localStorage.setItem(STORAGE, l); } catch {}
  }
  useEffect(() => {
    const tg = (window as TelegramWindow).Telegram?.WebApp;
    let stored: string | null = null;
    try { stored = localStorage.getItem(STORAGE); } catch {}
    const query = new URLSearchParams(location.search).get('lang');
    persist(isLanguage(query) ? query : isLanguage(stored) ? stored : normalizeLanguage(tg?.initDataUnsafe?.user?.language_code));
    if (!tg?.initData) return;
    const started = revision.current;
    const abort = new AbortController();
    fetch('/api/preferences/language', {method:'POST', headers:{'Content-Type':'application/json','X-Telegram-Init-Data':tg.initData}, body:JSON.stringify({action:'get'}), signal:abort.signal})
      .then(r => { if (!r.ok) throw new Error('sync'); return r.json(); })
      .then(d => { if (started === revision.current && isLanguage(d.language)) persist(d.language); })
      .catch(e => { if (e.name !== 'AbortError') setSyncFailed(true); });
    return () => abort.abort();
  }, []);
  function setLanguage(l: Language) {
    if (!isLanguage(l)) return;
    const selectedRevision = ++revision.current;
    persist(l);
    setSyncFailed(false);
    const data = (window as TelegramWindow).Telegram?.WebApp?.initData;
    if (!data) return;
    // Serialize writes so a slower earlier selection cannot overwrite a newer one.
    writes.current = writes.current.catch(() => {}).then(async () => {
      const response = await fetch('/api/preferences/language', {method:'POST',headers:{'Content-Type':'application/json','X-Telegram-Init-Data':data},body:JSON.stringify({action:'set',language:l})});
      if (!response.ok) throw new Error('sync');
      if (selectedRevision === revision.current) setSyncFailed(false);
    }).catch(() => { if (selectedRevision === revision.current) setSyncFailed(true); });
  }
  return <Context.Provider value={{language,setLanguage,t:(s,p)=>translate(language,s,p),syncFailed}}>{children}</Context.Provider>;
}
export function useI18n() { const value = useContext(Context); if (!value) throw new Error('LanguageProvider required'); return value; }
