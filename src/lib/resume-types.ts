export interface Experiencia {
  cargo: string;
  empresa: string;
  periodo: string;
  descricao: string;
}

export interface Formacao {
  curso: string;
  instituicao: string;
  periodo: string;
}

export interface ResumeData {
  nome: string;
  profissao: string;
  email: string;
  telefone: string;
  cidade: string;
  resumo: string;
  experiencias: Experiencia[];
  formacao: Formacao[];
  habilidades: string[];
  idiomas: string[];
  fotoDataUrl?: string;
}

export const emptyResume: ResumeData = {
  nome: "",
  profissao: "",
  email: "",
  telefone: "",
  cidade: "",
  resumo: "",
  experiencias: [],
  formacao: [],
  habilidades: [],
  idiomas: [],
};