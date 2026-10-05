'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { t } from '@/app/lib/i18n';

// Rede de segurança: se uma secção falhar, mostra o erro e um botão para tentar outra vez,
// em vez de deixar a página inteira em branco. Volta ao normal quando se muda de secção.
interface Props { children: ReactNode; chave?: string }
interface Estado { erro: Error | null }

export default class LimiteErro extends Component<Props, Estado> {
  state: Estado = { erro: null };
  static getDerivedStateFromError(erro: Error): Estado { return { erro }; }
  componentDidCatch(erro: Error, info: ErrorInfo) { console.error('Erro numa secção da plataforma:', erro, info.componentStack); }
  componentDidUpdate(anterior: Props) { if (anterior.chave !== this.props.chave && this.state.erro) this.setState({ erro: null }); }
  render() {
    if (!this.state.erro) return this.props.children;
    return (
      <div role="alert" style={{ maxWidth: 640, margin: '12vh auto', padding: '28px 28px', borderRadius: 14, background: '#1C1F24', border: '1px solid #2D3139', color: '#ECEDEF', fontFamily: "'Public Sans', system-ui, sans-serif", textAlign: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{t('Esta secção não abriu', 'This section did not open')}</div>
        <p style={{ margin: '0 0 16px', fontSize: 14.5, lineHeight: 1.6, color: '#A3A8B1' }}>{t('O resto da plataforma continua a funcionar. Tente outra vez; se o problema continuar, envie a mensagem abaixo à equipa.', 'The rest of the platform still works. Try again; if the problem persists, send the message below to the team.')}</p>
        <code style={{ display: 'block', margin: '0 0 18px', padding: '10px 12px', borderRadius: 8, background: '#15171B', color: '#EF8A7B', fontSize: 12.5, wordBreak: 'break-word', textAlign: 'left' }}>{this.state.erro.message || String(this.state.erro)}</code>
        <button type="button" onClick={() => window.location.reload()} style={{ height: 42, padding: '0 22px', borderRadius: 999, border: 0, background: '#8AB0E6', color: '#0F1216', fontFamily: 'inherit', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>{t('Tentar outra vez', 'Try again')}</button>
      </div>
    );
  }
}
