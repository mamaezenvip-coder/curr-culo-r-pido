import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Download,
  Loader2,
  Mic,
  Plus,
  Square,
  Trash2,
  Upload,
  Wand2,
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
} from "@/lib/cv.functions";
import { emptyResume, type ResumeData } from "@/lib/resume-types";
import { ResumePreview } from "@/components/ResumePreview";
import { generateResumePdf } from "@/lib/generate-pdf";

export const Route = createFileRoute("/criar")({
  head: () => ({
    meta: [
      { title: "Criar currículo — DESENROLA AI CLT" },
      {
        name: "description",
        content:
          "Monte seu currículo profissional em PDF preenchendo por texto ou áudio.",
      },
    ],
  }),
  component: Criar,
});

function Criar() {
  const [data, setData] = useState<ResumeData>(emptyResume);
  const [withPhoto, setWithPhoto] = useState(true);
  const [processingPhoto, setProcessingPhoto] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [recording, setRecording] = useState(false);

  const transcribeFn = useServerFn(transcribeAudio);
  const extractFn = useServerFn(extractResumeData);
  const whitenFn = useServerFn(whitenPhotoBackground);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const update = <K extends keyof ResumeData>(k: K, v: ResumeData[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  // -------- Audio recording ----------
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
      toast.info("Transcrevendo seu áudio...");
      const { text } = await transcribeFn({
        data: { audioBase64: base64, mimeType: blob.type || "audio/webm" },
      });
      if (!text.trim()) {
        toast.error("Não consegui entender o áudio. Tente novamente.");
        return;
      }
      toast.info("Organizando seu currículo...");
      const { data: extracted } = await extractFn({ data: { rawText: text } });
      mergeExtracted(extracted);
      toast.success("Pronto! Revise os campos preenchidos.");
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

  // -------- Photo ----------
  const onPhotoChange = async (file: File | null) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Foto muito grande. Use uma foto menor que 8MB.");
      return;
    }
    setProcessingPhoto(true);
    try {
      toast.info("Aplicando fundo branco profissional...");
      const base64 = await fileToBase64(file);
      const { dataUrl } = await whitenFn({
        data: { imageBase64: base64, mimeType: file.type || "image/jpeg" },
      });
      update("fotoDataUrl", dataUrl);
      toast.success("Foto pronta!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao processar foto");
      // fallback: use raw photo
      const reader = new FileReader();
      reader.onload = () => update("fotoDataUrl", reader.result as string);
      reader.readAsDataURL(file);
    } finally {
      setProcessingPhoto(false);
    }
  };

  const handleDownload = () => {
    if (!data.nome.trim()) {
      toast.error("Preencha pelo menos seu nome.");
      return;
    }
    const doc = generateResumePdf({ ...data, fotoDataUrl: withPhoto ? data.fotoDataUrl : undefined });
    const safe = data.nome.replace(/[^a-zA-Z0-9 ]/g, "").trim() || "curriculo";
    doc.save(`Curriculo - ${safe}.pdf`);
    toast.success("PDF baixado!");
  };

  // -------- Render ----------
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border/40 crystal">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-sm hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
          <span className="text-sm font-black tracking-tight">
            DESENROLA <span className="text-gradient-red">AI CLT</span>
          </span>
          <Button
            size="sm"
            onClick={handleDownload}
            className="bg-primary font-semibold shadow-[var(--shadow-red)] hover:bg-primary/90"
          >
            <Download className="mr-2 h-4 w-4" />
            Baixar PDF
          </Button>
        </div>
      </header>

      <div className="container mx-auto grid gap-6 px-4 py-6 lg:grid-cols-[1fr_1fr]">
        {/* Form */}
        <div className="space-y-5">
          {/* Audio block */}
          <Card title="Preencher por áudio (opcional)" icon={<Mic className="h-4 w-4" />}>
            <p className="text-xs text-muted-foreground">
              Não sabe escrever ou não consegue digitar? Grave um áudio contando seu nome,
              profissão, contato e experiências. A ferramenta preenche tudo para você.
            </p>
            <div className="mt-3 flex gap-2">
              {!recording ? (
                <Button
                  type="button"
                  onClick={startRecording}
                  disabled={transcribing}
                  className="bg-primary hover:bg-primary/90"
                >
                  {transcribing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Mic className="mr-2 h-4 w-4" />
                  )}
                  {transcribing ? "Processando..." : "Gravar áudio"}
                </Button>
              ) : (
                <Button type="button" onClick={stopRecording} variant="destructive">
                  <Square className="mr-2 h-4 w-4" />
                  Parar gravação
                </Button>
              )}
              <label className="inline-flex">
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) processAudioBlob(f);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  asChild
                  disabled={transcribing}
                  className="cursor-pointer"
                >
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    Enviar áudio
                  </span>
                </Button>
              </label>
            </div>
          </Card>

          {/* Photo */}
          <Card title="Foto" icon={<Wand2 className="h-4 w-4" />}>
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={withPhoto}
                  onChange={(e) => setWithPhoto(e.target.checked)}
                  className="h-4 w-4 accent-red-600"
                />
                Currículo com foto
              </label>
            </div>

            {withPhoto && (
              <div className="mt-4 flex items-center gap-4">
                <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-full crystal">
                  {data.fotoDataUrl ? (
                    <img
                      src={data.fotoDataUrl}
                      alt="Foto"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">Sem foto</span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => onPhotoChange(e.target.files?.[0] ?? null)}
                    />
                    <Button
                      type="button"
                      asChild
                      disabled={processingPhoto}
                      className="cursor-pointer bg-primary hover:bg-primary/90"
                    >
                      <span>
                        {processingPhoto ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="mr-2 h-4 w-4" />
                        )}
                        {processingPhoto ? "Tratando foto..." : "Enviar foto"}
                      </span>
                    </Button>
                  </label>
                  {data.fotoDataUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => update("fotoDataUrl", undefined)}
                    >
                      <X className="mr-1 h-3 w-3" /> Remover
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Use foto do peito pra cima. O fundo é trocado por branco profissional.
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* Identification */}
          <Card title="Dados pessoais">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Nome completo *">
                <Input
                  value={data.nome}
                  onChange={(e) => update("nome", e.target.value)}
                  placeholder="Ex: João da Silva"
                />
              </Field>
              <Field label="Profissão / Cargo desejado">
                <Input
                  value={data.profissao}
                  onChange={(e) => update("profissao", e.target.value)}
                  placeholder="Ex: Auxiliar de logística"
                />
              </Field>
              <Field label="E-mail">
                <Input
                  type="email"
                  value={data.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="seu@email.com"
                />
              </Field>
              <Field label="Telefone">
                <Input
                  value={data.telefone}
                  onChange={(e) => update("telefone", e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </Field>
              <Field label="Cidade / Estado">
                <Input
                  value={data.cidade}
                  onChange={(e) => update("cidade", e.target.value)}
                  placeholder="São Paulo, SP"
                />
              </Field>
            </div>
            <Field label="Resumo profissional" className="mt-3">
              <Textarea
                rows={3}
                value={data.resumo}
                onChange={(e) => update("resumo", e.target.value)}
                placeholder="2-3 linhas sobre você."
              />
            </Field>
          </Card>

          {/* Experiences */}
          <Card title="Experiência profissional">
            <div className="space-y-3">
              {data.experiencias.map((exp, i) => (
                <div key={i} className="rounded-lg border border-border/60 p-3">
                  <div className="grid gap-2 md:grid-cols-2">
                    <Input
                      placeholder="Cargo"
                      value={exp.cargo}
                      onChange={(e) =>
                        updateList(setData, "experiencias", i, "cargo", e.target.value)
                      }
                    />
                    <Input
                      placeholder="Empresa"
                      value={exp.empresa}
                      onChange={(e) =>
                        updateList(setData, "experiencias", i, "empresa", e.target.value)
                      }
                    />
                    <Input
                      placeholder="Período (Ex: Jan/2022 - Atual)"
                      value={exp.periodo}
                      onChange={(e) =>
                        updateList(setData, "experiencias", i, "periodo", e.target.value)
                      }
                    />
                  </div>
                  <Textarea
                    rows={2}
                    className="mt-2"
                    placeholder="Atividades realizadas"
                    value={exp.descricao}
                    onChange={(e) =>
                      updateList(setData, "experiencias", i, "descricao", e.target.value)
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromList(setData, "experiencias", i)}
                    className="mt-1"
                  >
                    <Trash2 className="mr-1 h-3 w-3" /> Remover
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setData((d) => ({
                    ...d,
                    experiencias: [
                      ...d.experiencias,
                      { cargo: "", empresa: "", periodo: "", descricao: "" },
                    ],
                  }))
                }
              >
                <Plus className="mr-2 h-4 w-4" /> Adicionar experiência
              </Button>
            </div>
          </Card>

          {/* Education */}
          <Card title="Formação">
            <div className="space-y-3">
              {data.formacao.map((f, i) => (
                <div key={i} className="rounded-lg border border-border/60 p-3">
                  <div className="grid gap-2 md:grid-cols-3">
                    <Input
                      placeholder="Curso"
                      value={f.curso}
                      onChange={(e) =>
                        updateList(setData, "formacao", i, "curso", e.target.value)
                      }
                    />
                    <Input
                      placeholder="Instituição"
                      value={f.instituicao}
                      onChange={(e) =>
                        updateList(setData, "formacao", i, "instituicao", e.target.value)
                      }
                    />
                    <Input
                      placeholder="Período"
                      value={f.periodo}
                      onChange={(e) =>
                        updateList(setData, "formacao", i, "periodo", e.target.value)
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromList(setData, "formacao", i)}
                    className="mt-1"
                  >
                    <Trash2 className="mr-1 h-3 w-3" /> Remover
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setData((d) => ({
                    ...d,
                    formacao: [
                      ...d.formacao,
                      { curso: "", instituicao: "", periodo: "" },
                    ],
                  }))
                }
              >
                <Plus className="mr-2 h-4 w-4" /> Adicionar formação
              </Button>
            </div>
          </Card>

          {/* Skills + Languages */}
          <Card title="Habilidades">
            <SimpleList
              items={data.habilidades}
              onChange={(v) => update("habilidades", v)}
              placeholder="Ex: Trabalho em equipe"
            />
          </Card>
          <Card title="Idiomas">
            <SimpleList
              items={data.idiomas}
              onChange={(v) => update("idiomas", v)}
              placeholder="Ex: Inglês intermediário"
            />
          </Card>

          <div className="sticky bottom-4 z-10">
            <Button
              size="lg"
              onClick={handleDownload}
              className="h-12 w-full bg-primary text-base font-semibold shadow-[var(--shadow-red)] hover:bg-primary/90"
            >
              <Download className="mr-2 h-5 w-5" />
              Baixar currículo em PDF
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-auto">
          <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
            Pré-visualização
          </div>
          <ResumePreview d={{ ...data, fotoDataUrl: withPhoto ? data.fotoDataUrl : undefined }} />
        </div>
      </div>
    </div>
  );
}

// ============ small helpers ============
function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="crystal rounded-2xl p-5">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

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
      <Button type="button" variant="outline" onClick={() => onChange([...items, ""])}>
        <Plus className="mr-2 h-4 w-4" /> Adicionar
      </Button>
    </div>
  );
}

function updateList<
  K extends "experiencias" | "formacao",
>(
  setter: React.Dispatch<React.SetStateAction<ResumeData>>,
  key: K,
  index: number,
  field: keyof ResumeData[K][number],
  value: string,
) {
  setter((prev) => {
    const next = [...prev[key]] as ResumeData[K];
    (next[index] as Record<string, string>)[field as string] = value;
    return { ...prev, [key]: next };
  });
}

function removeFromList<K extends "experiencias" | "formacao">(
  setter: React.Dispatch<React.SetStateAction<ResumeData>>,
  key: K,
  index: number,
) {
  setter((prev) => ({
    ...prev,
    [key]: (prev[key] as unknown[]).filter((_, i) => i !== index) as ResumeData[K],
  }));
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