// ═══════════════════════════════════════════════════════════════════════════
// OBSERVATÓRIO DE TURISMO DE BRAGA - DADOS REAIS
// Fontes: INE / TravelBI (Estatística Turismo Braga 2019–2025), relatório interno
// "Indicadores de Desempenho Turístico 2025", Taxa Municipal Turística (Reg. 927/2025)
// e Atendimento de Balcão do Posto de Turismo. NENHUM dado é placeholder.
// Gerado a partir dos ficheiros internos da Divisão de Atividades Económicas e Turismo.
// ═══════════════════════════════════════════════════════════════════════════

export const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
export const MESES_CURTO = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

// ─── INE / TravelBI: Dormidas e Hóspedes mensais Braga (2019–2025) ───
export const DORMIDAS_BRAGA: Record<string, Record<string, number|null>> = {"Janeiro": {"2019": 36271, "2020": 35228, "2021": 14395, "2022": 22155, "2023": 32094, "2024": 35840, "2025": 36636, "2026": 37650}, "Fevereiro": {"2019": 34371, "2020": 39559, "2021": 12195, "2022": 37741, "2023": 36962, "2024": 39779, "2025": 37605, "2026": 40049}, "Março": {"2019": 42833, "2020": 15855, "2021": 12272, "2022": 39334, "2023": 42111, "2024": 43742, "2025": 51210, "2026": 53197}, "Abril": {"2019": 54356, "2020": 2325, "2021": 16144, "2022": 55243, "2023": 59395, "2024": 51836, "2025": 58663, "2026": 61059}, "Maio": {"2019": 59183, "2020": 5962, "2021": 27010, "2022": 57798, "2023": 59263, "2024": 62640, "2025": 67107, "2026": 68898}, "Junho": {"2019": 60639, "2020": 11212, "2021": 34345, "2022": 56548, "2023": 57952, "2024": 62727, "2025": 60533, "2026": 64671}, "Julho": {"2019": 65049, "2020": 23611, "2021": 41421, "2022": 64265, "2023": 67872, "2024": 67636, "2025": 68047, "2026": null}, "Agosto": {"2019": 80145, "2020": 48889, "2021": 64382, "2022": 77495, "2023": 76155, "2024": 82792, "2025": 83497, "2026": null}, "Setembro": {"2019": 62522, "2020": 30296, "2021": 51738, "2022": 61969, "2023": 62498, "2024": 70053, "2025": 67243, "2026": null}, "Outubro": {"2019": 55301, "2020": 25174, "2021": 54948, "2022": 54257, "2023": 56889, "2024": 63006, "2025": 62259, "2026": null}, "Novembro": {"2019": 46214, "2020": 12077, "2021": 40498, "2022": 45756, "2023": 41380, "2024": 49620, "2025": 50217, "2026": null}, "Dezembro": {"2019": 42716, "2020": 13421, "2021": 32646, "2022": 44568, "2023": 44738, "2024": 48995, "2025": 46046, "2026": null}};
export const HOSPEDES_BRAGA: Record<string, Record<string, number|null>> = {"Janeiro": {"2019": 21231, "2020": 21986, "2021": 8312, "2022": 14630, "2023": 19628, "2024": 20824, "2025": 22505, "2026": 23254}, "Fevereiro": {"2019": 20720, "2020": 23837, "2021": 7034, "2022": 19497, "2023": 20555, "2024": 22557, "2025": 22822, "2026": 22993}, "Março": {"2019": 25308, "2020": 9989, "2021": 7651, "2022": 20896, "2023": 22634, "2024": 23575, "2025": 28129, "2026": 26703}, "Abril": {"2019": 31244, "2020": 2016, "2021": 10496, "2022": 29316, "2023": 31383, "2024": 27646, "2025": 31261, "2026": 33022}, "Maio": {"2019": 34354, "2020": 4798, "2021": 16429, "2022": 29964, "2023": 30543, "2024": 33456, "2025": 35612, "2026": 36244}, "Junho": {"2019": 34813, "2020": 8535, "2021": 18636, "2022": 28945, "2023": 30885, "2024": 34087, "2025": 33809, "2026": 32697}, "Julho": {"2019": 32572, "2020": 15035, "2021": 20765, "2022": 32663, "2023": 31799, "2024": 35053, "2025": 35942, "2026": null}, "Agosto": {"2019": 44366, "2020": 28471, "2021": 33690, "2022": 40212, "2023": 43000, "2024": 44912, "2025": 44473, "2026": null}, "Setembro": {"2019": 34246, "2020": 19268, "2021": 26452, "2022": 34084, "2023": 36516, "2024": 37011, "2025": 37986, "2026": null}, "Outubro": {"2019": 37253, "2020": 16163, "2021": 28563, "2022": 28937, "2023": 31935, "2024": 34449, "2025": 34553, "2026": null}, "Novembro": {"2019": 27301, "2020": 8400, "2021": 21094, "2022": 25151, "2023": 23927, "2024": 29242, "2025": 28361, "2026": null}, "Dezembro": {"2019": 27365, "2020": 9905, "2021": 19770, "2022": 27287, "2023": 27849, "2024": 30066, "2025": 28441, "2026": null}};
export const DORMIDAS_ANUAL: Record<string, number|null> = {"2019": 639600, "2020": 263609, "2021": 401994, "2022": 617129, "2023": 637309, "2024": 678666, "2025": 689063};
export const HOSPEDES_ANUAL: Record<string, number|null> = {"2019": 370773, "2020": 168403, "2021": 218892, "2022": 331582, "2023": 350654, "2024": 372878, "2025": 383894};
export const REVPAR_MENSAL: Record<string, Record<string, number|null>> = {"Janeiro": {"2019": 23.1, "2020": 21.0, "2021": 8.4, "2022": 13.5, "2023": 21.8, "2024": 22.8, "2025": 24.6, "2026": 27.3}, "Fevereiro": {"2019": 23.2, "2020": 25.1, "2021": 9.0, "2022": 30.1, "2023": 28.4, "2024": 26.7, "2025": 27.9, "2026": 30.2}, "Março": {"2019": 25.3, "2020": 9.5, "2021": 8.1, "2022": 28.3, "2023": 28.1, "2024": 32.0, "2025": 35.1, "2026": 37.0}, "Abril": {"2019": 33.6, "2020": 4.0, "2021": 10.8, "2022": 42.1, "2023": 44.6, "2024": 37.6, "2025": 45.1, "2026": 49.8}, "Maio": {"2019": 36.7, "2020": 14.0, "2021": 17.8, "2022": 39.7, "2023": 42.9, "2024": 49.5, "2025": 54.6, "2026": 53.7}, "Junho": {"2019": 42.2, "2020": 10.0, "2021": 20.6, "2022": 41.9, "2023": 46.5, "2024": 48.3, "2025": 50.1, "2026": 59.1}, "Julho": {"2019": 41.7, "2020": 16.0, "2021": 25.0, "2022": 44.0, "2023": 52.7, "2024": 52.7, "2025": 57.6}, "Agosto": {"2019": 49.2, "2020": 34.0, "2021": 45.1, "2022": 59.1, "2023": 53.7, "2024": 63.8, "2025": 67.8}, "Setembro": {"2019": 40.8, "2020": 19.9, "2021": 31.7, "2022": 46.4, "2023": 48.3, "2024": 57.3, "2025": 58.8}, "Outubro": {"2019": 33.9, "2020": 16.0, "2021": 32.5, "2022": 37.3, "2023": 40.7, "2024": 44.9, "2025": 51.7}, "Novembro": {"2019": 29.8, "2020": 8.9, "2021": 26.9, "2022": 31.0, "2023": 28.5, "2024": 33.9, "2025": 39.2}, "Dezembro": {"2019": 25.8, "2020": 10.0, "2021": 21.5, "2022": 29.9, "2023": 29.5, "2024": 31.7, "2025": 33.5}};
export const ADR_ANUAL: Record<string, number> = {"2018": 50.1, "2019": 55.3, "2020": 51.0, "2021": 50.5, "2022": 62.1, "2023": 68.4, "2024": 72.4, "2025": 78.8};

