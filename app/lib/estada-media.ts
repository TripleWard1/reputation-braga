import { DORMIDAS_BRAGA, HOSPEDES_BRAGA, ESTADA_MEDIA } from './observatorio-dados';

// Estada média em Braga (INE): dormidas ÷ hóspedes em alojamento turístico.
// Devolve o último ano completo e o acumulado do ano corrente (janeiro até ao último mês publicado),
// comparado com o mesmo período do ano anterior. Funções simples, sem setas encadeadas.
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const MESES_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MESES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export interface EstadaRecente {
  anoCompleto: string; valorAnoCompleto: number;
  ano: string; ultimoMes: number; valor: number; valorAnterior: number;
  mesPt: string; mesEn: string; mesEs: string;
}

function ultimoMes(ano: string): number {
  let u = -1;
  for (let i = 0; i < MESES.length; i++) { const r = DORMIDAS_BRAGA[MESES[i]]; if (r && r[ano] != null) u = i; }
  return u;
}
function razao(ano: string, ate: number): number {
  let d = 0; let h = 0;
  for (let i = 0; i <= ate; i++) {
    const rd = DORMIDAS_BRAGA[MESES[i]]; const rh = HOSPEDES_BRAGA[MESES[i]];
    if (!rd || !rh || rd[ano] == null || rh[ano] == null) return 0;
    d += rd[ano] as number; h += rh[ano] as number;
  }
  return h ? d / h : 0;
}

export function estadaRecente(): EstadaRecente | null {
  const anos = Object.keys(ESTADA_MEDIA).sort();
  if (!anos.length) return null;
  const ano = anos[anos.length - 1];
  const u = ultimoMes(ano);
  const completo = u === 11 ? ano : String(Number(ano) - 1);
  const anoAcum = u === 11 ? String(Number(ano) + 1) : ano;
  const ua = u === 11 ? -1 : u;
  return {
    anoCompleto: completo, valorAnoCompleto: ESTADA_MEDIA[completo] || 0,
    ano: anoAcum, ultimoMes: ua,
    valor: ua >= 0 ? razao(anoAcum, ua) : 0,
    valorAnterior: ua >= 0 ? razao(String(Number(anoAcum) - 1), ua) : 0,
    mesPt: ua >= 0 ? MESES[ua].toLowerCase() : '', mesEn: ua >= 0 ? MESES_EN[ua] : '', mesEs: ua >= 0 ? MESES_ES[ua].toLowerCase() : '',
  };
}

// Número com duas casas decimais (vírgula em português).
export function dec2(v: number, pt: boolean): string {
  return v.toLocaleString(pt ? 'pt-PT' : 'en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
