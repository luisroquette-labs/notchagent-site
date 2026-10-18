// tests/ctas.test.ts
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

// Aceita tambem o dominio nu `https://notchagent.app` so em fim-de-string;
// o prefixo com barra protege contra subdominios tipo notchagent.app.malicioso.com.
function ehPermitido(url: string): boolean {
  return (
    url === 'https://notchagent.app' ||
    PERMITIDOS.some((permitido) => url.startsWith(permitido))
  )
}

describe('CTAs do site', () => {
  it('nenhum link de saida escapa do tracklink', () => {
    // aspas simples ou duplas, case-insensitive, e scheme-relative (//dominio/...)
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

  // O guard acima so exige o prefixo /t/ — um slug trocado (download-dmg virando
  // releases, por exemplo) passaria verde e mandaria o visitante para o lugar
  // errado sem quebrar teste nenhum. Aqui cada slug usado e conferido contra a
  // lista dos que existem de fato no banco de tracking links.
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

  it('o CTA principal de download aponta para a Mac App Store', () => {
    const primeiro = html.match(/<a[^>]*data-download[^>]*href="([^"]+)"/i)?.[1]
      ?? html.match(/<a[^>]*href="([^"]+)"[^>]*data-download/i)?.[1]
    expect(primeiro).toBe('https://apps.apple.com/br/app/notchagent/id6817046228?mt=12')
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
