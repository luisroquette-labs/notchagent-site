import { readFileSync, existsSync } from 'node:fs'
import { describe, it, expect } from 'vitest'

const PAGE = 'public/index.html'
const CSS = 'public/styles.css'
const html = existsSync(PAGE) ? readFileSync(PAGE, 'utf8') : ''
const css = existsSync(CSS) ? readFileSync(CSS, 'utf8') : ''

describe('REGRESSÃO A1: reveals visíveis sem JS', () => {
  it('a página esconde .reveal por padrão (design preservado)', () => {
    expect(css).toMatch(/\.reveal\{opacity:0/)
  })

  it('noscript no <head> restaura opacidade e transform dos .reveal', () => {
    const noscript = html.match(/<noscript>([\s\S]*?)<\/noscript>/i)?.[1] ?? ''
    expect(noscript, 'bloco <noscript> ausente no HTML').not.toBe('')
    expect(noscript).toMatch(/\.reveal/)
    expect(noscript).toMatch(/opacity:\s*1/)
    expect(noscript).toMatch(/transform:\s*none/)
  })
})
