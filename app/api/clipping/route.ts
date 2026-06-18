import { NextRequest, NextResponse } from 'next/server';

// Clipping de notícias via Google News RSS (público, sem API key).
// Corre no servidor para evitar CORS. O cliente chama /api/clipping?q=...
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .trim();
}

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') || 'turismo Braga').slice(0, 120);
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=pt-PT&gl=PT&ceid=PT:pt`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; VisitBraga/1.0)' } });
    if (!res.ok) {
      return NextResponse.json({ error: `Google News HTTP ${res.status}` }, { status: res.status });
    }
    const xml = await res.text();
    const items: { title: string; link: string; pubDate: string; source: string }[] = [];
    const itemRe = /<item>([\s\S]*?)<\/item>/g;
    let m: RegExpExecArray | null;
    while ((m = itemRe.exec(xml)) && items.length < 40) {
      const block = m[1];
      const pick = (tag: string) => {
        const r = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`).exec(block);
        return r ? decode(r[1]) : '';
      };
      const rawTitle = pick('title');
      const source = pick('source');
      // O Google News acrescenta " - Fonte" ao título; removemos para não duplicar
      const title = source && rawTitle.endsWith(` - ${source}`)
        ? rawTitle.slice(0, rawTitle.length - source.length - 3)
        : rawTitle;
      items.push({ title, link: pick('link'), pubDate: pick('pubDate'), source });
    }
    return NextResponse.json({ items, query: q });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro ao obter notícias.' }, { status: 502 });
  }
}