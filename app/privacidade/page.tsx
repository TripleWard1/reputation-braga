'use client';

import PaginaLegal, { useLingua } from '@/app/components/PaginaLegal';
import { CONTACTOS } from '@/app/lib/contactos';

// Aviso de Privacidade (RGPD): o que a plataforma faz realmente com dados, em PT, EN e ES.
export default function Privacidade() {
  const [l, mudar] = useLingua();
  const epd = CONTACTOS.emailEPD
    ? <a href={`mailto:${CONTACTOS.emailEPD}`}>{CONTACTOS.emailEPD}</a>
    : <a href={CONTACTOS.site} target="_blank" rel="noopener noreferrer">{CONTACTOS.site.replace('https://', '')}</a>;
  const data = new Date(CONTACTOS.dataDeclaracao).toLocaleDateString(l === 'pt' ? 'pt-PT' : l === 'es' ? 'es-ES' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const cnpd = <a href="https://www.cnpd.pt" target="_blank" rel="noopener noreferrer">cnpd.pt</a>;
  const T = {
    pt: {
      titulo: 'Aviso de Privacidade',
      resumo: <><strong>Em resumo:</strong> para consultar o Observatório não precisa de se registar, não usamos cookies de análise nem de publicidade e não guardamos as perguntas que faz à inteligência artificial.</>,
      sec: [
        ['Quem é responsável', <>O responsável pelo tratamento de dados é o <strong>{CONTACTOS.entidade}</strong>. Pode contactar o Encarregado de Proteção de Dados através de {epd}.</>],
        ['Ao consultar a plataforma', <>Não usamos cookies de análise, de publicidade ou de redes sociais. A língua escolhida fica guardada <strong>apenas no seu navegador</strong>. O serviço de alojamento (Vercel) regista dados técnicos de acesso, como o endereço IP e a página pedida, por razões de segurança e funcionamento.</>],
        ['Serviços externos carregados pelo navegador', <>Para mostrar a plataforma, o seu navegador obtém conteúdos de serviços de terceiros, que recebem o seu endereço IP: tipos de letra (Google Fonts), mapas (OpenStreetMap e, se estiver configurado, CARTO), bandeiras (flagcdn), o logótipo (imgur), a biblioteca dos mapas (unpkg), dados meteorológicos (Open-Meteo, no separador Meteorologia) e, ao exportar, as bibliotecas xlsx-js-style (Excel, através do jsDelivr) e html2canvas e jsPDF (PDF, através do cdnjs).</>],
        ['«Pergunte ao Observatório»', <>O texto da pergunta é enviado à <strong>Groq, Inc.</strong> (Estados Unidos) apenas para gerar a resposta. A plataforma não guarda as perguntas. O seu endereço IP é usado <strong>só em memória</strong>, durante 10 minutos, para limitar o número de perguntas. <strong>Não escreva dados pessoais nas perguntas.</strong></>],
        ['Línguas da plataforma', <>As versões em inglês e espanhol estão escritas na própria plataforma. Mudar de língua não envia dados a terceiros.</>],
        ['Comentários do Google Maps', <>A plataforma analisa, de forma agregada, comentários públicos publicados no Google Maps sobre os locais turísticos. Não guarda nem mostra o nome dos autores.</>],
        ['Área de administração', <>Só a equipa do Município entra na administração. Para isso usa-se um cookie técnico de sessão (válido 30 dias) e o serviço Firebase Authentication (Google), que guarda o email de administração. Os dados da plataforma são guardados no Google Firebase.</>],
        ['Fundamento', <>O tratamento é necessário ao exercício de funções de interesse público do Município, nos termos do artigo 6.º, n.º 1, alínea e), do Regulamento Geral sobre a Proteção de Dados. Os cookies utilizados são estritamente necessários e não exigem consentimento.</>],
        ['Os seus direitos', <>Pode pedir acesso, retificação, apagamento ou limitação dos seus dados, ou opor-se ao tratamento, através de {epd}. Pode também apresentar reclamação à Comissão Nacional de Proteção de Dados ({cnpd}).</>],
      ] as [string, React.ReactNode][],
      atual: <>Última atualização: {data}.</>,
    },
    en: {
      titulo: 'Privacy Notice',
      resumo: <><strong>In short:</strong> you do not need to register to use the Observatory, we do not use analytics or advertising cookies, and we do not store the questions you ask the artificial intelligence.</>,
      sec: [
        ['Who is responsible', <>The data controller is <strong>{CONTACTOS.entidade}</strong> (Braga City Council). You can contact the Data Protection Officer at {epd}.</>],
        ['When you use the platform', <>We do not use analytics, advertising or social media cookies. Your chosen language is stored <strong>only in your browser</strong>. The hosting service (Vercel) records technical access data, such as IP address and requested page, for security and operation.</>],
        ['External services loaded by your browser', <>To display the platform, your browser fetches content from third-party services, which receive your IP address: fonts (Google Fonts), maps (OpenStreetMap and, if configured, CARTO), flags (flagcdn), the logo (imgur), the map library (unpkg), weather data (Open-Meteo, in the Weather tab) and, when exporting, the xlsx-js-style (Excel, via jsDelivr) and html2canvas and jsPDF (PDF, via cdnjs) libraries.</>],
        ['«Ask the Observatory»', <>The text of your question is sent to <strong>Groq, Inc.</strong> (United States) solely to generate the answer. The platform does not store questions. Your IP address is used <strong>only in memory</strong>, for 10 minutes, to limit the number of questions. <strong>Do not include personal data in your questions.</strong></>],
        ['Platform languages', <>The English and Spanish versions are written into the platform itself. Switching language sends no data to third parties.</>],
        ['Google Maps reviews', <>The platform analyses, in aggregate, public reviews posted on Google Maps about tourist sites. It does not store or show the authors’ names.</>],
        ['Administration area', <>Only Council staff can access the administration area. This uses a technical session cookie (valid for 30 days) and Firebase Authentication (Google), which stores the administrator email. Platform data is stored on Google Firebase.</>],
        ['Legal basis', <>Processing is necessary for the performance of tasks carried out in the public interest by the Council, under Article 6(1)(e) of the General Data Protection Regulation. The cookies used are strictly necessary and do not require consent.</>],
        ['Your rights', <>You may request access, rectification, erasure or restriction of your data, or object to processing, via {epd}. You may also lodge a complaint with the Portuguese Data Protection Authority ({cnpd}).</>],
      ] as [string, React.ReactNode][],
      atual: <>Last updated: {data}.</>,
    },
    es: {
      titulo: 'Aviso de Privacidad',
      resumo: <><strong>En resumen:</strong> no necesita registrarse para consultar el Observatorio, no usamos cookies de análisis ni de publicidad y no guardamos las preguntas que hace a la inteligencia artificial.</>,
      sec: [
        ['Responsable', <>El responsable del tratamiento de datos es el <strong>{CONTACTOS.entidade}</strong> (Ayuntamiento de Braga). Puede contactar con el Delegado de Protección de Datos a través de {epd}.</>],
        ['Al consultar la plataforma', <>No usamos cookies de análisis, de publicidad ni de redes sociales. El idioma elegido se guarda <strong>solo en su navegador</strong>. El servicio de alojamiento (Vercel) registra datos técnicos de acceso, como la dirección IP y la página solicitada, por motivos de seguridad y funcionamiento.</>],
        ['Servicios externos cargados por el navegador', <>Para mostrar la plataforma, su navegador obtiene contenidos de servicios de terceros, que reciben su dirección IP: tipografías (Google Fonts), mapas (OpenStreetMap y, si está configurado, CARTO), banderas (flagcdn), el logotipo (imgur), la biblioteca de los mapas (unpkg), datos meteorológicos (Open-Meteo, en la pestaña Meteorología) y, al exportar, las bibliotecas xlsx-js-style (Excel, a través de jsDelivr) y html2canvas y jsPDF (PDF, a través de cdnjs).</>],
        ['«Pregunte al Observatorio»', <>El texto de la pregunta se envía a <strong>Groq, Inc.</strong> (Estados Unidos) únicamente para generar la respuesta. La plataforma no guarda las preguntas. Su dirección IP se usa <strong>solo en memoria</strong>, durante 10 minutos, para limitar el número de preguntas. <strong>No escriba datos personales en las preguntas.</strong></>],
        ['Idiomas de la plataforma', <>Las versiones en inglés y español están escritas en la propia plataforma. Cambiar de idioma no envía datos a terceros.</>],
        ['Reseñas de Google Maps', <>La plataforma analiza, de forma agregada, reseñas públicas publicadas en Google Maps sobre los lugares turísticos. No guarda ni muestra el nombre de los autores.</>],
        ['Área de administración', <>Solo el personal del Ayuntamiento accede a la administración. Para ello se usa una cookie técnica de sesión (válida 30 días) y el servicio Firebase Authentication (Google), que guarda el correo de administración. Los datos de la plataforma se guardan en Google Firebase.</>],
        ['Base jurídica', <>El tratamiento es necesario para el ejercicio de funciones de interés público del Ayuntamiento, conforme al artículo 6.1.e) del Reglamento General de Protección de Datos. Las cookies utilizadas son estrictamente necesarias y no requieren consentimiento.</>],
        ['Sus derechos', <>Puede solicitar el acceso, la rectificación, la supresión o la limitación de sus datos, u oponerse al tratamiento, a través de {epd}. También puede presentar una reclamación ante la autoridad portuguesa de protección de datos, CNPD ({cnpd}).</>],
      ] as [string, React.ReactNode][],
      atual: <>Última actualización: {data}.</>,
    },
  }[l];
  return (
    <PaginaLegal titulo={T.titulo} lingua={l} mudar={mudar}>
      <p className="lg-nota">{T.resumo}</p>
      {T.sec.map(([h, p]) => (<section key={h}><h2>{h}</h2><p>{p}</p></section>))}
      <p style={{ marginTop: 32, fontSize: 13.5 }}>{T.atual}</p>
    </PaginaLegal>
  );
}
