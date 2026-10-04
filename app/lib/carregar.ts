// Carregamento de partes da app (import dinâmico) com recuperação.
// Depois de um novo deploy (ou de uma recompilação no StackBlitz), quem tem a página aberta pode pedir
// uma parte com o nome antigo, que já não existe ("ChunkLoadError"). Aqui: tenta outra vez e, se voltar
// a falhar, recarrega a página UMA vez (no máximo uma vez por minuto, para nunca entrar em ciclo).
export function comRecuperacao<T>(carregar: () => Promise<T>): () => Promise<T> {
  return () =>
    carregar().catch(
      () =>
        new Promise<T>((ok, falha) => {
          setTimeout(() => {
            carregar().then(ok).catch((erro) => {
              try {
                if (typeof window !== 'undefined') {
                  const ultima = Number(sessionStorage.getItem('rb-recarregou') || 0);
                  if (Date.now() - ultima > 60000) {
                    sessionStorage.setItem('rb-recarregou', String(Date.now()));
                    window.location.reload();
                    return;
                  }
                }
              } catch { /* sem sessionStorage: segue para o erro */ }
              falha(erro);
            });
          }, 700);
        }),
    );
}
