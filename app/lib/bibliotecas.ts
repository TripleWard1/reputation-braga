// Bibliotecas pesadas carregadas a pedido a partir do próprio site (pacotes npm), em vez de servidores externos (unpkg, cdnjs):
// funcionam mesmo que esses serviços falhem e não dependem de código servido por terceiros.
import 'leaflet/dist/leaflet.css';

let leaflet: Promise<any> | null = null;
/** Leaflet (mapas). Fica também em window.L, como o código dos mapas espera. */
export function carregarLeaflet(): Promise<any> {
  const w = window as any;
  if (w.L) return Promise.resolve(w.L);
  if (!leaflet) {
    leaflet = import('leaflet').then((m: any) => { const L = m.default || m; w.L = L; return L; })
      .catch((e) => { leaflet = null; throw e; });
  }
  return leaflet;
}

let pdf: Promise<void> | null = null;
/** html2canvas e jsPDF (exportação em PDF). Ficam em window.html2canvas e window.jspdf.jsPDF. */
export function carregarPdf(): Promise<void> {
  const w = window as any;
  if (w.html2canvas && w.jspdf && w.jspdf.jsPDF) return Promise.resolve();
  if (!pdf) {
    pdf = Promise.all([import('html2canvas'), import('jspdf')]).then(([h, j]: any[]) => {
      w.html2canvas = h.default || h;
      w.jspdf = { jsPDF: j.jsPDF || (j.default && j.default.jsPDF) || j.default };
    }).catch((e) => { pdf = null; throw e; });
  }
  return pdf;
}