// ─── INE: Indicadores de desempenho 2025 (relatório interno, fonte INE) ───
export const HEADLINE = {"periodo": "2025 (ano completo) · INE/TravelBI", "dormidas2025": 689063, "dormidasVar": 1.5, "hospedes2025": 383894, "hospedesVar": 3.0, "dormidasNorte": 13.8, "dormidasNorteVar": 4.5, "dormidasPT": 77.8, "dormidasPTVar": 2.2, "hospedesNorte": 7.1, "hospedesNorteVar": 3.6, "hospedesPT": 30.6, "hospedesPTVar": 2.9, "ocupQuarto": {"Braga": 58.1, "Norte": 53.1, "Portugal": 57.8}, "ocupCama": {"Braga": 47.0, "Norte": 44.3, "Portugal": 48.2}, "revpar2024": {"Braga": 42, "Norte": 57, "Portugal": 69}, "adr2024": {"Braga": 72.4, "Norte": 106.5, "Portugal": 120.1}, "proveitos": {"Braga2023": 35.2, "Braga2024": 38.9, "varBraga": 10.5, "varNorte": 11.4, "varPortugal": 11.0, "Braga2025": 44.5, "varBraga2025": 14.2, "varNorte2025": 8.9, "varPortugal2025": 7.2}, "sazonalidadeVerao": {"Braga": 32.5, "Norte": 34.5, "Portugal": 34.9}, "estadaMedia": {"Braga": 1.8, "Norte": 1.9, "Portugal": 2.5, "naoResidentes": 2.3}, "mercados2025": ["Espanha", "Brasil", "França", "Reino Unido", "Polónia", "EUA", "Alemanha", "Roménia", "Itália", "Países Baixos"], "revpar2025": {"Braga": 45.8, "Norte": 58.2, "Portugal": 72.4}, "adr2025": {"Braga": 78.8, "Norte": 109.1, "Portugal": 124.9}, "ocupQuarto2025": {"Braga": 57.9, "Portugal": 57.2}, "ocupCama2025": {"Braga": 47.4, "Portugal": 48.0}};
export const INFRA = {"empreendimentos": 44, "alojamentoLocal": 709};


// ─── Benchmark regional e nacional (INE/TravelBI) ───
// Séries mensais de dormidas e hóspedes para o Norte e para Portugal, 2019–2026.
// Permitem comparar a evolução de Braga com a região e o país no mesmo período.
// 2026 disponível até junho; meses seguintes a null.

