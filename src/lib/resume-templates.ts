export type TemplateId = "executivo" | "minimalista" | "moderno";

export const TEMPLATES: { id: TemplateId; name: string; desc: string }[] = [
  {
    id: "executivo",
    name: "Executivo",
    desc: "Barra lateral escura com destaques vermelhos. Clássico e impactante.",
  },
  {
    id: "minimalista",
    name: "Minimalista",
    desc: "Uma coluna, muito espaço em branco. Limpo e fácil de ler.",
  },
  {
    id: "moderno",
    name: "Moderno",
    desc: "Cabeçalho vermelho em destaque e duas colunas. Visual atual.",
  },
];