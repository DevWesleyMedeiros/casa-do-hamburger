// EXPLICAÇÃO AI: Um barrel export (ou barrel file) é um padrão de organização de arquivos que agrupa várias exportações de módulos de um diretório em um único arquivo. No Zustand, ele permite que você centralize e importe suas stores de maneira limpa, mantendo seu código limpo e escalável. O conceito envolve a criação de um arquivo chamado index.js ou index.ts dentro de uma pasta, o qual centraliza as exportações de todos os arquivos de estado que estão ali.

export { useUserStore } from "./useUserStrore";