// Dormidas - Região Norte
export const DORMIDAS_NORTE: Record<string, Record<string, number|null>> = {"Janeiro": {"2019": 506234, "2020": 578609, "2021": 134458, "2022": 347052, "2023": 600832, "2024": 631211, "2025": 668317, "2026": 719144}, "Fevereiro": {"2019": 527872, "2020": 625615, "2021": 98480, "2022": 525143, "2023": 690781, "2024": 749648, "2025": 750875, "2026": 774073}, "Março": {"2019": 720805, "2020": 265615, "2021": 124151, "2022": 664922, "2023": 857634, "2024": 995542, "2025": 998322, "2026": 1070915}, "Abril": {"2019": 916002, "2020": 30274, "2021": 182065, "2022": 1007139, "2023": 1190754, "2024": 1126950, "2025": 1279684, "2026": 1330129}, "Maio": {"2019": 1003703, "2020": 70636, "2021": 395133, "2022": 1069023, "2023": 1230630, "2024": 1343584, "2025": 1432292, "2026": 1520684}, "Junho": {"2019": 1041697, "2020": 203890, "2021": 525623, "2022": 1110295, "2023": 1222633, "2024": 1301539, "2025": 1387447, "2026": 1454475}, "Julho": {"2019": 1171400, "2020": 466450, "2021": 697914, "2022": 1340013, "2023": 1429710, "2024": 1502696, "2025": 1575877, "2026": null}, "Agosto": {"2019": 1410095, "2020": 835671, "2021": 1131753, "2022": 1641848, "2023": 1732291, "2024": 1857934, "2025": 1897429, "2026": null}, "Setembro": {"2019": 1144562, "2020": 557919, "2021": 835537, "2022": 1245424, "2023": 1418077, "2024": 1480273, "2025": 1532076, "2026": null}, "Outubro": {"2019": 994052, "2020": 397645, "2021": 886795, "2022": 1127059, "2023": 1259788, "2024": 1319779, "2025": 1370945, "2026": null}, "Novembro": {"2019": 713057, "2020": 160674, "2021": 624508, "2022": 739381, "2023": 809076, "2024": 954270, "2025": 968639, "2026": null}, "Dezembro": {"2019": 661233, "2020": 173388, "2021": 505650, "2022": 739346, "2023": 820410, "2024": 840470, "2025": 880884, "2026": null}};

// Dormidas - Portugal
export const DORMIDAS_PORTUGAL: Record<string, Record<string, number|null>> = {"Janeiro": {"2019": 3034284, "2020": 3258226, "2021": 688039, "2022": 1993952, "2023": 3434232, "2024": 3453292, "2025": 3659360, "2026": 3741952}, "Fevereiro": {"2019": 3365240, "2020": 3817043, "2021": 459904, "2022": 2922077, "2023": 4015685, "2024": 4279170, "2025": 4163822, "2026": 4203862}, "Março": {"2019": 4606922, "2020": 1875506, "2021": 615727, "2022": 4012532, "2023": 5085292, "2024": 5730508, "2025": 5556754, "2026": 5625115}, "Abril": {"2019": 5981300, "2020": 133212, "2021": 921028, "2022": 5999962, "2023": 6837609, "2024": 6541951, "2025": 7123799, "2026": 7150714}, "Maio": {"2019": 6557840, "2020": 261593, "2021": 2024210, "2022": 6499189, "2023": 7144581, "2024": 7689493, "2025": 7801025, "2026": 7996616}, "Junho": {"2019": 7177554, "2020": 1031062, "2021": 3401792, "2022": 7180852, "2023": 7456723, "2024": 7828625, "2025": 8074409, "2026": 8131293}, "Julho": {"2019": 8231230, "2020": 2631261, "2021": 4538643, "2022": 8665889, "2023": 8816485, "2024": 9049614, "2025": 9417931, "2026": null}, "Agosto": {"2019": 9633427, "2020": 5082349, "2021": 7507272, "2022": 9959209, "2023": 10146558, "2024": 10538303, "2025": 10688807, "2026": null}, "Setembro": {"2019": 7624574, "2020": 3534350, "2021": 5585513, "2022": 7691275, "2023": 8238579, "2024": 8442778, "2025": 8503904, "2026": null}, "Outubro": {"2019": 6358685, "2020": 2300257, "2021": 5468960, "2022": 6790071, "2023": 7384027, "2024": 7570229, "2025": 7729932, "2026": null}, "Novembro": {"2019": 4071968, "2020": 920058, "2021": 3556760, "2022": 4252017, "2023": 4574288, "2024": 5015151, "2025": 5043963, "2026": null}, "Dezembro": {"2019": 3515940, "2020": 953382, "2021": 2564574, "2022": 3727766, "2023": 4045091, "2024": 4151486, "2025": 4278900, "2026": null}};

// Hóspedes - Região Norte
export const HOSPEDES_NORTE: Record<string, Record<string, number|null>> = {"Janeiro": {"2019": 295989, "2020": 338706, "2021": 80773, "2022": 206784, "2023": 338059, "2024": 357921, "2025": 381925, "2026": 409235}, "Fevereiro": {"2019": 309843, "2020": 364088, "2021": 60923, "2022": 300059, "2023": 378819, "2024": 413961, "2025": 423469, "2026": 434122}, "Março": {"2019": 407753, "2020": 142976, "2021": 76160, "2022": 359736, "2023": 459735, "2024": 530029, "2025": 540604, "2026": 562003}, "Abril": {"2019": 498434, "2020": 17494, "2021": 115410, "2022": 533858, "2023": 629868, "2024": 605780, "2025": 672744, "2026": 704773}, "Maio": {"2019": 551425, "2020": 45309, "2021": 243324, "2022": 569440, "2023": 652560, "2024": 717815, "2025": 762711, "2026": 811408}, "Junho": {"2019": 562599, "2020": 124847, "2021": 296511, "2022": 574132, "2023": 644663, "2024": 689947, "2025": 717938, "2026": 745219}, "Julho": {"2019": 585758, "2020": 253554, "2021": 357443, "2022": 657365, "2023": 699911, "2024": 727622, "2025": 758254, "2026": null}, "Agosto": {"2019": 702278, "2020": 427559, "2021": 554248, "2022": 776568, "2023": 830257, "2024": 893565, "2025": 893820, "2026": null}, "Setembro": {"2019": 616762, "2020": 310138, "2021": 445500, "2022": 651951, "2023": 741324, "2024": 776710, "2025": 787931, "2026": null}, "Outubro": {"2019": 548509, "2020": 235674, "2021": 486032, "2022": 601520, "2023": 662693, "2024": 696947, "2025": 721286, "2026": null}, "Novembro": {"2019": 409128, "2020": 97582, "2021": 345667, "2022": 402232, "2023": 442660, "2024": 525677, "2025": 527099, "2026": null}, "Dezembro": {"2019": 384548, "2020": 111990, "2021": 286711, "2022": 411875, "2023": 461098, "2024": 475914, "2025": 500234, "2026": null}};

