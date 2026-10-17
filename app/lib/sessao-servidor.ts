// Sessão de administração: cookie assinado (HMAC-SHA256) com validade, em vez do segredo em bruto.
// Funciona no Edge (middleware) e no Node (rotas), por usar apenas Web Crypto.
//
// Variáveis na Vercel: APP_PASSWORD (palavra-passe) e APP_SESSION_TOKEN (segredo longo e aleatório que assina o cookie).

export const NOME_COOKIE = 'rb_session';
export const DURACAO_S = 60 * 60 * 24 * 14; // 14 dias

const enc = new TextEncoder();

export function configurada(): boolean {
  return !!(process.env.APP_PASSWORD && process.env.APP_SESSION_TOKEN);
}

// Em produção a proteção está sempre ativa: sem variáveis configuradas ninguém entra como administrador (falha fechada).
export function protecaoAtiva(): boolean {
  return configurada() || process.env.NODE_ENV === 'production';
}

// Comparação em tempo constante (não revela, pelo tempo de resposta, quantos caracteres coincidem).
export function igualSeguro(a: string, b: string): boolean {
  const x = enc.encode(a);
  const y = enc.encode(b);
  const n = Math.max(x.length, y.length);
  let d = x.length ^ y.length;
  for (let i = 0; i < n; i++) d |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return d === 0;
}

function hex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function assinar(texto: string): Promise<string> {
  const chave = await crypto.subtle.importKey('raw', enc.encode(process.env.APP_SESSION_TOKEN || ''), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', chave, enc.encode(texto)));
}

export async function criarValorSessao(): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + DURACAO_S;
  const nonce = hex(crypto.getRandomValues(new Uint8Array(12)).buffer as ArrayBuffer);
  const base = `${exp}.${nonce}`;
  return `${base}.${await assinar(base)}`;
}

export async function sessaoValida(valor?: string | null): Promise<boolean> {
  if (!valor || !process.env.APP_SESSION_TOKEN) return false;
  const p = valor.split('.');
  if (p.length !== 3) return false;
  const exp = Number(p[0]);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
  return igualSeguro(p[2], await assinar(`${p[0]}.${p[1]}`));
}

export async function eAdmin(req: { cookies: { get(n: string): { value: string } | undefined } }): Promise<boolean> {
  if (!protecaoAtiva()) return true; // só em desenvolvimento local, sem variáveis
  return sessaoValida(req.cookies.get(NOME_COOKIE)?.value);
}

// Limitador de tentativas de login por IP (em memória: por instância, suficiente para travar força bruta simples).
const JANELA_MS = 15 * 60 * 1000;
const MAX_FALHAS = 5;
const MAX_FALHAS_GLOBAL = 60;
const falhas = new Map<string, number[]>();
let globais: number[] = [];

function recentes(l: number[] | undefined, agora: number) {
  return (l || []).filter((t) => agora - t < JANELA_MS);
}

export function ipDe(req: { headers: { get(n: string): string | null } }): string {
  return (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('x-real-ip') || 'anonimo';
}

export function bloqueado(ip: string): number {
  const agora = Date.now();
  globais = recentes(globais, agora);
  const l = recentes(falhas.get(ip), agora);
  if (l.length) falhas.set(ip, l); else falhas.delete(ip);
  if (l.length >= MAX_FALHAS) return Math.ceil((JANELA_MS - (agora - l[0])) / 1000);
  if (globais.length >= MAX_FALHAS_GLOBAL) return Math.ceil((JANELA_MS - (agora - globais[0])) / 1000);
  return 0;
}

export function registarFalha(ip: string) {
  const agora = Date.now();
  falhas.set(ip, [...recentes(falhas.get(ip), agora), agora]);
  globais.push(agora);
  if (falhas.size > 5000) falhas.clear();
}

export function limpar(ip: string) {
  falhas.delete(ip);
}
