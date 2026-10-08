// População residente por freguesia: INE, Censos 2021 (resultados definitivos), quadros extraídos a 08/10/2026.
// Idades por ciclo de vida e residentes de nacionalidade estrangeira. "nomeAL" liga cada freguesia ao nome usado
// na base municipal do alojamento local (AL_BRAGA.freguesias).
export interface Freguesia { cod: string; nome: string; pop: number; ate14: number; de15a24: number; de25a64: number; mais65: number; estrangeiros: number; nomeAL?: string }

export const CENSOS_FONTE = 'INE, Recenseamento da População e Habitação · Censos 2021 (resultados definitivos)';
export const POP_CONCELHO = { pop: 193324, ate14: 26753, de15a24: 21976, de25a64: 109422, mais65: 35173, estrangeiros: 11282 };

export const FREGUESIAS: Freguesia[] = [
  { cod: "030351", nome: "Braga (São Vítor)", pop: 32876, ate14: 4346, de15a24: 4065, de25a64: 18942, mais65: 5523, estrangeiros: 3963, nomeAL: "São Victor" },
  { cod: "030364", nome: "Braga (Maximinos, Sé e Cividade)", pop: 15087, ate14: 1875, de15a24: 1613, de25a64: 8565, mais65: 3034, estrangeiros: 1326, nomeAL: "Braga (Maximinos, Sé e Cividade)" },
  { cod: "030377", nome: "Nogueira, Fraião e Lamaçães", pop: 15015, ate14: 2571, de15a24: 1508, de25a64: 8690, mais65: 2246, estrangeiros: 654, nomeAL: "Nogueira, Fraião e Lamaçães" },
  { cod: "030365", nome: "Braga (São José de São Lázaro e São João do Souto)", pop: 14791, ate14: 1708, de15a24: 1459, de25a64: 7811, mais65: 3813, estrangeiros: 1361, nomeAL: "Braga (São José de São Lázaro e São João do Souto)" },
  { cod: "030349", nome: "Braga (São Vicente)", pop: 13974, ate14: 1928, de15a24: 1681, de25a64: 7934, mais65: 2431, estrangeiros: 1100, nomeAL: "São Vicente" },
  { cod: "030379", nome: "Real, Dume e Semelhe", pop: 13682, ate14: 2135, de15a24: 1596, de25a64: 7966, mais65: 1985, estrangeiros: 625, nomeAL: "Real, Dume e Semelhe" },
  { cod: "030371", nome: "Ferreiros e Gondizalves", pop: 9976, ate14: 1552, de15a24: 1147, de25a64: 5662, mais65: 1615, estrangeiros: 396, nomeAL: "Ferreiros e Gondizalves" },
  { cod: "030373", nome: "Lomar e Arcos", pop: 7265, ate14: 987, de15a24: 926, de25a64: 4240, mais65: 1112, estrangeiros: 254, nomeAL: "Lomar e Arcos" },
  { cod: "030319", nome: "Gualtar", pop: 6761, ate14: 1075, de15a24: 684, de25a64: 4000, mais65: 1002, estrangeiros: 355, nomeAL: "Gualtar" },
  { cod: "030367", nome: "Celeirós, Aveleda e Vimieiro", pop: 6742, ate14: 940, de15a24: 763, de25a64: 3749, mais65: 1290, estrangeiros: 182 },
  { cod: "030378", nome: "Nogueiró e Tenões", pop: 5946, ate14: 916, de15a24: 611, de25a64: 3435, mais65: 984, estrangeiros: 293, nomeAL: "Nogueiró e Tenões" },
  { cod: "030331", nome: "Palmeira", pop: 5700, ate14: 846, de15a24: 630, de25a64: 3073, mais65: 1151, estrangeiros: 125, nomeAL: "Palmeira" },
  { cod: "030374", nome: "Merelim (São Paio), Panoias e Parada de Tibães", pop: 5168, ate14: 658, de15a24: 633, de25a64: 2891, mais65: 986, estrangeiros: 72, nomeAL: "Merelim (São Paio), Panoias e Parada de Tibães" },
  { cod: "030370", nome: "Este (São Pedro e São Mamede)", pop: 4066, ate14: 611, de15a24: 483, de25a64: 2225, mais65: 747, estrangeiros: 76, nomeAL: "Este (São Pedro e São Mamede)" },
  { cod: "030375", nome: "Merelim (São Pedro) e Frossos", pop: 3935, ate14: 530, de15a24: 494, de25a64: 2232, mais65: 679, estrangeiros: 92 },
  { cod: "030301", nome: "Adaúfe", pop: 3587, ate14: 437, de15a24: 336, de25a64: 2038, mais65: 776, estrangeiros: 52, nomeAL: "Adaúfe" },
  { cod: "030325", nome: "Mire de Tibães", pop: 2344, ate14: 258, de15a24: 295, de25a64: 1269, mais65: 522, estrangeiros: 26, nomeAL: "Mire de Tibães" },
  { cod: "030366", nome: "Cabreiros e Passos (São Julião)", pop: 2082, ate14: 262, de15a24: 211, de25a64: 1114, mais65: 495, estrangeiros: 16, nomeAL: "Cabreiros e Passos (São Julião)" },
  { cod: "030369", nome: "Escudeiros e Penso (Santo Estêvão e São Vicente)", pop: 1823, ate14: 250, de15a24: 201, de25a64: 1016, mais65: 356, estrangeiros: 13 },
  { cod: "030354", nome: "Sequeira", pop: 1741, ate14: 196, de15a24: 185, de25a64: 930, mais65: 430, estrangeiros: 25 },
  { cod: "030313", nome: "Esporões", pop: 1713, ate14: 247, de15a24: 170, de25a64: 989, mais65: 307, estrangeiros: 29 },
  { cod: "030381", nome: "Vilaça e Fradelos", pop: 1552, ate14: 199, de15a24: 160, de25a64: 862, mais65: 331, estrangeiros: 10 },
  { cod: "030330", nome: "Padim da Graça", pop: 1416, ate14: 158, de15a24: 171, de25a64: 800, mais65: 287, estrangeiros: 14, nomeAL: "Padim da Graça" },
  { cod: "030363", nome: "Arentim e Cunha", pop: 1406, ate14: 145, de15a24: 163, de25a64: 784, mais65: 314, estrangeiros: 12, nomeAL: "Arentim e Cunha" },
  { cod: "030376", nome: "Morreira e Trandeiras", pop: 1364, ate14: 186, de15a24: 173, de25a64: 725, mais65: 280, estrangeiros: 9, nomeAL: "Morreira e Trandeiras" },
  { cod: "030355", nome: "Sobreposta", pop: 1267, ate14: 174, de15a24: 175, de25a64: 715, mais65: 203, estrangeiros: 18, nomeAL: "Sobreposta" },
  { cod: "030356", nome: "Tadim", pop: 1267, ate14: 197, de15a24: 149, de25a64: 716, mais65: 205, estrangeiros: 39, nomeAL: "Tadim" },
  { cod: "030336", nome: "Priscos", pop: 1256, ate14: 160, de15a24: 140, de25a64: 699, mais65: 257, estrangeiros: 11 },
  { cod: "030368", nome: "Crespos e Pousada", pop: 1231, ate14: 143, de15a24: 145, de25a64: 668, mais65: 275, estrangeiros: 20, nomeAL: "Crespos e Pousada" },
  { cod: "030315", nome: "Figueiredo", pop: 1150, ate14: 145, de15a24: 142, de25a64: 655, mais65: 208, estrangeiros: 10 },
  { cod: "030338", nome: "Ruilhe", pop: 1110, ate14: 152, de15a24: 134, de25a64: 595, mais65: 229, estrangeiros: 19 },
  { cod: "030357", nome: "Tebosa", pop: 1081, ate14: 132, de15a24: 129, de25a64: 605, mais65: 215, estrangeiros: 24 },
  { cod: "030372", nome: "Guisande e Oliveira (São Pedro)", pop: 1072, ate14: 146, de15a24: 154, de25a64: 601, mais65: 171, estrangeiros: 14, nomeAL: "Guisande e Oliveira (São Pedro)" },
  { cod: "030334", nome: "Pedralva", pop: 1060, ate14: 127, de15a24: 130, de25a64: 611, mais65: 192, estrangeiros: 10 },
  { cod: "030312", nome: "Espinho", pop: 1057, ate14: 122, de15a24: 113, de25a64: 605, mais65: 217, estrangeiros: 23 },
  { cod: "030380", nome: "Santa Lucrécia de Algeriz e Navarra", pop: 909, ate14: 113, de15a24: 93, de25a64: 524, mais65: 179, estrangeiros: 10, nomeAL: "Santa Lucrécia de Algeriz e Navarra" },
  { cod: "030322", nome: "Lamas", pop: 852, ate14: 126, de15a24: 114, de25a64: 486, mais65: 126, estrangeiros: 4 },
];
