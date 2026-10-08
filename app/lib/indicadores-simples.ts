// Os indicadores técnicos do Observatório e do Relatório INSTO, explicados em linguagem simples.
// Usado no separador INSTO («Como ler os indicadores») e no Relatório Anual INSTO (Metodologia e Glossário).
// [nome, explicação] em português e em inglês.
export interface IndicadorSimples { pt: [string, string]; en: [string, string] }

export const INDICADORES_SIMPLES: IndicadorSimples[] = [
  {
    pt: ['Variação homóloga', 'Compara um mês ou um ano com o mesmo período do ano anterior (março com março, por exemplo). Assim, a subida não é confundida com a época do ano.'],
    en: ['Year-on-year change', 'Compares a month or a year with the same period of the previous year (March with March, for example), so a rise is not mistaken for the time of year.'],
  },
  {
    pt: ['Crescimento médio anual (TCAC)', 'Quanto a procura cresceu, em média, em cada ano de um período. Um TCAC de 1% entre 2019 e 2025 quer dizer que, se tivesse crescido sempre ao mesmo ritmo, teria aumentado 1% por ano.'],
    en: ['Average annual growth (CAGR)', 'How much demand grew, on average, each year over a period. A CAGR of 1% between 2019 and 2025 means that, had it grown at a steady pace, it would have risen 1% a year.'],
  },
  {
    pt: ['Coeficiente de Gini da sazonalidade', 'Mede se os turistas vêm ao longo de todo o ano ou se se concentram em poucos meses. Vai de 0 (todos os meses iguais) até perto de 1 (tudo num só mês): quanto mais baixo, menos sazonal é o destino. Lê-se comparando com o Norte e com o país.'],
    en: ['Seasonality Gini coefficient', 'Measures whether visitors come all year round or are concentrated in a few months. It ranges from 0 (every month equal) to close to 1 (everything in one month): the lower, the less seasonal the destination. It is read by comparison with the North and the country.'],
  },
  {
    pt: ['Índice de Herfindahl-Hirschman (IHH)', 'Mede se o destino depende de poucos mercados. Soma-se o quadrado da quota de cada país: se todos os turistas viessem de um só país, daria 10 000; com muitos países equilibrados, fica perto de 0. Acima de 1 800 considera-se uma dependência elevada.'],
    en: ['Herfindahl-Hirschman Index (HHI)', 'Measures whether the destination depends on a few markets. The squares of each country’s share are added up: if all visitors came from a single country it would be 10,000; with many balanced countries it is close to 0. Above 1,800 is considered high dependence.'],
  },
  {
    pt: ['Taxa de função turística de Defert', 'Quantas camas turísticas há por cada 100 habitantes. Mostra o peso do turismo na cidade face a quem lá vive: quanto mais alta, maior a presença do turismo no dia a dia.'],
    en: ['Defert tourist function rate', 'How many tourist beds there are per 100 residents. It shows the weight of tourism relative to the people who live there: the higher, the more present tourism is in daily life.'],
  },
  {
    pt: ['Intensidade turística', 'Dormidas por habitante num ano. Indica quantas noites de turistas existem para cada residente.'],
    en: ['Tourism intensity', 'Overnight stays per resident in a year. It indicates how many tourist nights there are for each resident.'],
  },
  {
    pt: ['Pressão do alojamento local por freguesia', 'Camas de alojamento local por cada 100 residentes da freguesia. Permite ver onde o alojamento local pesa mais, sobretudo no centro histórico.'],
    en: ['Short-term rental pressure by parish', 'Short-term rental beds per 100 residents of the parish. It shows where short-term rentals weigh most, especially in the historic centre.'],
  },
  {
    pt: ['Correlação de Pearson', 'Mede se duas séries sobem e descem ao mesmo tempo, de −1 a +1. Perto de +1, andam juntas (por exemplo, mais passageiros no aeroporto e mais dormidas em Braga); perto de 0, não há relação. Mostra que andam juntas, não que uma causa a outra.'],
    en: ['Pearson correlation', 'Measures whether two series rise and fall together, from −1 to +1. Close to +1 they move together (for example, more airport passengers and more overnight stays in Braga); close to 0 there is no relationship. It shows they move together, not that one causes the other.'],
  },
  {
    pt: ['Preço médio real', 'O preço médio por quarto ocupado (ADR) já descontada a inflação. Mostra se os preços subiram mais ou menos do que o custo de vida.'],
    en: ['Real average rate', 'The average price per occupied room (ADR) after removing inflation. It shows whether prices rose more or less than the cost of living.'],
  },
  {
    pt: ['Índice de sazonalidade mensal', 'Dormidas de um mês a dividir pela média dos meses. 1,00 é um mês médio; abaixo de 0,9 é um mês fraco, onde vale a pena captar visitantes.'],
    en: ['Monthly seasonality index', 'Overnight stays in a month divided by the monthly average. 1.00 is an average month; below 0.9 is a weak month, worth targeting for visitors.'],
  },
];
