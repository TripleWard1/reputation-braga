// Exportação de dados de gráficos para Excel (.xlsx, via SheetJS carregado só quando é preciso) ou CSV.
// Partilhada pelo Observatório e pelas páginas de reputação.
import { t } from '@/app/lib/i18n';

export type Linha = Record<string, string | number | null>;
const slugFicheiro = (s: string) => (s || 'dados').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 60) || 'dados';
let xlsxPromessa: Promise<any> | null = null;
function carregarXlsx(): Promise<any> {
  const w = window as any;
  if (w.XLSX) return Promise.resolve(w.XLSX);
  if (!xlsxPromessa) {
    xlsxPromessa = new Promise((ok, ko) => {
      const sc = document.createElement('script');
      sc.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
      sc.async = true;
      sc.onload = () => (w.XLSX ? ok(w.XLSX) : ko(new Error('xlsx')));
      sc.onerror = () => { xlsxPromessa = null; ko(new Error('xlsx')); };
      document.head.appendChild(sc);
    });
  }
  return xlsxPromessa;
}
function guardarFicheiro(conteudo: BlobPart, tipo: string, nome: string) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const a = document.createElement('a'); a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
export async function descarregarDados(titulo: string, folhas: Linha[][]) {
  const nome = slugFicheiro(titulo);
  try {
    const X = await carregarXlsx();
    const wb = X.utils.book_new();
    folhas.forEach((l, i) => X.utils.book_append_sheet(wb, X.utils.json_to_sheet(l), folhas.length > 1 ? `${t('Dados', 'Data')} ${i + 1}` : t('Dados', 'Data')));
    X.writeFile(wb, `${nome}.xlsx`);
  } catch {
    // Alternativa sem biblioteca: CSV que o Excel abre diretamente (UTF-8 com BOM, separador ";" e vírgula decimal)
    const csv = folhas.map((l) => {
      const cab = Object.keys(l[0] || {});
      const cel = (v: any) => { if (v == null) return ''; if (typeof v === 'number') return String(v).replace('.', ','); const s2 = String(v); return /[;"\n]/.test(s2) ? `"${s2.replace(/"/g, '""')}"` : s2; };
      return [cab.map(cel).join(';'), ...l.map((r) => cab.map((k) => cel(r[k])).join(';'))].join('\r\n');
    }).join('\r\n\r\n');
    guardarFicheiro('\ufeff' + csv, 'text/csv;charset=utf-8', `${nome}.csv`);
  }
}
