import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8')

const PERMITIDOS = [
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
  'https://www.googletagmanager.com',
  'https://notchagent.app/',
  'https://apps.apple.com/',
  'https://schema.org',
]

function ehPermitido(url: string): boolean {
  return (
    url === 'https://notchagent.app' ||
    PERMITIDOS.some((permitido) => url.startsWith(permitido))
  )
}

describe('CTAs do site', () => {
  it('nenhum link de saida escapa do tracklink', () => {
    const externos = [...html.matchAll(/href=(["'])((?:https?:)?\/\/[^"']+)\1/gi)]
      .map((m) => m[2])
      .map((u) => (u.startsWith('//') ? `https:${u}` : u))
      .map((u) => u.toLowerCase())
      .filter((u) => !ehPermitido(u))
      .filter((u) => !u.startsWith('https://cfgauss.com.br/t/'))
    expect(externos).toEqual([])
  })

  it('nao aponta para uma versao fixa do binario', () => {
    expect(html).not.toMatch(/releases\/download\/v\d+\.\d+\.\d+/)
  })

  it('so usa slugs de tracklink que existem', () => {
    const CONHECIDOS = new Set([
      'notchagent-download-dmg',
      'notchagent-download-zip',
      'notchagent-download-windows',
      'notchagent-github',
      'notchagent-releases',
      'notchagent-install',
      'notchagent-changelog',
    ])
    const usados = [...html.matchAll(/https:\/\/cfgauss\.com\.br\/t\/([a-z0-9-]+)/gi)]
      .map((m) => m[1].toLowerCase())
    expect(usados.length).toBeGreaterThan(0)
    expect([...new Set(usados)].filter((s) => !CONHECIDOS.has(s))).toEqual([])
  })

  it('o CTA principal de download é um gate que leva à Mac App Store', () => {
    const primeiro = html.match(/<button[^>]*data-gate[^>]*data-dest="([^"]+)"/i)?.[1]
      ?? html.match(/<button[^>]*data-dest="([^"]+)"[^>]*data-gate/i)?.[1]
    expect(primeiro).toBe('https://apps.apple.com/br/app/notchagent/id6817046228?mt=12')
  })

  it('nenhum link direto abre a App Store sem antes colher o lead', () => {
    expect(html).not.toMatch(/<a\b[^>]*href="https:\/\/apps\.apple\.com/i)
    expect(html).toMatch(/data-gate[^>]*data-dest="https:\/\/apps\.apple\.com/i)
  })

  it('o download passa pelo formulário do motor de forms da CF Gauss', () => {
    expect(html).toMatch(/cfgauss\.com\.br\/embed\/f\/[0-9a-f-]+/i)
  })

  it('até os links de código/GitHub passam pelo gate (nenhum <a> abre direto)', () => {
    expect(html).not.toMatch(/<a\b[^>]*href="https:\/\/cfgauss\.com\.br\/t\//i)
    expect(html).toMatch(/data-gate[^>]*data-dest="https:\/\/cfgauss\.com\.br\/t\/notchagent-github"/i)
  })

  it('o app oficial da App Store é endossado como seguro na página', () => {
    expect(html).toMatch(/apps\.apple\.com\/br\/app\/notchagent\/id6817046228/)
    expect(html).toMatch(/Mac App Store/)
    expect(html).toMatch(/aprovad[oa] pela Apple/i)
  })

  it('a secao de captura nao esta oculta', () => {
    const secao = html.match(/<section[^>]*id="subscribe"[^>]*>/)?.[0] ?? ''
    const escondida =
      /\shidden\b/.test(secao) ||
      /style=["'][^"']*display\s*:\s*none[^"']*["']/i.test(secao) ||
      /class=["'][^"']*hidden[^"']*["']/i.test(secao)
    expect(
      escondida,
      'secao #subscribe oculta por atributo hidden, display:none ou classe contendo "hidden"'
    ).toBe(false)
  })
})