// Hóspedes - Portugal
export const HOSPEDES_PORTUGAL: Record<string, Record<string, number|null>> = {"Janeiro": {"2019": 1273443, "2020": 1419505, "2021": 296172, "2022": 849349, "2023": 1447386, "2024": 1481248, "2025": 1595206, "2026": 1663436}, "Fevereiro": {"2019": 1393567, "2020": 1585501, "2021": 202024, "2022": 1242777, "2023": 1644704, "2024": 1762148, "2025": 1768393, "2026": 1775035}, "Março": {"2019": 1863147, "2020": 681811, "2021": 274336, "2022": 1572516, "2023": 2058884, "2024": 2309801, "2025": 2313123, "2026": 2331204}, "Abril": {"2019": 2331199, "2020": 46971, "2021": 446342, "2022": 2342684, "2023": 2732376, "2024": 2630805, "2025": 2846213, "2026": 2908800}, "Maio": {"2019": 2625708, "2020": 126627, "2021": 969144, "2022": 2533868, "2023": 2840168, "2024": 3110262, "2025": 3191104, "2026": 3309568}, "Junho": {"2019": 2740152, "2020": 476660, "2021": 1352387, "2022": 2670797, "2023": 2856589, "2024": 3048643, "2025": 3119023, "2026": 3149837}, "Julho": {"2019": 2849319, "2020": 1025974, "2021": 1633781, "2022": 3030807, "2023": 3160427, "2024": 3217992, "2025": 3361695, "2026": null}, "Agosto": {"2019": 3335024, "2020": 1877772, "2021": 2537993, "2022": 3380778, "2023": 3549245, "2024": 3766530, "2025": 3810125, "2026": null}, "Setembro": {"2019": 2896432, "2020": 1352118, "2021": 2053453, "2022": 2899683, "2023": 3171914, "2024": 3263886, "2025": 3294186, "2026": null}, "Outubro": {"2019": 2500447, "2020": 990434, "2021": 2128258, "2022": 2637687, "2023": 2872798, "2024": 2978613, "2025": 3084383, "2026": null}, "Novembro": {"2019": 1755112, "2020": 398463, "2021": 1452112, "2022": 1740976, "2023": 1900838, "2024": 2163562, "2025": 2177005, "2026": null}, "Dezembro": {"2019": 1578866, "2020": 448764, "2021": 1116009, "2022": 1617799, "2023": 1793561, "2024": 1854697, "2025": 1937744, "2026": null}};


// ─── Estada média em Braga (noites por hóspede) ───
// Calculada a partir das dormidas e hóspedes do INE. 2026 refere-se a jan–jun.
export const ESTADA_MEDIA: Record<string, number> = {"2019": 1.725, "2020": 1.565, "2021": 1.836, "2022": 1.861, "2023": 1.817, "2024": 1.82, "2025": 1.795, "2026": 1.861};


