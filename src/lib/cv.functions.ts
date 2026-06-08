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