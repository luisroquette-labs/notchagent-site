import { describe, it, expect } from 'vitest'
import { sumDownloads } from '../api/downloads'

const fixtures = [
  {
    tag_name: 'v3.5.1',
    assets: [
      { name: 'NotchAgent-3.5.1.dmg', download_count: 41 },
      { name: 'NotchAgent-3.5.1.zip', download_count: 17 },
      { name: 'v3.5.1.zip', download_count: 5 },
      { name: 'v3.5.1.tar.gz', download_count: 2 },
    ],
  },
  {
    tag_name: 'v3.1.2',
    assets: [
      { name: 'NotchAgent-Desk-Beta1-3.1.2.dmg', download_count: 130 },
      { name: 'v3.1.2.zip', download_count: 3 },
    ],
  },
]

describe('sumDownloads', () => {
  it('soma downloads de binários e ignora pacotes de código-fonte', () => {
    expect(sumDownloads(fixtures)).toBe(41 + 17 + 130)
  })

  it('retorna 0 para lista vazia', () => {
    expect(sumDownloads([])).toBe(0)
  })

  it('não quebra com asset sem download_count', () => {
    expect(sumDownloads([{ tag_name: 'vX', assets: [{ name: 'a.dmg' }] }])).toBe(0)
  })

  describe('REGRESSÃO: prerelease não entra no total', () => {
    it('ignora downloads de um prerelease (build de teste do Windows)', () => {
      const comPrerelease = [
        ...fixtures,
        {
          tag_name: 'windows-test-build-20260824',
          prerelease: true,
          assets: [{ name: 'NotchAgent.Windows.exe', download_count: 999 }],
        },
      ]
      expect(sumDownloads(comPrerelease)).toBe(41 + 17 + 130)
    })

    it('mantém contando uma release normal (prerelease: false ou ausente)', () => {
      const release = { tag_name: 'v3.5.5', prerelease: false, assets: [{ name: 'NotchAgent-3.5.5.dmg', download_count: 3 }] }
      expect(sumDownloads([release])).toBe(3)
    })
  })
})
