import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'

const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8')

describe('REGRESSÃO A2: hero video pausável', () => {
  const heroVideo = html.match(/<video[^>]*id="hero-video"[^>]*>/i)?.[0] ?? ''

  it('o vídeo do hero é identificável e não autoplay no markup', () => {
    expect(heroVideo, 'vídeo do hero sem id="hero-video"').not.toBe('')
    expect(heroVideo).not.toMatch(/\bautoplay\b/)
  })

  it('tem botão de pausar/retomar acessível por teclado com aria-label', () => {
    const btn = html.match(/<button[^>]*id="hero-video-toggle"[^>]*>/i)?.[0] ?? ''
    expect(btn, 'botão hero-video-toggle ausente').not.toBe('')
    expect(btn).toMatch(/aria-label=/)
    expect(btn).toMatch(/aria-pressed=/)
  })

  it('o script inline liga o botão ao vídeo e respeita prefers-reduced-motion', () => {
    const script = (html.match(/<script>([\s\S]*?)<\/script>/g) ?? []).join('')
    expect(script).toMatch(/getElementById\('hero-video'\)/)
    expect(script).toMatch(/prefers-reduced-motion/)
    expect(script).toMatch(/setHeroPaused\(reduced\)/)
  })
})
