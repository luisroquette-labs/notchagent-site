export const config = { runtime: 'edge' }

const FORMATOS = ['dmg', 'zip'] as const
type Formato = (typeof FORMATOS)[number]

// Pacotes de fonte chegam nomeados `v3.5.1.zip` / `v3.5.1.tar.gz` e nunca
// são o binário do app — mesmo critério do api/downloads.ts.
const FONTE = /^v[\d.]+\.(zip|tar\.gz)$/

export function escolherAsset(
  assets: Array<{ name: string; browser_download_url: string }>,
  formato: string,
): string | null {
  if (!(FORMATOS as readonly string[]).includes(formato)) return null
  const achado = assets.find(
    (a) => !FONTE.test(a.name) && a.name.toLowerCase().endsWith(`.${formato}`),
  )
  return achado ? achado.browser_download_url : null
}

const FALLBACK = 'https://github.com/luisroquette-labs/notchagent/releases/latest'

// Cache na CDN: o asset de uma release não muda, e a API anônima do GitHub
// limita a 60 req/h por IP compartilhado. stale-while-revalidate segura o
// clique mesmo num pico de lançamento (mesmo padrão do api/downloads.ts).
const CACHE = 'public, s-maxage=600, stale-while-revalidate=3600'

export function redirectComCache(url: string): Response {
  // Response.redirect() traz headers imutáveis — headers.set() lançaria 500.
  return new Response(null, {
    status: 302,
    headers: { Location: url, 'Cache-Control': CACHE },
  })
}

export default async function handler(req: Request): Promise<Response> {
  const formato = new URL(req.url).searchParams.get('f') ?? 'dmg'
  try {
    const res = await fetch('https://api.github.com/repos/luisroquette-labs/notchagent/releases/latest', {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'notchagent-site' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return redirectComCache(FALLBACK)
    const { assets = [] } = await res.json()
    const url = escolherAsset(assets, formato)
    return redirectComCache(url ?? FALLBACK)
  } catch {
    return redirectComCache(FALLBACK)
  }
}
