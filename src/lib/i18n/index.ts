import type { Language } from '../../types'
import type { Translations } from './types'
import { ja } from './ja'
import { en } from './en'

export const TRANSLATIONS: Record<Language, Translations> = { ja, en }
export type { Translations } from './types'
