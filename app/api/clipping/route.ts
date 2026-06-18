import { NextRequest, NextResponse } from 'next/server';

// Clipping de notícias via RSS público (sem API key). Corre no servidor (evita CORS).
// Tenta Google News e, em caso de falha, recorre ao Bing News.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Item = { title: string; link: string; pubDate: string; source: string };

function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .trim();
}

function parseRss(xml: string): Item[] {
  const items: Item[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml)) && items.length < 40) {
    const block = m[1];
    const pick = (tag: string) => {
      const r = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`).exec(block);
      return r ? decode(r[1]) : '';
    };
    const source = pick('source');
    const rawTitle = pick('title');
    const title = source && rawTitle.endsWith(` - ${source}`)
      ? rawTitle.slice(0, rawTitle.length - source.length - 3)
      : rawTitle;
    if (title) items.push({ title, link: pick('link'), pubDate: pick('pubDate'), source });
  }
  return items;
}

async function fetchRss(url: string): Promise<Item[]> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return parseRss(await res.text());
  } finally {
    clearTimeout(t);
  }
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') || 'turismo Braga').slice(0, 120);
  const enc = encodeURIComponent(q);
  const sources = [
    { name: 'Google News', url: `https://news.google.com/rss/search?q=${enc}&hl=pt-PT&gl=PT&ceid=PT:pt` },
    { name: 'Bing News', url: `https://www.bing.com/news/search?q=${enc}&format=rss&cc=pt` },
  ];
  const errors: string[] = [];
  for (const s of sources) {
    try {
      const items = await fetchRss(s.url);
      if (items.length > 0) return NextResponse.json({ items, query: q, provider: s.name });
      errors.push(`${s.name}: 0 resultados`);
    } catch (e: any) {
      errors.push(`${s.name}: ${e?.message || 'erro'}`);
    }
  }
  return NextResponse.json(
    { error: `Não foi possível obter notícias. Detalhe: ${errors.join(' · ')}` },
    { status: 502 },
  );
}