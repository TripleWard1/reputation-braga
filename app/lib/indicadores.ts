// ─────────────────────────────────────────────────────────────────────────────
// OBSERVATÓRIO DE TURISMO DE BRAGA — Indicadores do Território
// Modelo de dados, fontes oficiais e helpers.
//
// FILOSOFIA: esta plataforma NÃO inventa números. Guarda e cruza os indicadores
// OFICIAIS que a equipa de Turismo verifica e introduz, sempre com fonte e período
// identificados. Os valores que vêm pré-carregados estão marcados como EXEMPLO e
// devem ser substituídos pelos dados reais (INE / TravelBI / Taxa Municipal
// Turística). Assim os números são auditáveis e defensáveis em reunião.
// ─────────────────────────────────────────────────────────────────────────────

import { db } from '@/app/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// ─── TIPOS ───────────────────────────────────────────────────────────────────

export interface RegistoMensal {
  periodo: string;          // 'AAAA-MM' (ex.: '2025-08')
  dormidas: number | null;  // INE — dormidas no concelho/NUTS III
  hospedes: number | null;  // INE — hóspedes
  proveitos: number | null; // INE — proveitos totais (€)
  taxaTuristica: number | null; // Receita da Taxa Municipal Turística (€) — dado do MUNICÍPIO
  ocupacao: number | null;  // Taxa líquida de ocupação-cama (%)
  exemplo?: boolean;        // true = valor de demonstração, a substituir
}

export interface MercadoEmissor {
  pais: string;
  dormidas: number;
  exemplo?: boolean;
}

export interface IndicadoresBraga {
  mensal: RegistoMensal[];
  mercados: MercadoEmissor[];
  atualizadoEm: string | null;
}

// ─── FONTES OFICIAIS (para citar na ferramenta) ──────────────────────────────

export const FONTES = [
  {
    nome: 'INE — Atividade Turística (mensal)',
    desc: 'Dormidas, hóspedes, estada média e proveitos por localização geográfica (NUTS 2024). Braga integra a NUTS III Cávado.',
    url: 'https://www.ine.pt',
  },
  {
    nome: 'INE — Estatísticas do Turismo (anual)',
    desc: 'Consolidação anual. Em 2024 o Norte registou +5,9% de dormidas (média nacional +3,8%).',
    url: 'https://www.ine.pt',
  },
  {
    nome: 'TravelBI by Turismo de Portugal',
    desc: 'Indicadores de procura, mercados emissores e sazonalidade.',
    url: 'https://travelbi.turismodeportugal.pt',
  },
  {
    nome: 'Município de Braga — Taxa Municipal Turística',
    desc: 'Regulamento n.º 927/2025. 1,50 €/dormida, até 4 noites seguidas, hóspedes com mais de 16 anos. Fonte de dados PRÓPRIA do Município — o indicador mais fiável da procura efetiva.',
    url: 'https://www.cm-braga.pt',
  },
];

// Facto fixo e verificado (Regulamento n.º 927/2025)
export const TAXA_TURISTICA = {
  valorPorDormida: 1.5,
  maxNoites: 4,
  idadeMinima: 16,
  regulamento: 'Regulamento n.º 927/2025',
};

// ─── SEED (EXEMPLO — substituir pelos dados oficiais) ────────────────────────
// Valores meramente ilustrativos da ESTRUTURA. NÃO são dados reais de Braga.
// Servem só para a ferramenta não aparecer vazia na primeira utilização.

