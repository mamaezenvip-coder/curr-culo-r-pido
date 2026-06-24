import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  Eye,
  GraduationCap,
  Image as ImageIcon,
  Keyboard,
  Loader2,
  Mic,
  Plus,
  Square,
  Trash2,
  Upload,
  User,
  Briefcase,
  Sparkles,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  transcribeAudio,
  extractResumeData,
  whitenPhotoBackground,
  enhanceResumeWithAI,
} from "@/lib/cv.functions";
import { emptyResume, type ResumeData } from "@/lib/resume-types";
import { ResumePreview } from "@/components/ResumePreview";
import { generateResumePdf } from "@/lib/generate-pdf";
import { TEMPLATES, type TemplateId } from "@/lib/resume-templates";

export const Route = createFileRoute("/criar")({
  head: () => ({
    meta: [
      { title: "Criar currículo — DESENROLA AI CLT" },
      {
        name: "description",
        content:
          "Monte seu currículo em poucos passos simples. Funciona até com áudio.",
      },
    ],
  }),
  component: Criar,
});

const STEPS = [
  { key: "inicio", label: "Começar", icon: Sparkles },
  { key: "foto", label: "Foto", icon: ImageIcon },
  { key: "dados", label: "Seus dados", icon: User },
  { key: "exp", label: "Experiência", icon: Briefcase },
  { key: "form", label: "Estudos", icon: GraduationCap },
  { key: "pronto", label: "Pronto!", icon: Check },
] as const;