// ─── 1.º Semestre 2026 (jan–jun) - INE/TravelBI ───
// Séries mensais de ADR, RevPAR, ocupação e proveitos (Braga e Portugal), ranking de municípios
// e mercados emissores (dormidas/hóspedes por país de residência). Fonte: Estatística_Turismo_2026 (1.º semestre).
// Nota metodológica: as variações semestrais de ADR/RevPAR calculam-se como média simples dos meses
// nos DOIS anos (o INE só publica o valor semestral ponderado para 2026, não para 2025).
// Ocupação: usa-se o total semestral publicado pelo INE para ambos os anos.
// Mercados: nomes conforme o ficheiro; comparação disponível para o top-10 de cada ano.
// Nota: a folha de nacionalidades soma jun/2026 = 64 821 dormidas e 32 679 hóspedes; a série mensal
// (DORMIDAS_BRAGA/HOSPEDES_BRAGA) usa 64 671 e 32 697 - diferença por confirmar junto da fonte.
export type SerieMensal = Record<string, number[]>;
export type Semestre2026 = {
  periodo: string;
  meses: string[];
  adr: { Braga: SerieMensal; Portugal: SerieMensal };
  revpar: { Braga: SerieMensal; Portugal: SerieMensal };
  ocupCama: { Braga: SerieMensal; Portugal: SerieMensal; totalINE: Record<string, Record<string, number>> };
  ocupQuarto: { Braga: SerieMensal; Portugal: SerieMensal; totalINE: Record<string, Record<string, number>> };
  proveitos: { Braga: SerieMensal; PortugalTotal: Record<string, number> };
  topMunicipios: [string, number, number][];
  residencia: { dormidas: { Portugal: number; Estrangeiro: number }; hospedes: { Portugal: number; Estrangeiro: number } };
  mercadosDormidas: [string, number, number][];
  mercadosHospedes: [string, number, number][];
};
export const SEMESTRE_2026: Semestre2026 = {"periodo": "1.º semestre (jan–jun) · 2026 vs 2025", "meses": ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"], "adr": {"Braga": {"2023": [55.3, 59.3, 54.6, 69.1, 68.4, 70.9], "2024": [57.7, 59.2, 65.0, 68.9, 72.6, 74.8], "2025": [62.27, 64.79, 66.89, 77.2, 80.42, 80.86], "2026": [69.1, 65.94, 67.22, 79.55, 83.34, 87.07]}, "Portugal": {"2025": [89.11, 87.48, 95.81, 115.36, 128.4, 137.36], "2026": [91.55, 89.56, 98.41, 117.65, 130.89, 141.0]}}, "revpar": {"Braga": {"2025": [24.62, 27.91, 35.12, 45.07, 54.64, 50.08], "2026": [27.33, 30.15, 37.01, 49.75, 53.7, 59.12]}, "Portugal": {"2025": [33.33, 39.64, 48.82, 69.4, 83.4, 89.51], "2026": [33.88, 39.88, 49.68, 69.88, 83.98, 90.75]}}, "ocupCama": {"Braga": {"2025": [30.8, 34.6, 41.4, 48.7, 53.9, 49.9], "2026": [30.5, 36.2, 42.8, 50.4, 54.2, 52.3]}, "Portugal": {"2025": [29.1, 35.5, 40.1, 50.3, 52.4, 54.8], "2026": [28.8, 35.0, 39.4, 49.1, 52.0, 53.6]}, "totalINE": {"Braga": {"2025": 43.2, "2026": 44.4}, "Portugal": {"2025": 43.7, "2026": 43.3}}}, "ocupQuarto": {"Braga": {"2025": [39.5, 43.1, 52.5, 58.4, 67.9, 61.9], "2026": [39.6, 45.7, 55.1, 62.5, 64.4, 67.9]}, "Portugal": {"2025": [37.4, 45.3, 51.0, 60.2, 65.0, 65.2], "2026": [37.0, 44.5, 50.5, 59.4, 64.2, 64.4]}, "totalINE": {"Braga": {"2025": 53.9, "2026": 55.3}, "Portugal": {"2025": 54.0, "2026": 53.3}}}, "proveitos": {"Braga": {"2023": [1562168, 1834479, 2014691, 3189401, 3184072, 3245722], "2024": [1850386, 2011875, 2279180, 2715786, 3635154, 3682875], "2025": [2151800, 2181725, 2938631, 3478950, 4357666, 3953320], "2026": [2325331, 2292896, 3078012, 3930457, 4384477, 4645697]}, "PortugalTotal": {"2025": 2995538506, "2026": 3149516207}}, "topMunicipios": [["Ourém", 544928, 525119], ["Braga", 311754, 325524], ["Évora", 329892, 317743], ["Coimbra", 318251, 306486], ["Setúbal", 183749, 198278], ["Guimarães", 173981, 190289], ["Aveiro", 195519, 187093], ["Grândola", 180215, 179508], ["Covilhã", 172619, 168388], ["Odemira", 155154, 165835]], "residencia": {"dormidas": {"Portugal": 158193, "Estrangeiro": 167481}, "hospedes": {"Portugal": 106257, "Estrangeiro": 68638}}, "mercadosDormidas": [["Espanha", 24467, 26682], ["Reino Unido", 15511, 17932], ["Polónia", 11460, 13418], ["Brasil", 15020, 13059], ["Estados Unidos", 8488, 10385], ["França", 9717, 9180], ["Alemanha", 7548, 8777], ["Croácia", 3947, 5854], ["Itália", 5171, 4956], ["Roménia", 4732, 4819], ["Turquia", 3967, 4448]], "mercadosHospedes": [["Espanha", 14925, 15334], ["Reino Unido", 5609, 7213], ["Brasil", 7494, 6309], ["Polónia", 4727, 4482], ["França", 5031, 4349], ["Estados Unidos", 3809, 4252], ["Alemanha", 3363, 4014], ["Itália", 2821, 2548], ["Países Baixos", 1643, 1805], ["Canadá", 1166, 1318], ["Coreia do Sul", 1393, 1134]]};

// ─── Capacidade de alojamento - Quartos e Camas (INE, anual) ───
// Fonte: INE - Inquérito à Permanência de Hóspedes na Hotelaria e Outros Alojamentos.
// 'total' inclui ainda o Turismo no Espaço Rural e de Habitação (= total − hotelaria − alojamentoLocal).
// Nota: o alojamento local aqui contabilizado é apenas o abrangido pelo inquérito do INE,
// não coincidindo com o total de registos de AL do município (ver INFRA.alojamentoLocal).
export type CapacidadeAno = { total: number; hotelaria: number; alojamentoLocal: number };

// N.º de quartos, 2017–2025
export const QUARTOS: Record<string, Record<string, CapacidadeAno>> = {
  Braga: { '2017': { total: 1476, hotelaria: 1257, alojamentoLocal: 185 }, '2018': { total: 1641, hotelaria: 1382, alojamentoLocal: 221 }, '2019': { total: 1712, hotelaria: 1427, alojamentoLocal: 239 }, '2020': { total: 1462, hotelaria: 1326, alojamentoLocal: 106 }, '2021': { total: 1594, hotelaria: 1366, alojamentoLocal: 204 }, '2022': { total: 1783, hotelaria: 1515, alojamentoLocal: 244 }, '2023': { total: 1881, hotelaria: 1515, alojamentoLocal: 330 }, '2024': { total: 1899, hotelaria: 1581, alojamentoLocal: 294 }, '2025': { total: 1919, hotelaria: 1630, alojamentoLocal: 259 } },
  Portugal: { '2017': { total: 175056, hotelaria: 137085, alojamentoLocal: 27683 }, '2018': { total: 184435, hotelaria: 142033, alojamentoLocal: 31656 }, '2019': { total: 193164, hotelaria: 146214, alojamentoLocal: 34958 }, '2020': { total: 151751, hotelaria: 116719, alojamentoLocal: 24390 }, '2021': { total: 179501, hotelaria: 137503, alojamentoLocal: 29536 }, '2022': { total: 200748, hotelaria: 153606, alojamentoLocal: 33423 }, '2023': { total: 209669, hotelaria: 157705, alojamentoLocal: 36948 }, '2024': { total: 215490, hotelaria: 160470, alojamentoLocal: 39414 }, '2025': { total: 220220, hotelaria: 163960, alojamentoLocal: 40057 } },
};

// N.º de camas (capacidade de alojamento), 2023–2025
export const CAPACIDADE_CAMAS: Record<string, Record<string, CapacidadeAno>> = {
  Braga: { '2023': { total: 4014, hotelaria: 3127, alojamentoLocal: 788 }, '2024': { total: 4040, hotelaria: 3217, alojamentoLocal: 763 }, '2025': { total: 4053, hotelaria: 3312, alojamentoLocal: 663 } },
  Portugal: { '2023': { total: 478552, hotelaria: 353800, alojamentoLocal: 91828 }, '2024': { total: 492262, hotelaria: 359850, alojamentoLocal: 98263 }, '2025': { total: 502666, hotelaria: 367416, alojamentoLocal: 99594 } },
};



// ─── Oferta de alojamento por freguesia (registos RNAL + RNET) ───
// Fonte: listagem municipal de Alojamento Local (713 registos, jan/2011 a mar/2026)
// e de Empreendimentos Turísticos (36 unidades, após remoção de 2 registos repetidos
// do mesmo n.º RNET 6140 - Hotel Rural Alves, em Escudeiros e Penso).
// 'curto' é o nome abreviado para caber nos eixos dos gráficos.
export type FreguesiaOferta = { freguesia: string; curto: string; al: number; et: number };

export const ALOJAMENTO_FREGUESIA: FreguesiaOferta[] = [
  { freguesia: "Braga (São José de São Lázaro e São João do Souto)", curto: "S. José S. Lázaro / S. João Souto", al: 197, et: 12 },
  { freguesia: "Braga (Maximinos, Sé e Cividade)", curto: "Maximinos, Sé e Cividade", al: 183, et: 2 },
  { freguesia: "Braga (São Vicente)", curto: "São Vicente", al: 106, et: 2 },
  { freguesia: "Braga (São Vítor)", curto: "São Vítor", al: 101, et: 4 },
  { freguesia: "Nogueiró e Tenões", curto: "Nogueiró e Tenões", al: 18, et: 6 },
  { freguesia: "Nogueira, Fraião e Lamaçães", curto: "Nogueira, Fraião e Lamaçães", al: 15, et: 1 },
  { freguesia: "Crespos e Pousada", curto: "Crespos e Pousada", al: 12, et: 3 },
  { freguesia: "Gualtar", curto: "Gualtar", al: 14, et: 0 },
  { freguesia: "Este (São Pedro e São Mamede)", curto: "Este (S. Pedro e S. Mamede)", al: 8, et: 2 },
  { freguesia: "Merelim (São Paio), Panoias e Parada de Tibães", curto: "Merelim (S. Paio), Panoias e Parada", al: 8, et: 0 },
  { freguesia: "Ferreiros e Gondizalves", curto: "Ferreiros e Gondizalves", al: 5, et: 1 },
  { freguesia: "Santa Lucrécia de Algeriz e Navarra", curto: "Sta. Lucrécia de Algeriz e Navarra", al: 6, et: 0 },
  { freguesia: "Adaúfe", curto: "Adaúfe", al: 4, et: 1 },
  { freguesia: "Lomar e Arcos", curto: "Lomar e Arcos", al: 5, et: 0 },
  { freguesia: "Palmeira", curto: "Palmeira", al: 4, et: 1 },
  { freguesia: "Real, Dume e Semelhe", curto: "Real, Dume e Semelhe", al: 5, et: 0 },
  { freguesia: "Mire de Tibães", curto: "Mire de Tibães", al: 4, et: 0 },
  { freguesia: "Morreira e Trandeiras", curto: "Morreira e Trandeiras", al: 4, et: 0 },
  { freguesia: "Sobreposta", curto: "Sobreposta", al: 4, et: 0 },
  { freguesia: "Arentim e Cunha", curto: "Arentim e Cunha", al: 2, et: 0 },
  { freguesia: "Cabreiros e Passos (São Julião)", curto: "Cabreiros e Passos", al: 2, et: 0 },
  { freguesia: "Celeirós, Aveleda e Vimieiro", curto: "Celeirós, Aveleda e Vimieiro", al: 1, et: 0 },
  { freguesia: "Escudeiros e Penso (Santo Estêvão e São Vicente)", curto: "Escudeiros e Penso", al: 0, et: 1 },
  { freguesia: "Guisande e Oliveira (São Pedro)", curto: "Guisande e Oliveira", al: 1, et: 0 },
  { freguesia: "Merelim (São Pedro) e Frossos", curto: "Merelim (S. Pedro) e Frossos", al: 1, et: 0 },
  { freguesia: "Padim da Graça", curto: "Padim da Graça", al: 1, et: 0 },
  { freguesia: "Pedralva", curto: "Pedralva", al: 1, et: 0 },
  { freguesia: "Tadim", curto: "Tadim", al: 1, et: 0 },
];


// ─── Residentes vs Não Residentes - Braga (INE), 2018–2025 ───
// Fonte: INE/TravelBI. Estada média 2025: 2,27 noites (não residentes) / 1,48 (residentes).
export const RESIDENTES: Record<string, { dormidasRes: number; dormidasNaoRes: number; hospedesRes: number; hospedesNaoRes: number }> = {
  '2018': { dormidasRes: 300426, dormidasNaoRes: 281988, hospedesRes: 204168, hospedesNaoRes: 125935 },
  '2019': { dormidasRes: 330578, dormidasNaoRes: 309022, hospedesRes: 228025, hospedesNaoRes: 140724 },
  '2020': { dormidasRes: 183225, dormidasNaoRes: 80384, hospedesRes: 131694, hospedesNaoRes: 36709 },
  '2021': { dormidasRes: 250192, dormidasNaoRes: 151802, hospedesRes: 164414, hospedesNaoRes: 54478 },
  '2022': { dormidasRes: 307045, dormidasNaoRes: 310084, hospedesRes: 204227, hospedesNaoRes: 127355 },
  '2023': { dormidasRes: 300762, dormidasNaoRes: 336547, hospedesRes: 204409, hospedesNaoRes: 146245 },
  '2024': { dormidasRes: 321322, dormidasNaoRes: 357344, hospedesRes: 215984, hospedesNaoRes: 156894 },
  '2025': { dormidasRes: 338165, dormidasNaoRes: 354073, hospedesRes: 227883, hospedesNaoRes: 156011 },
};

// ─── Taxa Municipal Turística - receita mensal (€), 2021–2026 ───
// Valor imputado ao mês do documento (mês de referência da fatura), não ao mês de pagamento.
// 2021–2025 e jan–mar/2026: série de faturação emitida (valores múltiplos de 1,50 €/dormida).
// abr–jun/2026: apurado a partir dos mapas SGF "Documentos Cobrados" do 1.º e 2.º trimestres
// de 2026 (extração de 18/08/2026), somando o Valor Pago por mês do documento. São valores
// PROVISÓRIOS: só incluem faturas já cobradas até 30/06/2026, pelo que serão revistos em alta
// (em jan–mar/2026 a cobrança em falta à mesma data era de 3,3 a 5 %; junho é o mês mais incompleto).
export const TAXA_TURISTICA: Record<string, Record<string, number>> = {"2021": {"Janeiro": 592.5, "Fevereiro": 58.5, "Março": 0, "Abril": 8337, "Maio": 13503, "Junho": 25561.5, "Julho": 35956.5, "Agosto": 33003, "Setembro": 60334.5, "Outubro": 70957.5, "Novembro": 43299, "Dezembro": 9433.5, "Total": 301036.5}, "2022": {"Janeiro": 1744.5, "Fevereiro": 288, "Março": 310.5, "Abril": 34747.5, "Maio": 58750.5, "Junho": 53136, "Julho": 61803, "Agosto": 50796, "Setembro": 92595, "Outubro": 90024, "Novembro": 45967.5, "Dezembro": 883.5, "Total": 491046}, "2023": {"Janeiro": 1288.5, "Fevereiro": 99, "Março": 45, "Abril": 33274.5, "Maio": 71562, "Junho": 47589, "Julho": 88534.5, "Agosto": 51189, "Setembro": 67173, "Outubro": 80241, "Novembro": 58878, "Dezembro": 733.5, "Total": 500607}, "2024": {"Janeiro": 2067, "Fevereiro": 132, "Março": 216, "Abril": 43429.5, "Maio": 45028.5, "Junho": 56403, "Julho": 114961.5, "Agosto": 69060, "Setembro": 88303.5, "Outubro": 81241.5, "Novembro": 72600, "Dezembro": 1482, "Total": 574924.5}, "2025": {"Janeiro": 3304.5, "Fevereiro": 762, "Março": 366, "Abril": 48606, "Maio": 65524.5, "Junho": 56629.5, "Julho": 96475.5, "Agosto": 80301, "Setembro": 97998, "Outubro": 116245.5, "Novembro": 91531.5, "Dezembro": 49665, "Total": 707409}, "2026": {"Janeiro": 66933, "Fevereiro": 37371, "Março": 39426, "Abril": 62673.42, "Maio": 64098, "Junho": 51409.5}};

// ─── Atendimento de Balcão - Posto de Turismo (2025 e 2026) ───
// Reconstruído a partir do registo bruto (exportação de 24/09/2026, período 01/01/2025–24/09/2026).
// Definições (iguais nos dois anos): atendimentos = registos (visitantes + não visitantes); pax = pessoas;
// visitantes/residentes = n.º de atendimentos a visitantes / a não visitantes; listas por categoria e
// peregrinos/crianças/grupos/nec. especiais = n.º de atendimentos (interesses múltiplos contados um a um);
// estadaMedia = média de dormidas entre quem pernoita. 2026: 1 jan – 24 set (setembro parcial).
export const BALCAO: Record<string, any> = {"2025": {"atendimentos": 8077, "pax": 62008, "residentes": 119, "visitantes": 7958, "peregrinos": 0, "necEspeciais": 0, "criancas": 52, "grupos": 0, "estadaMedia": 3.28, "mensal": {"1": [345, 1942], "2": [460, 1816], "3": [491, 2395], "4": [872, 7542], "5": [927, 6358], "6": [726, 5290], "7": [928, 9505], "8": [793, 12829], "9": [689, 5082], "10": [679, 4830], "11": [456, 2486], "12": [711, 1933]}, "nacionalidades": [["Espanha", 1227], ["Portugal", 924], ["França", 882], ["Reino Unido", 614], ["Brasil", 554], ["Alemanha", 553], ["Países Baixos", 502], ["Estados Unidos", 472], ["Itália", 405], ["Bélgica", 320], ["Canadá", 200], ["Polónia", 166], ["Austrália", 131], ["Argentina", 81], ["Suíça", 73]], "interesses": [["Informação Turística de Braga", 333], ["Programação cultural ou publicações", 59], ["Outros", 40], ["Informação Transportes", 24], ["Informação Turística de outros destinos", 22], ["Localização ruas (Mapas)", 20], ["Gastronomia", 18], ["Lazer", 15], ["Vendas de Produtos", 14], ["Animação Nocturna", 8], ["Visitas Guiadas", 6], ["Caminhos de Santiago", 6]], "meioChegada": [], "cidades": [["Madrid", 29], ["Lisboa", 20], ["Vigo", 15], ["Corunha", 14], ["Barcelona", 11], ["Santiago de Compostela", 8], ["Paris", 6], ["Saragoça", 5], ["Sevilha", 5], ["Coimbra", 5], ["Badajoz", 5], ["Bilbau", 4], ["Porto", 4], ["Salamanca", 4], ["Pontevedra", 4]], "perfil": [["Visitante Individual / Família", 7958]], "alojamento": [["Hotel", 6], ["Apartamento (AL)", 2], ["Parque de Campismo/Caravanismo", 2]]}, "2026": {"atendimentos": 16270, "pax": 43463, "residentes": 3216, "visitantes": 13054, "peregrinos": 124, "necEspeciais": 24, "criancas": 1109, "grupos": 180, "estadaMedia": 2.75, "mensal": {"1": [716, 1421], "2": [580, 1517], "3": [1511, 4022], "4": [2018, 6755], "5": [1779, 4905], "6": [2121, 5102], "7": [2131, 6012], "8": [3421, 9245], "9": [1993, 4484]}, "nacionalidades": [["Espanha", 5246], ["França", 1817], ["Portugal", 1628], ["Alemanha", 686], ["Reino Unido", 650], ["Itália", 405], ["Países Baixos", 368], ["Brasil", 334], ["Estados Unidos", 328], ["Bélgica", 233], ["Canadá", 165], ["Polónia", 151], ["Argentina", 91], ["Austrália", 88], ["Suíça", 84]], "interesses": [["Informação Turística de Braga", 10952], ["Informação Turística de outros destinos", 768], ["Informação Transportes", 462], ["Eventos e Festividades", 397], ["Restauração/Gastronomia", 382], ["Loja", 371], ["Património/Museus", 289], ["Programação cultural ou publicações", 269], ["Comboio Turístico", 194], ["Outros", 176], ["Parque Nacional Peneda-Gerês", 169], ["Localização ruas (Mapas)", 165]], "meioChegada": [["Carro", 1926], ["Comboio", 467], ["Autocarro", 185], ["Autocaravana", 183], ["Motociclo", 16], ["A pé / Bicicleta", 14], ["Bicicleta", 11], ["Avião", 8], ["Avião (Aeroporto Porto)", 7], ["Cruzeiro (Porto de Leixões)", 6], ["A pé", 5], ["Outro", 3], ["Táxi", 1], ["Transfer", 1]], "cidades": [["Madrid", 1029], ["Barcelona", 296], ["Lisboa", 282], ["Bilbau", 253], ["Paris", 210], ["Valência", 181], ["Vigo", 155], ["Corunha", 150], ["Sevilha", 145], ["Saragoça", 132], ["Santiago de Compostela", 116], ["Londres", 108], ["Valladolid", 105], ["Porto", 89], ["Pamplona", 87]], "perfil": [["Visitante Individual / Família", 11684], ["Turista Individual / Família", 1284], ["Guia Turístico", 24], ["Outro", 16], ["M.I.C.E.", 15], ["Operador Turístico", 11], ["Professor / Escola", 11], ["Jornalista / Blogger", 5], ["Estudante Erasmus / Intercâmbio", 3], ["MICE - Corporate / Negócios", 1]], "alojamento": [["Hotel", 388], ["Parque de Campismo/Caravanismo", 173], ["Apartamento (AL)", 50], ["Apartamento Turístico", 36], ["Pousada da Juventude", 14], ["Estabelecimento de Hospedagem (Hostel) (AL)", 9], ["Albergue (Peregrinos)", 6], ["Moradia (AL)", 4], ["Aldeamento Turístico", 2], ["Quarto (AL)", 2], ["Turismo de Habitação", 1], ["Resort", 1], ["Residência Universitária / Quartos estudantes", 1]]}};

// ─── SUSTENTABILIDADE - dados reais de relatórios internos ───
// Fontes: Barómetro de Perceção dos Residentes (2026, n=293, amostra não probabilística);
// App Eco - Posto de Turismo (piloto, 15 submissões); Green Destinations TIA Braga 2025.
export const SUSTENTABILIDADE = {
  percecao: {
    n: 293,
    periodo: '29 abr – 10 mai 2026',
    positiva: 88.4, negativa: 3.4, neutra: 8.2,
    beneficiaEconomia: 93.0, valorizaCultura: 90.3, melhoraVida: 72.3,
    respeitaCultura: 74.3, respeitaAmbiente: 58.5,
    custoVida: 74.7, sobrelotacao: 66.9, impactosAmbientais: 71.5, naoOuvidos: 45.1, ouvidos: 11.3,
    igpt: [
      { dim: 'Economia e Desenvolvimento', resultado: 'Muito positiva', nivel: 5 },
      { dim: 'Cultura e Património', resultado: 'Muito positiva', nivel: 5 },
      { dim: 'Qualidade de Vida e Pressão Urbana', resultado: 'Moderadamente positiva', nivel: 3 },
      { dim: 'Sustentabilidade Ambiental', resultado: 'Moderadamente positiva', nivel: 3 },
      { dim: 'Governança e Participação', resultado: 'Moderadamente reduzida', nivel: 2 },
    ] as { dim: string; resultado: string; nivel: number }[],
  },
  appEco: {
    submissoes: 15, pegadaMedia: 287, taxaReciclagem: 20,
    transporte: [['Carro', 66.7], ['Avião', 26.7], ['Comboio', 6.7]] as [string, number][],
    alojamento: [['Hotel', 57.1], ['Alojamento Local', 28.6], ['Sem alojamento', 14.3]] as [string, number][],
    dieta: [['Mista', 46.7], ['Tradicional', 46.7], ['Carne', 6.7]] as [string, number][],
    residuos: [['Baixo', 83.3], ['Médio', 16.7]] as [string, number][],
    climatizacao: [['Baixa', 38.5], ['Ligeira', 30.8], ['Média', 15.4], ['Nenhuma', 15.4]] as [string, number][],
  },
  destino: {
    sazonalidade: 32.4, sazonalidadeNacional: 36.6,
    turistasPorHabitante: 1.7,
    frotaVerde: 60, autocarrosEletricos: 46,
    iluminacaoLED: 64, luminariasTotal: 36680,
    pegadaConcelho: 8615,
    biorresiduosVar: 149,
    economiaLocal: 75, dependenciaTurismo: '10–15%',
    recolhaSeletiva: 57.6, redePedestre: 280, redeCiclavel: 37,
    certificacao: 'Full',
  },
};
