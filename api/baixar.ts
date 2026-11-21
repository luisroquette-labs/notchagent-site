export const config = { runtime: 'edge' }

const FORMATOS = ['dmg', 'zip'] as const
type Formato = (typeof FORMATOS)[number]

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

const CACHE = 'public, s-maxage=600, stale-while-revalidate=3600'

export function redirectComCache(url: string): Response {
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
