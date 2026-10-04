'use client';

import { createContext, useContext } from 'react';

// Modo de administração: em modo público (sem sessão), todos os botões que alteram dados ficam escondidos.
// Por omissão é FALSE: se algum componente estiver fora do fornecedor, falha do lado seguro (sem botões de edição).
export const ModoAdmin = createContext<boolean>(false);
export const useAdmin = () => useContext(ModoAdmin);
