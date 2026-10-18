import { readFileSync, existsSync } from 'node:fs'
import { describe, it, expect } from 'vitest'

const PAGE = 'public/index.html'
const html = existsSync(PAGE) ? readFileSync(PAGE, 'utf8') : ''

describe('CONTRATO: página de download', () => {
  it('a página existe', () => {
    expect(existsSync(PAGE)).toBe(true)
  })

  it('nunca ensina o usuário a remover quarentena', () => {
    expect(html).not.toMatch(/xattr/i)
    expect(html).not.toMatch(/com\.apple\.quarantine/i)
  })

  it('nunca aponta para o mirror privado', () => {
    expect(html).not.toMatch(/notchagent-personal/)
  })

  it('o botão principal leva à Mac App Store oficial (via gate de lead)', () => {
    // O canal público de download é a Mac App Store (app oficial, revisado pela
    // Apple), mas sempre atrás do formulário de lead: a URL da loja é o destino
    // de um gate (data-dest), nunca um href direto.
    const appstore = html.match(/data-dest="(https:\/\/apps\.apple\.com\/br\/app\/notchagent\/id6817046228[^"]*)"/)
    expect(appstore, 'nenhum gate de download na Mac App Store').not.toBeNull()
  })

  it('declara os requisitos de sistema antes do clique', () => {
    expect(html).toMatch(/macOS 14/)
    expect(html).toMatch(/Apple Silicon/i)
  })

  it('nunca serve o appcast a partir do domínio comprado', () => {
    expect(html).not.toMatch(/notchagent\.app\/appcast/)
  })

  it('todo download passa por um gate de formulário antes de abrir', () => {
    // Regra do dono (18/10/2026): nada abre sem antes colher o lead. Os CTAs
    // de download são botões data-gate (não <a> direto), e existe o modal #gate
    // que embarca o formulário do motor de forms da CF Gauss.
    expect(html, 'nenhum botão data-gate de download').toMatch(/data-gate\b/)
    expect(html, 'modal de gate ausente').toMatch(/id="gate"/)
    expect(html, 'gate não embarca o form da CF Gauss').toMatch(/id="gate-iframe"[^>]*data-src="https:\/\/cfgauss\.com\.br\/embed\/f\//)
  })

  it('os formulários da página são do motor de forms da CF Gauss', () => {
    // O #subscribe deixou de ser form caseiro (/api/subscribe) e virou o form
    // embarcado da CF Gauss; não sobra nenhum <form> caseiro na página.
    expect(html).toMatch(/id="subscribe-iframe"[^>]*src="https:\/\/cfgauss\.com\.br\/embed\/f\//)
    expect(html).not.toContain('id="subscribe-form"')
  })

  it('o contador de downloads não inventa número no HTML', () => {
    expect(html, 'elemento dl-count ausente').toMatch(/id="dl-count"/)
    const el = html.match(/id="dl-count"[^>]*>[^<]*</)?.[0] ?? ''
    expect(el).not.toMatch(/[0-9]/)
  })

  it('declara o app como SoftwareApplication gratuito no schema', () => {
    expect(html).toMatch(/"@type":\s*"SoftwareApplication"/)
    expect(html).toMatch(/"price":\s*"0"/)
    expect(html).toMatch(/"url":\s*"https:\/\/notchagent\.app\/"/)
  })
})
