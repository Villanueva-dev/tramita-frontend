import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('PublicAdditionalCreditsPage definition code', () => {
  it('declares ADICION_CREDITOS exactly once in the page source', () => {
    const source = readFileSync('app/solicitud/creditos-adicionales/page.tsx', 'utf8')
    const occurrences = source.match(/ADICION_CREDITOS/g) ?? []

    expect(occurrences).toHaveLength(1)
  })
})
