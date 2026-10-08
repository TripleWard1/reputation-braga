'use client';

import { useEffect } from 'react';

// Rede de segurança de toda a página: se algo falhar fora das secções, mostra o erro e deixa tentar outra vez
// sem perder o separador em que se estava (o endereço da página guarda-o).
export default function Erro({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('Erro na plataforma:', error); }, [error]);
  const pedaco = /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module/i.test(String(error && (error.name + ' ' + error.message)));
  return (
    <div role="alert" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0c0e14', padding: 24 }}>
      <div style={{ maxWidth: 560, padding: '28px', borderRadius: 14, background: '#1C1F24', border: '1px solid #2D3139', color: '#ECEDEF', fontFamily: "'Public Sans', system-ui, sans-serif", textAlign: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{pedaco ? 'A plataforma foi atualizada' : 'Algo correu mal'}</div>
        <p style={{ margin: '0 0 16px', fontSize: 14.5, lineHeight: 1.6, color: '#A3A8B1' }}>{pedaco ? 'Há uma versão mais recente. Carregue para continuar no mesmo sítio.' : 'Tente outra vez. Se o problema continuar, envie a mensagem abaixo à equipa.'}</p>
        {!pedaco && <code style={{ display: 'block', margin: '0 0 18px', padding: '10px 12px', borderRadius: 8, background: '#15171B', color: '#EF8A7B', fontSize: 12.5, wordBreak: 'break-word', textAlign: 'left' }}>{(error && error.message) || String(error)}</code>}
        <button type="button" onClick={() => (pedaco ? window.location.reload() : reset())} style={{ height: 42, padding: '0 22px', borderRadius: 999, border: 0, background: '#8AB0E6', color: '#0F1216', fontFamily: 'inherit', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>{pedaco ? 'Continuar' : 'Tentar outra vez'}</button>
      </div>
    </div>
  );
}