export const SEED_INDICADORES: IndicadoresBraga = {
  mensal: [
    { periodo: '2025-03', dormidas: 62000, hospedes: 41000, proveitos: 4100000, taxaTuristica: 78000, ocupacao: 38, exemplo: true },
    { periodo: '2025-04', dormidas: 78000, hospedes: 51000, proveitos: 5600000, taxaTuristica: 99000, ocupacao: 46, exemplo: true },
    { periodo: '2025-05', dormidas: 91000, hospedes: 59000, proveitos: 6900000, taxaTuristica: 116000, ocupacao: 53, exemplo: true },
    { periodo: '2025-06', dormidas: 96000, hospedes: 62000, proveitos: 7400000, taxaTuristica: 122000, ocupacao: 57, exemplo: true },
    { periodo: '2025-07', dormidas: 112000, hospedes: 71000, proveitos: 9100000, taxaTuristica: 142000, ocupacao: 64, exemplo: true },
    { periodo: '2025-08', dormidas: 124000, hospedes: 78000, proveitos: 10300000, taxaTuristica: 158000, ocupacao: 69, exemplo: true },
    { periodo: '2025-09', dormidas: 103000, hospedes: 67000, proveitos: 8200000, taxaTuristica: 131000, ocupacao: 60, exemplo: true },
    { periodo: '2025-10', dormidas: 88000, hospedes: 57000, proveitos: 6600000, taxaTuristica: 112000, ocupacao: 51, exemplo: true },
  ],
  mercados: [
    { pais: 'Portugal (interno)', dormidas: 34000, exemplo: true },
    { pais: 'Espanha', dormidas: 21000, exemplo: true },
    { pais: 'Brasil', dormidas: 14000, exemplo: true },
    { pais: 'França', dormidas: 11000, exemplo: true },
    { pais: 'Alemanha', dormidas: 7000, exemplo: true },
    { pais: 'Reino Unido', dormidas: 6000, exemplo: true },
    { pais: 'EUA', dormidas: 5000, exemplo: true },
    { pais: 'Itália', dormidas: 4000, exemplo: true },
  ],
  atualizadoEm: null,
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

export const MESES_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function periodoLabel(periodo: string): string {
  const [ano, mes] = periodo.split('-');
  const idx = parseInt(mes, 10) - 1;
  return `${MESES_PT[idx] || mes}/${ano.slice(2)}`;
}

export function fmtNum(n: number | null | undefined, casas = 0): string {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return n.toLocaleString('pt-PT', { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

export function fmtEuro(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return '—';
  if (n >= 1000000) return `${(n / 1000000).toLocaleString('pt-PT', { maximumFractionDigits: 1 })} M€`;
  if (n >= 1000) return `${(n / 1000).toLocaleString('pt-PT', { maximumFractionDigits: 0 })} k€`;
  return `${fmtNum(n)} €`;
}

// Estada média = dormidas / hóspedes
export function estadaMedia(r: RegistoMensal): number | null {
  if (!r.dormidas || !r.hospedes) return null;
  return +(r.dormidas / r.hospedes).toFixed(2);
}

// Variação homóloga (face ao mesmo mês do ano anterior), em %
export function variacaoHomologa(mensal: RegistoMensal[], periodo: string, campo: keyof RegistoMensal): number | null {
  const atual = mensal.find((m) => m.periodo === periodo);
  const [ano, mes] = periodo.split('-');
  const anterior = mensal.find((m) => m.periodo === `${parseInt(ano, 10) - 1}-${mes}`);
  const va = atual?.[campo] as number | null | undefined;
  const vb = anterior?.[campo] as number | null | undefined;
  if (va === null || va === undefined || vb === null || vb === undefined || vb === 0) return null;
  return +(((va - vb) / vb) * 100).toFixed(1);
}

// Estima dormidas a partir da receita da taxa (com um fator de cobertura, já que
// nem todas as dormidas são tributadas: <16 anos, isenções, >4 noites).
export function dormidasEstimadasPelaTaxa(receita: number | null, fatorCobertura = 0.85): number | null {
  if (!receita) return null;
  return Math.round((receita / TAXA_TURISTICA.valorPorDormida) / fatorCobertura);
}

// ─── PERSISTÊNCIA (Firestore: documento único 'indicadores/braga') ───────────

export async function carregarIndicadores(): Promise<IndicadoresBraga> {
  try {
    const snap = await getDoc(doc(db, 'indicadores', 'braga'));
    if (snap.exists()) {
      const data = snap.data() as IndicadoresBraga;
      return {
        mensal: data.mensal || [],
        mercados: data.mercados || [],
        atualizadoEm: data.atualizadoEm || null,
      };
    }
  } catch (e) {
    console.error('Erro a carregar indicadores:', e);
  }
  return SEED_INDICADORES;
}

export async function guardarIndicadores(ind: IndicadoresBraga): Promise<void> {
  try {
    await setDoc(doc(db, 'indicadores', 'braga'), { ...ind, atualizadoEm: new Date().toISOString() });
  } catch (e) {
    console.error('Erro a guardar indicadores:', e);
  }
}