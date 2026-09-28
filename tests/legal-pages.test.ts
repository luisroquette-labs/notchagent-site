import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')
const home = read('../public/index.html')
const privacy = read('../public/privacy/index.html')
const support = read('../public/support/index.html')

describe('páginas exigidas pela Mac App Store', () => {
  it('publica links visíveis no rodapé', () => {
    expect(home).toContain('href="/privacy"')
    expect(home).toContain('href="/support"')
  })

  it('explica processamento, terceiros, exclusão e contato', () => {
    expect(privacy).toMatch(/Dados processados no Mac/)
    expect(privacy).toMatch(/Serviços de terceiros/)
    expect(privacy).toMatch(/Retenção e exclusão/)
    expect(privacy).toContain('lfrprojects.ai@gmail.com')
  })

  it('oferece contato humano identificável', () => {
    expect(support).toContain('Luis Fernando Roquette')
    expect(support).toContain('mailto:lfrprojects.ai@gmail.com')
  })
})
