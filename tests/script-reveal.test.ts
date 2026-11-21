import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'

const js = readFileSync(new URL('../public/script.js', import.meta.url), 'utf8')

describe('CONTRATO: gate de lead no script', () => {
  it('escuta todos os [data-gate], não só o primeiro', () => {
    expect(js).toMatch(/querySelectorAll\('\[data-gate\]'\)/)
    expect(js).not.toMatch(/document\.querySelector\('\[data-gate\]'\)/)
  })

  it('só reage a mensagens do motor de forms da CF Gauss', () => {
    expect(js).toContain("'https://cfgauss.com.br'")
    expect(js).toContain("data.source !== 'cfgauss-embed-form'")
  })

  it('no sucesso do form, navega o próprio tab (não window.open, que o Chrome bloqueia)', () => {
    expect(js).toMatch(/window\.location\.assign\(pendingDest\)/)
    expect(js).not.toMatch(/window\.open\(/)
  })

  it('não sobra o fluxo caseiro antigo (scroll/foco/subscribe)', () => {
    expect(js).not.toContain('/api/subscribe')
    expect(js).not.toMatch(/scrollIntoView/)
  })
})
