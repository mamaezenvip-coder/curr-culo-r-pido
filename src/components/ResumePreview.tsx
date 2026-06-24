import type { ResumeData } from "@/lib/resume-types";
import type { TemplateId } from "@/lib/resume-templates";

export function ResumePreview({ d, template = "executivo" }: { d: ResumeData; template?: TemplateId }) {
  if (template === "minimalista") return <MinimalistaPreview d={d} />;
  if (template === "moderno") return <ModernoPreview d={d} />;
  return <ExecutivoPreview d={d} />;
}

function ExecutivoPreview({ d }: { d: ResumeData }) {
  return (
    <div
      className="mx-auto w-full max-w-[794px] bg-white text-zinc-800 shadow-2xl"
      style={{ aspectRatio: "210 / 297" }}
    >
      <div className="grid h-full grid-cols-[34%_66%]">
        {/* Sidebar */}
        <aside className="relative bg-zinc-900 p-6 text-white">
          <div className="absolute left-0 top-0 h-full w-[6px] bg-red-700" />
          {d.fotoDataUrl && (
            <div className="mb-6 flex justify-center">
              <img
                src={d.fotoDataUrl}
                alt="Foto"
                className="h-32 w-32 rounded-full border-4 border-white object-cover"
              />
            </div>
          )}

          {(d.email || d.telefone || d.cidade) && (
            <Section title="Contato">
              {d.telefone && <p className="text-xs">{d.telefone}</p>}
              {d.email && <p className="break-all text-xs">{d.email}</p>}
              {d.cidade && <p className="text-xs">{d.cidade}</p>}
            </Section>
          )}

          {d.habilidades.filter((h) => h.trim()).length > 0 && (
            <Section title="Habilidades">
              <ul className="space-y-1">
                {d.habilidades
                  .filter((h) => h.trim())
                  .map((h, i) => (
                    <li key={i} className="flex gap-2 text-xs">
                      <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-red-600" />
                      {h}
                    </li>
                  ))}
              </ul>
            </Section>
          )}

          {d.idiomas.filter((i) => i.trim()).length > 0 && (
            <Section title="Idiomas">
              <ul className="space-y-1">
                {d.idiomas
                  .filter((i) => i.trim())
                  .map((i, idx) => (
                    <li key={idx} className="flex gap-2 text-xs">
                      <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-red-600" />
                      {i}
                    </li>
                  ))}
              </ul>
            </Section>
          )}
        </aside>

        {/* Main */}
        <main className="p-8">
          <h1 className="text-3xl font-extrabold leading-tight text-zinc-900">
            {d.nome || "Seu Nome"}
          </h1>
          {d.profissao && (
            <p className="mt-1 text-sm font-semibold uppercase tracking-wider text-red-700">
              {d.profissao}
            </p>
          )}
          <div className="mt-3 h-[3px] w-14 bg-red-700" />

          {d.resumo && (
            <MainSection title="Perfil Profissional">
              <p className="text-sm leading-relaxed text-zinc-700">{d.resumo}</p>
            </MainSection>
          )}

          {d.experiencias.filter((e) => e.cargo || e.empresa).length > 0 && (
            <MainSection title="Experiência Profissional">
              <div className="space-y-4">
                {d.experiencias
                  .filter((e) => e.cargo || e.empresa)
                  .map((e, i) => (
                    <div key={i}>
                      <p className="text-sm font-bold text-zinc-900">{e.cargo}</p>
                      <p className="text-xs font-semibold text-red-700">
                        {[e.empresa, e.periodo].filter(Boolean).join(" • ")}
                      </p>
                      {e.descricao && (
                        <p className="mt-1 text-xs leading-relaxed text-zinc-700">
                          {e.descricao}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </MainSection>
          )}

          {d.formacao.filter((f) => f.curso || f.instituicao).length > 0 && (
            <MainSection title="Formação">
              <div className="space-y-3">
                {d.formacao
                  .filter((f) => f.curso || f.instituicao)
                  .map((f, i) => (
                    <div key={i}>
                      <p className="text-sm font-bold text-zinc-900">{f.curso}</p>
                      <p className="text-xs font-semibold text-red-700">
                        {[f.instituicao, f.periodo].filter(Boolean).join(" • ")}
                      </p>
                    </div>
                  ))}
              </div>
            </MainSection>
          )}
        </main>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="mb-1 text-[11px] font-bold uppercase tracking-wider text-red-500">
        {title}
      </h3>
      <div className="mb-2 h-px w-full bg-red-700/70" />
      {children}
    </div>
  );
}

function MainSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="text-sm font-bold uppercase tracking-wider text-red-700">{title}</h2>
      <div className="mb-3 mt-1 h-px w-full bg-zinc-200" />
      {children}
    </section>
  );
}

/* ============== MINIMALISTA ============== */
function MinimalistaPreview({ d }: { d: ResumeData }) {
  const skills = d.habilidades.filter((h) => h.trim());
  const langs = d.idiomas.filter((i) => i.trim());
  return (
    <div
      className="mx-auto w-full max-w-[794px] bg-white p-12 text-zinc-800 shadow-2xl"
      style={{ aspectRatio: "210 / 297" }}
    >
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1">
          <h1 className="text-4xl font-black leading-tight text-zinc-900">
            {d.nome || "Seu Nome"}
          </h1>
          {d.profissao && (
            <p className="mt-1 text-base font-medium text-red-700">{d.profissao}</p>
          )}
          <p className="mt-2 text-xs text-zinc-500">
            {[d.telefone, d.email, d.cidade].filter(Boolean).join("  •  ")}
          </p>
          <div className="mt-3 h-[2px] w-12 bg-red-700" />
        </div>
        {d.fotoDataUrl && (
          <img
            src={d.fotoDataUrl}
            alt="Foto"
            className="h-24 w-24 rounded object-cover"
          />
        )}
      </div>

      {d.resumo && (
        <MiniSection title="Perfil">
          <p className="text-sm leading-relaxed text-zinc-700">{d.resumo}</p>
        </MiniSection>
      )}

      {d.experiencias.filter((e) => e.cargo || e.empresa).length > 0 && (
        <MiniSection title="Experiência">
          <div className="space-y-3">
            {d.experiencias
              .filter((e) => e.cargo || e.empresa)
              .map((e, i) => (
                <div key={i}>
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-bold text-zinc-900">{e.cargo}</p>
                    {e.periodo && (
                      <span className="text-[11px] text-zinc-500">{e.periodo}</span>
                    )}
                  </div>
                  {e.empresa && (
                    <p className="text-xs font-medium text-red-700">{e.empresa}</p>
                  )}
                  {e.descricao && (
                    <p className="mt-1 text-xs leading-relaxed text-zinc-700">
                      {e.descricao}
                    </p>
                  )}
                </div>
              ))}
          </div>
        </MiniSection>
      )}

      {d.formacao.filter((f) => f.curso || f.instituicao).length > 0 && (
        <MiniSection title="Formação">
          <div className="space-y-2">
            {d.formacao
              .filter((f) => f.curso || f.instituicao)
              .map((f, i) => (
                <div key={i}>
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-bold text-zinc-900">{f.curso}</p>
                    {f.periodo && (
                      <span className="text-[11px] text-zinc-500">{f.periodo}</span>
                    )}
                  </div>
                  {f.instituicao && (
                    <p className="text-xs font-medium text-red-700">{f.instituicao}</p>
                  )}
                </div>
              ))}
          </div>
        </MiniSection>
      )}

      {skills.length > 0 && (
        <MiniSection title="Habilidades">
          <p className="text-sm text-zinc-700">{skills.join("  •  ")}</p>
        </MiniSection>
      )}
      {langs.length > 0 && (
        <MiniSection title="Idiomas">
          <p className="text-sm text-zinc-700">{langs.join("  •  ")}</p>
        </MiniSection>
      )}
    </div>
  );
}

function MiniSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-red-700">
        {title}
      </h2>
      <div className="mb-2 mt-1 h-px w-full bg-zinc-200" />
      {children}
    </section>
  );
}

/* ============== MODERNO ============== */
function ModernoPreview({ d }: { d: ResumeData }) {
  const skills = d.habilidades.filter((h) => h.trim());
  const langs = d.idiomas.filter((i) => i.trim());
  return (
    <div
      className="mx-auto w-full max-w-[794px] bg-white text-zinc-800 shadow-2xl"
      style={{ aspectRatio: "210 / 297" }}
    >
      <header className="relative bg-red-700 p-6 text-white">
        <div className="absolute bottom-0 left-0 right-0 h-[6px] bg-zinc-900" />
        <div className="flex items-center gap-5">
          {d.fotoDataUrl && (
            <img
              src={d.fotoDataUrl}
              alt="Foto"
              className="h-24 w-24 rounded-full border-4 border-white object-cover"
            />
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-black leading-tight">{d.nome || "Seu Nome"}</h1>
            {d.profissao && (
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/90">
                {d.profissao}
              </p>
            )}
            <p className="mt-2 text-[11px] text-white/85">
              {[d.telefone, d.email, d.cidade].filter(Boolean).join("   |   ")}
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-[34%_66%]">
        <aside className="bg-zinc-50 p-6">
          {skills.length > 0 && (
            <ModSection title="Habilidades">
              <ul className="space-y-1">
                {skills.map((s, i) => (
                  <li key={i} className="flex gap-2 text-xs text-zinc-700">
                    <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-red-700" />
                    {s}
                  </li>
                ))}
              </ul>
            </ModSection>
          )}
          {langs.length > 0 && (
            <ModSection title="Idiomas">
              <ul className="space-y-1">
                {langs.map((l, i) => (
                  <li key={i} className="flex gap-2 text-xs text-zinc-700">
                    <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-red-700" />
                    {l}
                  </li>
                ))}
              </ul>
            </ModSection>
          )}
        </aside>
        <main className="p-6">
          {d.resumo && (
            <ModSection title="Perfil">
              <p className="text-sm leading-relaxed text-zinc-700">{d.resumo}</p>
            </ModSection>
          )}
          {d.experiencias.filter((e) => e.cargo || e.empresa).length > 0 && (
            <ModSection title="Experiência">
              <div className="space-y-3">
                {d.experiencias
                  .filter((e) => e.cargo || e.empresa)
                  .map((e, i) => (
                    <div key={i}>
                      <p className="text-sm font-bold text-zinc-900">{e.cargo}</p>
                      <p className="text-xs font-semibold text-red-700">
                        {[e.empresa, e.periodo].filter(Boolean).join(" • ")}
                      </p>
                      {e.descricao && (
                        <p className="mt-1 text-xs leading-relaxed text-zinc-700">
                          {e.descricao}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </ModSection>
          )}
          {d.formacao.filter((f) => f.curso || f.instituicao).length > 0 && (
            <ModSection title="Formação">
              <div className="space-y-2">
                {d.formacao
                  .filter((f) => f.curso || f.instituicao)
                  .map((f, i) => (
                    <div key={i}>
                      <p className="text-sm font-bold text-zinc-900">{f.curso}</p>
                      <p className="text-xs font-semibold text-red-700">
                        {[f.instituicao, f.periodo].filter(Boolean).join(" • ")}
                      </p>
                    </div>
                  ))}
              </div>
            </ModSection>
          )}
        </main>
      </div>
    </div>
  );
}

function ModSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-red-700">
        {title}
      </h2>
      <div className="mb-2 h-[2px] w-8 bg-red-700" />
      {children}
    </section>
  );
}