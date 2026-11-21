import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { escolherAsset, redirectComCache } from '../api/baixar'

const ASSETS = [
  { name: 'NotchAgent-3.5.1.dmg', browser_download_url: 'https://x/dmg' },
  { name: 'NotchAgent-3.5.1.zip', browser_download_url: 'https://x/zip' },
  { name: 'source.tar.gz', browser_download_url: 'https://x/src' },
]

describe('escolherAsset', () => {
  it('acha o dmg independente da versao no nome', () => {
    expect(escolherAsset(ASSETS, 'dmg')).toBe('https://x/dmg')
  })

  it('acha o zip e nao confunde com source.tar.gz', () => {
    expect(escolherAsset(ASSETS, 'zip')).toBe('https://x/zip')
  })

  it('devolve null quando o formato nao existe, em vez de undefined', () => {
    expect(escolherAsset([], 'dmg')).toBeNull()
  })

  it('recusa formato fora da lista', () => {
    expect(escolherAsset(ASSETS, 'exe' as never)).toBeNull()
  })

  it('nao devolve o fonte v3.5.1.zip no lugar do binario', () => {
    const assets = [
      { name: 'v3.5.1.zip', browser_download_url: 'https://x/fonte' },
      { name: 'NotchAgent-3.5.1.zip', browser_download_url: 'https://x/zip' },
    ]
    expect(escolherAsset(assets, 'zip')).toBe('https://x/zip')
  })
})

describe('redirectComCache', () => {
  it('redireciona 302 com Cache-Control para a CDN', () => {
    const res = redirectComCache('https://x')
    expect(res.status).toBe(302)
    expect(res.headers.get('Cache-Control')).toBe(
      'public, s-maxage=600, stale-while-revalidate=3600',
    )
  })
})

describe('fetch ao GitHub', () => {
  it('tem timeout para o caso de o GitHub pendurar', () => {
    const src = readFileSync(new URL('../api/baixar.ts', import.meta.url), 'utf8')
    expect(src).toMatch(/AbortSignal\.timeout\(8000\)/)
  })
})
