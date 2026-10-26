import messages from './messages.json';
export type Language = 'uz' | 'ru' | 'en';
export const languages: Language[] = ['uz', 'ru', 'en'];
export function isLanguage(value: unknown): value is Language { return languages.includes(value as Language); }
export function normalizeLanguage(value?: string): Language {
  const code = value?.toLowerCase().split('-')[0];
  return isLanguage(code) ? code : 'uz';
}
export function translate(language: Language, source: string | number | undefined | null, params: Record<string, string> = {}) {
  if (source == null) return '';
  const key = String(source).replace(/\s+/g, ' ').trim();
  const entry = (messages as Record<string, { ru: string; en: string }>)[String(source)]
    ?? (messages as Record<string, { ru: string; en: string }>)[key];
  const text = language === 'uz' ? String(source) : entry?.[language] ?? String(source);
  return text.replace(/\{(\w+)\}/g, (match, key: string) => params[key] ?? match);
}