function Criar() {
  const [data, setData] = useState<ResumeData>(emptyResume);
  const [withPhoto, setWithPhoto] = useState(true);
  const [step, setStep] = useState(0);
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [enhanced, setEnhanced] = useState(false);
  const [template, setTemplate] = useState<TemplateId>("executivo");

  const transcribeFn = useServerFn(transcribeAudio);
  const extractFn = useServerFn(extractResumeData);
  const whitenFn = useServerFn(whitenPhotoBackground);
  const enhanceFn = useServerFn(enhanceResumeWithAI);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const update = <K extends keyof ResumeData>(k: K, v: ResumeData[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  // ---------- Audio ----------
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await processAudioBlob(blob);
      };
      rec.start();
      setRecording(true);
    } catch {
      toast.error("Não foi possível acessar o microfone.");
    }
  };
  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };
  const processAudioBlob = async (blob: Blob) => {
    setTranscribing(true);
    try {
      const base64 = await blobToBase64(blob);
      toast.info("Ouvindo seu áudio...");
      const { text } = await transcribeFn({
        data: { audioBase64: base64, mimeType: blob.type || "audio/webm" },
      });
      if (!text.trim()) {
        toast.error("Não consegui entender. Tente falar mais perto do microfone.");
        return;
      }
      toast.info("Montando seu currículo...");
      const { data: extracted } = await extractFn({ data: { rawText: text } });
      mergeExtracted(extracted);
      toast.success("Pronto! Agora é só revisar.");
      setStep(1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao processar áudio");
    } finally {
      setTranscribing(false);
    }
  };
  const mergeExtracted = (e: Partial<ResumeData> & Record<string, unknown>) => {
    setData((prev) => ({
      ...prev,
      nome: (e.nome as string) || prev.nome,
      profissao: (e.profissao as string) || prev.profissao,
      email: (e.email as string) || prev.email,
      telefone: (e.telefone as string) || prev.telefone,
      cidade: (e.cidade as string) || prev.cidade,
      resumo: (e.resumo as string) || prev.resumo,
      experiencias:
        Array.isArray(e.experiencias) && e.experiencias.length
          ? (e.experiencias as ResumeData["experiencias"])
          : prev.experiencias,
      formacao:
        Array.isArray(e.formacao) && e.formacao.length
          ? (e.formacao as ResumeData["formacao"])
          : prev.formacao,
      habilidades:
        Array.isArray(e.habilidades) && e.habilidades.length
          ? (e.habilidades as string[])
          : prev.habilidades,
      idiomas:
        Array.isArray(e.idiomas) && e.idiomas.length
          ? (e.idiomas as string[])
          : prev.idiomas,
    }));
  };

  // ---------- Photo ----------
  const onPhotoChange = async (file: File | null) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Foto muito grande. Use uma menor que 8MB.");
      return;
    }
    setProcessingPhoto(true);
    try {
      toast.info("Deixando o fundo branquinho...");
      const base64 = await fileToBase64(file);
      const { dataUrl } = await whitenFn({
        data: { imageBase64: base64, mimeType: file.type || "image/jpeg" },
      });
      update("fotoDataUrl", dataUrl);
      toast.success("Foto pronta!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao processar foto");
      const reader = new FileReader();
      reader.onload = () => update("fotoDataUrl", reader.result as string);
      reader.readAsDataURL(file);
    } finally {
      setProcessingPhoto(false);
    }
  };

  // ---------- Download ----------
  const handleDownload = () => {
    if (!data.nome.trim()) {
      toast.error("Preencha pelo menos seu nome.");
      setStep(2);
      return;
    }
    const doc = generateResumePdf(
      {
        ...data,
        fotoDataUrl: withPhoto ? data.fotoDataUrl : undefined,
      },
      template,
    );
    const safe = data.nome.replace(/[^a-zA-Z0-9 ]/g, "").trim() || "curriculo";
    doc.save(`Curriculo - ${safe}.pdf`);
    toast.success("PDF baixado! Bom trabalho 🎉");
  };

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const runEnhance = async () => {
    if (!data.nome.trim()) {
      toast.error("Preencha pelo menos seu nome antes.");
      setStep(2);
      return;
    }
    setEnhancing(true);
    try {
      toast.info("✨ A IA está deixando seu currículo profissional...");
      const { data: better } = await enhanceFn({
        data: {
          raw: {
            nome: data.nome,
            profissao: data.profissao,
            email: data.email,
            telefone: data.telefone,
            cidade: data.cidade,
            resumo: data.resumo,
            experiencias: data.experiencias,
            formacao: data.formacao,
            habilidades: data.habilidades,
            idiomas: data.idiomas,
          },
        },
      });
      setData((d) => ({ ...d, ...(better as Partial<ResumeData>) }));
      setEnhanced(true);
      toast.success("Currículo turbinado! 🚀");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao melhorar");
    } finally {
      setEnhancing(false);
    }
  };

  useEffect(() => {
    if (step === 5 && !enhanced && !enhancing && data.nome.trim()) {
      void runEnhance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border/40 crystal">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-sm hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Início
          </Link>
          <span className="text-sm font-black tracking-tight">
            DESENROLA <span className="text-gradient-red">AI CLT</span>
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowPreview(true)}
            className="gap-1"
          >
            <Eye className="h-4 w-4" /> Ver
          </Button>
        </div>

        {/* Step progress */}
        <Stepper step={step} onJump={setStep} />
      </header>

      <main className="container mx-auto px-4 py-6 pb-32">
        <div className="mx-auto max-w-2xl">
          {step === 0 && (
            <StepStart
              recording={recording}
              transcribing={transcribing}
              onRecord={startRecording}
              onStop={stopRecording}
              onUpload={processAudioBlob}
              onType={() => setStep(1)}
            />
          )}
          {step === 1 && (
            <StepPhoto
              withPhoto={withPhoto}
              setWithPhoto={setWithPhoto}
              photo={data.fotoDataUrl}
              processing={processingPhoto}
              onChange={onPhotoChange}
              onRemove={() => update("fotoDataUrl", undefined)}
            />
          )}
          {step === 2 && <StepData data={data} update={update} />}
          {step === 3 && <StepExperience data={data} setData={setData} />}
          {step === 4 && <StepEducation data={data} setData={setData} />}
          {step === 5 && (
            <StepDone
              data={{ ...data, fotoDataUrl: withPhoto ? data.fotoDataUrl : undefined }}
              onDownload={handleDownload}
              onPreview={() => setShowPreview(true)}
              enhancing={enhancing}
              enhanced={enhanced}
              onEnhance={runEnhance}
              template={template}
              setTemplate={setTemplate}
            />
          )}
        </div>
      </main>

      {/* Footer nav — always visible, huge buttons */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 border-t border-border/40 crystal">
        <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-3">
          <Button
            variant="outline"
            onClick={prev}
            disabled={step === 0}
            className="h-12 flex-1 text-base"
          >
            <ArrowLeft className="mr-2 h-5 w-5" /> Voltar
          </Button>
          {step < STEPS.length - 1 ? (
            <Button
              onClick={next}
              className="h-12 flex-[2] bg-primary text-base font-bold shadow-[var(--shadow-red)] hover:bg-primary/90"
            >
              Próximo <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          ) : (
            <Button
              onClick={handleDownload}
              className="h-12 flex-[2] bg-primary text-base font-black uppercase shadow-[var(--shadow-red)] hover:bg-primary/90"
            >
              <Download className="mr-2 h-5 w-5" /> Baixar PDF
            </Button>
          )}
        </div>
      </footer>

      {/* Preview drawer */}
      {showPreview && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/70 p-4 backdrop-blur"
          onClick={() => setShowPreview(false)}
        >
          <div className="w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Pré-visualização</span>
              <Button size="sm" variant="outline" onClick={() => setShowPreview(false)}>
                <X className="mr-1 h-4 w-4" /> Fechar
              </Button>
            </div>
            <ResumePreview
              d={{ ...data, fotoDataUrl: withPhoto ? data.fotoDataUrl : undefined }}
              template={template}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ============== Step components ============== */

function Stepper({ step, onJump }: { step: number; onJump: (n: number) => void }) {
  return (
    <div className="container mx-auto flex gap-1 px-4 pb-3">
      {STEPS.map((s, i) => {
        const active = i === step;
        const done = i < step;
        return (
          <button
            key={s.key}
            onClick={() => onJump(i)}
            className={`flex-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
              active
                ? "bg-primary text-primary-foreground"
                : done
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
            }`}
            aria-label={`Passo ${i + 1}: ${s.label}`}
          >
            {i + 1}. {s.label}
          </button>
        );
      })}
    </div>
  );
}

function StepCard({
  title,
  subtitle,
  emoji,
  children,
}: {
  title: string;
  subtitle?: string;
  emoji?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="crystal rounded-3xl p-6 md:p-8">
      <div className="mb-5 text-center">
        {emoji && <div className="mb-2 text-5xl">{emoji}</div>}
        <h1 className="text-2xl font-black tracking-tight md:text-3xl">{title}</h1>
        {subtitle && (
          <p className="mt-2 text-sm text-muted-foreground md:text-base">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function StepStart({
  recording,
  transcribing,
  onRecord,
  onStop,
  onUpload,
  onType,
}: {
  recording: boolean;
  transcribing: boolean;
  onRecord: () => void;
  onStop: () => void;
  onUpload: (b: Blob) => void;
  onType: () => void;
}) {
  return (
    <StepCard
      emoji="👋"
      title="Como você quer começar?"
      subtitle="Escolha o jeito mais fácil pra você. Pode falar, digitar ou enviar um áudio."
    >
      <div className="grid gap-3">
        {!recording ? (
          <BigChoice
            icon={<Mic className="h-7 w-7" />}
            title={transcribing ? "Processando seu áudio..." : "Falar (gravar áudio)"}
            desc="Aperte e fale: nome, profissão, telefone, experiências. A gente preenche tudo."
            onClick={onRecord}
            disabled={transcribing}
            highlight
          >
            {transcribing && <Loader2 className="h-5 w-5 animate-spin" />}
          </BigChoice>
        ) : (
          <BigChoice
            icon={<Square className="h-7 w-7" />}
            title="Estou ouvindo... toque para parar"
            desc="Fale com calma. Quando terminar, aperte aqui."
            onClick={onStop}
            highlight
          />
        )}

        <label className="block">
          <input
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpload(f);
            }}
          />
          <BigChoice
            asLabel
            icon={<Upload className="h-7 w-7" />}
            title="Enviar um áudio gravado"
            desc="Já tem um áudio no celular? Envia aqui."
            disabled={transcribing || recording}
          />
        </label>

        <BigChoice
          icon={<Keyboard className="h-7 w-7" />}
          title="Prefiro digitar"
          desc="Vou preencher os campos um por um. É rapidinho."
          onClick={onType}
          disabled={transcribing || recording}
        />
      </div>
    </StepCard>
  );
}

function BigChoice({
  icon,
  title,
  desc,
  onClick,
  disabled,
  highlight,
  asLabel,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick?: () => void;
  disabled?: boolean;
  highlight?: boolean;
  asLabel?: boolean;
  children?: React.ReactNode;
}) {
  const cls = `flex w-full items-center gap-4 rounded-2xl border p-5 text-left transition-all ${
    highlight
      ? "border-primary/60 bg-primary/10 hover:bg-primary/15"
      : "border-border/60 bg-card/50 hover:border-primary/40 hover:bg-card"
  } ${disabled ? "pointer-events-none opacity-60" : "cursor-pointer"}`;
  const inner = (
    <>
      <div
        className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl ${
          highlight ? "bg-primary text-primary-foreground" : "bg-primary/20 text-primary"
        }`}
      >
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-base font-bold">{title}</div>
        <div className="text-xs text-muted-foreground md:text-sm">{desc}</div>
      </div>
      {children}
    </>
  );
  if (asLabel) return <div className={cls}>{inner}</div>;
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={cls}>
      {inner}
    </button>
  );
}

function StepPhoto({
  withPhoto,
  setWithPhoto,
  photo,
  processing,
  onChange,
  onRemove,
}: {
  withPhoto: boolean;
  setWithPhoto: (b: boolean) => void;
  photo?: string;
  processing: boolean;
  onChange: (f: File | null) => void;
  onRemove: () => void;
}) {
  return (
    <StepCard
      emoji="📸"
      title="Quer colocar uma foto?"
      subtitle="A gente troca o fundo da sua foto por branco profissional automaticamente."
    >
      <div className="mb-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setWithPhoto(true)}
          className={`rounded-2xl border-2 p-5 text-center font-bold transition-all ${
            withPhoto
              ? "border-primary bg-primary/15 text-primary"
              : "border-border/60 text-muted-foreground hover:border-primary/40"
          }`}
        >
          ✅ Com foto
        </button>
        <button
          type="button"
          onClick={() => setWithPhoto(false)}
          className={`rounded-2xl border-2 p-5 text-center font-bold transition-all ${
            !withPhoto
              ? "border-primary bg-primary/15 text-primary"
              : "border-border/60 text-muted-foreground hover:border-primary/40"
          }`}
        >
          🙅 Sem foto
        </button>
      </div>

      {withPhoto && (
        <div className="flex flex-col items-center gap-4">
          <div className="grid h-40 w-40 place-items-center overflow-hidden rounded-full border-4 border-primary/40 bg-card">
            {photo ? (
              <img src={photo} alt="Sua foto" className="h-full w-full object-cover" />
            ) : (
              <span className="px-4 text-center text-xs text-muted-foreground">
                Sua foto aparece aqui
              </span>
            )}
          </div>
          <label className="w-full">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onChange(e.target.files?.[0] ?? null)}
            />
            <Button
              asChild
              disabled={processing}
              className="h-12 w-full cursor-pointer bg-primary text-base font-bold hover:bg-primary/90"
            >
              <span>
                {processing ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-5 w-5" />
                )}
                {processing ? "Deixando bonita..." : photo ? "Trocar foto" : "Enviar foto"}
              </span>
            </Button>
          </label>
          {photo && (
            <Button variant="ghost" size="sm" onClick={onRemove}>
              <X className="mr-1 h-4 w-4" /> Remover foto
            </Button>
          )}
          <p className="text-center text-xs text-muted-foreground">
            Dica: use foto do peito pra cima, olhando pra câmera.
          </p>
        </div>
      )}
    </StepCard>
  );
}

function StepData({
  data,
  update,
}: {
  data: ResumeData;
  update: <K extends keyof ResumeData>(k: K, v: ResumeData[K]) => void;
}) {
  return (
    <StepCard
      emoji="📝"
      title="Seus dados"
      subtitle="Preencha o que souber. O nome é o mais importante."
    >
      <div className="space-y-4">
        <Big label="Qual é o seu nome completo?" required>
          <Input
            className="h-12 text-base"
            value={data.nome}
            onChange={(e) => update("nome", e.target.value)}
            placeholder="Ex: João da Silva"
          />
        </Big>
        <Big label="Qual vaga você quer?">
          <Input
            className="h-12 text-base"
            value={data.profissao}
            onChange={(e) => update("profissao", e.target.value)}
            placeholder="Ex: Auxiliar de logística"
          />
        </Big>
        <Big label="Telefone (com DDD)">
          <Input
            className="h-12 text-base"
            value={data.telefone}
            onChange={(e) => update("telefone", e.target.value)}
            placeholder="(11) 99999-9999"
          />
        </Big>
        <Big label="E-mail">
          <Input
            className="h-12 text-base"
            type="email"
            value={data.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="seu@email.com"
          />
        </Big>
        <Big label="Cidade onde mora">
          <Input
            className="h-12 text-base"
            value={data.cidade}
            onChange={(e) => update("cidade", e.target.value)}
            placeholder="São Paulo, SP"
          />
        </Big>
        <Big label="Fale um pouco sobre você (opcional)">
          <Textarea
            rows={3}
            className="text-base"
            value={data.resumo}
            onChange={(e) => update("resumo", e.target.value)}
            placeholder="Ex: Sou responsável, pontual e gosto de aprender."
          />
        </Big>
      </div>
    </StepCard>
  );
}

function Big({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="mb-2 block text-sm font-semibold">
        {label} {required && <span className="text-primary">*</span>}
      </Label>
      {children}
    </div>
  );
}

function StepExperience({
  data,
  setData,
}: {
  data: ResumeData;
  setData: React.Dispatch<React.SetStateAction<ResumeData>>;
}) {
  const add = () =>
    setData((d) => ({
      ...d,
      experiencias: [
        ...d.experiencias,
        { cargo: "", empresa: "", periodo: "", descricao: "" },
      ],
    }));
  return (
    <StepCard
      emoji="💼"
      title="Onde você já trabalhou?"
      subtitle="Adicione um ou mais trabalhos. Se nunca trabalhou, pule esse passo."
    >
      <div className="space-y-4">
        {data.experiencias.map((exp, i) => (
          <div key={i} className="rounded-2xl border border-border/60 bg-card/40 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-primary">
                Trabalho {i + 1}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setData((d) => ({
                    ...d,
                    experiencias: d.experiencias.filter((_, j) => j !== i),
                  }))
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              <Input
                className="h-11 text-base"
                placeholder="O que você fazia? (ex: Atendente)"
                value={exp.cargo}
                onChange={(e) =>
                  updateList(setData, "experiencias", i, "cargo", e.target.value)
                }
              />
              <Input
                className="h-11 text-base"
                placeholder="Nome da empresa"
                value={exp.empresa}
                onChange={(e) =>
                  updateList(setData, "experiencias", i, "empresa", e.target.value)
                }
              />
              <Input
                className="h-11 text-base"
                placeholder="Quando? (ex: 2022 até hoje)"
                value={exp.periodo}
                onChange={(e) =>
                  updateList(setData, "experiencias", i, "periodo", e.target.value)
                }
              />
              <Textarea
                rows={2}
                className="text-base"
                placeholder="O que você fazia no dia a dia? (opcional)"
                value={exp.descricao}
                onChange={(e) =>
                  updateList(setData, "experiencias", i, "descricao", e.target.value)
                }
              />
            </div>
          </div>
        ))}
        <Button
          onClick={add}
          variant="outline"
          className="h-12 w-full border-dashed text-base font-semibold"
        >
          <Plus className="mr-2 h-5 w-5" /> Adicionar trabalho
        </Button>
      </div>
    </StepCard>
  );
}

function StepEducation({
  data,
  setData,
}: {
  data: ResumeData;
  setData: React.Dispatch<React.SetStateAction<ResumeData>>;
}) {
  const addForm = () =>
    setData((d) => ({
      ...d,
      formacao: [...d.formacao, { curso: "", instituicao: "", periodo: "" }],
    }));
  return (
    <StepCard
      emoji="🎓"
      title="Estudos e habilidades"
      subtitle="Conta o que você estudou e o que sabe fazer."
    >
      <div className="space-y-6">
        <div>
          <h3 className="mb-2 text-sm font-bold uppercase text-primary">Estudos</h3>
          <div className="space-y-3">
            {data.formacao.map((f, i) => (
              <div key={i} className="rounded-2xl border border-border/60 bg-card/40 p-3">
                <div className="space-y-2">
                  <Input
                    className="h-11 text-base"
                    placeholder="O que estudou? (ex: Ensino médio)"
                    value={f.curso}
                    onChange={(e) =>
                      updateList(setData, "formacao", i, "curso", e.target.value)
                    }
                  />
                  <Input
                    className="h-11 text-base"
                    placeholder="Onde? (escola ou faculdade)"
                    value={f.instituicao}
                    onChange={(e) =>
                      updateList(setData, "formacao", i, "instituicao", e.target.value)
                    }
                  />
                  <Input
                    className="h-11 text-base"
                    placeholder="Quando? (ex: 2018 a 2020)"
                    value={f.periodo}
                    onChange={(e) =>
                      updateList(setData, "formacao", i, "periodo", e.target.value)
                    }
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1"
                  onClick={() =>
                    setData((d) => ({
                      ...d,
                      formacao: d.formacao.filter((_, j) => j !== i),
                    }))
                  }
                >
                  <Trash2 className="mr-1 h-4 w-4" /> Remover
                </Button>
              </div>
            ))}
            <Button
              onClick={addForm}
              variant="outline"
              className="h-11 w-full border-dashed font-semibold"
            >
              <Plus className="mr-2 h-4 w-4" /> Adicionar estudo
            </Button>
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-bold uppercase text-primary">
            O que você sabe fazer?
          </h3>
          <SimpleList
            items={data.habilidades}
            onChange={(v) => setData((d) => ({ ...d, habilidades: v }))}
            placeholder="Ex: Atendimento ao cliente"
          />
        </div>

        <div>
          <h3 className="mb-2 text-sm font-bold uppercase text-primary">Idiomas</h3>
          <SimpleList
            items={data.idiomas}
            onChange={(v) => setData((d) => ({ ...d, idiomas: v }))}
            placeholder="Ex: Inglês básico"
          />
        </div>
      </div>
    </StepCard>
  );
}

function StepDone({
  data,
  onDownload,
  onPreview,
  enhancing,
  enhanced,
  onEnhance,
}: {
  data: ResumeData;
  onDownload: () => void;
  onPreview: () => void;
  enhancing: boolean;
  enhanced: boolean;
  onEnhance: () => void;
}) {
  return (
    <StepCard
      emoji="🎉"
      title={enhancing ? "A IA está montando..." : "Tudo pronto!"}
      subtitle={
        enhancing
          ? "Aguarde uns segundinhos. A IA está deixando seu currículo profissional."
          : "Veja como ficou e baixe seu currículo em PDF pra mandar pras empresas."
      }
    >
      <div className="space-y-4">
        {enhancing && (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-primary/40 bg-primary/10 p-6 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-sm font-semibold text-primary">
              ✨ Profissionalizando textos, corrigindo erros e organizando tudo...
            </span>
          </div>
        )}
        <div className="overflow-hidden rounded-2xl border border-border/60">
          <div className="origin-top scale-[0.6] md:scale-[0.75]" style={{ height: 600 }}>
            <ResumePreview d={data} />
          </div>
        </div>
        <Button
          onClick={onEnhance}
          disabled={enhancing}
          variant="outline"
          className="h-12 w-full border-primary/60 text-base font-semibold text-primary hover:bg-primary/10"
        >
          {enhancing ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-5 w-5" />
          )}
          {enhanced ? "Melhorar de novo com IA" : "Melhorar com IA"}
        </Button>
        <Button
          onClick={onPreview}
          variant="outline"
          className="h-12 w-full text-base font-semibold"
        >
          <Eye className="mr-2 h-5 w-5" /> Ver tamanho real
        </Button>
        <Button
          onClick={onDownload}
          disabled={enhancing}
          className="h-14 w-full bg-primary text-lg font-black uppercase shadow-[var(--shadow-red)] hover:bg-primary/90"
        >
          <Download className="mr-2 h-6 w-6" /> Baixar meu currículo
        </Button>
      </div>
    </StepCard>
  );
}

/* ============== Helpers ============== */

function SimpleList({
  items,
  onChange,
  placeholder,
}: {
  items: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="flex gap-2">
          <Input
            className="h-11 text-base"
            value={it}
            placeholder={placeholder}
            onChange={(e) => {
              const next = [...items];
              next[i] = e.target.value;
              onChange(next);
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => onChange([...items, ""])}
        className="h-11 w-full border-dashed font-semibold"
      >
        <Plus className="mr-2 h-4 w-4" /> Adicionar
      </Button>
    </div>
  );
}

function updateList<K extends "experiencias" | "formacao">(
  setter: React.Dispatch<React.SetStateAction<ResumeData>>,
  key: K,
  index: number,
  field: keyof ResumeData[K][number],
  value: string,
) {
  setter((prev) => {
    const next = [...prev[key]] as ResumeData[K];
    (next[index] as unknown as Record<string, string>)[field as string] = value;
    return { ...prev, [key]: next };
  });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = r.result as string;
      resolve(s.split(",")[1] ?? "");
    };
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

function fileToBase64(file: File): Promise<string> {
  return blobToBase64(file);
}