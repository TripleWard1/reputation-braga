'use client';

import PaginaLegal, { usarLingua } from '@/app/components/PaginaLegal';
import { CONTACTOS } from '@/app/lib/contactos';

// Declaração de Acessibilidade e Usabilidade (Decreto-Lei n.º 83/2018), segundo a estrutura do modelo da AMA.
export default function Acessibilidade() {
  const [l, mudar] = usarLingua();
  const url = typeof window !== 'undefined' ? window.location.origin : '';
  const data = new Date(CONTACTOS.dataDeclaracao).toLocaleDateString(l === 'pt' ? 'pt-PT' : l === 'es' ? 'es-ES' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const contacto = CONTACTOS.emailAcessibilidade
    ? <a href={`mailto:${CONTACTOS.emailAcessibilidade}`}>{CONTACTOS.emailAcessibilidade}</a>
    : <a href={CONTACTOS.site} target="_blank" rel="noopener noreferrer">{CONTACTOS.site.replace('https://', '')}</a>;
  const T = {
    pt: {
      titulo: 'Declaração de Acessibilidade e Usabilidade',
      intro: <>O <strong>{CONTACTOS.entidade}</strong> compromete-se a tornar acessível o sítio web <strong>Observatório de Turismo de Braga</strong> ({url}), em conformidade com o Decreto-Lei n.º 83/2018, de 19 de outubro, que transpõe a Diretiva (UE) 2016/2102.</>,
      h1: 'Estado de conformidade', p1: <>Este sítio web está <strong>parcialmente conforme</strong> com as Diretrizes de Acessibilidade para Conteúdo Web (WCAG) 2.1, nível AA, devido às limitações indicadas abaixo.</>,
      h2: 'Conteúdo não acessível e alternativas',
      lim: [
        <><strong>Gráficos</strong>: alguns gráficos são complexos. Cada gráfico tem uma tabela de dados equivalente para leitores de ecrã e um botão para descarregar os dados em Excel.</>,
        <><strong>Mapas interativos</strong>: a navegação por teclado nos mapas é limitada. A mesma informação está disponível em listas (Locais, Alojamento Local, Mobilidade).</>,
        <><strong>Documentos PDF exportados</strong>: podem não ser totalmente acessíveis. Os mesmos conteúdos estão disponíveis nas páginas do sítio.</>,
        <><strong>Respostas geradas por inteligência artificial</strong> («Pergunte ao Observatório»): são texto simples, mas podem conter imprecisões; os dados oficiais estão nos separadores indicados.</>,
        <><strong>Conteúdos de terceiros</strong>: excertos de comentários públicos do Google Maps são reproduzidos tal como escritos pelos autores.</>,
      ],
      h3: 'Elaboração desta declaração', p3: <>Declaração elaborada em <strong>{data}</strong>, com base numa avaliação interna (testes automáticos e manuais: contraste de cores, navegação por teclado, foco visível, textos alternativos, estrutura de títulos, idioma da página e leitores de ecrã).</>,
      h4: 'Medidas de acessibilidade aplicadas',
      med: ['Contraste de texto de pelo menos 4,5:1 em todo o sítio.', 'Ligação «Saltar para o conteúdo» e foco visível em todos os elementos interativos.', 'Navegação completa por teclado nos menus, separadores e formulários.', 'Tabelas de dados acessíveis para cada gráfico e exportação dos dados em Excel.', 'Idioma da página atualizado ao mudar de língua.', 'Respeito pela preferência de movimento reduzido do sistema operativo.'],
      h5: 'Comentários e contactos', p5: <>Se encontrar alguma barreira de acessibilidade, ou precisar de um conteúdo num formato alternativo, contacte-nos: {contacto}. Responderemos com a maior brevidade possível.</>,
      h6: 'Procedimento de reclamação', p6: <>Se a resposta não for satisfatória, pode apresentar reclamação no <a href="https://www.livroreclamacoes.pt" target="_blank" rel="noopener noreferrer">Livro de Reclamações Eletrónico</a> e contactar a Agência para a Modernização Administrativa através de <a href="https://www.acessibilidade.gov.pt" target="_blank" rel="noopener noreferrer">acessibilidade.gov.pt</a>.</>,
    },
    en: {
      titulo: 'Accessibility and Usability Statement',
      intro: <><strong>{CONTACTOS.entidade}</strong> is committed to making the <strong>Braga Tourism Observatory</strong> website ({url}) accessible, in accordance with Portuguese Decree-Law 83/2018 of 19 October, transposing Directive (EU) 2016/2102.</>,
      h1: 'Compliance status', p1: <>This website is <strong>partially compliant</strong> with the Web Content Accessibility Guidelines (WCAG) 2.1, level AA, due to the limitations listed below.</>,
      h2: 'Non-accessible content and alternatives',
      lim: [
        <><strong>Charts</strong>: some charts are complex. Each chart has an equivalent data table for screen readers and a button to download the data as Excel.</>,
        <><strong>Interactive maps</strong>: keyboard navigation on maps is limited. The same information is available as lists (Places, Short-term rentals, Mobility).</>,
        <><strong>Exported PDF documents</strong>: may not be fully accessible. The same content is available on the website pages.</>,
        <><strong>AI-generated answers</strong> («Ask the Observatory»): plain text, but may contain inaccuracies; official data is in the indicated tabs.</>,
        <><strong>Third-party content</strong>: excerpts of public Google Maps reviews are shown as written by their authors.</>,
      ],
      h3: 'Preparation of this statement', p3: <>Statement prepared on <strong>{data}</strong>, based on an internal assessment (automatic and manual tests: colour contrast, keyboard navigation, visible focus, text alternatives, heading structure, page language and screen readers).</>,
      h4: 'Accessibility measures in place',
      med: ['Text contrast of at least 4.5:1 throughout the site.', '«Skip to content» link and visible focus on all interactive elements.', 'Full keyboard navigation of menus, tabs and forms.', 'Accessible data tables for every chart and Excel data export.', 'Page language updated when switching language.', 'Respect for the operating system’s reduced-motion preference.'],
      h5: 'Feedback and contact', p5: <>If you encounter an accessibility barrier, or need content in an alternative format, please contact us: {contacto}. We will reply as soon as possible.</>,
      h6: 'Complaints procedure', p6: <>If the reply is not satisfactory, you may file a complaint through the <a href="https://www.livroreclamacoes.pt" target="_blank" rel="noopener noreferrer">Electronic Complaints Book</a> and contact the Agency for Administrative Modernisation at <a href="https://www.acessibilidade.gov.pt" target="_blank" rel="noopener noreferrer">acessibilidade.gov.pt</a>.</>,
    },
    es: {
      titulo: 'Declaración de Accesibilidad y Usabilidad',
      intro: <>El <strong>{CONTACTOS.entidade}</strong> se compromete a hacer accesible el sitio web <strong>Observatorio de Turismo de Braga</strong> ({url}), de conformidad con el Decreto-Ley portugués 83/2018, de 19 de octubre, que transpone la Directiva (UE) 2016/2102.</>,
      h1: 'Situación de cumplimiento', p1: <>Este sitio web es <strong>parcialmente conforme</strong> con las Pautas de Accesibilidad para el Contenido Web (WCAG) 2.1, nivel AA, debido a las limitaciones indicadas a continuación.</>,
      h2: 'Contenido no accesible y alternativas',
      lim: [
        <><strong>Gráficos</strong>: algunos gráficos son complejos. Cada gráfico tiene una tabla de datos equivalente para lectores de pantalla y un botón para descargar los datos en Excel.</>,
        <><strong>Mapas interactivos</strong>: la navegación por teclado en los mapas es limitada. La misma información está disponible en listas (Lugares, Alojamiento local, Movilidad).</>,
        <><strong>Documentos PDF exportados</strong>: pueden no ser totalmente accesibles. Los mismos contenidos están disponibles en las páginas del sitio.</>,
        <><strong>Respuestas generadas por inteligencia artificial</strong> («Pregunte al Observatorio»): son texto simple, pero pueden contener imprecisiones; los datos oficiales están en las pestañas indicadas.</>,
        <><strong>Contenidos de terceros</strong>: los extractos de reseñas públicas de Google Maps se reproducen tal como los escribieron sus autores.</>,
      ],
      h3: 'Elaboración de esta declaración', p3: <>Declaración elaborada el <strong>{data}</strong>, a partir de una evaluación interna (pruebas automáticas y manuales: contraste de colores, navegación por teclado, foco visible, textos alternativos, estructura de títulos, idioma de la página y lectores de pantalla).</>,
      h4: 'Medidas de accesibilidad aplicadas',
      med: ['Contraste de texto de al menos 4,5:1 en todo el sitio.', 'Enlace «Saltar al contenido» y foco visible en todos los elementos interactivos.', 'Navegación completa por teclado en menús, pestañas y formularios.', 'Tablas de datos accesibles para cada gráfico y exportación de los datos en Excel.', 'Idioma de la página actualizado al cambiar de idioma.', 'Respeto por la preferencia de movimiento reducido del sistema operativo.'],
      h5: 'Comentarios y contacto', p5: <>Si encuentra alguna barrera de accesibilidad, o necesita un contenido en un formato alternativo, contáctenos: {contacto}. Responderemos lo antes posible.</>,
      h6: 'Procedimiento de reclamación', p6: <>Si la respuesta no es satisfactoria, puede presentar una reclamación en el <a href="https://www.livroreclamacoes.pt" target="_blank" rel="noopener noreferrer">Libro de Reclamaciones Electrónico</a> y contactar con la Agencia para la Modernización Administrativa en <a href="https://www.acessibilidade.gov.pt" target="_blank" rel="noopener noreferrer">acessibilidade.gov.pt</a>.</>,
    },
  }[l];
  return (
    <PaginaLegal titulo={T.titulo} lingua={l} mudar={mudar}>
      <p>{T.intro}</p>
      <h2>{T.h1}</h2><p>{T.p1}</p>
      <h2>{T.h2}</h2><ul>{T.lim.map((x, i) => <li key={i}>{x}</li>)}</ul>
      <h2>{T.h3}</h2><p>{T.p3}</p>
      <h2>{T.h4}</h2><ul>{T.med.map((x, i) => <li key={i}>{x}</li>)}</ul>
      <h2>{T.h5}</h2><p>{T.p5}</p>
      <h2>{T.h6}</h2><p>{T.p6}</p>
    </PaginaLegal>
  );
}
