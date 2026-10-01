export const config = { runtime: 'edge' }

type Asset = { name?: string; download_count?: number }
type Release = { assets?: Asset[]; prerelease?: boolean; tag_name?: string }

// Binários de verdade (DMG/ZIP do app). Pacotes de código-fonte chegam
// nomeados `v3.5.1.zip` / `v3.5.1.tar.gz` e inflariam o número. Prereleases
// (ex: windows-test-build-*) tambem ficam de fora — sao builds de teste de
// outra plataforma, nao o produto anunciado nesta pagina.
export function sumDownloads(releases: Release[]): number {
  return releases.reduce((total, release) => {
    if (release.prerelease) return total
    const binaries = (release.assets ?? []).filter((a) => {
      const name = a.name ?? ''
      return name !== '' && !/^v[\d.]+\.(zip|tar\.gz)$/.test(name)
    })
    return total + binaries.reduce((s, a) => s + (a.download_count ?? 0), 0)
  }, 0)
}

export default async function handler(): Promise<Response> {
  try {
    const res = await fetch(
      'https://api.github.com/repos/luisroquette-labs/notchagent/releases?per_page=10',
      { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'notchagent-site' } },
    )
    if (!res.ok) throw new Error(`GitHub ${res.status}`)
    const releases = (await res.json()) as Release[]
    return new Response(JSON.stringify({ total: sumDownloads(releases) }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, s-maxage=3600' },
    })
  } catch {
    return new Response(JSON.stringify({ total: null }), { status: 502 })
  }
}
