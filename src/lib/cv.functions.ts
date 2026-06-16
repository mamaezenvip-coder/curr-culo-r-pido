import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

function requireKey() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY ausente");
  return key;
}

/**
 * Recebe um áudio (base64 puro, sem prefixo data:) e retorna a transcrição.
 * O usuário descreve seus dados; depois o front-end usa esses dados para
 * preencher o currículo, sem inventar nada.
 */
export const transcribeAudio = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      audioBase64: z.string().min(20).max(20_000_000),
      mimeType: z.string().default("audio/webm"),
    }),
  )
  .handler(async ({ data }) => {
    const key = requireKey();
    const format = data.mimeType.includes("mp3")
      ? "mp3"
      : data.mimeType.includes("wav")
        ? "wav"
        : "webm";

    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "Você é um transcritor profissional em português brasileiro. Transcreva fielmente o áudio do usuário, mantendo o sentido original. Não invente, não resuma, apenas transcreva.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Transcreva este áudio em português:" },
              {
                type: "input_audio",
                input_audio: { data: data.audioBase64, format },
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Falha na transcrição (${res.status}): ${txt.slice(0, 200)}`);
    }
    const json = await res.json();
    const text: string = json?.choices?.[0]?.message?.content ?? "";
    return { text };
  });

/**
 * Extrai dados estruturados de currículo a partir de texto livre
 * (digitado ou transcrito de áudio).
 */
export const extractResumeData = createServerFn({ method: "POST" })
  .inputValidator(z.object({ rawText: z.string().min(1).max(8000) }))
  .handler(async ({ data }) => {
    const key = requireKey();

    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "Você extrai dados de currículo do texto do usuário em português brasileiro. Responda APENAS um JSON válido sem markdown. Se um campo não for mencionado, deixe string vazia ou array vazio. Reescreva descrições de forma profissional, sem inventar informações que o usuário não disse.",
          },
          {
            role: "user",
            content: `Extraia os dados deste texto e devolva no formato JSON:\n{\n  "nome": "",\n  "profissao": "",\n  "email": "",\n  "telefone": "",\n  "cidade": "",\n  "resumo": "",\n  "experiencias": [{"cargo":"","empresa":"","periodo":"","descricao":""}],\n  "formacao": [{"curso":"","instituicao":"","periodo":""}],\n  "habilidades": [""],\n  "idiomas": [""]\n}\n\nTexto:\n${data.rawText}`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Falha ao extrair dados (${res.status}): ${txt.slice(0, 200)}`);
    }
    const json = await res.json();
    const content: string = json?.choices?.[0]?.message?.content ?? "{}";
    try {
      return { data: JSON.parse(content) };
    } catch {
      return { data: {} };
    }
  });

/**
 * Recebe uma foto (base64 puro, sem prefixo data:) e devolve uma versão
 * tratada com fundo branco profissional usando Gemini image edit.
 */
export const whitenPhotoBackground = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      imageBase64: z.string().min(100).max(15_000_000),
      mimeType: z.string().default("image/jpeg"),
    }),
  )
  .handler(async ({ data }) => {
    const key = requireKey();

    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Replace the background with a clean, pure solid white background (#FFFFFF). Keep the person exactly as is, do not change the face, clothes, hair, or skin tone. Soft professional photography lighting. Output a square 1:1 portrait suitable for a professional resume. No text, no logos.",
              },
              {
                type: "image_url",
                image_url: { url: `data:${data.mimeType};base64,${data.imageBase64}` },
              },
            ],
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Falha ao tratar a foto (${res.status}): ${txt.slice(0, 200)}`);
    }
    const json = await res.json();
    // Lovable AI Gateway returns generated images in message.images[0].image_url.url
    const images = json?.choices?.[0]?.message?.images;
    const url: string | undefined = images?.[0]?.image_url?.url;
    if (!url) {
      throw new Error("A IA não retornou uma imagem. Tente outra foto.");
    }
    return { dataUrl: url };
  });

/**
 * Recebe os dados brutos preenchidos pelo usuário (que normalmente são
 * curtos, com erros e pouco profissionais) e devolve uma versão polida
 * pronta para um currículo profissional, SEM inventar fatos novos.
 */
export const enhanceResumeWithAI = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      raw: z.object({
        nome: z.string().default(""),
        profissao: z.string().default(""),
        email: z.string().default(""),
        telefone: z.string().default(""),
        cidade: z.string().default(""),
        resumo: z.string().default(""),
        experiencias: z
          .array(
            z.object({
              cargo: z.string().default(""),
              empresa: z.string().default(""),
              periodo: z.string().default(""),
              descricao: z.string().default(""),
            }),
          )
          .default([]),
        formacao: z
          .array(
            z.object({
              curso: z.string().default(""),
              instituicao: z.string().default(""),
              periodo: z.string().default(""),
            }),
          )
          .default([]),
        habilidades: z.array(z.string()).default([]),
        idiomas: z.array(z.string()).default([]),
      }),
    }),
  )
  .handler(async ({ data }) => {
    const key = requireKey();

    const system = `Você é um especialista em recrutamento brasileiro (RH/CLT).
Sua tarefa: pegar os dados crus que o usuário preencheu (curtos, com erros de português, informais)
e devolver uma versão PROFISSIONAL pronta para currículo, mantendo a verdade.

REGRAS:
- NUNCA invente empresas, cargos, datas, cursos ou habilidades que o usuário não escreveu.
- Corrija ortografia, pontuação e capitalização (ex: "frentista" -> "Frentista", "harvard university" -> só mantenha se for verdade; caso pareça absurdo/improvável dado o resto do perfil, mantenha como o usuário escreveu mas com capitalização correta).
- Reescreva o "resumo" em 2-3 frases profissionais em 1ª pessoa implícita (sem "Eu sou"), destacando atitude, responsabilidade e a vaga desejada. Se vazio, crie um resumo curto baseado na profissão e experiências reais.
- Para cada experiência, reescreva "descricao" em 1-3 bullets curtos começando com verbo no passado/presente (Atendi, Operei, Organizei...). Se descrição vazia, gere 1-2 bullets GENÉRICOS e plausíveis para o cargo/empresa informado (ex: para "Atendente": "Atendimento ao cliente presencial", "Organização do ambiente de trabalho"). NÃO invente números, prêmios, métricas.
- Capitalize nomes próprios (cidade, empresa, instituição, nome da pessoa).
- Habilidades: transforme em lista profissional curta (ex: "sei fazer tudo" -> mantenha mas adicione 3-4 habilidades genéricas coerentes com a profissão como "Trabalho em equipe", "Pontualidade", "Proatividade", "Comunicação"). Máx 8 itens.
- Idiomas: formate como "Português - Nativo", "Inglês - Básico" etc. Se só disser "Português", devolva "Português - Nativo".
- Mantenha telefone e email exatamente como foram digitados (só formate telefone para (DD) 9XXXX-XXXX se possível).

Responda APENAS JSON válido sem markdown, no MESMO formato dos dados de entrada.`;

    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: `Dados crus do usuário:\n${JSON.stringify(data.raw, null, 2)}\n\nDevolva o JSON profissional.`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Falha ao melhorar currículo (${res.status}): ${txt.slice(0, 200)}`);
    }
    const json = await res.json();
    const content: string = json?.choices?.[0]?.message?.content ?? "{}";
    try {
      return { data: JSON.parse(content) };
    } catch {
      return { data: data.raw };
    }
  });