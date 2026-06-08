import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Mic, FileText, Image as ImageIcon, Zap, CheckCircle2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DESENROLA AI CLT — Currículo profissional em PDF em minutos" },
      {
        name: "description",
        content:
          "Crie seu currículo 100% profissional em poucos cliques. Preencha por texto ou áudio, foto com fundo branco automático e baixe em PDF pronto para enviar.",
      },
      { property: "og:title", content: "DESENROLA AI CLT" },
      {
        property: "og:description",
        content:
          "Currículo profissional em PDF em minutos. Preenchimento por áudio ou texto.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen">
      <header className="container mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-lg crystal-red">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-black tracking-tight">
            DESENROLA <span className="text-gradient-red">AI CLT</span>
          </span>
        </div>
        <Link to="/criar">
          <Button variant="default" className="bg-primary hover:bg-primary/90">
            Criar currículo
          </Button>
        </Link>
      </header>

      <main className="container mx-auto px-6 pb-20 pt-10">
        <section className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full crystal px-4 py-1.5 text-xs font-medium">
            <Zap className="h-3.5 w-3.5 text-primary" />
            100% profissional · pronto em minutos
          </span>
          <h1 className="mt-6 text-5xl font-black leading-[1.05] tracking-tight md:text-6xl">
            Crie seu currículo em{" "}
            <span className="text-gradient-red">apenas alguns cliques</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Preencha digitando ou gravando um áudio. Foto opcional com fundo branco
            automático. Baixe em PDF profissional pronto para enviar à empresa.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/criar">
              <Button
                size="lg"
                className="h-12 bg-primary px-8 text-base font-semibold shadow-[var(--shadow-red)] hover:bg-primary/90"
              >
                Começar agora
                <Download className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>

        <section className="mx-auto mt-20 grid max-w-5xl gap-5 md:grid-cols-3">
          <Feature
            icon={<Mic className="h-5 w-5" />}
            title="Não sabe escrever? Mande áudio"
            desc="Grave sua voz contando sua experiência. A ferramenta transcreve e organiza tudo num currículo profissional."
          />
          <Feature
            icon={<ImageIcon className="h-5 w-5" />}
            title="Foto com fundo branco"
            desc="Envie qualquer foto do peito pra cima. A ferramenta troca o fundo para branco profissional."
          />
          <Feature
            icon={<Download className="h-5 w-5" />}
            title="PDF pronto para enviar"
            desc="Baixe um PDF profissional em segundos, pronto para mandar pra qualquer empresa."
          />
        </section>

        <section className="mx-auto mt-20 max-w-3xl rounded-2xl crystal-red p-8 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">
            Currículo profissional sem complicação
          </h2>
          <ul className="mx-auto mt-6 grid max-w-xl gap-3 text-left text-sm">
            {[
              "Preenchimento por texto OU áudio (acessível para todos)",
              "Opção com foto profissional ou sem foto",
              "Tratamento automático da foto com fundo branco",
              "Template único, design profissional moderno",
              "Download imediato em PDF — pronto para a vaga",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <Link to="/criar">
            <Button
              size="lg"
              className="mt-8 h-12 bg-primary px-8 font-semibold hover:bg-primary/90"
            >
              Criar meu currículo agora
            </Button>
          </Link>
        </section>
      </main>

      <footer className="border-t border-border/40 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} DESENROLA AI CLT — Currículo rápido e profissional
      </footer>
    </div>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="crystal rounded-2xl p-6">
      <div className="grid h-10 w-10 place-items-center rounded-lg crystal-red">{icon}</div>
      <h3 className="mt-4 text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
