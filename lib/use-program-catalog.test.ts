import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

/**
 * El hook lo usa también la página pública, que no tiene sesión: no puede depender de
 * `AppShell` ni del store. La guarda de la suite pública no recorre `lib/`, por eso va aparte.
 */
describe('useProgramCatalog boundary', () => {
  it('does not import AppShell or the request store', () => {
    const source = readFileSync('lib/use-program-catalog.ts', 'utf8')

    expect(source).not.toMatch(/app-shell|useTramita|['"](?:@\/lib\/|\.\/)store['"]/i)
  })
})
