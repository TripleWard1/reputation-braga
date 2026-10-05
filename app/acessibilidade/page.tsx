'use client';

import PaginaLegal, { useLingua } from '@/app/components/PaginaLegal';
import { CONTACTOS } from '@/app/lib/contactos';

// Declaração de Acessibilidade e Usabilidade (Decreto-Lei n.º 83/2018), segundo a estrutura do modelo da AMA.
export default function Acessibilidade() {
  const [l, mudar] = useLingua();
  const url = typeof window !== 'undefined' ? window.location.origin : '';
  const data = new Date(CONTACTOS.dataDeclaracao).toLocaleDateString(l === 'pt' ? 'pt-PT' : l === 'es' ? 'es-ES' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const contacto = CONTACTOS.emailAcessibilidade
    ? <a href={`mailto:${CONTACTOS.emailAcessibilidade}`}>{CONTACTOS.emailAcessibilidade}</a>
    : <a href={CONTACTOS.site} target="_blank" rel="noopener noreferrer">{CONTACTOS.site.replace('https://', '')}</a>;
  const T = {
    pt: {
      titulo: 'Declaração de Acessibilidade e Usabilidade',
      intro: <>O <strong>{CONTACTOS.entidade}</strong> compromete-se a tornar acessível a plataforma <strong>Observatório de Turismo de Braga</strong> ({url}), em conformidade com o Decreto-Lei n.º 83/2018, de 19 de outubro, que transpõe a Diretiva (UE) 2016/2102.</>,
      h1: 'Estado de conformidade', p1: <>Esta plataforma está <strong>parcialmente conforme</strong> com as Diretrizes de Acessibilidade para Conteúdo Web (WCAG) 2.1, nível AA, devido às limitações indicadas abaixo.</>,
      h2: 'Conteúdo não acessível e alternativas',
      lim: [
        <><strong>Gráficos</strong>: alguns gráficos são complexos. Os gráficos do Observatório e os gráficos de evolução das páginas de reputação têm uma tabela de dados equivalente para leitores de ecrã e um botão para descarregar os dados em Excel. Os gráficos de barras das fichas dos locais mostram os valores em texto, mas não têm exportação.</>,
        <><strong>Mapas interativos</strong>: a navegação por teclado nos mapas é limitada. A mesma informação está disponível em listas (Locais, Alojamento Local, Mobilidade).</>,
        <><strong>Documentos PDF exportados</strong>: podem não ser totalmente acessíveis. Os mesmos conteúdos estão disponíveis nas páginas da plataforma.</>,
        <><strong>Respostas geradas por inteligência artificial</strong> («Pergunte ao Observatório»): são texto simples, mas podem conter imprecisões; os dados oficiais estão nos separadores indicados.</>,
        <><strong>Conteúdos de terceiros</strong>: excertos de comentários públicos do Google Maps são reproduzidos tal como escritos pelos autores.</>,
      ],
      h3: 'Elaboração desta declaração', p3: <>Declaração elaborada em <strong>{data}</strong>, com base numa avaliação interna feita durante o desenvolvimento: cálculo do contraste das cores segundo as WCAG, navegação por teclado, foco visível, estrutura de títulos e idioma da página. Ainda não foram feitos testes com leitores de ecrã nem uma auditoria externa.</>,
      h4: 'Medidas de acessibilidade aplicadas',
      med: ['Contraste de pelo menos 4,5:1 nas cores de texto da plataforma.', 'Ligação «Saltar para o conteúdo» e foco visível nos elementos interativos.', 'Navegação por teclado nos menus, separadores e formulários.', 'Tabelas de dados acessíveis e exportação para Excel nos gráficos do Observatório e nos gráficos de evolução.', 'Idioma da página atualizado ao mudar de língua.', 'Respeito pela preferência de movimento reduzido do sistema operativo.'],
      h5: 'Comentários e contactos', p5: <>Se encontrar alguma barreira de acessibilidade, ou precisar de um conteúdo num formato alternativo, contacte-nos: {contacto}. Responderemos com a maior brevidade possível.</>,
      h6: 'Procedimento de reclamação', p6: <>Se a resposta não for satisfatória, pode contactar a Agência para a Modernização Administrativa (AMA), entidade que acompanha o cumprimento do Decreto-Lei n.º 83/2018, através de <a href="https://www.acessibilidade.gov.pt" target="_blank" rel="noopener noreferrer">acessibilidade.gov.pt</a>.</>,
    },
    en: {
      titulo: 'Accessibility and Usability Statement',
      intro: <><strong>{CONTACTOS.entidade}</strong> is committed to making the <strong>Braga Tourism Observatory</strong> platform ({url}) accessible, in accordance with Portuguese Decree-Law 83/2018 of 19 October, transposing Directive (EU) 2016/2102.</>,
      h1: 'Compliance status', p1: <>This platform is <strong>partially compliant</strong> with the Web Content Accessibility Guidelines (WCAG) 2.1, level AA, due to the limitations listed below.</>,
      h2: 'Non-accessible content and alternatives',
      lim: [
        <><strong>Charts</strong>: some charts are complex. Observatory charts and the trend charts on the reputation pages have an equivalent data table for screen readers and a button to download the data as Excel. Bar charts on the place pages show their values as text but have no export.</>,
        <><strong>Interactive maps</strong>: keyboard navigation on maps is limited. The same information is available as lists (Places, Short-term rentals, Mobility).</>,
        <><strong>Exported PDF documents</strong>: may not be fully accessible. The same content is available on the platform pages.</>,
        <><strong>AI-generated answers</strong> («Ask the Observatory»): plain text, but may contain inaccuracies; official data is in the indicated tabs.</>,
        <><strong>Third-party content</strong>: excerpts of public Google Maps reviews are shown as written by their authors.</>,
      ],
      h3: 'Preparation of this statement', p3: <>Statement prepared on <strong>{data}</strong>, based on an internal assessment carried out during development: colour contrast calculated according to WCAG, keyboard navigation, visible focus, heading structure and page language. Screen reader testing and an external audit have not yet been carried out.</>,
      h4: 'Accessibility measures in place',
      med: ['Contrast of at least 4.5:1 for the platform’s text colours.', '«Skip to content» link and visible focus on interactive elements.', 'Keyboard navigation of menus, tabs and forms.', 'Accessible data tables and Excel export for Observatory charts and trend charts.', 'Page language updated when switching language.', 'Respect for the operating system’s reduced-motion preference.'],
      h5: 'Feedback and contact', p5: <>If you encounter an accessibility barrier, or need content in an alternative format, please contact us: {contacto}. We will reply as soon as possible.</>,
      h6: 'Complaints procedure', p6: <>If the reply is not satisfactory, you may contact the Agency for Administrative Modernisation (AMA), the body that monitors compliance with Decree-Law 83/2018, at <a href="https://www.acessibilidade.gov.pt" target="_blank" rel="noopener noreferrer">acessibilidade.gov.pt</a>.</>,
    },
    es: {
      titulo: 'Declaración de Accesibilidad y Usabilidad',
      intro: <>El <strong>{CONTACTOS.entidade}</strong> se compromete a hacer accesible la plataforma <strong>Observatorio de Turismo de Braga</strong> ({url}), de conformidad con el Decreto-Ley portugués 83/2018, de 19 de octubre, que transpone la Directiva (UE) 2016/2102.</>,
      h1: 'Situación de cumplimiento', p1: <>Esta plataforma es <strong>parcialmente conforme</strong> con las Pautas de Accesibilidad para el Contenido Web (WCAG) 2.1, nivel AA, debido a las limitaciones indicadas a continuación.</>,
      h2: 'Contenido no accesible y alternativas',
      lim: [
        <><strong>Gráficos</strong>: algunos gráficos son complejos. Los gráficos del Observatorio y los gráficos de evolución de las páginas de reputación tienen una tabla de datos equivalente para lectores de pantalla y un botón para descargar los datos en Excel. Los gráficos de barras de las fichas de los lugares muestran los valores en texto, pero no tienen exportación.</>,
        <><strong>Mapas interactivos</strong>: la navegación por teclado en los mapas es limitada. La misma información está disponible en listas (Lugares, Alojamiento local, Movilidad).</>,
        <><strong>Documentos PDF exportados</strong>: pueden no ser totalmente accesibles. Los mismos contenidos están disponibles en las páginas de la plataforma.</>,
        <><strong>Respuestas generadas por inteligencia artificial</strong> («Pregunte al Observatorio»): son texto simple, pero pueden contener imprecisiones; los datos oficiales están en las pestañas indicadas.</>,
        <><strong>Contenidos de terceros</strong>: los extractos de reseñas públicas de Google Maps se reproducen tal como los escribieron sus autores.</>,
      ],
      h3: 'Elaboración de esta declaración', p3: <>Declaración elaborada el <strong>{data}</strong>, a partir de una evaluación interna realizada durante el desarrollo: cálculo del contraste de colores según las WCAG, navegación por teclado, foco visible, estructura de títulos e idioma de la página. Todavía no se han hecho pruebas con lectores de pantalla ni una auditoría externa.</>,
      h4: 'Medidas de accesibilidad aplicadas',
      med: ['Contraste de al menos 4,5:1 en los colores de texto de la plataforma.', 'Enlace «Saltar al contenido» y foco visible en los elementos interactivos.', 'Navegación por teclado en menús, pestañas y formularios.', 'Tablas de datos accesibles y exportación a Excel en los gráficos del Observatorio y en los gráficos de evolución.', 'Idioma de la página actualizado al cambiar de idioma.', 'Respeto por la preferencia de movimiento reducido del sistema operativo.'],
      h5: 'Comentarios y contacto', p5: <>Si encuentra alguna barrera de accesibilidad, o necesita un contenido en un formato alternativo, contáctenos: {contacto}. Responderemos lo antes posible.</>,
      h6: 'Procedimiento de reclamación', p6: <>Si la respuesta no es satisfactoria, puede contactar con la Agencia para la Modernización Administrativa (AMA), entidad que supervisa el cumplimiento del Decreto-Ley 83/2018, en <a href="https://www.acessibilidade.gov.pt" target="_blank" rel="noopener noreferrer">acessibilidade.gov.pt</a>.</>,
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
