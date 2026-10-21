/**
 * UI strings. `pt-BR` is the source of truth for the key set; every other
 * locale must define the same keys (enforced by the `Dictionary` type below).
 * Each locale lives in its own file under `./locales`.
 */
import { en } from './locales/en';
import { ptBR } from './locales/pt-BR';

export type TranslationKey = keyof typeof ptBR;
export type Dictionary = Record<TranslationKey, string>;

export const dictionaries: Record<string, Dictionary> = {
  'pt-BR': ptBR,
  en,
};
