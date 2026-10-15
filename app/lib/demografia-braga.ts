// Demografia de Braga: INE, "O seu município em números" (quadro-resumo, extraído em 15-10-2026)
// e INE, Estimativas anuais da população residente (população por sexo, 2023).
// Valores a 2025 em falta no quadro original (aparecem a 0) não foram usados.

export const DEMO_ANOS = [2011, 2021, 2024, 2025] as const;

export const POP_BRAGA: Record<number, number> = { 2011: 182762, 2021: 195527, 2024: 212380, 2025: 212635 };
export const POP_PORTUGAL: Record<number, number> = { 2011: 10558950, 2021: 10599117, 2024: 11387222, 2025: 11424031 };

/** Superfície do concelho (km²), arredondada pelo INE. */
export const AREA_KM2 = 183;
/** Superfície de Portugal (km²), para a densidade nacional de referência. */
export const AREA_PORTUGAL_KM2 = 92225;

/** Estrutura etária em 2025 (%). */
export const ETARIA_2025 = {
  Braga: { jovens: 13.2, ativa: 67.4, idosos: 19.4, idososPor100Jovens: 152 },
  Portugal: { jovens: 12.5, ativa: 64.3, idosos: 23.2, idososPor100Jovens: 189 },
};

/** Movimento natural em 2025 (nados-vivos, óbitos e saldo natural). */
export const NATURAL_2025 = {
  Braga: { nascimentos: 1716, obitos: 1511, saldo: 205 },
  Portugal: { nascimentos: 87764, obitos: 121817, saldo: -34053 },
};

/** População residente por sexo em 2023 (estimativa INE). */
export const SEXO_2023 = { total: 209088, homens: 100937, mulheres: 108151 };

export const crescimento = (de: number, ate: number, s: Record<number, number>) => (s[ate] / s[de] - 1) * 100;
export const densidade = (ano: number) => POP_BRAGA[ano] / AREA_KM2;
