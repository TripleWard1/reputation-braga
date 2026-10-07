// Exportação de dados de gráficos para Excel (.xlsx, via SheetJS carregado só quando é preciso) ou CSV.
// Partilhada pelo Observatório e pelas páginas de reputação.
import { t } from '@/app/lib/i18n';

export type Linha = Record<string, string | number | null>;
const slugFicheiro = (s: string) => (s || 'dados').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 60) || 'dados';
let xlsxPromessa: Promise<any> | null = null;
// xlsx-js-style: a mesma API do SheetJS, com estilos de célula (cores, contornos, formatos de número)
function carregarXlsx(): Promise<any> {
  const w = window as any;
  if (w.XLSX && w.XLSX.__comEstilos) return Promise.resolve(w.XLSX);
  if (!xlsxPromessa) {
    xlsxPromessa = new Promise((ok, ko) => {
      const sc = document.createElement('script');
      sc.src = 'https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.bundle.js';
      sc.async = true;
      sc.onload = () => { if (w.XLSX) { w.XLSX.__comEstilos = true; ok(w.XLSX); } else ko(new Error('xlsx')); };
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
// Folha formatada como a plataforma: título, linha institucional, cabeçalho azul, linhas alternadas, números formatados
function montarFolha(X: any, titulo: string, linhas: Linha[]): any {
  const cab = Object.keys(linhas[0] || {});
  const n = Math.max(1, cab.length);
  const hoje = new Date().toLocaleDateString(t('pt-PT', 'en-GB'));
  const aoa: (string | number | null)[][] = [
    [titulo], [`${t('Observatório de Turismo de Braga · Município de Braga', 'Braga Tourism Observatory · Braga City Council')} · ${t('exportado em', 'exported on')} ${hoje}`], [],
    cab, ...linhas.map((r) => cab.map((c) => (r[c] === undefined ? null : r[c]))),
  ];
  const ws = X.utils.aoa_to_sheet(aoa);
  const borda = { style: 'thin', color: { rgb: 'D5DCE6' } };
  const contorno = { top: borda, bottom: borda, left: borda, right: borda };
  const fonte = 'Calibri';
  const cel = (r: number, c: number) => X.utils.encode_cell({ r, c });
  // título e linha institucional (em toda a largura)
  ws[cel(0, 0)].s = { font: { name: fonte, bold: true, sz: 15, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '15171B' } }, alignment: { vertical: 'center' } };
  ws[cel(1, 0)].s = { font: { name: fonte, sz: 10, color: { rgb: '5A6270' } } };
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: n - 1 } }, { s: { r: 1, c: 0 }, e: { r: 1, c: n - 1 } }];
  for (let c = 1; c < n; c++) { ws[cel(0, c)] = { t: 's', v: '', s: ws[cel(0, 0)].s }; }
  // cabeçalho
  for (let c = 0; c < cab.length; c++) {
    ws[cel(3, c)].s = { font: { name: fonte, bold: true, sz: 11, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '3B5B8C' } }, alignment: { horizontal: c === 0 ? 'left' : 'center', vertical: 'center', wrapText: true }, border: contorno };
  }
  // dados: linhas alternadas e formatos de número
  for (let i = 0; i < linhas.length; i++) {
    const zebra = i % 2 === 1 ? { fgColor: { rgb: 'F1F5FB' } } : { fgColor: { rgb: 'FFFFFF' } };
    for (let c = 0; c < cab.length; c++) {
      const ref = cel(4 + i, c);
      if (!ws[ref]) ws[ref] = { t: 's', v: '' };
      const v = ws[ref].v;
      const num = typeof v === 'number';
      ws[ref].s = { font: { name: fonte, sz: 11, color: { rgb: '1C1F24' }, bold: c === 0 }, fill: zebra, border: contorno, alignment: { horizontal: num ? 'right' : 'left', vertical: 'center' } };
      if (num) ws[ref].z = Number.isInteger(v) ? '#,##0' : '#,##0.0#';
    }
  }
  // largura das colunas e altura do título
  ws['!cols'] = cab.map((c) => {
    let m = String(c).length;
    for (let i = 0; i < linhas.length; i++) { const v = linhas[i][c]; const l = v == null ? 0 : String(typeof v === 'number' ? v.toLocaleString('pt-PT') : v).length; if (l > m) m = l; }
    return { wch: Math.min(60, Math.max(10, m + 3)) };
  });
  ws['!rows'] = [{ hpt: 28 }, { hpt: 16 }, { hpt: 8 }, { hpt: 22 }];
  ws['!freeze'] = { xSplit: 0, ySplit: 4 };
  ws['!views'] = [{ state: 'frozen', ySplit: 4 }];
  return ws;
}

export async function descarregarDados(titulo: string, folhas: Linha[][]) {
  const nome = slugFicheiro(titulo);
  try {
    const X = await carregarXlsx();
    const wb = X.utils.book_new();
    folhas.forEach((l, i) => X.utils.book_append_sheet(wb, montarFolha(X, folhas.length > 1 ? `${titulo} (${i + 1})` : titulo, l), folhas.length > 1 ? `${t('Dados', 'Data')} ${i + 1}` : t('Dados', 'Data')));
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
