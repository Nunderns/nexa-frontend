import { describe, it, expect } from 'vitest'
import { dictionaries, type TranslationKey } from '../i18n/translations'

describe('Translations', () => {
  it('should have all required keys in pt-BR', () => {
    const ptBR = dictionaries['pt-BR']
    const requiredKeys: TranslationKey[] = [
      'profile.tabUpvoted',
      'profile.tabDownvoted',
      'profile.noUpvotedTitle',
      'profile.noUpvotedBody',
      'profile.noDownvotedTitle',
      'profile.noDownvotedBody',
    ]

    requiredKeys.forEach((key) => {
      expect(ptBR[key]).toBeDefined()
      expect(typeof ptBR[key]).toBe('string')
    })
  })

  it('should have all required keys in en', () => {
    const en = dictionaries['en']
    const requiredKeys: TranslationKey[] = [
      'profile.tabUpvoted',
      'profile.tabDownvoted',
      'profile.noUpvotedTitle',
      'profile.noUpvotedBody',
      'profile.noDownvotedTitle',
      'profile.noDownvotedBody',
    ]

    requiredKeys.forEach((key) => {
      expect(en[key]).toBeDefined()
      expect(typeof en[key]).toBe('string')
    })
  })

  it('should have the same keys in both locales', () => {
    const ptBRKeys = Object.keys(dictionaries['pt-BR'])
    const enKeys = Object.keys(dictionaries['en'])

    expect(ptBRKeys).toEqual(enKeys)
  })

  it('should have non-empty translation values', () => {
    const ptBR = dictionaries['pt-BR']
    const en = dictionaries['en']

    Object.keys(ptBR).forEach((key) => {
      expect(ptBR[key as TranslationKey]).toBeTruthy()
      expect(ptBR[key as TranslationKey].length).toBeGreaterThan(0)
    })

    Object.keys(en).forEach((key) => {
      expect(en[key as TranslationKey]).toBeTruthy()
      expect(en[key as TranslationKey].length).toBeGreaterThan(0)
    })
  })
})
